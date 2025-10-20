/**
 * Hooks personalizados para sincronización en tiempo real
 * 
 * Facilita el uso de Supabase Realtime en los componentes de React
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import realtimeService from '../services/realtimeService';

/**
 * Hook para sincronización en tiempo real de pagos
 * @param {Function} onPaymentCreated - Callback cuando se crea un pago
 * @param {Function} onPaymentUpdated - Callback cuando se actualiza un pago
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimePayments = (onPaymentCreated, onPaymentUpdated, onError, options = {}) => {
  const { user, company } = useAuth();
  const channelsRef = useRef({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const userId = options.userId || user?.id;
  const companyId = options.companyId || company?.id;

  useEffect(() => {
    if (!userId && !companyId) {
      console.log('⚠️ useRealtimePayments: Se requiere userId o companyId');
      setConnectionStatus('error');
      onError?.({ message: 'Se requiere userId o companyId', type: 'validation' });
      return;
    }

    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
      setConnectionStatus('connecting');
    }

    // Suscribir a cambios en pagos con manejo de errores
    try {
      const channels = realtimeService.subscribeToPayments(
        (payload) => {
          console.log('💰 Nuevo pago creado:', payload);
          setConnectionStatus('connected');
          onPaymentCreated?.(payload);
        },
        (payload) => {
          console.log('💰 Pago actualizado:', payload);
          setConnectionStatus('connected');
          onPaymentUpdated?.(payload);
        },
        userId,
        companyId
      );

      if (channels) {
        channelsRef.current = channels;
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        onError?.({ message: 'Error al suscribirse a pagos', type: 'subscription' });
      }
    } catch (error) {
      console.error('❌ Error en useRealtimePayments:', error);
      setConnectionStatus('error');
      onError?.({ message: error.message, type: 'connection' });
    }

    // Limpiar suscripciones al desmontar
    return () => {
      try {
        if (channelsRef.current.insertChannel) {
          realtimeService.unsubscribe(channelsRef.current.insertChannel);
        }
        if (channelsRef.current.updateChannel) {
          realtimeService.unsubscribe(channelsRef.current.updateChannel);
        }
      } catch (error) {
        console.error('❌ Error limpiando suscripciones de pagos:', error);
      }
    };
  }, [userId, companyId, onPaymentCreated, onPaymentUpdated, onError]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    connectionStatus,
    channels: channelsRef.current
  };
};

/**
 * Hook para sincronización en tiempo real de deudas
 * @param {Function} onDebtCreated - Callback cuando se crea una deuda
 * @param {Function} onDebtUpdated - Callback cuando se actualiza una deuda
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeDebts = (onDebtCreated, onDebtUpdated, onError, options = {}) => {
  const { user, company } = useAuth();
  const channelsRef = useRef({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const userId = options.userId || user?.id;
  const companyId = options.companyId || company?.id;

  useEffect(() => {
    if (!userId && !companyId) {
      console.log('⚠️ useRealtimeDebts: Se requiere userId o companyId');
      setConnectionStatus('error');
      onError?.({ message: 'Se requiere userId o companyId', type: 'validation' });
      return;
    }

    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
      setConnectionStatus('connecting');
    }

    // Suscribir a cambios en deudas con manejo de errores
    try {
      const channels = realtimeService.subscribeToDebts(
        (payload) => {
          console.log('📄 Nueva deuda creada:', payload);
          setConnectionStatus('connected');
          onDebtCreated?.(payload);
        },
        (payload) => {
          console.log('📄 Deuda actualizada:', payload);
          setConnectionStatus('connected');
          onDebtUpdated?.(payload);
        },
        userId,
        companyId
      );

      if (channels) {
        channelsRef.current = channels;
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        onError?.({ message: 'Error al suscribirse a deudas', type: 'subscription' });
      }
    } catch (error) {
      console.error('❌ Error en useRealtimeDebts:', error);
      setConnectionStatus('error');
      onError?.({ message: error.message, type: 'connection' });
    }

    // Limpiar suscripciones al desmontar
    return () => {
      try {
        if (channelsRef.current.insertChannel) {
          realtimeService.unsubscribe(channelsRef.current.insertChannel);
        }
        if (channelsRef.current.updateChannel) {
          realtimeService.unsubscribe(channelsRef.current.updateChannel);
        }
      } catch (error) {
        console.error('❌ Error limpiando suscripciones de deudas:', error);
      }
    };
  }, [userId, companyId, onDebtCreated, onDebtUpdated, onError]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    connectionStatus,
    channels: channelsRef.current
  };
};

/**
 * Hook para sincronización en tiempo real de acuerdos
 * @param {Function} onAgreementCreated - Callback cuando se crea un acuerdo
 * @param {Function} onAgreementUpdated - Callback cuando se actualiza un acuerdo
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeAgreements = (onAgreementCreated, onAgreementUpdated, onError, options = {}) => {
  const { user, company } = useAuth();
  const channelsRef = useRef({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const userId = options.userId || user?.id;
  const companyId = options.companyId || company?.id;

  useEffect(() => {
    if (!userId && !companyId) {
      console.log('⚠️ useRealtimeAgreements: Se requiere userId o companyId');
      setConnectionStatus('error');
      onError?.({ message: 'Se requiere userId o companyId', type: 'validation' });
      return;
    }

    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
      setConnectionStatus('connecting');
    }

    // Suscribir a cambios en acuerdos con manejo de errores
    try {
      const channels = realtimeService.subscribeToAgreements(
        (payload) => {
          console.log('🤝 Nuevo acuerdo creado:', payload);
          setConnectionStatus('connected');
          onAgreementCreated?.(payload);
        },
        (payload) => {
          console.log('🤝 Acuerdo actualizado:', payload);
          setConnectionStatus('connected');
          onAgreementUpdated?.(payload);
        },
        userId,
        companyId
      );

      if (channels) {
        channelsRef.current = channels;
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        onError?.({ message: 'Error al suscribirse a acuerdos', type: 'subscription' });
      }
    } catch (error) {
      console.error('❌ Error en useRealtimeAgreements:', error);
      setConnectionStatus('error');
      onError?.({ message: error.message, type: 'connection' });
    }

    // Limpiar suscripciones al desmontar
    return () => {
      try {
        if (channelsRef.current.insertChannel) {
          realtimeService.unsubscribe(channelsRef.current.insertChannel);
        }
        if (channelsRef.current.updateChannel) {
          realtimeService.unsubscribe(channelsRef.current.updateChannel);
        }
      } catch (error) {
        console.error('❌ Error limpiando suscripciones de acuerdos:', error);
      }
    };
  }, [userId, companyId, onAgreementCreated, onAgreementUpdated, onError]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    connectionStatus,
    channels: channelsRef.current
  };
};

/**
 * Hook para sincronización en tiempo real de ofertas
 * @param {Function} onOfferCreated - Callback cuando se crea una oferta
 * @param {Function} onOfferUpdated - Callback cuando se actualiza una oferta
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeOffers = (onOfferCreated, onOfferUpdated, options = {}) => {
  const { company } = useAuth();
  const channelsRef = useRef({});

  const companyId = options.companyId || company?.id;

  useEffect(() => {
    if (!companyId) {
      console.log('⚠️ useRealtimeOffers: Se requiere companyId');
      return;
    }

    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
    }

    // Suscribir a cambios en ofertas
    const channels = realtimeService.subscribeToOffers(
      (payload) => {
        console.log('💡 Nueva oferta creada:', payload);
        onOfferCreated?.(payload);
      },
      (payload) => {
        console.log('💡 Oferta actualizada:', payload);
        onOfferUpdated?.(payload);
      },
      companyId
    );

    channelsRef.current = channels;

    // Limpiar suscripciones al desmontar
    return () => {
      if (channels.insertChannel) {
        realtimeService.unsubscribe(channels.insertChannel);
      }
      if (channels.updateChannel) {
        realtimeService.unsubscribe(channels.updateChannel);
      }
    };
  }, [companyId, onOfferCreated, onOfferUpdated]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    channels: channelsRef.current
  };
};

/**
 * Hook para sincronización en tiempo real de notificaciones
 * @param {Function} onNotificationCreated - Callback cuando se crea una notificación
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeNotifications = (onNotificationCreated, onError, options = {}) => {
  const { user } = useAuth();
  const channelsRef = useRef({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const userId = options.userId || user?.id;

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ useRealtimeNotifications: Se requiere userId');
      setConnectionStatus('error');
      onError?.({ message: 'Se requiere userId', type: 'validation' });
      return;
    }

    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
      setConnectionStatus('connecting');
    }

    // Suscribir a cambios en notificaciones con manejo de errores
    try {
      const channel = realtimeService.subscribeToNotifications(
        userId,
        (payload) => {
          console.log('🔔 Nueva notificación:', payload);
          setConnectionStatus('connected');
          onNotificationCreated?.(payload);
        }
      );

      if (channel) {
        channelsRef.current.notificationChannel = channel;
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        onError?.({ message: 'Error al suscribirse a notificaciones', type: 'subscription' });
      }
    } catch (error) {
      console.error('❌ Error en useRealtimeNotifications:', error);
      setConnectionStatus('error');
      onError?.({ message: error.message, type: 'connection' });
    }

    // Limpiar suscripciones al desmontar
    return () => {
      try {
        if (channelsRef.current.notificationChannel) {
          realtimeService.unsubscribe(channelsRef.current.notificationChannel);
        }
      } catch (error) {
        console.error('❌ Error limpiando suscripciones de notificaciones:', error);
      }
    };
  }, [userId, onNotificationCreated, onError]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    connectionStatus,
    notificationChannel: channelsRef.current.notificationChannel
  };
};

/**
 * Hook para administradores - sincronización de usuarios
 * @param {Function} onUserCreated - Callback cuando se crea un usuario
 * @param {Function} onUserUpdated - Callback cuando se actualiza un usuario
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeUsers = (onUserCreated, onUserUpdated) => {
  const channelsRef = useRef({});

  useEffect(() => {
    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
    }

    // Suscribir a cambios en usuarios
    const channels = realtimeService.subscribeToUsers(
      (payload) => {
        console.log('👤 Nuevo usuario creado:', payload);
        onUserCreated?.(payload);
      },
      (payload) => {
        console.log('👤 Usuario actualizado:', payload);
        onUserUpdated?.(payload);
      }
    );

    channelsRef.current = channels;

    // Limpiar suscripciones al desmontar
    return () => {
      if (channels.insertChannel) {
        realtimeService.unsubscribe(channels.insertChannel);
      }
      if (channels.updateChannel) {
        realtimeService.unsubscribe(channels.updateChannel);
      }
    };
  }, [onUserCreated, onUserUpdated]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    channels: channelsRef.current
  };
};

/**
 * Hook para administradores - sincronización de empresas
 * @param {Function} onCompanyCreated - Callback cuando se crea una empresa
 * @param {Function} onCompanyUpdated - Callback cuando se actualiza una empresa
 * @returns {Object} Estado y funciones del hook
 */
