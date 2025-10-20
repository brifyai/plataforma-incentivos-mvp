/**
 * Custom Hook for Debtor Analytics
 * 
 * Hook personalizado para manejar analytics avanzados de deudores
 * con caching y actualizaciones en tiempo real
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debtorAnalyticsService } from '../services/debtorAnalyticsService';

export const useDebtorAnalytics = (userId, options = {}) => {
  const {
    timeRange = '30d',
    enableRealTime = true,
    autoRefresh = true,
    refreshInterval = 30000 // 30 segundos
  } = options;

  // Estados para diferentes tipos de datos
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [paymentPredictions, setPaymentPredictions] = useState(null);
  const [behavioralAnalysis, setBehavioralAnalysis] = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [visualizationData, setVisualizationData] = useState({});
  
  // Estados de carga y error
  const [loading, setLoading] = useState({
    financial: false,
    predictions: false,
    behavioral: false,
    progress: false,
    visualization: false
  });
  
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Referencias para manejo de suscripciones
  const subscriptionRef = useRef(null);
  const intervalRef = useRef(null);

  // Cargar métricas financieras
  const loadFinancialMetrics = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, financial: true }));
    setError(null);
    
    try {
      const data = await debtorAnalyticsService.getFinancialMetrics(userId, timeRange);
      setFinancialMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading financial metrics:', err);
      setError(err.message || 'Error loading financial metrics');
    } finally {
      setLoading(prev => ({ ...prev, financial: false }));
    }
  }, [userId, timeRange]);

  // Cargar predicciones de pagos
  const loadPaymentPredictions = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, predictions: true }));
    
    try {
      const data = await debtorAnalyticsService.getPaymentPredictions(userId);
      setPaymentPredictions(data);
    } catch (err) {
      console.error('Error loading payment predictions:', err);
      setError(err.message || 'Error loading payment predictions');
    } finally {
      setLoading(prev => ({ ...prev, predictions: false }));
    }
  }, [userId]);

  // Cargar análisis de comportamiento
  const loadBehavioralAnalysis = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, behavioral: true }));
    
    try {
      const data = await debtorAnalyticsService.getBehavioralAnalysis(userId);
      setBehavioralAnalysis(data);
    } catch (err) {
      console.error('Error loading behavioral analysis:', err);
      setError(err.message || 'Error loading behavioral analysis');
    } finally {
      setLoading(prev => ({ ...prev, behavioral: false }));
    }
  }, [userId]);

  // Cargar métricas de progreso
  const loadProgressMetrics = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, progress: true }));
    
    try {
      const data = await debtorAnalyticsService.getProgressMetrics(userId);
      setProgressMetrics(data);
    } catch (err) {
      console.error('Error loading progress metrics:', err);
      setError(err.message || 'Error loading progress metrics');
    } finally {
      setLoading(prev => ({ ...prev, progress: false }));
    }
  }, [userId]);

  // Cargar datos de visualización
  const loadVisualizationData = useCallback(async (chartType, customTimeRange) => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, visualization: true }));
    
    try {
      const data = await debtorAnalyticsService.getVisualizationData(
        userId, 
        chartType, 
        customTimeRange || timeRange
      );
      
      setVisualizationData(prev => ({
        ...prev,
        [chartType]: data
      }));
    } catch (err) {
      console.error('Error loading visualization data:', err);
      setError(err.message || 'Error loading visualization data');
    } finally {
      setLoading(prev => ({ ...prev, visualization: false }));
    }
  }, [userId, timeRange]);

  // Cargar todos los datos
  const loadAllData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({
      financial: true,
      predictions: true,
      behavioral: true,
      progress: true,
      visualization: true
    }));
    
    try {
      await Promise.all([
        loadFinancialMetrics(),
        loadPaymentPredictions(),
        loadBehavioralAnalysis(),
        loadProgressMetrics(),
        loadVisualizationData('payment_history'),
        loadVisualizationData('debt_trend'),
        loadVisualizationData('payment_distribution'),
        loadVisualizationData('financial_health')
      ]);
    } catch (err) {
      console.error('Error loading all data:', err);
      setError(err.message || 'Error loading analytics data');
    } finally {
      setLoading(prev => ({
        financial: false,
        predictions: false,
        behavioral: false,
        progress: false,
        visualization: false
      }));
    }
  }, [userId, loadFinancialMetrics, loadPaymentPredictions, loadBehavioralAnalysis, loadProgressMetrics, loadVisualizationData]);

  // Refrescar datos específicos
  const refreshData = useCallback(async (dataType) => {
    switch (dataType) {
      case 'financial':
        await loadFinancialMetrics();
        break;
      case 'predictions':
        await loadPaymentPredictions();
        break;
      case 'behavioral':
        await loadBehavioralAnalysis();
        break;
      case 'progress':
        await loadProgressMetrics();
        break;
      case 'visualization':
        await loadVisualizationData('payment_history');
        await loadVisualizationData('debt_trend');
        await loadVisualizationData('payment_distribution');
        await loadVisualizationData('financial_health');
        break;
      default:
        await loadAllData();
    }
  }, [loadFinancialMetrics, loadPaymentPredictions, loadBehavioralAnalysis, loadProgressMetrics, loadVisualizationData, loadAllData]);

  // Configurar suscripción a actualizaciones en tiempo real
  useEffect(() => {
    if (!enableRealTime || !userId) return;

    const handleRealTimeUpdate = (data) => {
      console.log('Real-time analytics update:', data);
      
      // Actualizar timestamp
      setLastUpdated(new Date());
      
      // Refrescar datos automáticamente
      refreshData('financial');
    };

    subscriptionRef.current = debtorAnalyticsService.subscribe(handleRealTimeUpdate);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [enableRealTime, userId, refreshData]);

  // Configurar auto-refresco
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    intervalRef.current = setInterval(() => {
      refreshData('financial');
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, userId, refreshInterval, refreshInterval]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, loadAllData]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calcular métricas derivadas
  const derivedMetrics = {
    overallProgress: financialMetrics ? financialMetrics.paymentProgress : 0,
    financialHealthGrade: financialMetrics ? 
      (financialMetrics.financialHealthScore >= 80 ? 'A' :
       financialMetrics.financialHealthScore >= 70 ? 'B' :
       financialMetrics.financialHealthScore >= 60 ? 'C' : 'D') : 'N/A',
    riskLevel: paymentPredictions ? 
      (paymentPredictions.riskOfDefault < 0.2 ? 'Low' :
       paymentPredictions.riskOfDefault < 0.5 ? 'Medium' : 'High') : 'Unknown',
    nextPaymentStatus: financialMetrics && financialMetrics.nextPaymentDue ? 
      (new Date() > financialMetrics.nextPaymentDue ? 'Overdue' : 'Pending') : 'Unknown'
  };

  return {
    // Datos
    financialMetrics,
    paymentPredictions,
    behavioralAnalysis,
    progressMetrics,
    visualizationData,
    
    // Estados
    loading,
    error,
    lastUpdated,
    
    // Métricas derivadas
    derivedMetrics,
    
    // Métodos
    loadFinancialMetrics,
    loadPaymentPredictions,
    loadBehavioralAnalysis,
    loadProgressMetrics,
    loadVisualizationData,
    loadAllData,
    refreshData,
    
    // Utilidades
    isLoading: Object.values(loading).some(Boolean),
    hasError: !!error,
    isDataLoaded: !!(financialMetrics || paymentPredictions || behavioralAnalysis || progressMetrics)
  };
};

export default useDebtorAnalytics;