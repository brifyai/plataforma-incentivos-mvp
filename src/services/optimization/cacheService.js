/**
 * Servicio de Caché Inteligente para NexuPay
 * 
 * Implementa caché en memoria con TTL (Time To Live)
 * para optimizar consultas frecuentes a la base de datos
 */

// Cache en memoria
const memoryCache = new Map();

// Configuración del caché
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
  maxSize: 100, // Máximo número de entradas en caché
  cleanupInterval: 60 * 1000, // Limpiar caché cada minuto
  enableMetrics: true // Habilitar métricas de rendimiento
};

// Métricas del caché
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  cleanups: 0,
  totalRequests: 0
};

// Tiempos de TTL específicos por tipo de dato
const TTL_CONFIG = {
  user_profile: 10 * 60 * 1000, // 10 minutos
  company_profile: 15 * 60 * 1000, // 15 minutos
  company_debts: 2 * 60 * 1000, // 2 minutos
  company_clients: 5 * 60 * 1000, // 5 minutos
  payment_stats: 3 * 60 * 1000, // 3 minutos
  commission_stats: 5 * 60 * 1000, // 5 minutos
  system_config: 30 * 60 * 1000, // 30 minutos
  analytics_data: 7 * 60 * 1000, // 7 minutos
  default: 5 * 60 * 1000 // 5 minutos por defecto
};

/**
 * Genera una clave de caché única basada en el nombre de la función y los parámetros
 * @param {string} functionName - Nombre de la función
 * @param {Array|Object} params - Parámetros de la función
 * @returns {string} - Clave de caché única
 */
const generateCacheKey = (functionName, params) => {
  try {
    const paramsStr = typeof params === 'object' 
      ? JSON.stringify(params, Object.keys(params).sort()) 
      : String(params);
    return `${functionName}:${btoa(paramsStr).replace(/[^a-zA-Z0-9]/g, '')}`;
  } catch (error) {
    console.warn('Error generating cache key:', error);
    return `${functionName}:${Date.now()}`;
  }
};

/**
 * Verifica si una entrada de caché ha expirado
 * @param {Object} cacheEntry - Entrada de caché
 * @returns {boolean} - true si ha expirado
 */
const isExpired = (cacheEntry) => {
  return Date.now() > cacheEntry.expiresAt;
};

/**
 * Limpia las entradas expiradas del caché
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    cacheMetrics.cleanups++;
    console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
  }
};

/**
 * Evicta las entradas más antiguas si el caché excede el tamaño máximo
 */
const evictOldestEntries = () => {
  if (memoryCache.size <= CACHE_CONFIG.maxSize) {
    return;
  }
  
  // Convertir a array y ordenar por fecha de creación
  const entries = Array.from(memoryCache.entries())
    .sort(([, a], [, b]) => a.createdAt - b.createdAt);
  
  // Eliminar las entradas más antiguas
  const toDelete = entries.slice(0, memoryCache.size - CACHE_CONFIG.maxSize);
  toDelete.forEach(([key]) => {
    memoryCache.delete(key);
    cacheMetrics.evictions++;
  });
  
  console.log(`🗑️ Cache eviction: removed ${toDelete.length} oldest entries`);
};

/**
 * Obtiene el TTL apropiado para un tipo de dato
 * @param {string} dataType - Tipo de dato
 * @returns {number} - TTL en milisegundos
 */
const getTTL = (dataType) => {
  return TTL_CONFIG[dataType] || TTL_CONFIG.default;
};

/**
 * Obtiene una entrada del caché
 * @param {string} key - Clave del caché
 * @returns {any|null} - Datos del caché o null si no existe o ha expirado
 */
const get = (key) => {
  const entry = memoryCache.get(key);
  
  if (!entry) {
    cacheMetrics.misses++;
    cacheMetrics.totalRequests++;
    return null;
  }
  
  if (isExpired(entry)) {
    memoryCache.delete(key);
    cacheMetrics.misses++;
    cacheMetrics.totalRequests++;
    return null;
  }
  
  cacheMetrics.hits++;
  cacheMetrics.totalRequests++;
  entry.accessCount++;
  entry.lastAccessed = Date.now();
  
  return entry.data;
};

/**
 * Establece una entrada en el caché
 * @param {string} key - Clave del caché
 * @param {any} data - Datos a almacenar
 * @param {string} dataType - Tipo de dato para determinar TTL
 * @param {number} customTTL - TTL personalizado (opcional)
 */
