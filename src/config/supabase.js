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
  // En producción, mostrar error más específico
  if (import.meta.env.PROD) {
    console.error('❌ Error Crítico: Variables de Supabase no configuradas en producción');
    console.error('🔧 Solución: Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify Dashboard');
    console.error('📋 Verifica: Site settings > Build & deploy > Environment');
  }
  
  throw new Error(
    `❌ Variables de entorno faltantes:\n` +
    `- VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ FALTANTE'}\n` +
    `- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌ FALTANTE'}\n\n` +
    `🔧 En producción, configura estas variables en Netlify Dashboard:\n` +
    `Site settings > Build & deploy > Environment\n\n` +
    `📋 Revisa SOLUCION_ERROR_SUPABASE_KEY.md para instrucciones detalladas.`
  );
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
export const handleSupabaseError = (error) => {
  if (!error) return null;

  // Log del error en desarrollo
  if (import.meta.env.DEV) {
    console.error('Supabase Error:', error);
    
    // Log adicional para errores específicos
    if (error.code === 'PGRST116') {
      console.warn('🔍 Recurso no encontrado (404): La función o tabla solicitada no existe');
    }
    if (error.code === '400' || error.status === 400) {
      console.warn('🔍 Error de sintaxis en consulta (400): Verifica la estructura de la consulta');
    }
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.warn('🔍 Error de permisos: Verifica las políticas RLS en Supabase');
    }
  }

  // Retornar mensaje amigable para el usuario
  const errorMessages = {
    'Invalid login credentials': 'Credenciales inválidas. Por favor, verifica tu email y contraseña.',
    'User already registered': 'Este email ya está registrado. Por favor, inicia sesión.',
    'Email not confirmed': 'Por favor, confirma tu email antes de iniciar sesión.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Network request failed': 'Error de conexión. Por favor, verifica tu conexión a internet.',
    'function get_conversations_with_stats(uuid, uuid, integer, integer) does not exist':
      'La función de conversaciones no está disponible. Usando consulta alternativa.',
    'permission denied for table': 'No tienes permisos para acceder a esta tabla.',
    'column does not exist': 'La columna solicitada no existe en la tabla.',
    'relation does not exist': 'La tabla o relación especificada no existe.',
  };

  // Manejo específico para errores comunes
  if (error.code === 'PGRST116') {
    return 'El recurso solicitado no fue encontrado. Puede que la función no esté disponible aún.';
  }
  
  if (error.code === '400' || error.status === 400) {
    return 'Error en la consulta. Por favor, intenta recargar la página.';
  }

  if (error.code === '42501' || error.message?.includes('permission denied')) {
    return 'No tienes permisos para realizar esta acción. Contacta al administrador.';
  }

  return errorMessages[error.message] || error.message || 'Ha ocurrido un error. Por favor, intenta de nuevo.';
};

export default supabase;
