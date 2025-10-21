/**
 * Servicio de Autenticación
 *
 * Maneja todas las operaciones de autenticación con Supabase:
 * - Registro de usuarios
 * - Login
 * - Logout
 * - Recuperación de contraseña
 * - Gestión de sesiones
 *
 * Última actualización: 2025-10-08 - Agregada exportación de hashPassword
 */

import { supabase, handleSupabaseError } from '../config/supabase';
import { USER_ROLES } from '../config/constants';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { sendConfirmationEmail as sendEmailConfirmation, sendPasswordResetEmail as sendPasswordReset, sendEmailChangeConfirmation, sendWelcomeEmailDebtor, sendWelcomeEmailCompany, sendWelcomeEmailAdmin } from './emailService';
import { createKnowledgeBaseForNewCompany } from './knowledgeBaseService';

/**
 * Clase de error personalizada para autenticación
 */
class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR', statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Tipos de errores de autenticación
 */
const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
};

// Configuración de credenciales (desde variables de entorno)
const GOD_MODE_CREDENTIALS = {
  email: import.meta.env.VITE_GOD_MODE_EMAIL || 'camiloalegriabarra@gmail.com',
  password: import.meta.env.VITE_GOD_MODE_PASSWORD || 'GodMode2024!'
};

// Configuración de seguridad
const SALT_ROUNDS = 12;
const JWT_SECRET = 'super-secret-jwt-key-change-in-production-2024';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Rate limiting en memoria (para desarrollo - en producción usar Redis)
const loginAttempts = new Map();
const blockedUsers = new Map();

/**
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Error al procesar contraseña');
  }
};

/**
 * Verifica una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} True si coincide
 */
