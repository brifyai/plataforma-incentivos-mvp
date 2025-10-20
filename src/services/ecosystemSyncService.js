/**
 * Ecosystem Sync Service
 * 
 * Servicio central para sincronización entre portales empresas-personas
 * Proporciona sincronización en tiempo real, notificaciones cruzadas y estados compartidos
 */

import { supabase } from '../config/supabase';
import realtimeService from './realtimeService';

class EcosystemSyncService {
  constructor() {
    this.syncChannels = new Map();
    this.activeSubscriptions = new Map();
    this.syncCallbacks = new Map();
    this.lastSyncTimestamp = new Map();
    this.syncQueue = [];
    this.isProcessingQueue = false;
    
    // Canales de sincronización
    this.CHANNELS = {
      NEGOTIATION_STATUS: 'negotiation_status_sync',
      PAYMENT_UPDATES: 'payment_updates_sync',
      AGREEMENT_CHANGES: 'agreement_changes_sync',
      COMPANY_DEBTOR_SYNC: 'company_debtor_sync',
      REALTIME_NOTIFICATIONS: 'realtime_notifications',
      SHARED_ANALYTICS: 'shared_analytics_sync'
    };
    
    // Tipos de eventos
    this.EVENT_TYPES = {
      DEBT_STATUS_CHANGE: 'debt_status_change',
      PAYMENT_RECEIVED: 'payment_received',
      AGREEMENT_CREATED: 'agreement_created',
      AGREEMENT_UPDATED: 'agreement_updated',
      NEGOTIATION_INITIATED: 'negotiation_initiated',
      NEGOTIATION_COMPLETED: 'negotiation_completed',
      COMPANY_STATUS_UPDATE: 'company_status_update',
      DEBTOR_ACTIVITY: 'debtor_activity',
      ANALYTICS_UPDATE: 'analytics_update'
    };
  }

  /**
   * Inicializa el servicio de sincronización
   */
  async initialize(userId, userType = 'company') {
    try {
      this.userId = userId;
      this.userType = userType;
      
      // Suscribirse a canales de sincronización
      await this.setupSyncChannels();
      
      // Inicializar cola de procesamiento
      this.startSyncQueueProcessor();
      
      console.log(`🔄 Ecosystem Sync Service initialized for ${userType}:`, userId);
      return true;
    } catch (error) {
      console.error('❌ Error initializing ecosystem sync service:', error);
      return false;
    }
  }

