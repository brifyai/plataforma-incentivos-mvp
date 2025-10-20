/**
 * Auth Callback Page
 *
 * Página que maneja el callback de OAuth después de la autenticación con Google
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback, user, profile, loading } = useAuth();
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🚀 AuthCallbackPage: Iniciando handleCallback');
      try {
        console.log('🔄 AuthCallbackPage: Llamando handleOAuthCallback...');
        const { success, error, redirectToProfile } = await handleOAuthCallback();
        console.log('📊 AuthCallbackPage: Resultado handleOAuthCallback:', { success, error, redirectToProfile });

        if (success) {
          console.log('✅ AuthCallbackPage: Callback exitoso, marcando como procesado');
          setCallbackProcessed(true);
        } else {
          console.error('❌ AuthCallbackPage: Error en callback de OAuth:', error);
          // Mostrar error específico si es "Auth session missing!"
          if (error && error.includes('Auth session missing!')) {
            console.error('🔍 Error específico: Sesión de autenticación faltante');
            navigate('/login?error=auth_session_missing&details=' + encodeURIComponent('La sesión de autenticación no se pudo establecer. Por favor, intenta iniciar sesión nuevamente.'));
          } else {
            // Redirigir al login con error genérico
            navigate('/login?error=oauth_callback_failed&details=' + encodeURIComponent(error || 'Error desconocido'));
          }
        }
      } catch (error) {
        console.error('❌ AuthCallbackPage: Excepción en handleCallback:', error);
        console.error('Stack trace:', error.stack);
        navigate('/login?error=oauth_callback_error&details=' + encodeURIComponent(error.message || 'Error desconocido'));
      }
    };

    console.log('▶️ AuthCallbackPage: Ejecutando handleCallback');
    handleCallback();
  }, [handleOAuthCallback, navigate]);

  // Redirigir cuando el perfil esté disponible y tenga rol asignado
  useEffect(() => {
    console.log('🔍 AuthCallbackPage: Verificando estado para redirección:', {
      callbackProcessed,
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      profileRole: profile?.role,
      userRole: user?.user_metadata?.role
    });

    // Si el callback fue procesado y tenemos usuario, pero no perfil aún, esperar un poco
    if (callbackProcessed && !loading && user && !profile) {
      console.log('⏳ Esperando carga del perfil...');
      console.log('📋 Metadata del usuario:', user?.user_metadata);
      
      // Esperar un momento más para que el perfil se cargue
      const timeout = setTimeout(() => {
        if (!profile) {
          console.warn('⚠️ El perfil no se cargó después de esperar, intentando redirección básica');
          // Usar el rol del usuario metadata como fallback
          const userRole = user?.user_metadata?.role;
          const needsProfileCompletion = user?.user_metadata?.needs_profile_completion;
          
          console.log('📋 Usando metadata para redirección:', {
            userRole,
            needsProfileCompletion
          });
          
          if (needsProfileCompletion) {
            console.log('📝 Usuario necesita completar perfil (según metadata)');
            if (userRole === 'company') {
              console.log('🏢 Redirigiendo a perfil de empresa (fallback)');
              navigate('/empresa/perfil');
            } else if (userRole === 'debtor') {
              console.log('👤 Redirigiendo a perfil de deudor (fallback)');
              navigate('/personas/perfil');
            } else {
              console.log('👑 Admin con OAuth, redirigiendo a dashboard (fallback)');
              navigate('/admin/dashboard');
            }
          } else {
            // Si no necesita completar perfil, redirigir al dashboard correspondiente
            if (userRole === 'company') {
              console.log('🏢 Redirigiendo a dashboard de empresa (fallback)');
              navigate('/empresa/dashboard');
            } else if (userRole === 'god_mode') {
              console.log('👑 Redirigiendo a dashboard de administrador (fallback)');
              navigate('/admin/dashboard');
            } else if (userRole === 'debtor') {
              console.log('👤 Redirigiendo a dashboard de deudor (fallback)');
              navigate('/personas/dashboard');
            } else {
              console.warn('⚠️ Rol no detectado, redirigiendo al home');
              navigate('/');
            }
          }
        }
      }, 3000); // Esperar 3 segundos

      return () => clearTimeout(timeout);
    }

    // Si tenemos perfil con rol, redirigir según el rol
    if (callbackProcessed && !loading && user && profile && profile.role) {
      console.log('🔄 Redirigiendo usuario OAuth con rol:', profile.role);
      console.log('📋 Datos del perfil:', {
        role: profile.role,
        needs_profile_completion: profile.needs_profile_completion,
        oauth_signup: profile.oauth_signup,
        company_id: profile.company_id
      });

      // Verificar si necesita completar perfil o es una empresa que debe ir al perfil
      const needsProfileCompletion = profile.needs_profile_completion || false;
      const isCompany = profile.role === 'company';

      console.log('📋 Verificando condiciones:', {
        isCompany,
        needsProfileCompletion,
        profileRole: profile.role
      });

      if (isCompany && needsProfileCompletion) {
        console.log('🏢 Empresa necesita completar perfil, redirigiendo a perfil de empresa');
        navigate('/empresa/perfil');
      } else if (isCompany) {
        console.log('🏢 Redirigiendo a dashboard de empresa');
        navigate('/empresa/dashboard');
      } else if (profile.role === 'god_mode') {
        console.log('👑 Redirigiendo a dashboard de administrador');
        navigate('/admin/dashboard');
      } else if (profile.role === 'debtor') {
        console.log('👤 Redirigiendo a dashboard de deudor');
        navigate('/personas/dashboard');
      } else {
        console.warn('⚠️ Rol desconocido, redirigiendo al home:', profile.role);
        navigate('/');
      }
    } else if (callbackProcessed && !loading && user && profile && !profile.role) {
      console.warn('⚠️ Usuario autenticado pero sin rol asignado, esperando...');
    }
  }, [callbackProcessed, loading, user, profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold text-secondary-900 mt-4">
          Procesando tu inicio de sesión...
        </h2>
        <p className="text-secondary-600 mt-2">
          Estamos verificando tu cuenta de Google
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;