const verifyPassword = async (password, hashedPassword) => {
  try {
    // Verificar si es un hash bcrypt (empieza con $2b$ o $2a$)
    if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
      return await bcrypt.compare(password, hashedPassword);
    } else {
      // Contraseña antigua sin hash - comparar directamente (para compatibilidad)
      console.warn('⚠️ Usando comparación de contraseña sin hash (deprecado)');
      return password === hashedPassword;
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Crea un token JWT para el usuario usando jose
 * @param {Object} user - Datos del usuario
 * @returns {Promise<string>} Token JWT
 */
const createAccessToken = async (claims, opts = {}) => {
  const secret = new TextEncoder().encode(JWT_SECRET);

  // Soporta dos estilos de entrada:
  // - Objeto "usuario" (id, email, user_metadata.role, etc.)
  // - Objeto "claims" arbitrario (email, type, purpose, etc.)
  const payload = {
    ...(typeof claims === 'object' ? claims : {}),
    userId: claims?.id ?? claims?.userId ?? claims?.sub ?? null,
    email: claims?.email ?? claims?.user?.email ?? null,
    role: claims?.user_metadata?.role ?? claims?.role ?? null,
    type: claims?.type || 'access'
  };

  // Construir JWT
  const jwtBuilder = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  // Soportar expiración custom:
  // 1) opts.expiresIn (string '1h', segundos, timestamp)
  // 2) claims.exp (timestamp/segundos legacy)
  // 3) fallback a JWT_EXPIRES_IN
  if (opts?.expiresIn) {
    jwtBuilder.setExpirationTime(opts.expiresIn);
  } else if (claims?.exp) {
    jwtBuilder.setExpirationTime(claims.exp);
  } else {
    jwtBuilder.setExpirationTime(JWT_EXPIRES_IN);
  }

  return await jwtBuilder.sign(secret);
};

/**
 * Crea un refresh token JWT usando jose
 * @param {Object} user - Datos del usuario
 * @returns {Promise<string>} Refresh token JWT
 */
const createRefreshToken = async (user) => {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .setIssuedAt()
    .sign(secret);
};

/**
 * Verifica y decodifica un token JWT usando jose
 * @param {string} token - Token JWT
 * @returns {Promise<Object|null>} Payload decodificado o null si inválido
 */
const verifyToken = async (token) => {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.warn('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Función helper para crear errores de autenticación consistentes
 * @param {string} code - Código de error
 * @param {string} message - Mensaje de error
 * @param {Error} originalError - Error original (opcional)
 * @returns {AuthError} Error de autenticación
 */
const createAuthError = (code, message, originalError = null) => {
  console.error(`❌ Auth Error [${code}]:`, message, originalError ? { original: originalError } : '');

  const error = new AuthError(message, code);

  // Agregar información adicional para debugging
  if (originalError) {
    error.originalError = originalError;
  }

  return error;
};

/**
 * Función helper para manejar errores de Supabase y convertirlos a AuthError
 * @param {Error} error - Error de Supabase
 * @param {string} operation - Nombre de la operación
 * @returns {AuthError} Error de autenticación
 */
const handleSupabaseAuthError = (error, operation) => {
  console.error(`❌ Supabase Error in ${operation}:`, error);

  // Mapear errores comunes de Supabase a códigos de AuthError
  if (error?.code === 'PGRST116') {
    return createAuthError(AUTH_ERROR_CODES.USER_NOT_FOUND, 'Usuario no encontrado');
  }

  if (error?.message?.includes('JWT')) {
    return createAuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, 'Sesión expirada o inválida');
  }

  if (error?.message?.includes('network')) {
    return createAuthError(AUTH_ERROR_CODES.NETWORK_ERROR, 'Error de conexión');
  }

  return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, error?.message || 'Error interno del servidor');
};

/**
 * Función helper para limpiar sesiones corruptas
 */
const clearCorruptedSessions = () => {
  localStorage.removeItem('secure_session');
  localStorage.removeItem('mock_session');
};

/**
 * Verifica si un usuario está bloqueado por rate limiting
 * @param {string} identifier - Email o IP del usuario
 * @returns {boolean} True si está bloqueado
 */
const isUserBlocked = (identifier) => {
  const blockInfo = blockedUsers.get(identifier);
  if (!blockInfo) return false;

  // Verificar si el bloqueo ha expirado
  if (Date.now() > blockInfo.unblockTime) {
    blockedUsers.delete(identifier);
    return false;
  }

  return true;
};

/**
 * Registra un intento de login fallido
 * @param {string} identifier - Email o IP del usuario
 */
const recordFailedLogin = (identifier) => {
  const attempts = loginAttempts.get(identifier) || 0;
  const newAttempts = attempts + 1;

  loginAttempts.set(identifier, newAttempts);

  // Bloquear si excede el límite
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    const unblockTime = Date.now() + (LOCKOUT_DURATION_MINUTES * 60 * 1000);
    blockedUsers.set(identifier, { unblockTime, attempts: newAttempts });

    console.warn(`🚫 Usuario ${identifier} bloqueado por ${LOCKOUT_DURATION_MINUTES} minutos debido a múltiples intentos fallidos`);
  }
};

/**
 * Limpia los intentos de login exitosos
 * @param {string} identifier - Email o IP del usuario
 */
const clearLoginAttempts = (identifier) => {
  loginAttempts.delete(identifier);
  blockedUsers.delete(identifier);
};

/**
 * Obtiene el tiempo restante de bloqueo en minutos
 * @param {string} identifier - Email o IP del usuario
 * @returns {number} Minutos restantes o 0 si no está bloqueado
 */
const getRemainingBlockTime = (identifier) => {
  const blockInfo = blockedUsers.get(identifier);
  if (!blockInfo) return 0;

  const remainingMs = blockInfo.unblockTime - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
};

/**
 * Inicializa el usuario administrador si no existe
 * @returns {Promise<boolean>} True si se creó o ya existía
 */
const initializeGodModeUser = async () => {
  try {
    console.log('🔍 Verificando usuario administrador...');

    // Verificar si ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', GOD_MODE_CREDENTIALS.email)
      .single();

    if (!checkError && existingUser) {
      console.log('✅ Usuario administrador ya existe');
      return true;
    }

    // Crear usuario administrador
    console.log('👑 Creando usuario administrador...');

    const hashedPassword = await hashPassword(GOD_MODE_CREDENTIALS.password);

    const { error: createError } = await supabase
      .from('users')
      .insert({
        email: GOD_MODE_CREDENTIALS.email,
        password: hashedPassword,
        full_name: 'Administrador del Sistema',
        rut: `GOD-${Date.now()}`,
        role: 'god_mode',
        validation_status: 'validated',
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (createError) {
      console.error('❌ Error creando usuario administrador:', createError);
      return false;
    }

    console.log('✅ Usuario administrador creado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en initializeGodModeUser:', error);
    return false;
  }
};

/**
 * Registra un nuevo usuario en el sistema usando la tabla users
 * @param {Object} userData - Datos del usuario a registrar
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña del usuario
 * @param {string} userData.fullName - Nombre completo
 * @param {string} [userData.rut] - RUT del usuario (opcional para god_mode)
 * @param {string} userData.role - Rol del usuario ('debtor', 'company', o 'god_mode')
 * @param {Object} [userData.companyData] - Datos adicionales si es empresa
 * @param {string} [currentUserRole] - Rol del usuario actual (para validaciones)
 * @returns {Promise<{user, error}>}
 */
const signUp = async (userData, currentUserRole = null) => {
  try {
    const { email, password, fullName, rut, role = USER_ROLES.DEBTOR, companyData } = userData;

    // Validación: Solo god_mode puede crear otros god_mode
    if (role === 'god_mode' && currentUserRole !== 'god_mode') {
      return { user: null, error: 'Solo administradores pueden crear otros administradores.' };
    }

    // Para usuarios god_mode, usar RUT automático si no se proporciona
    const finalRut = role === 'god_mode' ? `GOD-${Date.now()}` : rut;

    // Verificar si el email ya existe (excepto para god_mode que puede tener emails únicos)
    if (role !== 'god_mode') {
      const { exists: emailExists, error: emailCheckError } = await checkEmailExists(email);
      if (emailCheckError) {
        return { user: null, error: emailCheckError };
      }
      if (emailExists) {
        return { user: null, error: 'Este email ya está registrado.' };
      }
    }

    // Verificar si el RUT ya existe (excepto para god_mode que usa RUTs automáticos)
    if (role !== 'god_mode') {
      const { exists: rutExists, error: rutCheckError } = await checkRutExists(rut);
      if (rutCheckError) {
        return { user: null, error: rutCheckError };
      }
      if (rutExists) {
        return { user: null, error: 'Este RUT ya está registrado.' };
      }
    }

    // Verificar si el teléfono ya existe (solo si se proporciona)
    if (userData.phone && userData.phone.trim() !== '') {
      const { exists: phoneExists, error: phoneCheckError } = await checkPhoneExists(userData.phone);
      if (phoneCheckError) {
        return { user: null, error: phoneCheckError };
      }
      if (phoneExists) {
        return { user: null, error: 'Este teléfono ya está registrado.' };
      }
    }

    // Hashear la contraseña antes de guardar
    console.log('🔐 Hasheando contraseña para nuevo usuario...');
    const hashedPassword = await hashPassword(password);

    // Generar token de confirmación de email
    const confirmationToken = await createAccessToken({
      email,
      type: 'email_confirmation',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    });

    // Crear usuario en la tabla users
    const { data: userDataResult, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword, // ✅ Contraseña hasheada de forma segura
        full_name: fullName,
        rut: finalRut,
        phone: userData.phone || null, // ✅ Agregar teléfono
        role,
        validation_status: role === 'god_mode' ? 'validated' : 'pending',
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return { user: null, error: handleSupabaseError(insertError) };
    }

    // 3. Si es empresa, crear registro en companies
    if (role === USER_ROLES.COMPANY && companyData) {
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: userDataResult.id,
          company_name: companyData.businessName,
          rut: companyData.companyRut,
          contact_email: email,
          contact_phone: companyData.phone,
          company_type: companyData.companyType,
        });

      if (companyError) {
        console.error('Error creating company profile:', companyError);
        // No eliminar el usuario, solo registrar el error
      } else {
        console.log('✅ Empresa registrada exitosamente');
        
        // 4. Crear base de conocimiento automáticamente para la nueva empresa
        try {
          console.log('🧠 Creando base de conocimiento para nueva empresa...');
          const kbResult = await createKnowledgeBaseForNewCompany({
            userId: userDataResult.id,
            companyName: companyData.businessName,
            companyRut: companyData.companyRut,
            email: email,
            phone: companyData.phone
          });
          
          if (kbResult.success) {
            console.log('✅ Base de conocimiento creada automáticamente para la empresa');
          } else {
            console.warn('⚠️ No se pudo crear base de conocimiento automáticamente:', kbResult.error);
            // No fallar el registro por esto, pero registrar el warning
          }
        } catch (kbError) {
          console.warn('⚠️ Error creando base de conocimiento automáticamente:', kbError.message);
          // No fallar el registro por esto
        }
      }
    }

    // Enviar email de confirmación (excepto para god_mode que ya está validado)
    if (role !== 'god_mode') {
      try {
        console.log('📧 Enviando email de confirmación...');
        const emailResult = await sendEmailConfirmation(email, fullName, confirmationToken, role);
        if (!emailResult.success) {
          console.warn('⚠️ No se pudo enviar email de confirmación:', emailResult.error);
          // No fallar el registro por esto
        } else {
          console.log('✅ Email de confirmación enviado, ID:', emailResult.messageId);
        }
      } catch (emailError) {
        console.warn('⚠️ Error enviando email de confirmación:', emailError.message);
        // No fallar el registro por problemas de email
      }
    }

    // Enviar email de bienvenida después del registro exitoso
    try {
      console.log('🎉 Enviando email de bienvenida...');

      let welcomeResult;
      if (role === USER_ROLES.COMPANY) {
        welcomeResult = await sendWelcomeEmailCompany({
          fullName,
          email,
          companyName: companyData?.businessName || fullName,
          companyEmail: email
        });
      } else if (role === 'god_mode') {
        welcomeResult = await sendWelcomeEmailAdmin({
          fullName,
          email
        });
      } else {
        // Default to debtor
        welcomeResult = await sendWelcomeEmailDebtor({
          fullName,
          email
        });
      }

      if (!welcomeResult.success) {
        console.warn('⚠️ No se pudo enviar email de bienvenida:', welcomeResult.error);
        // No fallar el registro por esto
      } else {
        console.log('✅ Email de bienvenida enviado, ID:', welcomeResult.messageId);
      }
    } catch (welcomeError) {
      console.warn('⚠️ Error enviando email de bienvenida:', welcomeError.message);
      // No fallar el registro por problemas de email
    }

    // Crear un objeto user simulado para mantener compatibilidad
    const mockUser = {
      id: userDataResult.id,
      email: userDataResult.email,
      user_metadata: {
        full_name: userDataResult.full_name,
        rut: userDataResult.rut,
        role: userDataResult.role,
      },
    };

    return { user: mockUser, error: null };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { user: null, error: 'Error al registrar usuario. Por favor, intenta de nuevo.' };
  }
};

/**
 * Inicia sesión de un usuario consultando la tabla users
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<{user, session, error}>}
 */
const signIn = async (email, password) => {
  try {
    console.log('🔍 Intentando login con:', email);

    // Rate limiting: verificar si el usuario está bloqueado
    if (isUserBlocked(email)) {
      const remainingMinutes = getRemainingBlockTime(email);
      console.warn(`🚫 Login bloqueado para ${email}, ${remainingMinutes} minutos restantes`);
      return {
        user: null,
        session: null,
        error: `Cuenta temporalmente bloqueada. Intenta de nuevo en ${remainingMinutes} minutos.`
      };
    }

    // Verificar conexión a Supabase
    const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
    if (testError) {
      console.error('❌ Error de conexión a Supabase:', testError);
      return { user: null, session: null, error: `Error de conexión: ${testError.message}` };
    }
    console.log('✅ Conexión a Supabase OK');

    // Buscar usuario en la tabla users
    console.log('👤 Buscando usuario...');
    let { data: userData, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('📊 Resultado query:', { userData: userData ? 'encontrado' : 'no encontrado', queryError });

    if (queryError) {
      if (queryError.code === 'PGRST116') { // No rows found
        console.log('❌ Usuario no encontrado en tabla users');

        // Si es el email del administrador, intentar inicializarlo
        if (email === GOD_MODE_CREDENTIALS.email) {
          console.log('👑 Verificando/inicializando usuario administrador...');
          const godInitialized = await initializeGodModeUser();

          if (!godInitialized) {
            return { user: null, session: null, error: 'Error al inicializar usuario administrador.' };
          }

          // Reintentar obtener el usuario después de inicializarlo
          const { data: godUser, error: godError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (godError) {
            return { user: null, session: null, error: 'Error al obtener usuario administrador.' };
          }

          userData = godUser;
        } else {
          return { user: null, session: null, error: 'Usuario no registrado. Por favor, regístrate primero.' };
        }
      } else {
        console.error('❌ Error en query:', queryError);
        return { user: null, session: null, error: `Error de base de datos: ${queryError.message}` };
      }
    }

    // Verificar que tenga campo password
    if (!userData.hasOwnProperty('password')) {
      console.error('❌ La tabla users no tiene campo password');
      return { user: null, session: null, error: 'Error de configuración: campo password faltante.' };
    }

    // Verificar contraseña usando bcrypt (con compatibilidad hacia atrás)
    console.log('🔒 Verificando contraseña...');
    console.log('   - Tipo de hash:', userData.password?.startsWith('$2b$') ? 'bcrypt' : 'texto plano');

    const isPasswordValid = await verifyPassword(password, userData.password);

    if (!isPasswordValid) {
      console.log('❌ Contraseña no coincide');
      recordFailedLogin(email); // Registrar intento fallido
      return { user: null, session: null, error: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.' };
    }

    console.log('✅ Contraseña verificada correctamente');
    clearLoginAttempts(email); // Limpiar intentos en login exitoso

    console.log('✅ Login exitoso');

    // Crear objeto user real
    const realUser = {
      id: userData.id,
      email: userData.email,
      user_metadata: {
        full_name: userData.full_name,
        rut: userData.rut,
        role: userData.role,
      },
    };

    // Crear tokens JWT seguros
    const accessToken = await createAccessToken(realUser);
    const refreshToken = await createRefreshToken(realUser);

    // Crear sesión con tokens JWT
    const secureSession = {
      user: realUser,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
    };

    // Guardar en localStorage (mantener compatibilidad pero con tokens seguros)
    localStorage.setItem('secure_session', JSON.stringify(secureSession));

    // También guardar versión compatible con el sistema anterior
    localStorage.setItem('mock_session', JSON.stringify({
      user: realUser,
      access_token: accessToken,
      refresh_token: refreshToken,
    }));

    console.log('✅ Sesión segura creada con JWT');
    return { user: realUser, session: secureSession, error: null };
  } catch (error) {
    console.error('❌ Error in signIn:', error);
    return { user: null, session: null, error: 'Error al iniciar sesión. Por favor, intenta de nuevo.' };
  }
};

/**
 * Cierra la sesión del usuario actual
 * @returns {Promise<{error}>}
 */
const signOut = async () => {
  try {
    // Limpiar sesiones seguras
    localStorage.removeItem('secure_session');
    // Limpiar sesiones antiguas para compatibilidad
    localStorage.removeItem('mock_session');

    console.log('✅ Sesión cerrada correctamente');
    return { error: null };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { error: 'Error al cerrar sesión. Por favor, intenta de nuevo.' };
  }
};

/**
 * Valida una sesión y retorna el usuario si es válida
 * @param {Object} session - Sesión a validar
 * @returns {Promise<Object|null>} Usuario si válido, null si no
 */
const validateSession = async (session) => {
  // Verificar expiración
  if (session.expires_at && Date.now() > session.expires_at) {
    console.log('🔄 Token expirado, limpiando sesión');
    clearCorruptedSessions();
    return null;
  }

  // Verificar token JWT
  const tokenPayload = await verifyToken(session.access_token);
  if (!tokenPayload) {
    console.log('🔄 Token inválido, limpiando sesión');
    clearCorruptedSessions();
    return null;
  }

  return session.user;
};

/**
 * Obtiene el usuario actualmente autenticado desde localStorage con verificación JWT
 * @returns {Promise<{user, error}>}
 */
const getCurrentUser = async () => {
  try {
    // Intentar obtener sesión segura primero
    const secureSessionData = localStorage.getItem('secure_session');
    if (secureSessionData) {
      const session = JSON.parse(secureSessionData);
      const user = await validateSession(session);
      return { user, error: null };
    }

    // Fallback al sistema anterior para compatibilidad
    const sessionData = localStorage.getItem('mock_session');
    if (!sessionData) {
      return { user: null, error: null };
    }

    const session = JSON.parse(sessionData);
    return { user: session.user, error: null };
  } catch (error) {
    clearCorruptedSessions();
    const authError = handleSupabaseAuthError(error, 'getCurrentUser');
    return { user: null, error: authError.message };
  }
};

/**
 * Obtiene la sesión actual desde localStorage con verificación JWT
 * @returns {Promise<{session, error}>}
 */
const getSession = async () => {
  try {
    // Intentar obtener sesión segura primero
    const secureSessionData = localStorage.getItem('secure_session');
    if (secureSessionData) {
      const session = JSON.parse(secureSessionData);

      // Usar validateSession para verificar si es válida
      const user = await validateSession(session);
      if (user) {
        return { session, error: null };
      }
      return { session: null, error: null };
    }

    // Fallback al sistema anterior para compatibilidad
    const sessionData = localStorage.getItem('mock_session');
    if (!sessionData) {
      return { session: null, error: null };
    }

    const session = JSON.parse(sessionData);
    return { session, error: null };
  } catch (error) {
    clearCorruptedSessions();
    const authError = handleSupabaseAuthError(error, 'getSession');
    return { session: null, error: authError.message };
  }
};

/**
 * Envía un email para recuperar la contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<{error}>}
 */
const sendPasswordResetEmail = async (email) => {
  try {
    console.log('🔑 Iniciando proceso de reset de contraseña para:', email);

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('email', email)
      .single();

    console.log('👤 Resultado búsqueda usuario:', { found: !!userData, error: userError });

    if (userError) {
      console.warn('Usuario no encontrado para reset de contraseña:', email);
      // No revelar si el usuario existe o no por seguridad
      return { error: null };
    }

    // Generar token de reset de contraseña
    const resetToken = await createAccessToken({
      email,
      type: 'password_reset',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    });

    console.log('🎫 Token generado, llamando a sendPasswordReset...');

    // Enviar email usando nuestro servicio personalizado
    const emailResult = await sendPasswordReset(userData.email, userData.full_name, resetToken);

    console.log('📧 Resultado envío email:', emailResult);

    if (!emailResult.success) {
      console.error('Error enviando email de reset:', emailResult.error);
      return { error: 'Error al enviar email de recuperación.' };
    }

    console.log('✅ Reset de contraseña enviado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return { error: 'Error al enviar email de recuperación. Por favor, intenta de nuevo.' };
  }
};

/**
 * Actualiza la contraseña del usuario autenticado
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{error}>}
 */
const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updatePassword:', error);
    return { error: 'Error al actualizar contraseña. Por favor, intenta de nuevo.' };
  }
};

/**
 * Resetea la contraseña usando un token JWT
 * @param {string} token - Token de reset de contraseña
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{error}>}
 */
const resetPasswordWithToken = async (token, newPassword) => {
  try {
    console.log('🔑 Iniciando reset de contraseña con token...');

    // Validar que el token no esté vacío
    if (!token || token.trim() === '') {
      console.error('❌ Token vacío o nulo');
      return { error: 'Token de recuperación requerido.' };
    }

    // Intentar decodificar el token si está URL-encoded
    let tokenToVerify = token;
    try {
      const decodedToken = decodeURIComponent(token);
      if (decodedToken !== token) {
        console.log('🔄 Token estaba URL-encoded, decodificado');
        tokenToVerify = decodedToken;
      }
    } catch (decodeError) {
      console.warn('⚠️ Token no estaba URL-encoded o ya estaba decodificado:', decodeError.message);
    }

    console.log('🔍 Verificando token JWT...');

    // Verificar el token JWT
    const payload = await verifyToken(tokenToVerify);

    console.log('📊 Payload del token:', payload ? 'válido' : 'null/inválido');

    if (!payload) {
      console.error('❌ Token JWT inválido o expirado');
      return { error: 'Token de recuperación inválido o expirado.' };
    }

    // Asegurar tipo de token correcto con compatibilidad retro
    if (payload.type !== 'password_reset') {
      // Compatibilidad: aceptar tokens legados que no tenían type explícito o usaban 'access'
      const isLegacyReset =
        (!!payload.email) &&
        (payload.type === undefined || payload.type === 'access');

      if (!isLegacyReset) {
        console.error('❌ Tipo de token incorrecto:', payload.type, '(esperado: password_reset)');
        return { error: 'Tipo de token inválido para recuperación de contraseña.' };
      }

      console.warn('⚠️ Usando token LEGACY para reset de contraseña (sin type=password_reset)');
    }

    if (!payload.email) {
      console.error('❌ Token no contiene email');
      return { error: 'Token de recuperación incompleto.' };
    }

    const { email } = payload;
    console.log('📧 Email extraído del token:', email);

    // Verificar que el usuario existe antes de actualizar
    console.log('👤 Verificando que el usuario existe...');
    const { data: userData, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userCheckError) {
      console.error('❌ Usuario no encontrado para reset de contraseña:', userCheckError);
      return { error: 'Usuario no encontrado. El token puede haber expirado.' };
    }

    console.log('✅ Usuario encontrado:', userData.full_name);

    // Validar la nueva contraseña
    if (!newPassword || newPassword.length < 8) {
      console.error('❌ Nueva contraseña demasiado corta');
      return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    // Hashear la nueva contraseña
    console.log('🔐 Hasheando nueva contraseña...');
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña en la base de datos
    console.log('💾 Actualizando contraseña en base de datos...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      return { error: handleSupabaseError(updateError) };
    }

    console.log('✅ Contraseña actualizada exitosamente para:', email);
    return { error: null };
  } catch (error) {
    console.error('Error in resetPasswordWithToken:', error);
    return { error: 'Error al actualizar contraseña. Por favor, intenta de nuevo.' };
  }
};

/**
 * Verifica si el email ya está registrado
 * @param {string} email - Email a verificar
 * @returns {Promise<{exists, error}>}
 */
const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase.rpc('check_email_exists', { check_email: email });

    if (error) {
      return { exists: false, error: handleSupabaseError(error) };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return { exists: false, error: 'Error al verificar email.' };
  }
};

/**
 * Verifica si el RUT ya está registrado
 * @param {string} rut - RUT a verificar
 * @returns {Promise<{exists, error}>}
 */
const checkRutExists = async (rut) => {
  try {
    const { data, error } = await supabase.rpc('check_rut_exists', { check_rut: rut });

    if (error) {
      return { exists: false, error: handleSupabaseError(error) };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error in checkRutExists:', error);
    return { exists: false, error: 'Error al verificar RUT.' };
  }
};

/**
 * Verifica si el teléfono ya está registrado
 * @param {string} phone - Teléfono a verificar
 * @returns {Promise<{exists, error}>}
 */
const checkPhoneExists = async (phone) => {
  try {
    const { data, error } = await supabase.rpc('check_phone_exists', { check_phone: phone });

    if (error) {
      return { exists: false, error: handleSupabaseError(error) };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error in checkPhoneExists:', error);
    return { exists: false, error: 'Error al verificar teléfono.' };
  }
};

/**
 * Suscribe a cambios en el estado de autenticación
 * @param {Function} callback - Función a ejecutar cuando cambia el estado
 * @returns {Object} Subscription object
 */
const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

/**
 * Inicia sesión con Google OAuth
 * @returns {Promise<{user, session, error}>}
 */
const signInWithGoogle = async () => {
  try {
    console.log('🔍 Iniciando autenticación con Google...');

    // Determinar la URL de redirección correcta según el entorno
    const getRedirectUrl = () => {
      // Si estamos en desarrollo local
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const port = window.location.port || '3002';
        return `http://${window.location.hostname}:${port}/auth/callback`;
      }
      
      // Si estamos en producción o staging
      return `${window.location.origin}/auth/callback`;
    };

    const redirectUrl = getRedirectUrl();
    console.log('🔗 URL de redirección OAuth:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ Error en OAuth de Google:', error);
      return { user: null, session: null, error: handleSupabaseError(error) };
    }

    // Nota: signInWithOAuth redirige automáticamente, no retorna datos aquí
    return { user: null, session: null, error: null };
  } catch (error) {
    console.error('❌ Error in signInWithGoogle:', error);
    return { user: null, session: null, error: 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.' };
  }
};

/**
 * Maneja el callback de OAuth después de la autenticación
 * @returns {Promise<{user, session, error, redirectToProfile}>}
 */
const handleAuthCallback = async () => {
  try {
    console.log('🔄 Procesando callback de autenticación...');

    // Obtener datos de registro pendientes si existen
    let registrationData = null;
    try {
      const pendingData = localStorage.getItem('pending_oauth_registration');
      if (pendingData) {
        registrationData = JSON.parse(pendingData);
        console.log('📋 Datos de registro pendientes encontrados:', registrationData);
      }
    } catch (parseError) {
      console.warn('⚠️ Error parseando datos de registro pendientes:', parseError.message);
    }

    // Para OAuth, necesitamos usar getUser() para obtener la información del usuario autenticado
    const { data, error } = await supabase.auth.getUser();
    console.log('📊 Resultado getUser:', { data: data ? 'presente' : 'null', user: data?.user ? 'encontrado' : 'null', error });

    if (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return { user: null, session: null, error: handleSupabaseError(error), redirectToProfile: false };
    }

    if (!data.user) {
      console.log('⚠️ No hay usuario autenticado');
      return { user: null, session: null, error: 'No se pudo completar la autenticación.', redirectToProfile: false };
    }

    const user = data.user;
    
    // Obtener la sesión actual para el token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    if (sessionError) {
      console.warn('⚠️ Error obteniendo sesión (continuando sin token):', sessionError);
    }
    console.log('👤 Usuario de Supabase:', { id: user?.id, email: user?.email, name: user?.user_metadata?.name });

    // Primero verificar si el usuario ya existe en nuestra tabla users para obtener su rol real
    let userRole = 'debtor'; // Por defecto
    let userFullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario Google';
    let userRut = `OAUTH-${Date.now()}`;
    let userPhone = null;
    let userExists = false;
    let needsProfileCompletion = false;
    let redirectToProfile = false;

    try {
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('role, full_name, rut, phone, needs_profile_completion')
        .eq('email', user.email)
        .single();

      if (!userCheckError && existingUser) {
        console.log('✅ Usuario existente encontrado en OAuth, usando rol real:', existingUser.role);
        userRole = existingUser.role;
        userFullName = existingUser.full_name;
        userRut = existingUser.rut;
        userPhone = existingUser.phone;
        needsProfileCompletion = existingUser.needs_profile_completion || false;
        userExists = true;
      } else {
        console.log('👤 Usuario nuevo en OAuth, usando rol por defecto:', userRole);
      }
    } catch (checkError) {
      console.warn('⚠️ Error verificando usuario existente en OAuth:', checkError.message);
    }

    // Si el usuario no existe en nuestra tabla, intentar crearlo automáticamente para registro con Google
    if (!userExists) {
      console.log('👤 Usuario OAuth no encontrado, creando automáticamente para registro...');

      // Usar datos de registro si están disponibles, sino usar valores por defecto
      const finalUserRole = registrationData?.role || userRole;
      const finalUserRut = registrationData?.rut || userRut;
      const finalUserFullName = registrationData?.fullName || userFullName;
      const finalUserPhone = registrationData?.phone || userPhone;
      needsProfileCompletion = registrationData?.needsProfileCompletion || false;
      redirectToProfile = registrationData?.redirectToProfile || false;

      console.log('📋 Datos para crear usuario OAuth:', {
        role: finalUserRole,
        needsProfileCompletion,
        redirectToProfile,
        hasRegistrationData: !!registrationData
      });

      // Crear usuario automáticamente con datos de Google
      const userData = {
        id: user.id, // Usar el ID de Supabase Auth
        email: user.email,
        rut: finalUserRut,
        full_name: finalUserFullName,
        phone: finalUserPhone,
        role: finalUserRole,
        validation_status: 'validated', // OAuth ya está validado por Google
        wallet_balance: 0,
        oauth_signup: true, // Marcar que se registró via OAuth
        needs_profile_completion: needsProfileCompletion,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Creando usuario OAuth en base de datos...');
      const { error: createError } = await supabase
        .from('users')
        .upsert(userData);

      if (createError) {
        console.error('❌ Error creando usuario OAuth automáticamente:', createError);
        return { user: null, session: null, error: 'Error al crear usuario. Por favor, intenta de nuevo.', redirectToProfile: false };
      } else {
        console.log('✅ Usuario OAuth creado automáticamente con perfil_completion:', needsProfileCompletion);
        userExists = true; // Ahora existe

        // Limpiar datos de registro pendientes si se usaron
        if (registrationData) {
          localStorage.removeItem('pending_oauth_registration');
        }
      }
    } else {
      // Usuario existente, verificar si necesita completar perfil
      console.log('👤 Usuario OAuth existente, verificando si necesita completar perfil...');
      try {
        const { data: existingUserData, error: existingUserError } = await supabase
          .from('users')
          .select('needs_profile_completion')
          .eq('email', user.email)
          .single();

        if (!existingUserError && existingUserData) {
          needsProfileCompletion = existingUserData.needs_profile_completion || false;
          console.log('📋 Usuario existente needs_profile_completion:', needsProfileCompletion);
        }
      } catch (checkError) {
        console.warn('⚠️ Error verificando needs_profile_completion del usuario existente:', checkError.message);
      }
    }

    // Crear objeto user con el rol correcto
    const mockUser = {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: userFullName,
        role: userRole, // Usar rol real del usuario
      },
    };

    // Crear sesión compatible con localStorage
    const mockSession = {
      user: mockUser,
      access_token: session?.access_token || 'mock_token_' + Date.now(),
      refresh_token: session?.refresh_token || 'mock_refresh_' + Date.now(),
    };

    // Guardar en localStorage para mantener compatibilidad con el resto del sistema
    localStorage.setItem('mock_session', JSON.stringify(mockSession));
    console.log('💾 Sesión guardada en localStorage');

    // Intentar crear el usuario en background (sin bloquear el login)
    try {
      console.log('🔄 Intentando crear usuario en tabla users en background...');

      // Usar los datos que ya obtuvimos antes, o datos de registro si están disponibles
      const finalUserRole = registrationData?.role || userRole;
      const finalUserRut = registrationData?.rut || userRut;
      const finalUserFullName = registrationData?.fullName || userFullName;
      const finalUserPhone = registrationData?.phone || userPhone;
      needsProfileCompletion = registrationData?.needsProfileCompletion || false;
      redirectToProfile = registrationData?.redirectToProfile || false;

      // Verificar si el email ya existe (para OAuth también)
      const { exists: emailExists, error: emailCheckError } = await checkEmailExists(user.email);
      if (emailCheckError) {
        console.warn('⚠️ Error verificando email en OAuth:', emailCheckError);
      } else if (emailExists) {
        console.warn('⚠️ Email ya existe en OAuth, pero continuando con login');
        // Para OAuth, si el email ya existe, simplemente continuamos
        // El usuario podrá hacer login normalmente
      }

      const userData = {
        id: user.id, // Usar el ID de Supabase Auth
        email: user.email,
        rut: finalUserRut,
        full_name: finalUserFullName,
        phone: finalUserPhone,
        role: finalUserRole,
        validation_status: 'validated',
        wallet_balance: 0,
        oauth_signup: true, // Marcar que se registró via OAuth
        needs_profile_completion: needsProfileCompletion,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: createError } = await supabase
        .from('users')
        .upsert(userData);

      if (createError) {
        console.warn('⚠️ No se pudo crear usuario en tabla users, pero OAuth funcionó:', createError.message);
      } else {
        console.log('✅ Usuario creado en tabla users con rol:', finalUserRole);

        // Si es empresa, crear también el registro en companies
        if (userRole === USER_ROLES.COMPANY && registrationData) {
          console.log('🏢 Creando registro de empresa para OAuth...');

          console.log('Datos de empresa:', {
            user_id: user.id,
            company_name: registrationData.businessName,
            rut: registrationData.companyRut,
            contact_email: user.email,
            contact_phone: registrationData.phone,
          });

          // Intentar insert directo (las políticas RLS deberían permitirlo para usuarios autenticados)
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              company_name: registrationData.businessName || 'Empresa Pendiente',
              rut: registrationData.companyRut || 'Pendiente',
              contact_email: user.email,
              contact_phone: registrationData.phone || null,
              company_type: registrationData.companyType || 'direct_creditor',
            })
            .select()
            .single();

          if (companyError) {
            console.error('❌ Error creando empresa:', companyError);
            console.error('Detalles del error:', {
              message: companyError.message,
              details: companyError.details,
              hint: companyError.hint,
              code: companyError.code
            });

            // Intentar verificar si ya existe una empresa para este usuario
            const { data: existingCompany, error: checkError } = await supabase
              .from('companies')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (existingCompany) {
              console.log('ℹ️ Empresa ya existe para este usuario:', existingCompany);
            } else if (checkError && checkError.code !== 'PGRST116') {
              console.error('❌ Error verificando empresa existente:', checkError);
            }
          } else {
            console.log('✅ Registro de empresa creado exitosamente:', companyData);
            
            // Crear base de conocimiento automáticamente para empresa OAuth
            try {
              console.log('🧠 Creando base de conocimiento para empresa OAuth...');
              const kbResult = await createKnowledgeBaseForNewCompany({
                userId: user.id,
                companyName: registrationData.businessName || 'Empresa Pendiente',
                companyRut: registrationData.companyRut || 'Pendiente',
                email: user.email,
                phone: registrationData.phone || null
              });
              
              if (kbResult.success) {
                console.log('✅ Base de conocimiento creada automáticamente para empresa OAuth');
              } else {
                console.warn('⚠️ No se pudo crear base de conocimiento OAuth automáticamente:', kbResult.error);
              }
            } catch (kbError) {
              console.warn('⚠️ Error creando base de conocimiento OAuth automáticamente:', kbError.message);
            }
          }
        }

        // Limpiar datos de registro pendientes
        if (registrationData) {
          localStorage.removeItem('pending_oauth_registration');
        }
      }
    } catch (bgError) {
      console.warn('⚠️ Error en creación background de usuario:', bgError.message);
    }

    console.log('✅ Autenticación con Google exitosa');
    return {
      user: mockUser,
      session: mockSession,
      error: null,
      redirectToProfile: redirectToProfile || needsProfileCompletion
    };
  } catch (error) {
    console.error('❌ Error in handleAuthCallback:', error);
    console.error('Stack trace:', error.stack);
    return { user: null, session: null, error: 'Error al procesar la autenticación. Por favor, intenta de nuevo.', redirectToProfile: false };
  }
};

/**
 * Actualiza el perfil del usuario actual
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
const updateUserProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuario no autenticado.' };
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { error: 'Error al actualizar perfil. Por favor, intenta de nuevo.' };
  }
};


/**
 * Confirma la cuenta del usuario usando el token
 * @param {string} token - Token de confirmación
 * @returns {Promise<{user, error}>}
 */
const confirmEmail = async (token) => {
  try {
    // Intentar decodificar el token si está URL-encoded
    let tokenToVerify = token;
    try {
      const decodedToken = decodeURIComponent(token);
      if (decodedToken !== token) {
        tokenToVerify = decodedToken;
      }
    } catch (decodeError) {
      // Token no estaba URL-encoded o ya estaba decodificado
    }

    // Verificar el token JWT
    const payload = await verifyToken(tokenToVerify);
    if (!payload || payload.type !== 'email_confirmation') {
      return { user: null, error: 'Token de confirmación inválido o expirado.' };
    }

    const { email } = payload;

    // Actualizar el estado de validación del usuario
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        validation_status: 'validated',
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      return { user: null, error: handleSupabaseError(updateError) };
    }

    console.log('✅ Email confirmado para:', email);

    // Crear objeto user para retorno
    const user = {
      id: userData.id,
      email: userData.email,
      user_metadata: {
        full_name: userData.full_name,
        rut: userData.rut,
        role: userData.role,
      },
    };

    return { user, error: null };

  } catch (error) {
    console.error('Error confirming email:', error);
    return { user: null, error: 'Error al confirmar email. El token puede haber expirado.' };
  }
};

