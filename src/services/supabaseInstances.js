/**
 * Supabase Instances Manager
 * 
 * Este servicio centraliza todas las instancias de Supabase para evitar
 * múltiples instancias de GoTrueClient y problemas de configuración.
 * 
 * Proporciona:
 * - Instancia principal (cliente regular)
 * - Instancia admin (con service role key)
 * - Instancias especializadas para diferentes servicios
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Configuración
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Instancias cacheadas
let instances = {
  main: null,        // Cliente principal (importado de config/supabase.js)
  admin: null,       // Cliente con service role
  realtime: null,    // Cliente optimizado para realtime
  storage: null,     // Cliente optimizado para storage
  functions: null    // Cliente optimizado para functions
};

/**
 * Obtiene la instancia principal de Supabase
 * @returns {Object} Cliente principal de Supabase
 */
export const getMainInstance = () => {
  return supabase; // Usar la instancia ya configurada en config/supabase.js
};

/**
 * Obtiene la instancia admin de Supabase (con service role)
 * @returns {Object|null} Cliente admin de Supabase o null si no hay configuración
 */
export const getAdminInstance = () => {
  if (instances.admin) {
    return instances.admin;
  }

  // Validar que tenemos la service role key
  if (!supabaseServiceKey || 
      supabaseServiceKey.includes('3k3k3k3k') || 
      supabaseServiceKey.length < 100) {
    console.warn('⚠️ SERVICE_ROLE_KEY no válida o no configurada. Las operaciones de administrador estarán limitadas.');
    return null;
  }

  try {
    instances.admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-frontend-service': 'admin-operations'
        }
      }
    });

    console.log('✅ Instancia admin de Supabase creada exitosamente');
    return instances.admin;
  } catch (error) {
    console.error('❌ Error creando instancia admin de Supabase:', error);
    return null;
  }
};

/**
 * Obtiene una instancia optimizada para operaciones de realtime
 * @returns {Object} Cliente optimizado para realtime
 */
export const getRealtimeInstance = () => {
  if (instances.realtime) {
    return instances.realtime;
  }

  try {
    instances.realtime = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-frontend-service': 'realtime-operations'
        }
      }
    });

    console.log('✅ Instancia realtime de Supabase creada exitosamente');
    return instances.realtime;
  } catch (error) {
    console.error('❌ Error creando instancia realtime de Supabase:', error);
    return getMainInstance(); // Fallback a instancia principal
  }
};

/**
 * Obtiene una instancia optimizada para operaciones de storage
 * @returns {Object} Cliente optimizado para storage
 */
export const getStorageInstance = () => {
  if (instances.storage) {
    return instances.storage;
  }

  try {
    instances.storage = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-frontend-service': 'storage-operations'
        }
      }
    });

    console.log('✅ Instancia storage de Supabase creada exitosamente');
    return instances.storage;
  } catch (error) {
    console.error('❌ Error creando instancia storage de Supabase:', error);
    return getMainInstance(); // Fallback a instancia principal
  }
};

/**
 * Obtiene una instancia optimizada para invocar funciones
 * @returns {Object} Cliente optimizado para functions
 */
export const getFunctionsInstance = () => {
  if (instances.functions) {
    return instances.functions;
  }

  try {
    instances.functions = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      functions: {
        invokeTimeout: 60000 // 60 segundos timeout para funciones
      },
      global: {
        headers: {
          'x-frontend-service': 'functions-operations'
        }
      }
    });

    console.log('✅ Instancia functions de Supabase creada exitosamente');
    return instances.functions;
  } catch (error) {
    console.error('❌ Error creando instancia functions de Supabase:', error);
    return getMainInstance(); // Fallback a instancia principal
  }
};

/**
 * Obtiene la instancia apropiada según el tipo de operación
 * @param {string} operationType - Tipo de operación (admin, realtime, storage, functions)
 * @returns {Object} Instancia de Supabase apropiada
 */
export const getSupabaseInstance = (operationType = 'main') => {
  switch (operationType) {
    case 'admin':
      return getAdminInstance() || getMainInstance();
    case 'realtime':
      return getRealtimeInstance();
    case 'storage':
      return getStorageInstance();
    case 'functions':
      return getFunctionsInstance();
    default:
      return getMainInstance();
  }
};

/**
 * Limpia todas las instancias cacheadas (útil para testing o logout)
 */
export const clearInstances = () => {
  instances = {
    main: null,
    admin: null,
    realtime: null,
    storage: null,
    functions: null
  };
  console.log('🧹 Instancias de Supabase limpiadas');
};

/**
 * Verifica el estado de las instancias
 * @returns {Object} Estado de todas las instancias
 */
export const getInstancesStatus = () => {
  return {
    main: !!instances.main || !!supabase,
    admin: !!instances.admin,
    realtime: !!instances.realtime,
    storage: !!instances.storage,
    functions: !!instances.functions,
    config: {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyValid: supabaseServiceKey && 
                      !supabaseServiceKey.includes('3k3k3k3k') && 
                      supabaseServiceKey.length >= 100
    }
  };
};

// Exportar instancia principal por defecto para compatibilidad
export default getMainInstance();