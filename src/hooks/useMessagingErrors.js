/**
 * useMessagingErrors Hook
 * 
 * Hook personalizado para manejar errores y estados de conexión del sistema de mensajería
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import realtimeService from '../services/realtimeService';
import messageService from '../services/messageService';

export const useMessagingErrors = () => {
  const [errors, setErrors] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    quality: 'unknown',
    lastConnected: null,
    reconnectAttempts: 0
  });
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Agregar un error al registro
  const addError = useCallback((error) => {
    const errorObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: error.type || 'error',
      message: error.message || 'Error desconocido',
      details: error.details || null,
      severity: error.severity || 'medium',
      resolved: false
    };

    setErrors(prev => [...prev, errorObj]);

    // Auto-eliminar errores después de 10 segundos si son de baja severidad
    if (errorObj.severity === 'low') {
      setTimeout(() => {
        resolveError(errorObj.id);
      }, 10000);
    }

    return errorObj.id;
  }, []);

  // Marcar un error como resuelto
  const resolveError = useCallback((errorId) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ));

    // Eliminar errores resueltos después de 1 segundo
    setTimeout(() => {
      setErrors(prev => prev.filter(error => error.id !== errorId));
    }, 1000);
  }, []);

  // Limpiar todos los errores
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Verificar estado de conexión
  const checkConnection = useCallback(async () => {
    try {
      // Verificar conexión con Supabase
      const { data, error } = await supabase.from('conversations').select('count').single();
      
      if (error) {
        throw new Error(`Error de conexión a Supabase: ${error.message}`);
      }

      // Verificar conexión en tiempo real
      const realtimeConnected = realtimeService.isRealtimeConnected();
      const subscriptionCount = realtimeService.getActiveSubscriptionsCount();

      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        quality: subscriptionCount > 0 ? 'good' : 'fair',
        lastConnected: new Date(),
        reconnectAttempts: 0
      }));

      return { connected: true, quality: subscriptionCount > 0 ? 'good' : 'fair' };
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        quality: 'poor'
      }));

      addError({
        type: 'connection',
        message: 'Error de conexión',
        details: error.message,
        severity: 'high'
      });

      return { connected: false, quality: 'poor', error: error.message };
    }
  }, [addError]);

  // Intentar reconexión automática
  const attemptReconnection = useCallback(async (maxAttempts = 3) => {
    if (isReconnecting) return false;

    setIsReconnecting(true);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setConnectionStatus(prev => ({
          ...prev,
          reconnectAttempts: attempt
        }));

        addError({
          type: 'reconnection',
          message: `Intento de reconexión ${attempt}/${maxAttempts}`,
          severity: 'low'
        });

        // Desconectar y volver a conectar
        realtimeService.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera progresiva
        realtimeService.connect();

        // Esperar un momento y verificar si se conectó
        setTimeout(() => {
          const connected = realtimeService.isRealtimeConnected();
          if (connected) {
            setIsConnected(true);
            setConnectionQuality('good');
            setLastConnected(new Date());
            setReconnectAttempts(0);
            setIsReconnecting(false);
          } else {
            setConnectionQuality('poor');
          }
          setIsReconnecting(false);
        }, 2000);
      } catch (error) {
        console.error(`Error en intento ${attempt} de reconexión:`, error);
        
        if (attempt === maxAttempts) {
          addError({
            type: 'reconnection',
            message: 'Fallaron todos los intentos de reconexión',
            details: error.message,
            severity: 'high'
          });
        }
      }
    }

    setIsReconnecting(false);
    return false;
  }, [isReconnecting, addError]);

  // Probar envío de mensaje
  const testMessageSending = useCallback(async (testConversationId = null) => {
    try {
      // Si no hay conversación de prueba, crear una temporal
      let conversationId = testConversationId;
      
      if (!conversationId) {
        const testConv = await messageService.createConversation({
          debtorId: 'test-user',
          companyId: 'test-company',
          subject: 'Conversación de Prueba',
          initialMessage: 'Mensaje de prueba para verificar el sistema'
        });
        
        conversationId = testConv.conversation.id;
      }

      // Enviar mensaje de prueba
      const result = await messageService.sendMessage(conversationId, {
        content: 'Mensaje de prueba de conexión',
        contentType: 'text',
        metadata: { test: true, timestamp: new Date().toISOString() }
      });

      if (result.success) {
        addError({
          type: 'test',
          message: 'Prueba de envío exitosa',
          severity: 'low'
        });
        
        return { success: true, messageId: result.message.id };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addError({
        type: 'test',
        message: 'Error en prueba de envío',
        details: error.message,
        severity: 'medium'
      });
      
      return { success: false, error: error.message };
    }
  }, [addError]);

  // Monitorear conexión automáticamente
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      await checkConnection();
    }, 30000); // Verificar cada 30 segundos

    // Verificación inicial
    checkConnection();

    return () => clearInterval(checkInterval);
  }, [checkConnection]);

  // Escuchar eventos de conexión/desconexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        quality: 'good',
        lastConnected: new Date()
      }));

      addError({
        type: 'connection',
        message: 'Conexión restaurada',
        severity: 'low'
      });

      // Intentar reconexión automática
      attemptReconnection();
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        quality: 'poor'
      }));

      addError({
        type: 'connection',
        message: 'Conexión perdida',
        severity: 'high'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addError, attemptReconnection]);

  // Estadísticas de errores
  const errorStats = {
    total: errors.length,
    unresolved: errors.filter(e => !e.resolved).length,
    byType: errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {}),
    bySeverity: errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    // Estado
    errors,
    connectionStatus,
    isReconnecting,
    errorStats,
    
    // Acciones
    addError,
    resolveError,
    clearErrors,
    checkConnection,
    attemptReconnection,
    testMessageSending,
    
    // Utilidades
    hasErrors: errors.some(e => !e.resolved),
    hasConnectionIssues: !connectionStatus.isConnected || connectionStatus.quality === 'poor',
    isHealthy: connectionStatus.isConnected && connectionStatus.quality !== 'poor' && !isReconnecting
  };
};

export default useMessagingErrors;