const set = (key, data, dataType = 'default', customTTL = null) => {
  const ttl = customTTL || getTTL(dataType);
  const now = Date.now();
  
  const entry = {
    data,
    createdAt: now,
    lastAccessed: now,
    expiresAt: now + ttl,
    accessCount: 0,
    dataType
  };
  
  memoryCache.set(key, entry);
  cacheMetrics.sets++;
  
  // Evictar entradas antiguas si es necesario
  evictOldestEntries();
};

/**
 * Elimina una entrada del caché
 * @param {string} key - Clave del caché
 * @returns {boolean} - true si se eliminó correctamente
 */
const remove = (key) => {
  return memoryCache.delete(key);
};

/**
 * Limpia todo el caché
 */
const clear = () => {
  const size = memoryCache.size;
  memoryCache.clear();
  console.log(`🧹 Cache cleared: removed ${size} entries`);
};

/**
 * Obtiene métricas del caché
 * @returns {Object} - Métricas del caché
 */
const getMetrics = () => {
  const hitRate = cacheMetrics.totalRequests > 0 
    ? (cacheMetrics.hits / cacheMetrics.totalRequests * 100).toFixed(2)
    : 0;
    
  return {
    ...cacheMetrics,
    hitRate: `${hitRate}%`,
    cacheSize: memoryCache.size,
    maxSize: CACHE_CONFIG.maxSize,
    memoryUsage: `${(memoryCache.size * 0.1).toFixed(2)} KB` // Estimación
  };
};

/**
 * Invalida entradas del caché por patrón
 * @param {string} pattern - Patrón a buscar (ej: 'user_profile:')
 */
const invalidatePattern = (pattern) => {
  let invalidatedCount = 0;
  
  for (const [key] of memoryCache.entries()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
      invalidatedCount++;
    }
  }
  
  console.log(`🗑️ Cache invalidation: removed ${invalidatedCount} entries matching "${pattern}"`);
  return invalidatedCount;
};

/**
 * Decorador para funciones que habilita el caché automáticamente
 * @param {string} dataType - Tipo de dato para determinar TTL
 * @param {Function} keyGenerator - Función personalizada para generar clave (opcional)
 * @returns {Function} - Función decorada con caché
 */
const withCache = (dataType, keyGenerator = null) => {
  return (target, propertyName, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const functionName = propertyName;
      const cacheKey = keyGenerator 
        ? keyGenerator(functionName, args)
        : generateCacheKey(functionName, args);
      
      // Intentar obtener del caché
      const cachedResult = get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Ejecutar función original
      const result = await originalMethod.apply(this, args);
      
      // Almacenar en caché
      set(cacheKey, result, dataType);
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Wrapper para funciones asíncronas que habilita caché
 * @param {Function} fn - Función a cachear
 * @param {string} dataType - Tipo de dato para TTL
 * @param {Function} keyGenerator - Función personalizada para clave (opcional)
 * @returns {Function} - Función con caché
 */
const cachedFunction = (fn, dataType, keyGenerator = null) => {
  return async function(...args) {
    const functionName = fn.name || 'anonymous';
    const cacheKey = keyGenerator 
      ? keyGenerator(functionName, args)
      : generateCacheKey(functionName, args);
    
    // Intentar obtener del caché
    const cachedResult = get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    // Ejecutar función original
    const result = await fn.apply(this, args);
    
    // Almacenar en caché
    set(cacheKey, result, dataType);
    
    return result;
  };
};

// Iniciar limpieza periódica
setInterval(cleanupExpiredEntries, CACHE_CONFIG.cleanupInterval);

// Log inicial
console.log('🚀 Cache service initialized', {
  defaultTTL: CACHE_CONFIG.defaultTTL,
  maxSize: CACHE_CONFIG.maxSize,
  cleanupInterval: CACHE_CONFIG.cleanupInterval
});

export {
  get,
  set,
  remove,
  clear,
  getMetrics,
  invalidatePattern,
  withCache,
  cachedFunction,
  generateCacheKey,
  getTTL,
  CACHE_CONFIG,
  TTL_CONFIG
};

export default {
  get,
  set,
  remove,
  clear,
  getMetrics,
  invalidatePattern,
  withCache,
  cachedFunction,
  generateCacheKey,
  getTTL,
  config: CACHE_CONFIG,
  ttlConfig: TTL_CONFIG
};