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
  throw new Error(
    'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas. ' +
    'Por favor, configúralas en tu archivo .env'
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

export default supabase;