/**
 * Inicia el proceso de cambio de email del usuario
 * @param {string} userId - ID del usuario
 * @param {string} newEmail - Nuevo email
 * @param {string} currentEmail - Email actual
 * @param {string} fullName - Nombre completo del usuario
 * @returns {Promise<{success, error}>}
 */
const initiateEmailChange = async (userId, newEmail, currentEmail, fullName) => {
  try {
    console.log('🔄 Iniciando cambio de email:', { userId, newEmail, currentEmail });

    // Verificar que el nuevo email no esté en uso por otro usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .single();

    // Si el email existe y no pertenece al usuario actual, rechazar
    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: 'Este email ya está registrado por otro usuario.' };
    }

    // Generar token de cambio de email
    const changeToken = await createAccessToken({
      userId,
      newEmail,
      currentEmail,
      type: 'email_change',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    });

    // Enviar email personalizado de cambio de email
    const emailResult = await sendEmailChangeConfirmation(newEmail, fullName, changeToken, currentEmail);

    if (!emailResult.success) {
      console.error('❌ Error enviando email de cambio:', emailResult.error);
      return { success: false, error: 'Error al enviar email de confirmación.' };
    }

    console.log('✅ Email de cambio enviado exitosamente');
    return { success: true, error: null };

  } catch (error) {
    console.error('Error initiating email change:', error);
    return { success: false, error: 'Error al iniciar cambio de email.' };
  }
};

