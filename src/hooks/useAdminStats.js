/**
 * useAdminStats Hook
 * 
 * Hook personalizado para obtener estadísticas de administrador
 * Optimizado con caché y actualizaciones en tiempo real
 */

import { useState, useEffect, useCallback } from 'react';
import { realTimeAnalyticsService } from '../services/realTimeAnalyticsService';
import { usePerformanceCache } from '../components/admin/PerformanceCache';

export const useAdminStats = (options = {}) => {
  const {
    refetchInterval = 60000, // 1 minuto por defecto
    staleTime = 30000, // 30 segundos por defecto
    enableRealTime = true,
    cacheEnabled = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutos
  } = options;

  // Generar clave de caché basada en opciones
  const cacheKey = `adminStats:${JSON.stringify(options)}`;

  // Función para obtener estadísticas
  const fetchAdminStats = useCallback(async () => {
    try {
      const [realTimeMetrics, businessMetrics] = await Promise.all([
        realTimeAnalyticsService.getRealTimeMetrics(),
        realTimeAnalyticsService.calculateBusinessMetrics()
      ]);

      const combinedData = {
        ...realTimeMetrics,
        businessMetrics,
        lastUpdated: new Date(),
        isStale: false
      };

      return combinedData;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }, []);

  // Usar caché de rendimiento
  const {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isStale,
  } = usePerformanceCache(cacheKey, fetchAdminStats, {
    ttl: cacheTTL,
    backgroundRefresh: true,
    refreshInterval: refetchInterval,
    enabled: cacheEnabled,
  });

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!enableRealTime) return;

    const unsubscribe = realTimeAnalyticsService.subscribe('admin_metrics', (update) => {
      console.log('📊 Actualización en tiempo real recibida:', update);
      
      // Para cambios críticos, refrescar datos inmediatamente
      if (update.type === 'INSERT' || update.type === 'UPDATE') {
        refetch();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [enableRealTime, refetch]);

  // Función para obtener métricas específicas
  const getMetric = useCallback((metricName) => {
    if (!data) return null;
    
    const metricPath = metricName.split('.');
    let value = data;
    
    for (const path of metricPath) {
      value = value?.[path];
      if (value === undefined) return null;
    }
    
    return value;
  }, [data]);

  // Función para obtener métricas formateadas
  const getFormattedMetric = useCallback((metricName, formatter) => {
    const value = getMetric(metricName);
    if (value === null) return null;
    return formatter ? formatter(value) : value;
  }, [getMetric]);

  // Función para obtener estadísticas de negocio específicas
  const getBusinessMetric = useCallback((metricName) => {
    return getMetric(`businessMetrics.${metricName}`);
  }, [getMetric]);

  return {
    stats: data,
    loading,
    error,
    refetch,
    isStale,
    getMetric,
    getFormattedMetric,
    getBusinessMetric,
    lastUpdated,
  };
};

export default useAdminStats;