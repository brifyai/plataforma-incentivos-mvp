/**
 * Configuración de Supabase
 * 
 * Este archivo configura el cliente de Supabase para la aplicación.
 * Las credenciales deben ser configuradas en el archivo .env
 */

import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  // En producción, mostrar advertencia pero no detener la aplicación
  if (import.meta.env.PROD) {
    console.warn('⚠️ SERVICE_ROLE_KEY no válida o no configurada. Las operaciones de administrador estarán limitadas.');
    console.warn('🔧 Solución: Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify Dashboard');
    console.warn('📋 Verifica: Site settings > Build & deploy > Environment variables');
    
    // Marcar que falta configuración
    window.SUPABASE_MISSING_CONFIG = true;
    
    // Crear un cliente mock para producción sin variables
    const mockSupabase = {
      from: () => ({
        select: () => ({ data: [], error: { message: 'Supabase no configurado' } }),
        insert: () => ({ data: null, error: { message: 'Supabase no configurado' } }),
        update: () => ({ data: null, error: { message: 'Supabase no configurado' } }),
        delete: () => ({ data: null, error: { message: 'Supabase no configurado' } }),
        eq: () => ({ select: () => ({ data: [], error: { message: 'Supabase no configurado' } }) }),
        order: () => ({ data: [], error: { message: 'Supabase no configurado' } }),
        limit: () => ({ data: [], error: { message: 'Supabase no configurado' } }),
        single: () => ({ data: null, error: { message: 'Supabase no configurado' } })
      }),
      auth: {
        signIn: () => ({ error: { message: 'Supabase no configurado' } }),
        signOut: () => ({ error: { message: 'Supabase no configurado' } }),
        signUp: () => ({ error: { message: 'Supabase no configurado' } }),
        getUser: () => ({ data: null, error: { message: 'Supabase no configurado' } }),
        onAuthStateChange: () => {},
        session: () => ({ data: null, error: { message: 'Supabase no configurado' } })
      },
      storage: {
        from: () => ({
          upload: () => ({ data: null, error: { message: 'Supabase no configurado' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' }, error: null })
        })
      }
    };
    
    // Exportar el cliente mock y la función de manejo de errores
    const handleMockError = (error) => {
      if (!error) return 'Supabase no está configurado. Contacta al administrador.';
      return error.message || 'Supabase no está configurado. Contacta al administrador.';
    };
    
    // Exportar para diferentes sistemas de módulos
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = { supabase: mockSupabase, handleSupabaseError: handleMockError };
    }
    
    // Asignar al objeto global para acceso
    window.supabase = mockSupabase;
    window.handleSupabaseError = handleMockError;
    
    // Detener la ejecución del módulo actual
    throw new Error('SUPABASE_MOCK_MODE');
  }
  
  // En desarrollo, lanzar error para que se configuren las variables
  throw new Error(
    `❌ Variables de entorno faltantes:\n` +
    `- VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ FALTANTE'}\n` +
    `- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌ FALTANTE'}\n\n` +
    `🔧 Crea un archivo .env con estas variables:\n` +
    `VITE_SUPABASE_URL=tu_url_de_supabase\n` +
    `VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase\n\n` +
    `📋 Revisa la documentación para obtener las credenciales.`
  );
}

// Crear el cliente de Supabase
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce', // Más seguro para aplicaciones SPA
    // Configurar site_url para OAuth (opcional, mejora algunos flujos)
    site_url: window.location.origin,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {},
  },
});

// Función helper para manejar errores de Supabase de manera consistente
const handleSupabaseError = (error) => {
  if (!error) return null;

  // Log del error en desarrollo
  if (import.meta.env.DEV) {
    console.error('Supabase Error:', error);
  }

  // Retornar mensaje amigable para el usuario
  const errorMessages = {
    'Invalid login credentials': 'Credenciales inválidas. Por favor, verifica tu email y contraseña.',
    'User already registered': 'Este email ya está registrado. Por favor, inicia sesión.',
    'Email not confirmed': 'Por favor, confirma tu email antes de iniciar sesión.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Network request failed': 'Error de conexión. Por favor, verifica tu conexión a internet.',
  };

  return errorMessages[error.message] || error.message || 'Ha ocurrido un error. Por favor, intenta de nuevo.';
};

// Exportar el cliente y las funciones
export { supabaseClient as supabase, handleSupabaseError };
export default supabaseClient;
