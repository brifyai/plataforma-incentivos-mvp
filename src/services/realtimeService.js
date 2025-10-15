/**
 * Servicio de Sincronización en Tiempo Real - Supabase Realtime
 * 
 * Proporciona funcionalidades de sincronización en tiempo real entre
 * los diferentes portales del sistema NexuPay.
 */

import { supabase } from '../config/supabase';

class RealtimeService {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
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
      // Habilitar Realtime
      supabase.realtime.connect();
      this.isConnected = true;
      console.log('✅ Conectado a Supabase Realtime');
    } catch (error) {
      console.error('❌ Error conectando a Supabase Realtime:', error);
    }
  }

  /**
   * Desconecta de Supabase Realtime
   */
  disconnect() {
    // Desconectar todos los canales
    this.channels.forEach((channel, key) => {
      channel.unsubscribe();
      console.log(`🔌 Desconectado canal: ${key}`);
    });

    this.channels.clear();
    this.subscribers.clear();
    this.isConnected = false;
    console.log('🔌 Desconectado de Supabase Realtime');
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
    
    try {
      let channel = supabase.channel(channelName);

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
        console.log(`🔄 Cambio en ${table}:`, payload);
        
        // Solo ejecutar callback si el tipo de evento coincide
        if (payload.eventType === event || event === '*') {
          callback(payload);
        }
      });

      // Suscribir el canal
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Suscrito a ${table} (${event})`);
          this.channels.set(channelName, channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error suscribiéndose a ${table}:`, status);
        }
      });

      return channelName;
    } catch (error) {
      console.error(`❌ Error suscribiéndose a ${table}:`, error);
      return null;
    }
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
   * Suscribe a cambios en conversaciones de mensajes
   * @param {Function} onConversationCreated - Callback cuando se crea una conversación
   * @param {Function} onConversationUpdated - Callback cuando se actualiza una conversación
   * @param {string} userId - ID del usuario (opcional, para filtrar)
   * @param {string} companyId - ID de la empresa (opcional, para filtrar)
   */
  subscribeToConversations(onConversationCreated, onConversationUpdated, userId = null, companyId = null) {
    const filter = userId ? `debtor_id=eq.${userId}` :
                   companyId ? `company_id=eq.${companyId}` : null;

    const insertChannel = this.subscribeToTable('conversations', 'INSERT', onConversationCreated, filter);
    const updateChannel = this.subscribeToTable('conversations', 'UPDATE', onConversationUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en mensajes
   * @param {Function} onMessageCreated - Callback cuando se crea un mensaje
   * @param {Function} onMessageUpdated - Callback cuando se actualiza un mensaje
   * @param {string} conversationId - ID de la conversación (opcional, para filtrar)
   */
  subscribeToMessages(onMessageCreated, onMessageUpdated, conversationId = null) {
    const filter = conversationId ? `conversation_id=eq.${conversationId}` : null;

    const insertChannel = this.subscribeToTable('messages', 'INSERT', onMessageCreated, filter);
    const updateChannel = this.subscribeToTable('messages', 'UPDATE', onMessageUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a cambios en archivos adjuntos de mensajes
   * @param {Function} onAttachmentCreated - Callback cuando se crea un adjunto
   * @param {Function} onAttachmentUpdated - Callback cuando se actualiza un adjunto
   * @param {string} messageId - ID del mensaje (opcional, para filtrar)
   */
  subscribeToMessageAttachments(onAttachmentCreated, onAttachmentUpdated, messageId = null) {
    const filter = messageId ? `message_id=eq.${messageId}` : null;

    const insertChannel = this.subscribeToTable('message_attachments', 'INSERT', onAttachmentCreated, filter);
    const updateChannel = this.subscribeToTable('message_attachments', 'UPDATE', onAttachmentUpdated, filter);

    return { insertChannel, updateChannel };
  }

  /**
   * Suscribe a todos los eventos de mensajería para un usuario
   * @param {string} userId - ID del usuario
   * @param {Function} onNewConversation - Callback para nuevas conversaciones
   * @param {Function} onConversationUpdate - Callback para actualizaciones de conversaciones
   * @param {Function} onNewMessage - Callback para nuevos mensajes
   * @param {Function} onMessageUpdate - Callback para actualizaciones de mensajes
   */
  subscribeToUserMessaging(userId, onNewConversation, onConversationUpdate, onNewMessage, onMessageUpdate) {
    const channels = {};

    // Suscribir a conversaciones del usuario
    const conversationChannels = this.subscribeToConversations(
      onNewConversation,
      onConversationUpdate,
      userId
    );
    channels.conversations = conversationChannels;

    // Suscribir a mensajes en conversaciones del usuario
    // Nota: Esto requerirá una consulta adicional para obtener las conversaciones del usuario
    // y suscribirse a cada una individualmente, o usar RLS policies en Supabase
    const messageChannels = this.subscribeToMessages(
      onNewMessage,
      onMessageUpdate
    );
    channels.messages = messageChannels;

    return channels;
  }

  /**
   * Suscribe a todos los eventos de mensajería para una empresa
   * @param {string} companyId - ID de la empresa
   * @param {Function} onNewConversation - Callback para nuevas conversaciones
   * @param {Function} onConversationUpdate - Callback para actualizaciones de conversaciones
   * @param {Function} onNewMessage - Callback para nuevos mensajes
   * @param {Function} onMessageUpdate - Callback para actualizaciones de mensajes
   */
  subscribeToCompanyMessaging(companyId, onNewConversation, onConversationUpdate, onNewMessage, onMessageUpdate) {
    const channels = {};

    // Suscribir a conversaciones de la empresa
    const conversationChannels = this.subscribeToConversations(
      onNewConversation,
      onConversationUpdate,
      null,
      companyId
    );
    channels.conversations = conversationChannels;

    // Suscribir a mensajes en conversaciones de la empresa
    const messageChannels = this.subscribeToMessages(
      onNewMessage,
      onMessageUpdate
    );
    channels.messages = messageChannels;

    return channels;
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
      console.log(`🔌 Suscripción cancelada: ${channelName}`);
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
}

// Crear instancia global del servicio
const realtimeService = new RealtimeService();

export default realtimeService;