/**
 * Confirma el cambio de email usando el token
 * @param {string} token - Token de cambio de email
 * @returns {Promise<{user, error}>}
 */
const confirmEmailChange = async (token) => {
  try {
    // Intentar decodificar el token si está URL-encoded
    let tokenToVerify = token;
    try {
      const decodedToken = decodeURIComponent(token);
      if (decodedToken !== token) {
        tokenToVerify = decodedToken;
      }
    } catch (decodeError) {
      // Token no estaba URL-encoded o ya estaba decodificado
    }

    // Verificar el token JWT
    const payload = await verifyToken(tokenToVerify);
    if (!payload || payload.type !== 'email_change') {
      return { user: null, error: 'Token de cambio de email inválido o expirado.' };
    }

    const { userId, newEmail, currentEmail } = payload;

    // Verificar que el nuevo email no esté en uso por otro usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return { user: null, error: 'Este email ya está siendo usado por otro usuario.' };
    }

    // Primero actualizar el email en Supabase Auth
    console.log('🔄 Actualizando email en Supabase Auth...');
    const { error: authUpdateError } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (authUpdateError) {
      console.error('❌ Error actualizando email en Supabase Auth:', authUpdateError);
      return { user: null, error: handleSupabaseError(authUpdateError) };
    }

    // Luego actualizar el email en nuestra tabla users
    console.log('🔄 Actualizando email en tabla users...');
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando email en tabla users:', updateError);
      // Si falla la actualización en users pero funcionó en Auth, al menos el email cambió
      console.warn('⚠️ Email cambió en Supabase Auth pero no en tabla users');
    }

    console.log('✅ Email cambiado exitosamente:', { from: currentEmail, to: newEmail });

    // Nota: Después de cambiar el email en Supabase Auth, el usuario puede necesitar
    // confirmar el cambio a través del email que Supabase envía automáticamente.
    // La sesión actual podría mantenerse válida, pero recomendamos que el usuario
    // haga logout y login nuevamente para asegurar consistencia.

    // Crear objeto user para retorno
    const user = {
      id: userData?.id || userId,
      email: newEmail,
      user_metadata: userData ? {
        full_name: userData.full_name,
        rut: userData.rut,
        role: userData.role,
      } : undefined,
    };

    return { user, error: null };

  } catch (error) {
    console.error('Error confirming email change:', error);
    return { user: null, error: 'Error al confirmar cambio de email. El token puede haber expirado.' };
  }
};

