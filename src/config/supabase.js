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

// Estado de configuración
let isConfigured = !!(supabaseUrl && supabaseAnonKey);
let isMockMode = !isConfigured;

// Crear un cliente mock para cuando no hay configuración
const createMockSupabase = () => {
  console.warn('⚠️ Supabase no configurado. Usando cliente mock.');
  console.warn('🔧 Solución: Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify Dashboard');
  console.warn('📋 Verifica: Site settings > Build & deploy > Environment variables');
  
  // Marcar que falta configuración
  if (typeof window !== 'undefined') {
    window.SUPABASE_MISSING_CONFIG = true;
    window.SUPABASE_MOCK_MODE = true;
  }
  
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      eq: () => ({ 
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
      }),
      order: () => ({ 
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }) })
      }),
      limit: () => ({ 
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } })
      }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      then: (resolve) => resolve({ data: [], error: { message: 'Supabase no configurado' } })
    }),
    auth: {
      signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signOut: () => Promise.resolve({ error: { message: 'Supabase no configurado' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      getUser: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      session: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      currentUser: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' }, error: null })
      })
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
    },
    realtime: {
      subscribe: () => ({ unsubscribe: () => {} })
    }
  };
};

// Validar que las variables de entorno estén configuradas
if (!isConfigured) {
  // En desarrollo, mostrar error detallado
  if (!import.meta.env.PROD) {
    console.error(
      `❌ Variables de entorno faltantes:\n` +
      `- VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ FALTANTE'}\n` +
      `- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌ FALTANTE'}\n\n` +
      `🔧 Crea un archivo .env con estas variables:\n` +
      `VITE_SUPABASE_URL=tu_url_de_supabase\n` +
      `VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase\n\n` +
      `📋 Revisa la documentación para obtener las credenciales.`
    );
  } else {
    // En producción, solo advertir pero continuar con modo mock
    console.warn('⚠️ Supabase no configurado en producción. La aplicación funcionará en modo limitado.');
  }
}

// Crear el cliente de Supabase (real o mock)
let supabaseClient;

if (isConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  } catch (error) {
    console.error('Error creando cliente de Supabase, usando modo mock:', error);
    supabaseClient = createMockSupabase();
    isMockMode = true;
  }
} else {
  supabaseClient = createMockSupabase();
}

// Función helper para manejar errores de Supabase de manera consistente
const handleSupabaseError = (error) => {
  if (!error) return null;

  // Log del error en desarrollo
  if (import.meta.env.DEV) {
    console.error('Supabase Error:', error);
  }

  // Si estamos en modo mock, retornar mensaje específico
  if (isMockMode) {
    return 'La base de datos no está configurada. Algunas funciones pueden no estar disponibles.';
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

// Función para verificar si Supabase está configurado
const isSupabaseConfigured = () => isConfigured && !isMockMode;

// Función para verificar si estamos en modo mock
const isSupabaseMockMode = () => isMockMode;

// Exportar el cliente y las funciones
export { 
  supabaseClient as supabase, 
  handleSupabaseError, 
  isSupabaseConfigured, 
  isSupabaseMockMode 
};
export default supabaseClient;
