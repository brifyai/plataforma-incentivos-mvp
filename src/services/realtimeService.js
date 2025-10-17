/**
 * Servicio de Sincronización en Tiempo Real - Supabase Realtime
 * 
 * Proporciona funcionalidades de sincronización en tiempo real entre
 * los diferentes portales del sistema NexuPay.
 */

import { getSupabaseInstance } from './supabaseInstances';

class RealtimeService {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
    this.retryAttempts = new Map();
    this.maxRetries = 1; // Reducido a 1 intento para evitar spam
    this.retryDelay = 5000; // Aumentado a 5 segundos
    this.lastErrorLog = new Map(); // Para evitar spam de logs
    this.errorLogCooldown = 30000; // 30 segundos entre logs del mismo error (aumentado)
    this.suppressedErrors = new Set(); // Errores completamente silenciados
  }

  /**
   * Conecta a Supabase Realtime
   */
  connect() {
    if (this.isConnected) {
      console.log('🔄 Realtime ya está conectado');
      return;
    }

    try {
      // Usar instancia optimizada para realtime
      const realtimeSupabase = getSupabaseInstance('realtime');
      realtimeSupabase.realtime.connect();
      this.isConnected = true;
      console.log('✅ Conectado a Supabase Realtime');
    } catch (error) {
      console.error('❌ Error conectando a Supabase Realtime:', error);
      // Reintentar conexión después de un delay
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Desconecta de Supabase Realtime
   */
  disconnect() {
    // Desconectar todos los canales
    this.channels.forEach((channel, key) => {
      channel.unsubscribe();
      // Solo loggear en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Desconectado canal: ${key}`);
      }
    });

    this.channels.clear();
    this.subscribers.clear();
    this.retryAttempts.clear();
    this.lastErrorLog.clear();
    this.suppressedErrors.clear();
    this.isConnected = false;
    
    // Solo loggear en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Desconectado de Supabase Realtime');
    }
  }

  /**
   * Suscribe a cambios en una tabla específica
   * @param {string} table - Nombre de la tabla
   * @param {string} event - Tipo de evento (INSERT, UPDATE, DELETE)
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @param {Object} filter - Filtro opcional (ej: { user_id: '123' })
   * @returns {string} ID del canal
   */
  subscribeToTable(table, event, callback, filter = null) {
    const channelName = `${table}_${event}_${Date.now()}`;
    
    const attemptSubscription = (retryCount = 0) => {
      try {
        // Usar instancia optimizada para realtime
        const realtimeSupabase = getSupabaseInstance('realtime');
        let channel = realtimeSupabase.channel(channelName);

        // Construir el evento de suscripción
        const subscriptionConfig = {
          event: '*',
          schema: 'public',
          table: table
        };

        // Agregar filtro si existe
        if (filter) {
          subscriptionConfig.filter = filter;
        }

        channel = channel.on('postgres_changes', subscriptionConfig, (payload) => {
          // Loggear solo en desarrollo o para debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Cambio en ${table}:`, payload);
          }
          
          // Solo ejecutar callback si el tipo de evento coincide
          if (payload.eventType === event || event === '*') {
            callback(payload);
          }
        });

        // Suscribir el canal
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Solo loggear si no estaba suscrito antes
            if (!this.channels.has(channelName)) {
              console.log(`✅ Suscrito a ${table} (${event})`);
            }
            this.channels.set(channelName, channel);
            // Resetear contador de reintentos
            this.retryAttempts.delete(channelName);
            this.lastErrorLog.delete(channelName);
          } else if (status === 'CHANNEL_ERROR') {
            // Silenciar completamente errores de canal no disponible (es esperado en desarrollo)
            const errorKey = `channel_error_${table}`;
            
            // Solo loggear si es la primera vez y estamos en desarrollo
            if (process.env.NODE_ENV === 'development' && !this.suppressedErrors.has(errorKey)) {
              console.warn(`⚠️ Error en tiempo real (${table}): Canal no disponible (silenciando futuros errores)`);
              this.suppressedErrors.add(errorKey);
              this.lastErrorLog.set(channelName, Date.now());
            }
            
            // Intentar reintentar silenciosamente
            if (retryCount < this.maxRetries) {
              const retryDelay = this.retryDelay * Math.pow(2, retryCount);
              
              setTimeout(() => {
                this.retryAttempts.set(channelName, retryCount + 1);
                attemptSubscription(retryCount + 1);
              }, retryDelay);
            } else {
              // Silenciar error final para no saturar logs
              this.retryAttempts.delete(channelName);
            }
          } else if (status === 'TIMED_OUT') {
            // Timeout es menos crítico, loggear solo si es primer intento
            if (retryCount === 0) {
              console.warn(`⏰ Timeout en suscripción a ${table}`);
            }
            
            // Reintentar en caso de timeout
            if (retryCount < this.maxRetries) {
              const retryDelay = this.retryDelay * Math.pow(2, retryCount);
              setTimeout(() => {
                this.retryAttempts.set(channelName, retryCount + 1);
                attemptSubscription(retryCount + 1);
              }, retryDelay);
            }
          }
        });

        return channelName;
      } catch (error) {
        // Silenciar completamente errores de conexión (es esperado en desarrollo)
        const errorKey = `connection_error_${table}`;
        
        // Solo loggear si es la primera vez y estamos en desarrollo
        if (process.env.NODE_ENV === 'development' && !this.suppressedErrors.has(errorKey)) {
          console.warn(`⚠️ Error en tiempo real (${table}): ${error.message} (silenciando futuros errores)`);
          this.suppressedErrors.add(errorKey);
          this.lastErrorLog.set(channelName, Date.now());
        }
        
        // Reintentar en caso de error
        if (retryCount < this.maxRetries) {
          const retryDelay = this.retryDelay * Math.pow(2, retryCount);
          setTimeout(() => {
            this.retryAttempts.set(channelName, retryCount + 1);
            attemptSubscription(retryCount + 1);
          }, retryDelay);
        }
        
        return null;
      }
    };

    return attemptSubscription();
  }

  /**
   * Suscribe a cambios en pagos (para todos los portales)
   * @param {Function} onPaymentCreated - Callback cuando se crea un pago
   * @param {Function} onPaymentUpdated - Callback cuando se actualiza un pago
   * @param {string} userId - ID del usuario (opcional, para filtrar)
   * @param {string} companyId - ID de la empresa (opcional, para filtrar)
   */
  subscribeToPayments(onPaymentCreated, onPaymentUpdated, userId = null, companyId = null) {
    const filter = userId ? `user_id=eq.${userId}` : 
                   companyId ? `company_id=eq.${companyId}` : null;

    // Suscribir a nuevos pagos
    const insertChannel = this.subscribeToTable('payments', 'INSERT', onPaymentCreated, filter);
    
    // Suscribir a actualizaciones de pagos
    const updateChannel = this.subscribeToTable('payments', 'UPDATE', onPaymentUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en deudas
   * @param {Function} onDebtCreated - Callback cuando se crea una deuda
   * @param {Function} onDebtUpdated - Callback cuando se actualiza una deuda
   * @param {string} userId - ID del usuario (opcional, para filtrar)
   * @param {string} companyId - ID de la empresa (opcional, para filtrar)
   */
  subscribeToDebts(onDebtCreated, onDebtUpdated, userId = null, companyId = null) {
    const filter = userId ? `user_id=eq.${userId}` : 
                   companyId ? `company_id=eq.${companyId}` : null;

    const insertChannel = this.subscribeToTable('debts', 'INSERT', onDebtCreated, filter);
    const updateChannel = this.subscribeToTable('debts', 'UPDATE', onDebtUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en acuerdos
   * @param {Function} onAgreementCreated - Callback cuando se crea un acuerdo
   * @param {Function} onAgreementUpdated - Callback cuando se actualiza un acuerdo
   * @param {string} userId - ID del usuario (opcional, para filtrar)
   * @param {string} companyId - ID de la empresa (opcional, para filtrar)
   */
  subscribeToAgreements(onAgreementCreated, onAgreementUpdated, userId = null, companyId = null) {
    const filter = userId ? `user_id=eq.${userId}` : 
                   companyId ? `company_id=eq.${companyId}` : null;

    const insertChannel = this.subscribeToTable('agreements', 'INSERT', onAgreementCreated, filter);
    const updateChannel = this.subscribeToTable('agreements', 'UPDATE', onAgreementUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en ofertas
   * @param {Function} onOfferCreated - Callback cuando se crea una oferta
   * @param {Function} onOfferUpdated - Callback cuando se actualiza una oferta
   * @param {string} companyId - ID de la empresa (opcional, para filtrar)
   */
  subscribeToOffers(onOfferCreated, onOfferUpdated, companyId = null) {
    const filter = companyId ? `company_id=eq.${companyId}` : null;

    const insertChannel = this.subscribeToTable('offers', 'INSERT', onOfferCreated, filter);
    const updateChannel = this.subscribeToTable('offers', 'UPDATE', onOfferUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a notificaciones para un usuario específico
   * @param {string} userId - ID del usuario
   * @param {Function} onNotificationCreated - Callback cuando se crea una notificación
   */
  subscribeToNotifications(userId, onNotificationCreated) {
    const filter = `user_id=eq.${userId}`;
    return this.subscribeToTable('notifications', 'INSERT', onNotificationCreated, filter);
  }

  /**
   * Suscribe a cambios en usuarios (para admin)
   * @param {Function} onUserCreated - Callback cuando se crea un usuario
   * @param {Function} onUserUpdated - Callback cuando se actualiza un usuario
   */
  subscribeToUsers(onUserCreated, onUserUpdated) {
    const insertChannel = this.subscribeToTable('users', 'INSERT', onUserCreated);
    const updateChannel = this.subscribeToTable('users', 'UPDATE', onUserUpdated);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en empresas (para admin)
   * @param {Function} onCompanyCreated - Callback cuando se crea una empresa
   * @param {Function} onCompanyUpdated - Callback cuando se actualiza una empresa
   */
  subscribeToCompanies(onCompanyCreated, onCompanyUpdated) {
    const insertChannel = this.subscribeToTable('companies', 'INSERT', onCompanyCreated);
    const updateChannel = this.subscribeToTable('companies', 'UPDATE', onCompanyUpdated);

    return { insertChannel, updateChannel };
  }

  /**
   * Cancela una suscripción específica
   * @param {string} channelName - Nombre del canal a cancelar
   */
  unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.retryAttempts.delete(channelName);
      this.lastErrorLog.delete(channelName);
      // Solo loggear en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Suscripción cancelada: ${channelName}`);
      }
    }
  }

  /**
   * Obtiene el estado de conexión
   * @returns {boolean} True si está conectado
   */
  isRealtimeConnected() {
    return this.isConnected;
  }

  /**
   * Obtiene el número de suscripciones activas
   * @returns {number} Número de suscripciones activas
   */
  getActiveSubscriptionsCount() {
    return this.channels.size;
  }

  /**
   * Lista todas las suscripciones activas
   * @returns {Array} Lista de nombres de canales activos
   */
  getActiveSubscriptions() {
    return Array.from(this.channels.keys());
  }

  /**
   * Obtiene el estado de todas las suscripciones
   * @returns {Object} Estado detallado de las suscripciones
   */
  getSubscriptionsStatus() {
    const status = {
      totalChannels: this.channels.size,
      activeChannels: 0,
      failedChannels: 0,
      retryingChannels: this.retryAttempts.size,
      channels: []
    };

    this.channels.forEach((channel, name) => {
      const retryCount = this.retryAttempts.get(name) || 0;
      status.channels.push({
        name,
        retryCount,
        status: retryCount > 0 ? 'retrying' : 'active'
      });

      if (retryCount === 0) {
        status.activeChannels++;
      } else {
        status.failedChannels++;
      }
    });

    return status;
  }

  /**
   * Reintenta todas las suscripciones fallidas
   */
  retryFailedSubscriptions() {
    console.log('🔄 Reintentando suscripciones fallidas...');
    
    // Obtener canales fallidos
    const failedChannels = Array.from(this.retryAttempts.keys());
    
    failedChannels.forEach(channelName => {
      const retryCount = this.retryAttempts.get(channelName);
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Reintentando canal: ${channelName}`);
        // Extraer información del canal para reintentar
        const parts = channelName.split('_');
        if (parts.length >= 3) {
          const table = parts[0];
          const event = parts[1];
          // Nota: Aquí necesitaríamos almacenar los callbacks originales para reintentar
          // Por ahora, limpiamos el canal fallido
          this.unsubscribe(channelName);
          this.retryAttempts.delete(channelName);
        }
      }
    });
  }

  /**
   * Limpia todas las suscripciones y reconecta
   */
  resetConnection() {
    console.log('🔄 Reiniciando conexión Realtime...');
    
    // Desconectar todos los canales
    this.disconnect();
    
    // Limpiar contadores de reintentos
    this.retryAttempts.clear();
    
    // Esperar y reconectar
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Verifica la salud de la conexión Realtime
   * @returns {Promise<Object>} Estado de salud de la conexión
   */
  async checkConnectionHealth() {
    try {
      const status = this.getSubscriptionsStatus();
      
      // Verificar si Supabase está disponible usando instancia principal
      const mainSupabase = getSupabaseInstance('main');
      const { data, error } = await mainSupabase.from('users').select('count').limit(1);
      
      return {
        isConnected: this.isConnected,
        isSupabaseAvailable: !error,
        subscriptionStatus: status,
        health: error ? 'degraded' : (status.failedChannels > 0 ? 'partial' : 'healthy'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isConnected: this.isConnected,
        isSupabaseAvailable: false,
        subscriptionStatus: this.getSubscriptionsStatus(),
        health: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia global del servicio
const realtimeService = new RealtimeService();

export default realtimeService;