  /**
   * Configura los canales de sincronización en tiempo real
   */
  async setupSyncChannels() {
    const channels = [
      this.CHANNELS.NEGOTIATION_STATUS,
      this.CHANNELS.PAYMENT_UPDATES,
      this.CHANNELS.AGREEMENT_CHANGES,
      this.CHANNELS.COMPANY_DEBTOR_SYNC,
      this.CHANNELS.REALTIME_NOTIFICATIONS,
      this.CHANNELS.SHARED_ANALYTICS
    ];

    for (const channel of channels) {
      try {
        const subscription = supabase
          .channel(`ecosystem_sync_${channel}_${this.userId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: this.getTableNameForChannel(channel) 
            },
            (payload) => this.handleSyncEvent(channel, payload)
          )
          .on('broadcast', { event: 'sync_update' }, (payload) => {
            this.handleBroadcastSync(channel, payload);
          })
          .subscribe();

        this.activeSubscriptions.set(channel, subscription);
        console.log(`✅ Subscribed to sync channel: ${channel}`);
      } catch (error) {
        console.error(`❌ Error subscribing to channel ${channel}:`, error);
      }
    }
  }

  /**
   * Obtiene el nombre de la tabla para un canal específico
   */
  getTableNameForChannel(channel) {
    const tableMap = {
      [this.CHANNELS.NEGOTIATION_STATUS]: 'negotiation_status',
      [this.CHANNELS.PAYMENT_UPDATES]: 'payments',
      [this.CHANNELS.AGREEMENT_CHANGES]: 'agreements',
      [this.CHANNELS.COMPANY_DEBTOR_SYNC]: 'company_debtor_sync',
      [this.CHANNELS.REALTIME_NOTIFICATIONS]: 'cross_portal_notifications',
      [this.CHANNELS.SHARED_ANALYTICS]: 'shared_analytics'
    };
    return tableMap[channel] || 'sync_events';
  }

  /**
   * Maneja eventos de sincronización de la base de datos
   */
  async handleSyncEvent(channel, payload) {
    try {
      const eventData = {
        channel,
        event: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        userType: this.userType
      };

      // Procesar evento según el canal
      await this.processSyncEvent(channel, eventData);

      // Notificar a callbacks registrados
      this.notifySyncCallbacks(channel, eventData);

      console.log(`🔄 Sync event processed: ${channel} - ${payload.eventType}`);
    } catch (error) {
      console.error('❌ Error handling sync event:', error);
    }
  }

  /**
   * Maneja eventos de broadcast para sincronización
   */
  async handleBroadcastSync(channel, payload) {
    try {
      const eventData = {
        channel,
        event: payload.payload.event,
        data: payload.payload.data,
        timestamp: payload.payload.timestamp,
        broadcast: true
      };

      await this.processSyncEvent(channel, eventData);
      this.notifySyncCallbacks(channel, eventData);

      console.log(`📡 Broadcast sync processed: ${channel}`);
    } catch (error) {
      console.error('❌ Error handling broadcast sync:', error);
    }
  }

  /**
   * Procesa eventos de sincronización específicos
   */
  async processSyncEvent(channel, eventData) {
    switch (channel) {
      case this.CHANNELS.NEGOTIATION_STATUS:
        await this.processNegotiationStatusSync(eventData);
        break;
      case this.CHANNELS.PAYMENT_UPDATES:
        await this.processPaymentUpdatesSync(eventData);
        break;
      case this.CHANNELS.AGREEMENT_CHANGES:
        await this.processAgreementChangesSync(eventData);
        break;
      case this.CHANNELS.COMPANY_DEBTOR_SYNC:
        await this.processCompanyDebtorSync(eventData);
        break;
      case this.CHANNELS.REALTIME_NOTIFICATIONS:
        await this.processRealtimeNotifications(eventData);
        break;
      case this.CHANNELS.SHARED_ANALYTICS:
        await this.processSharedAnalyticsSync(eventData);
        break;
      default:
        console.warn(`⚠️ Unknown sync channel: ${channel}`);
    }
  }

  /**
   * Procesa sincronización de estado de negociaciones
   */
  async processNegotiationStatusSync(eventData) {
    const { event, data } = eventData;
    
    // Actualizar estados locales
    if (event === 'INSERT' || event === 'UPDATE') {
      // Actualizar caché local de negociaciones
      this.updateLocalCache('negotiations', data);
      
      // Enviar notificación cruzada si es relevante
      if (this.isRelevantForCrossNotification(data)) {
        await this.sendCrossNotification({
          type: this.EVENT_TYPES.NEGOTIATION_STATUS_CHANGE,
          data,
          recipients: await this.getRelevantRecipients(data),
          message: this.generateNegotiationStatusMessage(data)
        });
      }
    }
  }

  /**
   * Procesa sincronización de actualizaciones de pago
   */
  async processPaymentUpdatesSync(eventData) {
    const { event, data } = eventData;
    
    if (event === 'INSERT') {
      // Actualizar métricas financieras compartidas
      await this.updateSharedFinancialMetrics(data);
      
      // Notificar a empresas relevantes
      await this.notifyCompaniesAboutPayment(data);
      
      // Actualizar dashboard unificado
      await this.updateUnifiedDashboard('payment_received', data);
    }
  }

  /**
   * Procesa sincronización de cambios en acuerdos
   */
  async processAgreementChangesSync(eventData) {
    const { event, data } = eventData;
    
    if (event === 'INSERT' || event === 'UPDATE') {
      // Sincronizar estado del acuerdo entre portales
      await this.syncAgreementStatus(data);
      
      // Actualizar progreso financiero compartido
      await this.updateSharedFinancialProgress(data);
      
      // Notificar a todas las partes involucradas
      await this.notifyAgreementParties(data);
    }
  }

  /**
   * Procesa sincronización empresa-deudor
   */
  async processCompanyDebtorSync(eventData) {
    const { data } = eventData;
    
    // Sincronizar estados compartidos
    await this.syncSharedStates(data);
    
    // Actualizar visibilidad cruzada
    await this.updateCrossPortalVisibility(data);
  }

  /**
   * Procesa notificaciones en tiempo real
   */
  async processRealtimeNotifications(eventData) {
    const { data } = eventData;
    
    // Enviar notificación al portal correspondiente
    if (data.target_user_type !== this.userType) {
      await this.deliverCrossPortalNotification(data);
    }
  }

  /**
   * Procesa sincronización de analytics compartidos
   */
  async processSharedAnalyticsSync(eventData) {
    const { data } = eventData;
    
    // Actualizar métricas compartidas
    await this.updateSharedMetrics(data);
    
    // Actualizar dashboard unificado
    await this.updateUnifiedDashboard('analytics_update', data);
  }

  /**
   * Envía notificaciones cruzadas entre portales
   */
  async sendCrossNotification(notificationData) {
    try {
      const notification = {
        id: this.generateId(),
        ...notificationData,
        created_at: new Date().toISOString(),
        delivered: false
      };

      // Guardar en base de datos
      const { error } = await supabase
        .from('cross_portal_notifications')
        .insert(notification);

      if (error) throw error;

      // Enviar via broadcast para entrega inmediata
      await this.broadcastNotification(notification);

      console.log('📨 Cross notification sent:', notificationData.type);
    } catch (error) {
      console.error('❌ Error sending cross notification:', error);
    }
  }

  /**
   * Envia notificación via broadcast
   */
  async broadcastNotification(notification) {
    try {
      const channel = supabase.channel('ecosystem_broadcast');
      
      await channel.send({
        type: 'broadcast',
        event: 'cross_notification',
        payload: notification
      });
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
    }
  }

  /**
   * Actualiza dashboard unificado
   */
  async updateUnifiedDashboard(eventType, data) {
    try {
      const dashboardUpdate = {
        event_type: eventType,
        data,
        user_id: this.userId,
        user_type: this.userType,
        timestamp: new Date().toISOString()
      };

      // Guardar actualización
      const { error } = await supabase
        .from('unified_dashboard_updates')
        .insert(dashboardUpdate);

      if (error) throw error;

      // Notificar a suscriptores del dashboard
      this.notifyDashboardUpdate(eventType, data);

      console.log('📊 Unified dashboard updated:', eventType);
    } catch (error) {
      console.error('❌ Error updating unified dashboard:', error);
    }
  }

  /**
   * Registra callbacks para eventos de sincronización
   */
  onSyncEvent(channel, callback) {
    if (!this.syncCallbacks.has(channel)) {
      this.syncCallbacks.set(channel, []);
    }
    this.syncCallbacks.get(channel).push(callback);
  }

  /**
   * Notifica a callbacks registrados
   */
  notifySyncCallbacks(channel, eventData) {
    const callbacks = this.syncCallbacks.get(channel);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error('❌ Error in sync callback:', error);
        }
      });
    }
  }

  /**
   * Notifica actualizaciones del dashboard
   */
  notifyDashboardUpdate(eventType, data) {
    const dashboardCallbacks = this.syncCallbacks.get('dashboard_update');
    if (dashboardCallbacks) {
      dashboardCallbacks.forEach(callback => {
        try {
          callback({ eventType, data, timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('❌ Error in dashboard callback:', error);
        }
      });
    }
  }

  /**
   * Obtiene estados compartidos entre portales
   */
  async getSharedStates(entityId, entityType) {
    try {
      const { data, error } = await supabase
        .from('shared_states')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting shared states:', error);
      return [];
    }
  }

  /**
   * Actualiza estados compartidos
   */
  async updateSharedState(entityId, entityType, stateData) {
    try {
      const { error } = await supabase
        .from('shared_states')
        .upsert({
          entity_id: entityId,
          entity_type: entityType,
          state_data: stateData,
          updated_by: this.userId,
          updated_by_type: this.userType,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('🔄 Shared state updated:', entityType, entityId);
    } catch (error) {
      console.error('❌ Error updating shared state:', error);
    }
  }

  /**
   * Obtiene métricas financieras compartidas
   */
  async getSharedFinancialMetrics(timeRange = '30d') {
    try {
      const { data, error } = await supabase
        .from('shared_financial_metrics')
        .select('*')
        .gte('created_at', this.getDateRange(timeRange))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting shared financial metrics:', error);
      return [];
    }
  }

  /**
   * Utilidades
   */
  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDateRange(range) {
    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return ranges[range]?.toISOString() || ranges['30d'].toISOString();
  }

  updateLocalCache(key, data) {
    // Implementar caché local
    if (typeof window !== 'undefined') {
      const cacheKey = `ecosync_${key}_${this.userId}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }
  }

  isRelevantForCrossNotification(data) {
    // Lógica para determinar si requiere notificación cruzada
    return data.priority === 'high' || data.requires_cross_notification;
  }

  async getRelevantRecipients(data) {
    // Implementar lógica para obtener destinatarios relevantes
    return [];
  }

  generateNegotiationStatusMessage(data) {
    // Generar mensaje basado en el estado
    return `Estado de negociación actualizado: ${data.status}`;
  }

  async updateSharedFinancialMetrics(data) {
    // Implementar actualización de métricas financieras compartidas
  }

  async notifyCompaniesAboutPayment(data) {
    // Implementar notificación a empresas
  }

  async syncAgreementStatus(data) {
    // Implementar sincronización de estado de acuerdos
  }

  async updateSharedFinancialProgress(data) {
    // Implementar actualización de progreso financiero compartido
  }

  async notifyAgreementParties(data) {
    // Implementar notificación a partes del acuerdo
  }

  async syncSharedStates(data) {
    // Implementar sincronización de estados compartidos
  }

  async updateCrossPortalVisibility(data) {
    // Implementar actualización de visibilidad cruzada
  }

  async deliverCrossPortalNotification(data) {
    // Implementar entrega de notificación cruzada
  }

  async updateSharedMetrics(data) {
    // Implementar actualización de métricas compartidas
  }

  startSyncQueueProcessor() {
    // Implementar procesador de cola de sincronización
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  async cleanup() {
    try {
      // Desuscribirse de todos los canales
      for (const [channel, subscription] of this.activeSubscriptions) {
        await supabase.removeChannel(subscription);
        console.log(`🔌 Unsubscribed from: ${channel}`);
      }

      // Limpiar cachés y callbacks
      this.syncCallbacks.clear();
      this.activeSubscriptions.clear();
      this.lastSyncTimestamp.clear();

      console.log('🧹 Ecosystem Sync Service cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up ecosystem sync service:', error);
    }
  }
}

// Exportar instancia singleton
const ecosystemSyncService = new EcosystemSyncService();
export default ecosystemSyncService;