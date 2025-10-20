/**
 * Real-time Analytics Service
 * 
 * Proporciona actualizaciones en tiempo real para el dashboard administrativo
 * Se integra sin romper el código existente
 */

import { supabase } from '../config/supabase';

class RealTimeAnalyticsService {
  constructor() {
    this.subscribers = new Map();
    this.channels = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Suscribirse a actualizaciones en tiempo real
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    // Si es la primera suscripción, conectar al canal
    if (this.subscribers.get(eventType).size === 1) {
      this.connectToChannel(eventType);
    }

    // Retornar función de unsuscribe
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.disconnectFromChannel(eventType);
        }
      }
    };
  }

  // Conectar a un canal de Supabase Realtime
  async connectToChannel(channelName) {
    try {
      if (this.channels.has(channelName)) {
        return; // Ya conectado
      }

      const channel = supabase
        .channel(`admin_${channelName}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: channelName 
          }, 
          (payload) => {
            this.handleRealtimeUpdate(channelName, payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`✅ Conectado al canal: ${channelName}`);
          } else if (status === 'CHANNEL_ERROR') {
            this.handleConnectionError(channelName);
          }
        });

      this.channels.set(channelName, channel);
    } catch (error) {
      console.error(`❌ Error conectando al canal ${channelName}:`, error);
      this.handleConnectionError(channelName);
    }
  }

  // Desconectar de un canal
  disconnectFromChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🔌 Desconectado del canal: ${channelName}`);
    }
  }

  // Manejar actualizaciones en tiempo real
  handleRealtimeUpdate(channelName, payload) {
    const subscribers = this.subscribers.get(channelName);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback({
            type: payload.eventType,
            table: payload.table,
            record: payload.new,
            oldRecord: payload.old,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error en callback de suscriptor:', error);
        }
      });
    }
  }

  // Manejar errores de conexión
  handleConnectionError(channelName) {
    this.isConnected = false;
    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`🔄 Reintentando conectar a ${channelName} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connectToChannel(channelName);
      }, 2000 * this.reconnectAttempts); // Backoff exponencial
    } else {
      console.error(`❌ No se pudo conectar a ${channelName} después de ${this.maxReconnectAttempts} intentos`);
    }
  }

  // Obtener métricas en tiempo real
  async getRealTimeMetrics() {
    try {
      const { data, error } = await supabase
        .from('admin_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error obteniendo métricas en tiempo real:', error);
        return this.getDefaultMetrics();
      }

      return {
        ...data,
        timestamp: new Date(data.timestamp),
        isRealTime: true
      };
    } catch (error) {
      console.error('Error en getRealTimeMetrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Métricas por defecto si hay error
  getDefaultMetrics() {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalCompanies: 0,
      activeCompanies: 0,
      totalPayments: 0,
      totalAmount: 0,
      serverLoad: 0,
      databaseConnections: 0,
      timestamp: new Date(),
      isRealTime: false
    };
  }

  // Calcular métricas de negocio avanzadas
  async calculateBusinessMetrics() {
    try {
      // Obtener datos de múltiples tablas
      const [usersResult, paymentsResult, companiesResult] = await Promise.all([
        supabase.from('users').select('created_at, role').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        supabase.from('payments').select('amount, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        supabase.from('companies').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ]);

      const users = usersResult.data || [];
      const payments = paymentsResult.data || [];
      const companies = companiesResult.data || [];

      // Calcular métricas avanzadas
      const businessMetrics = {
        customerLifetimeValue: this.calculateCLV(payments),
        churnRate: this.calculateChurnRate(users),
        acquisitionCost: this.calculateCAC(companies),
        revenuePerUser: this.calculateARPU(payments, users),
        monthlyGrowthRate: this.calculateGrowthRate(users, companies),
        averageTransactionValue: this.calculateATV(payments),
        conversionRate: this.calculateConversionRate(users, payments),
        retentionRate: this.calculateRetentionRate(users)
      };

      return businessMetrics;
    } catch (error) {
      console.error('Error calculando métricas de negocio:', error);
      return this.getDefaultBusinessMetrics();
    }
  }

  // Calcular Customer Lifetime Value (CLV)
  calculateCLV(payments) {
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const customerCount = new Set(payments.map(p => p.user_id)).size;
    return customerCount > 0 ? totalRevenue / customerCount : 0;
  }

  // Calcular tasa de churn
  calculateChurnRate(users) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldUsers = users.filter(u => new Date(u.created_at) < thirtyDaysAgo).length;
    const totalUsers = users.length;
    return totalUsers > 0 ? ((totalUsers - oldUsers) / totalUsers) * 100 : 0;
  }

  // Calcular Customer Acquisition Cost (CAC)
  calculateCAC(companies) {
    const totalCompanies = companies.length;
    const marketingSpend = 1000000; // Valor estimado
    return totalCompanies > 0 ? marketingSpend / totalCompanies : 0;
  }

  // Calcular Average Revenue Per User (ARPU)
  calculateARPU(payments, users) {
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const userCount = new Set(payments.map(p => p.user_id)).size;
    return userCount > 0 ? totalRevenue / userCount : 0;
  }

  // Calcular tasa de crecimiento mensual
  calculateGrowthRate(users, companies) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const currentUsers = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;
    const previousUsers = users.filter(u => new Date(u.created_at) >= sixtyDaysAgo && new Date(u.created_at) < thirtyDaysAgo).length;
    
    return previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
  }

  // Calcular Average Transaction Value (ATV)
  calculateATV(payments) {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return payments.length > 0 ? totalAmount / payments.length : 0;
  }

  // Calcular tasa de conversión
  calculateConversionRate(users, payments) {
    const userCount = new Set(payments.map(p => p.user_id)).size;
    const totalUsers = users.length;
    return totalUsers > 0 ? (userCount / totalUsers) * 100 : 0;
  }

  // Calcular tasa de retención
  calculateRetentionRate(users) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const retainedUsers = users.filter(u => new Date(u.created_at) < thirtyDaysAgo).length;
    const totalUsers = users.length;
    return totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
  }

  // Métricas de negocio por defecto
  getDefaultBusinessMetrics() {
    return {
      customerLifetimeValue: 0,
      churnRate: 0,
      acquisitionCost: 0,
      revenuePerUser: 0,
      monthlyGrowthRate: 0,
      averageTransactionValue: 0,
      conversionRate: 0,
      retentionRate: 0
    };
  }

  // Limpiar todas las suscripciones
  cleanup() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
    this.isConnected = false;
  }
}

// Exportar instancia única
export const realTimeAnalyticsService = new RealTimeAnalyticsService();

export default realTimeAnalyticsService;