export const useRealtimeCompanies = (onCompanyCreated, onCompanyUpdated) => {
  const channelsRef = useRef({});

  useEffect(() => {
    // Conectar a realtime si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
    }

    // Suscribir a cambios en empresas
    const channels = realtimeService.subscribeToCompanies(
      (payload) => {
        console.log('🏢 Nueva empresa creada:', payload);
        onCompanyCreated?.(payload);
      },
      (payload) => {
        console.log('🏢 Empresa actualizada:', payload);
        onCompanyUpdated?.(payload);
      }
    );

    channelsRef.current = channels;

    // Limpiar suscripciones al desmontar
    return () => {
      if (channels.insertChannel) {
        realtimeService.unsubscribe(channels.insertChannel);
      }
      if (channels.updateChannel) {
        realtimeService.unsubscribe(channels.updateChannel);
      }
    };
  }, [onCompanyCreated, onCompanyUpdated]);

  return {
    isConnected: realtimeService.isRealtimeConnected(),
    channels: channelsRef.current
  };
};

/**
 * Hook genérico para obtener estado de conexión
 * @returns {Object} Estado de conexión de realtime
 */
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(realtimeService.isRealtimeConnected());
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);

  useEffect(() => {
    // Conectar si no está conectado
    if (!realtimeService.isRealtimeConnected()) {
      realtimeService.connect();
      setIsConnected(true);
    }

    // Actualizar estado periódicamente
    const interval = setInterval(() => {
      setIsConnected(realtimeService.isRealtimeConnected());
      setActiveSubscriptions(realtimeService.getActiveSubscriptionsCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    realtimeService.connect();
    setIsConnected(true);
  }, []);

  return {
    isConnected,
    activeSubscriptions,
    connect,
    disconnect,
    subscriptions: realtimeService.getActiveSubscriptions()
  };
};