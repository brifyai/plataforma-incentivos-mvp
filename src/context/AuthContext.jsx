/**
 * Auth Context
 * 
 * Maneja el estado de autenticación global de la aplicación:
 * - Usuario autenticado
 * - Sesión activa
 * - Funciones de login/logout
 * - Protección de rutas
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  updatePassword,
  sendPasswordResetEmail,
  resetPasswordWithToken,
  signInWithGoogle,
  handleAuthCallback,
} from '../services/authService';
import { getUserProfile, getCompanyProfile } from '../services/databaseService';
import { USER_ROLES } from '../config/constants';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); // Start as true to prevent redirects during initial check
  const [error, setError] = useState(null);

  // Expose loadUserProfile for external use
  const loadUserProfileExternally = async (userId) => {
    return await loadUserProfile(userId);
  };

  // Cargar usuario y perfil al montar
  useEffect(() => {
    checkUser();
  }, []);

  /**
      * Verifica si hay un usuario autenticado al cargar
          */
       const checkUser = async () => {
         try {
           console.log('🔍 Iniciando verificación de usuario simplificada...');
           setLoading(true);
           
           // Versión simplificada: solo verificar localStorage
           const { user: currentUser, error } = await getCurrentUser();
   
           if (error || !currentUser) {
             console.log('📝 No hay usuario en localStorage, verificando sesión de Supabase...');
             
             // Verificar sesión de Supabase Auth (para OAuth)
             const { data: supabaseSession, error: supabaseError } = await supabase.auth.getSession();
     
             if (!supabaseError && supabaseSession?.session) {
               console.log('✅ Sesión de Supabase encontrada, usando esa');
               const { user: supabaseUser } = supabaseSession.session;
               
               // Crear usuario mock básico para evitar bloqueos
               const mockUser = {
                 id: supabaseUser.id,
                 email: supabaseUser.email,
                 user_metadata: {
                   full_name: supabaseUser.user_metadata?.full_name || 'Usuario',
                   role: supabaseUser.user_metadata?.role || 'user',
                 },
               };
               
               setUser(mockUser);
               setSession(supabaseSession.session);
               
               // Intentar cargar perfil pero sin bloquear si falla
               try {
                 await loadUserProfile(mockUser.id);
               } catch (profileError) {
                 console.warn('⚠️ Error cargando perfil, continuando sin perfil:', profileError);
                 // Crear perfil básico para no bloquear
                 setProfile({
                   id: mockUser.id,
                   email: mockUser.email,
                   full_name: mockUser.user_metadata.full_name,
                   role: mockUser.user_metadata.role,
                 });
               }
             } else {
               console.log('📝 No hay sesión de Supabase, usuario no autenticado');
               setUser(null);
               setProfile(null);
               setSession(null);
             }
           } else {
             console.log('✅ Usuario encontrado en localStorage');
             setUser(currentUser);
             setSession(null);
             
             // Intentar cargar perfil pero sin bloquear si falla
             try {
               await loadUserProfile(currentUser.id);
             } catch (profileError) {
               console.warn('⚠️ Error cargando perfil, continuando sin perfil:', profileError);
               // Crear perfil básico para no bloquear
               setProfile({
                 id: currentUser.id,
                 email: currentUser.email,
                 full_name: currentUser.user_metadata?.full_name || 'Usuario',
                 role: currentUser.user_metadata?.role || 'user',
               });
             }
           }
         } catch (error) {
           console.error('Error checking user:', error);
           setUser(null);
           setProfile(null);
           setSession(null);
           // No establecer error para no bloquear la aplicación
           console.warn('⚠️ Continuando sin autenticación debido a error');
         } finally {
           setLoading(false);
           setInitializing(false);
           console.log('🏁 Verificación de usuario completada');
         }
       };

  /**
   * Carga el perfil completo del usuario desde la base de datos (100% real)
   */
  const loadUserProfile = async (userId) => {
    try {
      console.log('🔍 Cargando perfil de usuario simplificado...');
      
      // Load user profile from database for ALL users
      const { profile: userProfile, error: profileError } = await getUserProfile(userId);

      if (profileError) {
        console.warn('⚠️ Error loading user profile, usando perfil básico:', profileError);
        // Crear perfil básico en lugar de limpiar sesión
        const basicProfile = {
          id: userId,
          email: user?.email || 'usuario@ejemplo.com',
          full_name: user?.user_metadata?.full_name || 'Usuario',
          role: user?.user_metadata?.role || 'user',
        };
        setProfile(basicProfile);
        return;
      }

      // Si el perfil es null (usuario no existe), crear perfil básico
      if (!userProfile) {
        console.warn('⚠️ User profile not found, creating basic profile');
        const basicProfile = {
          id: userId,
          email: user?.email || 'usuario@ejemplo.com',
          full_name: user?.user_metadata?.full_name || 'Usuario',
          role: user?.user_metadata?.role || 'user',
        };
        setProfile(basicProfile);
        return;
      }

      // Si es empresa o god_mode, intentar cargar datos de la empresa sin bloquear
      if (userProfile?.role === USER_ROLES.COMPANY || userProfile?.role === 'god_mode') {
        console.log('🏢 Usuario es empresa, cargando datos...');
        
        try {
          const companyResult = await loadCompanyProfileWithRetry(userId);
          
          const finalProfile = { ...userProfile };
          
          if (companyResult) {
            finalProfile.company = companyResult;
            console.log('✅ Company profile loaded successfully');
          } else {
            console.warn('⚠️ Company profile not found, continuing without company data');
          }
          
          setProfile(finalProfile);
        } catch (companyError) {
          console.warn('⚠️ Error loading company profile, continuing without company data:', companyError);
          // Establecer perfil de usuario sin datos de empresa
          setProfile(userProfile);
        }
      } else {
        // Para usuarios normales, establecer el perfil directamente
        console.log('👤 Usuario normal, estableciendo perfil directamente');
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // En caso de error, crear perfil básico en lugar de limpiar sesión
      const basicProfile = {
        id: userId,
        email: user?.email || 'usuario@ejemplo.com',
        full_name: user?.user_metadata?.full_name || 'Usuario',
        role: user?.user_metadata?.role || 'user',
      };
      setProfile(basicProfile);
    }
  };

  /**
   * Carga el perfil de empresa con reintentos optimizados
   */
  const loadCompanyProfileWithRetry = async (userId) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { company, error: companyError } = await getCompanyProfile(userId);
        if (!companyError && company) {
          return company; // Retornar la empresa encontrada
        }

        if (attempts === 0) {
          // Solo en el primer intento, esperar un poco por si la empresa se está creando
          console.log('⏳ Company profile not found, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Reducido a 1.5 segundos
        }
      } catch (companyLoadError) {
        console.error('Error loading company profile:', companyLoadError);
      }
      attempts++;
    }

    return null; // No se encontró la empresa después de todos los intentos
  };

  /**
   * Inicia sesión
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { user: authUser, session: authSession, error } = await signIn(email, password);

      if (error) {
        setError(error);
        return { success: false, error };
      }

      // Completar login normalmente
      setUser(authUser);
      setSession(authSession);
      await loadUserProfile(authUser.id);

      return { success: true, user: authUser };
    } catch (error) {
      const errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia sesión con Google
   */
  const loginWithGoogle = async (registrationData = null) => {
    try {
      setLoading(true);
      setError(null);

      // Si hay datos de registro, guardarlos temporalmente para usar después del callback
      if (registrationData) {
        localStorage.setItem('pending_oauth_registration', JSON.stringify({
          ...registrationData,
          timestamp: Date.now()
        }));
        console.log('💾 Datos de registro guardados para OAuth:', registrationData);
      }

      const { error } = await signInWithGoogle();

      if (error) {
        setError(error);
        setLoading(false);
        return { success: false, error };
      }

      // signInWithGoogle redirige automáticamente, no hay más procesamiento aquí
      return { success: true };
    } catch (error) {
      const errorMessage = 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Maneja el callback de OAuth
   */
  const handleOAuthCallback = async () => {
    console.log('🔄 Iniciando handleOAuthCallback...');
    try {
      setLoading(true);
      setError(null);
      console.log('📝 Estados iniciales - loading:', true, 'initializing:', true);

      const { user: authUser, session: authSession, error, redirectToProfile } = await handleAuthCallback();
      console.log('🔑 Resultado handleAuthCallback:', { user: !!authUser, session: !!authSession, error, redirectToProfile });

      if (error) {
        console.error('❌ Error en handleAuthCallback:', error);
        setError(error);
        return { success: false, error };
      }

      // Nota: La creación del usuario ya se maneja en authService.handleAuthCallback
      // Solo necesitamos verificar si hay datos pendientes y limpiarlos si expiraron
      const pendingRegistration = localStorage.getItem('pending_oauth_registration');
      if (pendingRegistration) {
        try {
          const registrationData = JSON.parse(pendingRegistration);
          // Verificar que no haya expirado (5 minutos máximo)
          if (Date.now() - registrationData.timestamp > 5 * 60 * 1000) {
            console.log('⏰ Datos de registro expirados, limpiando...');
            localStorage.removeItem('pending_oauth_registration');
          }
          // Los datos pendientes se limpian en authService después de usarlos
        } catch (parseError) {
          console.error('❌ Error procesando datos de registro pendientes:', parseError);
          localStorage.removeItem('pending_oauth_registration');
        }
      }

      // Flujo normal de OAuth (usuario existente)
      console.log('✅ Configurando usuario y sesión...');
      setUser(authUser);
      setSession(authSession);
      
      // Esperar a que el perfil se cargue completamente
      console.log('⏳ Esperando carga completa del perfil...');
      await loadUserProfile(authUser.id);
      
      // Pequeña espera adicional para asegurar que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🎉 handleOAuthCallback completado exitosamente');
      return { success: true, user: authUser, redirectToProfile };
    } catch (error) {
      console.error('💥 Error en handleOAuthCallback:', error);
      const errorMessage = 'Error al procesar la autenticación. Por favor, intenta de nuevo.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      console.log('🏁 Finally de handleOAuthCallback - cambiando estados...');
      setLoading(false);
      console.log('📝 Estados finales - loading:', false, 'initializing:', false);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const { user: newUser, error } = await signUp(userData);

      if (error) {
        setError(error);
        return { success: false, error };
      }

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = 'Error al registrar usuario. Por favor, intenta de nuevo.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
    * Cierra sesión
    */
  const logout = async () => {
    try {
      setLoading(true);

      // Cerrar sesión de Supabase Auth si existe
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.error('Error logging out from Supabase:', supabaseError);
      }

      // Cerrar sesión del sistema local
      const { error } = await signOut();
      if (error) {
        console.error('Error logging out from local system:', error);
      }

      // Log logout event (comentado por ahora)
      // console.log('User logout:', { userId: user?.id, email: user?.email });

      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error in logout:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envía email de recuperación de contraseña
   */
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await sendPasswordResetEmail(email);

      if (error) {
        setError(error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Error al enviar email de recuperación.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza la contraseña del usuario autenticado
   */
  const changePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await updatePassword(newPassword);

      if (error) {
        setError(error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Error al actualizar contraseña.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetea la contraseña usando un token
   */
  const resetPasswordToken = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await resetPasswordWithToken(token, newPassword);

      if (error) {
        setError(error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Error al resetear contraseña.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };



  /**
    * Refresca el perfil del usuario
    */
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = useMemo(() => (role) => {
    return profile?.role === role;
  }, [profile?.role]);

  /**
   * Verifica si el usuario está validado
   */
  const isValidated = useMemo(() => () => {
    return profile?.validation_status === 'validated';
  }, [profile?.validation_status]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    initializing,
    error,
    login,
    loginWithGoogle,
    handleOAuthCallback,
    register,
    logout,
    resetPassword,
    resetPasswordToken,
    changePassword,
    refreshProfile,
    loadUserProfile: loadUserProfileExternally,
    hasRole,
    isValidated,
    isAuthenticated: !!user,
    isDebtor: (profile?.role || user?.user_metadata?.role) === USER_ROLES.DEBTOR,
    isCompany: (profile?.role || user?.user_metadata?.role) === USER_ROLES.COMPANY,
    isAdmin: (profile?.role || user?.user_metadata?.role) === 'god_mode',
  }), [user, profile, session, loading, initializing, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
