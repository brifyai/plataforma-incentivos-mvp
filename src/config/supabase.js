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

// Validar que las variables de entorno tengan valores válidos
const isValidUrl = (url) => {
  try {
    new URL(url);
    return url.startsWith('https://') || url.startsWith('http://');
  } catch {
    return false;
  }
};

const isValidKey = (key) => key && typeof key === 'string' && key.length > 50;

// Debug extendido en desarrollo
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Configuration Debug:');
  console.log('- Raw URL:', supabaseUrl);
  console.log('- Raw Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
  console.log('- URL type:', typeof supabaseUrl);
  console.log('- Key type:', typeof supabaseAnonKey);
  console.log('- URL Valid:', isValidUrl(supabaseUrl));
  console.log('- Key Valid:', isValidKey(supabaseAnonKey));
}

// Estado de configuración - Validar realmente
let isConfigured = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey);
let isMockMode = !isConfigured;

// Debug de estado final en desarrollo
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Final State:');
  console.log('- isConfigured:', isConfigured);
  console.log('- isMockMode:', isMockMode);
}

// FORZAR CONFIGURACIÓN CORRECTA EN DESARROLLO (temporal para diagnóstico)
if (import.meta.env.DEV && supabaseUrl && supabaseAnonKey) {
  console.log('🔧 FORZANDO CONFIGURACIÓN CORRECTA EN DESARROLLO');
  isConfigured = true;
  isMockMode = false;
  console.log('✅ Configuración forzada como correcta');
}

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
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
      }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      then: (resolve) => resolve({ data: [], error: { message: 'Supabase no configurado' } })
    }),
    auth: {
      signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signOut: () => Promise.resolve({ error: { message: 'Supabase no configurado' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      getUser: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      getSession: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      updateUser: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
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

// Crear el cliente de Supabase (solo si está configurado correctamente)
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
    console.log('✅ Supabase configurado correctamente');
  } catch (error) {
    console.error('❌ Error creando cliente de Supabase:', error);
    // Crear cliente mock para evitar que la aplicación se rompa completamente
    supabaseClient = createMockSupabase();
    isMockMode = true;
  }
} else {
  console.error('❌ Supabase no está configurado correctamente');
  console.error('🔧 Revisa tus variables de entorno:');
  console.error(`   - VITE_SUPABASE_URL: ${supabaseUrl ? 'PRESENT but invalid' : 'MISSING'}`);
  console.error(`   - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'PRESENT but invalid' : 'MISSING'}`);
  
  // Crear cliente mock para evitar que la aplicación se rompa
  supabaseClient = createMockSupabase();
  isMockMode = true;
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
