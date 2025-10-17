/**
 * useEcosystemSync Hook
 * 
 * Hook personalizado para manejar la sincronización entre portales empresas-personas
 * Proporciona estado en tiempo real, notificaciones cruzadas y métricas compartidas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ecosystemSyncService from '../services/ecosystemSyncService';

export const useEcosystemSync = (options = {}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [sharedStates, setSharedStates] = useState(new Map());
  const [crossNotifications, setCrossNotifications] = useState([]);
  const [unifiedMetrics, setUnifiedMetrics] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncErrors, setSyncErrors] = useState([]);
  
  const serviceRef = useRef(null);
  const callbacksRef = useRef(new Map());
  const errorCooldownRef = useRef(new Map());

  const {
    userType = 'company', // 'company' | 'debtor' | 'admin'
    enableRealTime = true,
    autoConnect = true,
    syncChannels = ['all'],
    onError,
    onSyncEvent,
    onCrossNotification,
    onMetricsUpdate
  } = options;

  /**
   * Inicializa el servicio de sincronización
   */
  const initializeSync = useCallback(async () => {
    if (!user || !enableRealTime) return;

    try {
      setIsConnected(false);
      setSyncStatus('connecting');

      // Inicializar servicio
      const initialized = await ecosystemSyncService.initialize(
        user.id, 
        userType
      );

      if (initialized) {
        serviceRef.current = ecosystemSyncService;
        setIsConnected(true);
        setSyncStatus('connected');
        setLastSyncTime(new Date());

        // Configurar callbacks
        setupSyncCallbacks();

        // Cargar datos iniciales
        await loadInitialData();

        console.log(`🔄 Ecosystem sync initialized for ${userType}`);
      }
    } catch (error) {
      handleSyncError('initialization', error);
      setSyncStatus('error');
    }
  }, [user, userType, enableRealTime]);

  /**
   * Configura callbacks para eventos de sincronización
   */
  const setupSyncCallbacks = useCallback(() => {
    if (!serviceRef.current) return;

    // Callback para actualizaciones del dashboard unificado
    serviceRef.current.onSyncEvent('dashboard_update', (eventData) => {
      setLastSyncTime(new Date());
      onMetricsUpdate?.(eventData);
    });

    // Callback para notificaciones cruzadas
    serviceRef.current.onSyncEvent('realtime_notifications', (eventData) => {
      if (eventData.data.target_user_type === userType || !eventData.data.target_user_type) {
        setCrossNotifications(prev => [eventData.data, ...prev.slice(0, 49)]); // Mantener últimas 50
        onCrossNotification?.(eventData.data);
      }
    });

    // Callback para sincronización de estados
    serviceRef.current.onSyncEvent('company_debtor_sync', (eventData) => {
      updateLocalSharedState(eventData.data);
    });

    // Callback para métricas compartidas
    serviceRef.current.onSyncEvent('shared_analytics_sync', (eventData) => {
      updateUnifiedMetrics(eventData.data);
    });

    // Callback general para eventos de sincronización
    serviceRef.current.onSyncEvent('all', (eventData) => {
      onSyncEvent?.(eventData);
    });
  }, [userType, onSyncEvent, onCrossNotification, onMetricsUpdate]);

  /**
   * Carga datos iniciales
   */
  const loadInitialData = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      // Cargar métricas unificadas
      const metrics = await serviceRef.current.getSharedFinancialMetrics('30d');
      setUnifiedMetrics(metrics);

      // Cargar estados compartidos relevantes
      const states = await serviceRef.current.getSharedStates('user', user.id);
      const statesMap = new Map(states.map(state => [state.entity_id, state]));
      setSharedStates(statesMap);

      console.log('📊 Initial ecosystem data loaded');
    } catch (error) {
      handleSyncError('load_initial_data', error);
    }
  }, [user?.id]);

  /**
   * Maneja errores de sincronización con cooldown
   */
  const handleSyncError = useCallback((errorType, error) => {
    const cooldownKey = `${errorType}_${Date.now()}`;
    const lastErrorTime = errorCooldownRef.current.get(errorType);
    
    // Evitar spam de errores del mismo tipo (cooldown de 5 segundos)
    if (lastErrorTime && Date.now() - lastErrorTime < 5000) {
      return;
    }

    errorCooldownRef.current.set(errorType, Date.now());
    
    const errorMessage = `Sync error (${errorType}): ${error.message}`;
    setSyncErrors(prev => [...prev.slice(-4), { type: errorType, message: errorMessage, timestamp: new Date() }]);
    
    onError?.(errorType, error);
    console.error('❌ Ecosystem sync error:', errorType, error);
  }, [onError]);

  /**
   * Actualiza estado compartido local
   */
  const updateLocalSharedState = useCallback((stateData) => {
    if (!stateData?.entity_id) return;

    setSharedStates(prev => {
      const newStates = new Map(prev);
      newStates.set(stateData.entity_id, stateData);
      return newStates;
    });
  }, []);

  /**
   * Actualiza métricas unificadas
   */
  const updateUnifiedMetrics = useCallback((metricsData) => {
    setUnifiedMetrics(prev => {
      if (!prev) return [metricsData];
      
      // Actualizar o agregar métricas
      const existingIndex = prev.findIndex(m => m.id === metricsData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = metricsData;
        return updated;
      }
      
      return [metricsData, ...prev.slice(0, 99)]; // Mantener últimas 100
    });
  }, []);

  /**
   * Envía notificación cruzada
   */
  const sendCrossNotification = useCallback(async (notificationData) => {
    if (!serviceRef.current || !isConnected) {
      throw new Error('Ecosystem sync not connected');
    }

    try {
      await serviceRef.current.sendCrossNotification({
        ...notificationData,
        sender_id: user.id,
        sender_type: userType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleSyncError('send_notification', error);
      throw error;
    }
  }, [user?.id, userType, isConnected]);

  /**
   * Actualiza estado compartido en el servidor
   */
  const updateSharedStateServer = useCallback(async (entityId, entityType, stateData) => {
    if (!serviceRef.current || !isConnected) {
      throw new Error('Ecosystem sync not connected');
    }

    try {
      await serviceRef.current.updateSharedState(entityId, entityType, {
        ...stateData,
        updated_by: user.id,
        updated_by_type: userType
      });
    } catch (error) {
      handleSyncError('update_shared_state', error);
      throw error;
    }
  }, [user?.id, userType, isConnected]);

  /**
   * Obtiene estados compartidos de una entidad
   */
  const getSharedStates = useCallback(async (entityId, entityType) => {
    if (!serviceRef.current) return [];

    try {
      return await serviceRef.current.getSharedStates(entityId, entityType);
    } catch (error) {
      handleSyncError('get_shared_states', error);
      return [];
    }
  }, []);

  /**
   * Obtiene métricas financieras compartidas
   */
  const getSharedFinancialMetrics = useCallback(async (timeRange = '30d') => {
    if (!serviceRef.current) return [];

    try {
      return await serviceRef.current.getSharedFinancialMetrics(timeRange);
    } catch (error) {
      handleSyncError('get_financial_metrics', error);
      return [];
    }
  }, []);

  /**
   * Fuerza sincronización manual
   */
  const forceSync = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      setSyncStatus('syncing');
      await loadInitialData();
      setSyncStatus('connected');
      setLastSyncTime(new Date());
    } catch (error) {
      handleSyncError('force_sync', error);
      setSyncStatus('error');
    }
  }, [loadInitialData]);

  /**
   * Limpia notificaciones
   */
  const clearNotifications = useCallback(() => {
    setCrossNotifications([]);
  }, []);

  /**
   * Limpia errores
   */
  const clearErrors = useCallback(() => {
    setSyncErrors([]);
    errorCooldownRef.current.clear();
  }, []);

  /**
   * Obtiene estado de sincronización
   */
  const getSyncStatus = useCallback(() => ({
    isConnected,
    status: syncStatus,
    lastSyncTime,
    errorCount: syncErrors.length,
    notificationCount: crossNotifications.length
  }), [isConnected, syncStatus, lastSyncTime, syncErrors.length, crossNotifications.length]);

  // Efecto para inicialización automática
  useEffect(() => {
    if (autoConnect && user && enableRealTime) {
      initializeSync();
    }

    return () => {
      // Cleanup al desmontar
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, [autoConnect, user, enableRealTime, initializeSync]);

  // Efecto para reconexión automática
  useEffect(() => {
    if (!isConnected && enableRealTime && user) {
      const reconnectTimer = setTimeout(() => {
        if (syncStatus === 'error' || syncStatus === 'disconnected') {
          console.log('🔄 Attempting to reconnect ecosystem sync...');
          initializeSync();
        }
      }, 10000); // Reintentar cada 10 segundos

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, syncStatus, enableRealTime, user, initializeSync]);

  return {
    // Estado
    isConnected,
    syncStatus,
    sharedStates,
    crossNotifications,
    unifiedMetrics,
    lastSyncTime,
    syncErrors,

    // Métodos
    initializeSync,
    sendCrossNotification,
    updateSharedState,
    getSharedStates,
    getSharedFinancialMetrics,
    forceSync,
    clearNotifications,
    clearErrors,
    getSyncStatus,

    // Utilidades
    isSyncing: syncStatus === 'syncing',
    hasErrors: syncErrors.length > 0,
    hasNotifications: crossNotifications.length > 0
  };
};

export default useEcosystemSync;