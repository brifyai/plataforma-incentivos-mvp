/**
 * Performance Cache Component
 * 
 * Componente para gestionar caché de datos y optimizar rendimiento
 * Implementa patrón stale-while-revalidate
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Configuración de caché
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  BACKGROUND_REFRESH_INTERVAL: 30 * 1000, // 30 segundos
  MAX_CACHE_SIZE: 100, // Máximo de entradas en caché
};

// Cache global en memoria
const globalCache = new Map();

class CacheManager {
  constructor() {
    this.cache = globalCache;
    this.subscribers = new Map();
  }

  // Generar clave de caché
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Obtener datos del caché
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar si ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar timestamp de último acceso
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  // Guardar datos en caché
  set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    // Limpiar caché si excede el tamaño máximo
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    const entry = {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
    
    // Notificar suscriptores
    this.notifySubscribers(key, data);
  }

  // Limpiar entradas antiguas
  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por último acceso y eliminar las más antiguas
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const toDelete = entries.slice(0, Math.floor(CACHE_CONFIG.MAX_CACHE_SIZE * 0.2));
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  // Suscribirse a cambios en una clave
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Retornar función de unsuscribe
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notificar a suscriptores
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error en callback de suscriptor:', error);
        }
      });
    }
  }

  // Invalidar clave específica
  invalidate(key) {
    this.cache.delete(key);
  }

  // Invalidar por patrón
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el caché
  clear() {
    this.cache.clear();
    this.subscribers.clear();
  }

  // Obtener estadísticas del caché
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
      hitRate: this._hitRate || 0,
      entries: entries.length,
      expired: entries.filter(e => now > e.expiresAt).length,
      memoryUsage: JSON.stringify(entries).length, // Aproximación
    };
  }

  // Actualizar hit rate
  _updateHitRate(hit) {
    this._hitRate = this._hitRate ? (this._hitRate * 0.9 + hit * 0.1) : hit;
  }
}

// Instancia global del gestor de caché
const cacheManager = new CacheManager();

/**
 * Hook para usar caché con patrón stale-while-revalidate
 */
export const usePerformanceCache = (key, fetcher, options = {}) => {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    backgroundRefresh = true,
    refreshInterval = CACHE_CONFIG.BACKGROUND_REFRESH_INTERVAL,
    enabled = true,
    ...fetchOptions
  } = options;

  const [data, setData] = useState(() => {
    if (!enabled) return null;
    return cacheManager.get(key);
  });

  const [loading, setLoading] = useState(!data && enabled);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const entry = cacheManager.cache.get(key);
    return entry ? entry.createdAt : null;
  });

  const mountedRef = useRef(true);
  const refreshTimeoutRef = useRef(null);

  // Función para obtener datos
  const fetchData = useCallback(async (isBackground = false) => {
    if (!enabled) return;

    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      const result = await fetcher(fetchOptions);
      
      // Guardar en caché
      cacheManager.set(key, result, ttl);
      
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(Date.now());
        cacheManager._updateHitRate(1);
      }
    } catch (err) {
      console.error(`Error fetching data for key ${key}:`, err);
      if (mountedRef.current) {
        setError(err);
        cacheManager._updateHitRate(0);
      }
    } finally {
      if (mountedRef.current && !isBackground) {
        setLoading(false);
      }
    }
  }, [key, fetcher, ttl, enabled, fetchOptions]);

  // Función para refrescar datos manualmente
  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Suscribirse a cambios en caché
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = cacheManager.subscribe(key, (newData) => {
      if (mountedRef.current) {
        setData(newData);
        setLastUpdated(Date.now());
      }
    });

    return unsubscribe;
  }, [key, enabled]);

  // Obtener datos iniciales
  useEffect(() => {
    if (!enabled) return;

    const cachedData = cacheManager.get(key);
    if (cachedData) {
      setData(cachedData);
      setLastUpdated(cacheManager.cache.get(key)?.createdAt || null);
      setLoading(false);
      
      // Refresco en segundo plano si está habilitado
      if (backgroundRefresh) {
        fetchData(true);
      }
    } else {
      fetchData(false);
    }
  }, [key, enabled, backgroundRefresh, fetchData]);

  // Configurar refresco automático en segundo plano
  useEffect(() => {
    if (!enabled || !backgroundRefresh) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        fetchData(true);
        scheduleRefresh();
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [enabled, backgroundRefresh, refreshInterval, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isStale: lastUpdated ? (Date.now() - lastUpdated) > ttl : true,
  };
};

/**
 * Hook para caché de múltiples consultas
 */
export const useMultiCache = (queries, options = {}) => {
  const results = queries.map(({ key, fetcher, ...opts }) => {
    return usePerformanceCache(key, fetcher, { ...options, ...opts });
  });

  const data = results.map(r => r.data);
  const loading = results.some(r => r.loading);
  const error = results.find(r => r.error)?.error || null;
  const refetch = () => Promise.all(results.map(r => r.refetch()));
  const lastUpdated = Math.max(...results.map(r => r.lastUpdated || 0));

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    individualResults: results,
  };
};

/**
 * Utilidades para gestión de caché
 */
export const cacheUtils = {
  // Invalidar caché específico
  invalidate: (key) => cacheManager.invalidate(key),
  
  // Invalidar por patrón
  invalidatePattern: (pattern) => cacheManager.invalidatePattern(pattern),
  
  // Limpiar todo el caché
  clear: () => cacheManager.clear(),
  
  // Obtener estadísticas
  getStats: () => cacheManager.getStats(),
  
  // Precargar datos
  preload: async (key, fetcher, options = {}) => {
    try {
      const data = await fetcher(options);
      cacheManager.set(key, data, options.ttl);
      return data;
    } catch (error) {
      console.error(`Error preloading data for key ${key}:`, error);
      throw error;
    }
  },
  
  // Generar clave de caché
  generateKey: (prefix, params = {}) => cacheManager.generateKey(prefix, params),
};

export default cacheManager;