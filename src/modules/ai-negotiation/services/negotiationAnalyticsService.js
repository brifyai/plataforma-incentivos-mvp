/**
 * Servicio de Analytics para Negociación
 * 
 * Maneja métricas y análisis de rendimiento del sistema de IA
 */

import { supabase } from '../../../config/supabase.js';

export class NegotiationAnalyticsService {
  
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene métricas generales de negociación
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Métricas generales
   */
  async getGeneralMetrics(companyId) {
    try {
      const cacheKey = `general_metrics_${companyId}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Obtener conversaciones activas
      const { data: activeConversations, error: activeError } = await supabase
        .from('negotiation_conversations')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('ai_enabled', true);

      if (activeError) throw activeError;

      // Obtener analytics completados
      const { data: analytics, error: analyticsError } = await supabase
        .from('negotiation_analytics')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) throw analyticsError;

      // Calcular métricas
      const totalNegotiations = analytics?.length || 0;
      const successfulNegotiations = analytics?.filter(a => a.outcome === 'agreement').length || 0;
      const escalatedNegotiations = analytics?.filter(a => a.outcome === 'escalated').length || 0;
      const avgResolutionTime = analytics?.reduce((sum, a) => sum + (a.conversation_duration_minutes || 0), 0) / totalNegotiations || 0;

      const metrics = {
        activeNegotiations: activeConversations?.length || 0,
        totalNegotiations,
        aiSuccessRate: totalNegotiations > 0 ? Math.round((successfulNegotiations / totalNegotiations) * 100) : 0,
        escalations: escalatedNegotiations,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        lastUpdated: new Date().toISOString()
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting general metrics:', error);
      throw error;
    }
  }

  /**
   * Obtiene conversaciones activas con detalles
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} Lista de conversaciones activas
   */
  async getActiveNegotiations(companyId) {
    try {
      const { data, error } = await supabase
        .from('negotiation_conversations')
        .select(`
          *,
          negotiation_messages (
            id,
            content,
            sender_type,
            created_at,
            metadata
          ),
          proposals:proposal_id (
            id,
            total_amount,
            installments,
            status
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('ai_enabled', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(conversation => ({
        id: conversation.id,
        proposalId: conversation.proposal_id,
        proposalData: conversation.proposals,
        status: conversation.status,
        aiActive: conversation.ai_enabled,
        messageCount: conversation.negotiation_messages?.length || 0,
        lastMessage: conversation.negotiation_messages?.[0]?.created_at,
        lastMessageContent: conversation.negotiation_messages?.[0]?.content,
        progress: this.calculateProgress(conversation),
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting active negotiations:', error);
      throw error;
    }
  }

  /**
   * Obtiene tendencias de negociación
   * @param {string} companyId - ID de la empresa
   * @param {number} days - Días a analizar
   * @returns {Promise<Object>} Tendencias
   */
  async getNegotiationTrends(companyId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('negotiation_analytics')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const dailyData = this.groupByDay(data || []);
      
      return {
        period: days,
        dailyData,
        totalNegotiations: data?.length || 0,
        averageSuccessRate: this.calculateAverageSuccessRate(data || []),
        trends: this.calculateTrends(dailyData)
      };
    } catch (error) {
      console.error('Error getting negotiation trends:', error);
      throw error;
    }
  }

  /**
   * Registra evento de métrica
   * @param {string} companyId - ID de la empresa
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @returns {Promise<void>}
   */
  async trackEvent(companyId, eventType, eventData) {
    try {
      const { error } = await supabase
        .from('negotiation_analytics')
        .insert({
          company_id: companyId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Invalidar caché relevante
      this.invalidateCache(`general_metrics_${companyId}`);
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Genera reporte de rendimiento
   * @param {string} companyId - ID de la empresa
   * @param {Object} options - Opciones del reporte
   * @returns {Promise<Object>} Reporte generado
   */
  async generatePerformanceReport(companyId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        includeDetails = false
      } = options;

      const { data, error } = await supabase
        .from('negotiation_analytics')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const report = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalNegotiations: data?.length || 0,
          successfulNegotiations: data?.filter(d => d.outcome === 'agreement').length || 0,
          escalatedNegotiations: data?.filter(d => d.outcome === 'escalated').length || 0,
          averageResolutionTime: this.calculateAverageResolutionTime(data || []),
          successRate: this.calculateAverageSuccessRate(data || [])
        },
        performance: {
          aiEfficiency: this.calculateAIEfficiency(data || []),
          escalationRate: this.calculateEscalationRate(data || []),
          customerSatisfaction: this.calculateCustomerSatisfaction(data || [])
        }
      };

      if (includeDetails) {
        report.details = data;
      }

      return report;
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Obtiene feedback de negociaciones
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} Feedback recibido
   */
  async getFeedback(companyId) {
    try {
      const { data, error } = await supabase
        .from('negotiation_feedback')
        .select(`
          *,
          negotiation_conversations (
            id,
            status,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Métodos utilitarios privados
   */
  calculateProgress(conversation) {
    const messageCount = conversation.negotiation_messages?.length || 0;
    const maxMessages = 15; // Umbral típico de escalamiento
    
    return Math.min(Math.round((messageCount / maxMessages) * 100), 100);
  }

  groupByDay(data) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return Object.keys(grouped).map(date => ({
      date,
      negotiations: grouped[date].length,
      successful: grouped[date].filter(d => d.outcome === 'agreement').length,
      escalated: grouped[date].filter(d => d.outcome === 'escalated').length
    }));
  }

  calculateTrends(dailyData) {
    if (dailyData.length < 2) return { trend: 'stable', change: 0 };

    const recent = dailyData.slice(-7);
    const previous = dailyData.slice(-14, -7);

    const recentSuccess = recent.reduce((sum, d) => sum + d.successful, 0);
    const previousSuccess = previous.reduce((sum, d) => sum + d.successful, 0);

    const recentTotal = recent.reduce((sum, d) => sum + d.negotiations, 0);
    const previousTotal = previous.reduce((sum, d) => sum + d.negotiations, 0);

    const recentRate = recentTotal > 0 ? (recentSuccess / recentTotal) * 100 : 0;
    const previousRate = previousTotal > 0 ? (previousSuccess / previousTotal) * 100 : 0;

    const change = recentRate - previousRate;
    const trend = change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';

    return { trend, change: Math.round(change * 10) / 10 };
  }

  calculateAverageSuccessRate(data) {
    if (data.length === 0) return 0;
    
    const successful = data.filter(d => d.outcome === 'agreement').length;
    return Math.round((successful / data.length) * 100);
  }

  calculateAverageResolutionTime(data) {
    if (data.length === 0) return 0;
    
    const totalTime = data.reduce((sum, d) => sum + (d.conversation_duration_minutes || 0), 0);
    return Math.round((totalTime / data.length) * 10) / 10;
  }

  calculateAIEfficiency(data) {
    const aiHandled = data.filter(d => d.ai_messages > 0).length;
    return data.length > 0 ? Math.round((aiHandled / data.length) * 100) : 0;
  }

  calculateEscalationRate(data) {
    const escalated = data.filter(d => d.outcome === 'escalated').length;
    return data.length > 0 ? Math.round((escalated / data.length) * 100) : 0;
  }

  calculateCustomerSatisfaction(data) {
    // Esto sería calculado basado en feedback real
    // Por ahora, usamos un cálculo basado en outcomes
    const successful = data.filter(d => d.outcome === 'agreement').length;
    const escalated = data.filter(d => d.outcome === 'escalated').length;
    
    if (data.length === 0) return 0;
    
    // Asumimos que acuerdos = satisfacción alta, escalamientos = satisfacción baja
    const satisfactionScore = (successful * 5 + escalated * 2) / data.length;
    return Math.round(satisfactionScore * 10) / 10;
  }

  getCachedData(key) {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidateCache(pattern) {
    for (const key of this.metricsCache.keys()) {
      if (key.includes(pattern)) {
        this.metricsCache.delete(key);
      }
    }
  }
}

// Exportar instancia única
export const negotiationAnalyticsService = new NegotiationAnalyticsService();