/**
 * Valida manualmente un usuario (solo para administradores)
 * @param {string} userId - ID del usuario a validar
 * @returns {Promise<{user, error}>}
 */
const validateUserManually = async (userId) => {
  try {
    console.log('🔍 Validando usuario manualmente:', userId);

    // Actualizar el estado de validación del usuario
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        validation_status: 'validated',
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando usuario:', updateError);
      return { user: null, error: handleSupabaseError(updateError) };
    }

    console.log('✅ Usuario validado manualmente:', userData.email);

    // Crear objeto user para retorno
    const user = {
      id: userData.id,
      email: userData.email,
      user_metadata: {
        full_name: userData.full_name,
        rut: userData.rut,
        role: userData.role,
      },
    };

    return { user, error: null };

  } catch (error) {
    console.error('Error validating user manually:', error);
    return { user: null, error: 'Error al validar usuario manualmente.' };
  }
};

/**
 * Rechaza un usuario (solo para administradores)
 * @param {string} userId - ID del usuario a rechazar
 * @returns {Promise<{user, error}>}
 */
const rejectUser = async (userId) => {
  try {
    console.log('🔍 Rechazando usuario:', userId);

    // Actualizar el estado de validación del usuario
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        validation_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error rechazando usuario:', updateError);
      return { user: null, error: handleSupabaseError(updateError) };
    }

    console.log('✅ Usuario rechazado:', userData.email);

    // Crear objeto user para retorno
    const user = {
      id: userData.id,
      email: userData.email,
      user_metadata: {
        full_name: userData.full_name,
        rut: userData.rut,
        role: userData.role,
      },
    };

    return { user, error: null };

  } catch (error) {
    console.error('Error rejecting user:', error);
    return { user: null, error: 'Error al rechazar usuario.' };
  }
};

/**
 * Envía email de reset de contraseña para un usuario (solo para administradores)
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success, error, messageId}>}
 */
const sendPasswordResetForUser = async (userId) => {
  try {
    console.log('🔑 Enviando reset de contraseña para usuario:', userId);

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error obteniendo datos del usuario:', userError);
      return { success: false, error: handleSupabaseError(userError) };
    }

    // Generar token de reset de contraseña
    const resetToken = await createAccessToken({
      email: userData.email,
      type: 'password_reset',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    });

    // Enviar email de reset
    const emailResult = await sendPasswordReset(userData.email, userData.full_name, resetToken);

    if (!emailResult.success) {
      console.error('❌ Error enviando email de reset:', emailResult.error);
      return { success: false, error: emailResult.error };
    }

    console.log('✅ Email de reset enviado a:', userData.email);
    return { success: true, error: null, messageId: emailResult.messageId };

  } catch (error) {
    console.error('Error sending password reset for user:', error);
    return { success: false, error: 'Error al enviar email de reset de contraseña.' };
  }
};



/**
 * Configura la información bancaria de una empresa
 * @param {Object} bankAccountData - Datos bancarios
 * @returns {Promise<{success, error, beneficiaryId}>}
 */
const setupCompanyBankAccount = async (bankAccountData) => {
  try {
    console.log('🚀 Iniciando setupCompanyBankAccount...');
    console.log('📋 Datos recibidos:', bankAccountData);

    // Primero intentar obtener el usuario de la sesión actual
    console.log('🔍 Verificando sesión actual...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📊 Datos de sesión:', { session: sessionData?.session ? 'presente' : 'ausente', error: sessionError });

    // Si no hay sesión, intentar obtener el usuario directamente
    let user = sessionData?.session?.user;
    if (!user) {
      console.log('🔄 Intentando obtener usuario directamente...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('📊 Datos de usuario:', { user: userData?.user ? 'presente' : 'ausente', error: userError });
      user = userData?.user;
    }

    // Si todavía no hay usuario, intentar desde localStorage (sistema legacy)
    if (!user) {
      console.log('🔄 Intentando obtener desde localStorage...');
      try {
        const sessionData = localStorage.getItem('secure_session') || localStorage.getItem('mock_session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData);
          user = parsedSession.user;
          console.log('✅ Usuario obtenido desde localStorage:', user?.email);
        }
      } catch (localStorageError) {
        console.warn('⚠️ Error leyendo localStorage:', localStorageError);
      }
    }

    console.log('👤 Usuario final:', user ? { id: user.id, email: user.email } : 'No encontrado');

    if (!user) {
      console.error('❌ Usuario no autenticado - No se encontró ninguna sesión');
      return { success: false, error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.' };
    }

    // Obtener información de la empresa
    console.log('🏢 Buscando información de la empresa...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('📊 Resultado búsqueda empresa:', { company: company ? 'encontrada' : 'no encontrada', error: companyError });

    if (companyError || !company) {
      console.error('❌ Empresa no encontrada:', companyError);
      return { success: false, error: 'Empresa no encontrada.' };
    }

    // Preparar datos bancarios
    let bankAccountInfo = null;
    let mercadopagoBeneficiaryId = null;

    // Mapear nombre de banco a código de Mercado Pago
    const bankCodeMap = {
      'banco estado': '038',
      'banco de chile': '001',
      'banco santander': '037',
      'banco bci': '016',
      'banco itau': '039',
      'banco security': '049',
      'banco falabella': '051',
      'banco ripley': '053',
      'banco consignación': '000',
      'scotiabank': '014',
      'bbva': '504',
      'banco edwards citi': '002',
      'hsbc bank': '031',
      'rabobank': '050',
      'banco penta': '017',
      'banco paris': '009',
      'btg pactual': '059',
      'corpbanca': '027',
      'banco del desarrollo': '045',
      'mercado pago': '000',
      'mach': '000',
      'tenpo': '000',
      'copec pay': '000',
      'caja los andes': '000',
      'prepago los héroes': '000',
      'bci prepago': '016',
      'itaú prepago': '039',
      'santander light': '037'
    };

    // Nota: Mercado Pago no requiere registro previo de beneficiarios.
    // Los datos del beneficiario se proporcionan con cada solicitud de pago.
    // Simplemente marcamos como "registrado" ya que tenemos la información necesaria.
    mercadopagoBeneficiaryId = `verified-${user.id}-${Date.now()}`;
    console.log('✅ Beneficiario listo para Mercado Pago (no requiere registro previo):', mercadopagoBeneficiaryId);

    // Guardar información bancaria
    bankAccountInfo = {
      bankName: bankAccountData.bankName,
      accountType: bankAccountData.accountType,
      accountNumber: bankAccountData.accountNumber,
      accountHolderName: bankAccountData.accountHolderName,
      bankId: bankCodeMap[bankAccountData.bankName.toLowerCase()] || '000'
    };
    console.log('💳 Información bancaria preparada:', bankAccountInfo);

    // Actualizar empresa con información bancaria
    console.log('💾 Actualizando empresa con información bancaria...');
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        bank_account_info: bankAccountInfo,
        mercadopago_beneficiary_id: mercadopagoBeneficiaryId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    console.log('📊 Resultado actualización:', { error: updateError });

    if (updateError) {
      console.error('❌ Error actualizando empresa:', updateError);
      return { success: false, error: handleSupabaseError(updateError) };
    }

    console.log('✅ Información bancaria configurada exitosamente');
    return {
      success: true,
      beneficiaryId: mercadopagoBeneficiaryId,
      error: null
    };

  } catch (error) {
    console.error('❌ Error en setupCompanyBankAccount:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error: `Error al configurar cuenta bancaria: ${error.message}` };
  }
};

export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  sendPasswordResetEmail,
  updatePassword,
  resetPasswordWithToken,
  checkEmailExists,
  checkRutExists,
  checkPhoneExists,
  onAuthStateChange,
  updateUserProfile,
  signInWithGoogle,
  handleAuthCallback,
  confirmEmail,
  initiateEmailChange,
  confirmEmailChange,
  validateUserManually,
  rejectUser,
  sendPasswordResetForUser,
  setupCompanyBankAccount,
};
