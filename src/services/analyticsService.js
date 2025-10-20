/**
 * Analytics Service - Servicio de Analytics Avanzado
 *
 * Proporciona métricas clave, ROI de IA, eficiencia de filtros,
 * y insights automáticos para optimización de campañas
 */

import { supabase } from '../config/supabase';
import { aiService } from './aiService';

export class AnalyticsService {
  constructor() {
    this.aiService = aiService;
  }

  /**
   * MÉTRICAS CLAVE - CONVERSIÓN POR SEGMENTO Y CAMPAÑA
   */
  async getConversionBySegmentAndCampaign(companyId, dateRange = null) {
    try {
      let query = supabase
        .from('campaign_results')
        .select(`
          *,
          campaign:unified_campaigns(id, name, campaign_type, ai_config),
          debtor:users(id, risk_level),
          corporate_client:corporate_clients(id, name, display_category),
          segment:corporate_segments(id, name)
        `)
        .eq('campaign.company_id', companyId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: results, error } = await query;

      if (error) throw error;

      // Agrupar por campaña y segmento
      const campaignMetrics = {};
      const segmentMetrics = {};

      results.forEach(result => {
        const campaignId = result.campaign.id;
        const segmentKey = this.getSegmentKey(result);

        // Métricas por campaña
        if (!campaignMetrics[campaignId]) {
          campaignMetrics[campaignId] = {
            campaign: result.campaign,
            totalSent: 0,
            totalOpened: 0,
            totalConverted: 0,
            totalRevenue: 0,
            conversionRate: 0,
            avgPersonalizationScore: 0
          };
        }

        campaignMetrics[campaignId].totalSent++;
        if (result.opened_at) campaignMetrics[campaignId].totalOpened++;
        if (result.converted_at) {
          campaignMetrics[campaignId].totalConverted++;
          campaignMetrics[campaignId].totalRevenue += parseFloat(result.amount_paid || 0);
        }
        campaignMetrics[campaignId].avgPersonalizationScore += result.ai_personalization_score || 0;

        // Métricas por segmento
        if (!segmentMetrics[segmentKey]) {
          segmentMetrics[segmentKey] = {
            segment: segmentKey,
            totalSent: 0,
            totalOpened: 0,
            totalConverted: 0,
            totalRevenue: 0,
            conversionRate: 0,
            avgRiskLevel: 0,
            count: 0
          };
        }

        segmentMetrics[segmentKey].totalSent++;
        if (result.opened_at) segmentMetrics[segmentKey].totalOpened++;
        if (result.converted_at) {
          segmentMetrics[segmentKey].totalConverted++;
          segmentMetrics[segmentKey].totalRevenue += parseFloat(result.amount_paid || 0);
        }
        segmentMetrics[segmentKey].avgRiskLevel += this.riskLevelToNumber(result.debtor?.risk_level);
        segmentMetrics[segmentKey].count++;
      });

      // Calcular tasas de conversión
      Object.values(campaignMetrics).forEach(metrics => {
        metrics.conversionRate = metrics.totalSent > 0 ? (metrics.totalConverted / metrics.totalSent) * 100 : 0;
        metrics.avgPersonalizationScore = metrics.totalSent > 0 ? metrics.avgPersonalizationScore / metrics.totalSent : 0;
      });

      Object.values(segmentMetrics).forEach(metrics => {
        metrics.conversionRate = metrics.totalSent > 0 ? (metrics.totalConverted / metrics.totalSent) * 100 : 0;
        metrics.avgRiskLevel = metrics.count > 0 ? metrics.avgRiskLevel / metrics.count : 0;
      });

      return {
        campaignMetrics: Object.values(campaignMetrics),
        segmentMetrics: Object.values(segmentMetrics),
        totalResults: results.length
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      return { campaignMetrics: [], segmentMetrics: [], totalResults: 0 };
    }
  }

  /**
   * MÉTRICAS CLAVE - ROI DE IA
   */
  async calculateAIRoi(companyId, dateRange = null) {
    try {
      // Obtener datos de uso de IA
      let aiUsageQuery = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('company_id', companyId);

      if (dateRange) {
        aiUsageQuery = aiUsageQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: aiUsage, error: aiError } = await aiUsageQuery;
      if (aiError) throw aiError;

      // Obtener resultados de campañas con IA
      let campaignQuery = supabase
        .from('campaign_results')
        .select(`
          *,
          campaign:unified_campaigns(ai_config)
        `)
        .eq('campaign.company_id', companyId)
        .not('campaign.ai_config', 'is', null);

      if (dateRange) {
        campaignQuery = campaignQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: campaignResults, error: campaignError } = await campaignQuery;
      if (campaignError) throw campaignError;

      // Calcular costos de IA
      const aiCosts = aiUsage.reduce((total, usage) => total + parseFloat(usage.cost || 0), 0);

      // Calcular ingresos generados por campañas con IA
      const aiRevenue = campaignResults
        .filter(result => result.converted_at)
        .reduce((total, result) => total + parseFloat(result.amount_paid || 0), 0);

      // Calcular baseline (conversión sin IA) - estimación
      const totalSent = campaignResults.length;
      const totalConverted = campaignResults.filter(r => r.converted_at).length;
      const actualConversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

      // Estimar conversión baseline (típicamente 20-30% menor sin IA)
      const baselineConversionRate = Math.max(0, actualConversionRate * 0.75);
      const baselineRevenue = (baselineConversionRate / 100) * totalSent * this.getAveragePaymentAmount(campaignResults);

      // Calcular ROI
      const additionalRevenue = aiRevenue - baselineRevenue;
      const roi = aiCosts > 0 ? ((additionalRevenue - aiCosts) / aiCosts) * 100 : 0;

      return {
        aiCosts,
        aiRevenue,
        baselineRevenue,
        additionalRevenue,
        roi,
        actualConversionRate,
        baselineConversionRate,
        totalAICalls: aiUsage.length,
        avgCostPerCall: aiUsage.length > 0 ? aiCosts / aiUsage.length : 0,
        aiUsageByProvider: this.groupAIUsageByProvider(aiUsage)
      };
    } catch (error) {
      console.error('Error calculating AI ROI:', error);
      return {
        aiCosts: 0,
        aiRevenue: 0,
        baselineRevenue: 0,
        additionalRevenue: 0,
        roi: 0,
        actualConversionRate: 0,
        baselineConversionRate: 0,
        totalAICalls: 0,
        avgCostPerCall: 0,
        aiUsageByProvider: {}
      };
    }
  }

  /**
   * MÉTRICAS CLAVE - EFICIENCIA DE FILTROS JERÁRQUICOS
   */
  async getHierarchicalFilterEfficiency(companyId, dateRange = null) {
    try {
      // Obtener campañas con filtros jerárquicos
      let campaignQuery = supabase
        .from('unified_campaigns')
        .select(`
          *,
          results:campaign_results(count)
        `)
        .eq('company_id', companyId)
        .not('filter_config', 'is', null);

      if (dateRange) {
        campaignQuery = campaignQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: campaigns, error } = await campaignQuery;
      if (error) throw error;

      const efficiencyMetrics = [];

      for (const campaign of campaigns) {
        const filters = campaign.filter_config || {};

        // Calcular eficiencia de cada filtro
        const corporateFilterEfficiency = await this.calculateCorporateFilterEfficiency(campaign.id, filters);
        const riskFilterEfficiency = await this.calculateRiskFilterEfficiency(campaign.id, filters);
        const debtFilterEfficiency = await this.calculateDebtFilterEfficiency(campaign.id, filters);

        // Calcular eficiencia general
        const overallEfficiency = this.calculateOverallEfficiency([
          corporateFilterEfficiency,
          riskFilterEfficiency,
          debtFilterEfficiency
        ]);

        efficiencyMetrics.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          corporateFilterEfficiency,
          riskFilterEfficiency,
          debtFilterEfficiency,
          overallEfficiency,
          totalFiltered: campaign.results?.[0]?.count || 0
        });
      }

      return {
        efficiencyMetrics,
        averageEfficiency: efficiencyMetrics.length > 0
          ? efficiencyMetrics.reduce((sum, m) => sum + m.overallEfficiency, 0) / efficiencyMetrics.length
          : 0
      };
    } catch (error) {
      console.error('Error calculating hierarchical filter efficiency:', error);
      return { efficiencyMetrics: [], averageEfficiency: 0 };
    }
  }

  /**
   * MÉTRICAS CLAVE - USO Y COSTOS DE APIs DE IA
   */
  async getAIUsageAndCosts(companyId, dateRange = null) {
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('company_id', companyId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: usageLogs, error } = await query;
      if (error) throw error;

      // Agrupar por proveedor y tarea
      const usageByProvider = {};
      const usageByTask = {};
      const usageByModel = {};

      let totalTokens = 0;
      let totalCost = 0;
      let totalRequests = usageLogs.length;

      usageLogs.forEach(log => {
        const provider = log.provider;
        const task = log.task_type;
        const model = log.model;

        // Por proveedor
        if (!usageByProvider[provider]) {
          usageByProvider[provider] = {
            requests: 0,
            tokens: 0,
            cost: 0,
            successRate: 0,
            avgResponseTime: 0
          };
        }
        usageByProvider[provider].requests++;
        usageByProvider[provider].tokens += log.tokens_used || 0;
        usageByProvider[provider].cost += parseFloat(log.cost || 0);

        // Por tarea
        if (!usageByTask[task]) {
          usageByTask[task] = {
            requests: 0,
            tokens: 0,
            cost: 0,
            avgTokensPerRequest: 0
          };
        }
        usageByTask[task].requests++;
        usageByTask[task].tokens += log.tokens_used || 0;
        usageByTask[task].cost += parseFloat(log.cost || 0);

        // Por modelo
        if (!usageByModel[model]) {
          usageByModel[model] = {
            requests: 0,
            tokens: 0,
            cost: 0,
            provider
          };
        }
        usageByModel[model].requests++;
        usageByModel[model].tokens += log.tokens_used || 0;
        usageByModel[model].cost += parseFloat(log.cost || 0);

        // Totales
        totalTokens += log.tokens_used || 0;
        totalCost += parseFloat(log.cost || 0);
      });

      // Calcular métricas adicionales
      Object.values(usageByProvider).forEach(provider => {
        provider.avgTokensPerRequest = provider.requests > 0 ? provider.tokens / provider.requests : 0;
        provider.costPerToken = provider.tokens > 0 ? provider.cost / provider.tokens : 0;
      });

      Object.values(usageByTask).forEach(task => {
        task.avgTokensPerRequest = task.requests > 0 ? task.tokens / task.requests : 0;
        task.costPerRequest = task.requests > 0 ? task.cost / task.requests : 0;
      });

      return {
        totalRequests,
        totalTokens,
        totalCost,
        avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
        avgTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
        usageByProvider,
        usageByTask,
        usageByModel,
        costBreakdown: {
          groq: usageByProvider.GROQ?.cost || 0,
          chutes: usageByProvider.CHUTES?.cost || 0
        }
      };
    } catch (error) {
      console.error('Error getting AI usage and costs:', error);
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgCostPerRequest: 0,
        avgTokensPerRequest: 0,
        usageByProvider: {},
        usageByTask: {},
        usageByModel: {},
        costBreakdown: { groq: 0, chutes: 0 }
      };
    }
  }

  /**
   * INSIGHTS AUTOMÁTICOS - RECOMENDACIONES DE IA
   */
  async generateCampaignOptimizationRecommendations(companyId) {
    try {
      // Obtener datos recientes de campañas
      const { data: recentCampaigns, error } = await supabase
        .from('unified_campaigns')
        .select(`
          *,
          results:campaign_results(count)
        `)
        .eq('company_id', companyId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 días
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const campaignData = recentCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.campaign_type,
        status: campaign.status,
        conversionRate: campaign.metrics?.conversionRate || 0,
        totalSent: campaign.metrics?.actualSent || 0,
        aiEnabled: campaign.ai_config?.enabled || false,
        filters: campaign.filter_config,
        offer: campaign.offer_config
      }));

      // Generar recomendaciones con IA
      const recommendations = await aiService.executeTask('campaign_optimization', {
        prompt: `Analiza estas campañas recientes y proporciona recomendaciones específicas de optimización:

Campañas recientes:
${JSON.stringify(campaignData, null, 2)}

Proporciona recomendaciones específicas para:
1. Mejora de tasas de conversión
2. Optimización de filtros y segmentación
3. Ajustes en ofertas y personalización
4. Estrategias de IA más efectivas
5. Mejores prácticas identificadas

Devuelve un JSON con recomendaciones prioritarias y justificaciones.`
      });

      return JSON.parse(recommendations.response || '[]');
    } catch (error) {
      console.error('Error generating campaign recommendations:', error);
      return [];
    }
  }

  /**
   * INSIGHTS AUTOMÁTICOS - ANÁLISIS PREDICTIVO DE COMPORTAMIENTO
   */
  async generatePredictiveBehaviorAnalysis(companyId) {
    try {
      // Obtener datos históricos de comportamiento
      const { data: behaviorData, error } = await supabase
        .from('campaign_results')
        .select(`
          *,
          debtor:users(risk_level, created_at),
          campaign:unified_campaigns(campaign_type, ai_config)
        `)
        .eq('campaign.company_id', companyId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 90 días
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar datos para análisis predictivo
      const behaviorPatterns = this.analyzeBehaviorPatterns(behaviorData);

      // Generar análisis predictivo con IA
      const predictiveAnalysis = await aiService.executeTask('predictive_analytics', {
        prompt: `Analiza estos patrones de comportamiento de deudores y proporciona insights predictivos:

Patrones de comportamiento:
${JSON.stringify(behaviorPatterns, null, 2)}

Proporciona análisis predictivo sobre:
1. Tendencias de conversión por segmento
2. Patrones de comportamiento identificados
3. Predicciones de respuesta futura
4. Recomendaciones para targeting
5. Riesgos potenciales y oportunidades

Devuelve análisis detallado en formato JSON.`
      });

      return JSON.parse(predictiveAnalysis.response || '{}');
    } catch (error) {
      console.error('Error generating predictive behavior analysis:', error);
      return {};
    }
  }

  /**
   * INSIGHTS AUTOMÁTICOS - TENDENCIAS DE MERCADO
   */
  async generateMarketTrendsAndBestPractices() {
    try {
      // Este análisis se basa en datos generales del mercado de cobranza
      const marketAnalysis = await aiService.executeTask('predictive_analytics', {
        prompt: `Proporciona un análisis de tendencias actuales en el mercado de cobranza digital y mejores prácticas:

Analiza tendencias como:
1. Adopción de IA en cobranza
2. Efectividad de diferentes canales de comunicación
3. Mejores prácticas de personalización
4. Tendencias en experiencia del usuario
5. Impacto de la regulación (GDPR, etc.)
6. Tecnologías emergentes

Proporciona insights accionables y recomendaciones específicas para empresas de cobranza.`
      });

      return JSON.parse(marketAnalysis.response || '{}');
    } catch (error) {
      console.error('Error generating market trends analysis:', error);
      return {};
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  getSegmentKey(result) {
    if (result.corporate_client) {
      return `corporate_${result.corporate_client.id}`;
    } else if (result.segment) {
      return `segment_${result.segment.id}`;
    } else {
      return `individual_${result.debtor?.risk_level || 'unknown'}`;
    }
  }

  riskLevelToNumber(riskLevel) {
    const levels = { low: 1, medium: 2, high: 3 };
    return levels[riskLevel] || 2;
  }

  getAveragePaymentAmount(results) {
    const payments = results
      .filter(r => r.amount_paid)
      .map(r => parseFloat(r.amount_paid));

    return payments.length > 0
      ? payments.reduce((sum, amount) => sum + amount, 0) / payments.length
      : 100000; // Valor por defecto
  }

  groupAIUsageByProvider(usageLogs) {
    return usageLogs.reduce((acc, log) => {
      const provider = log.provider;
      if (!acc[provider]) {
        acc[provider] = { requests: 0, cost: 0 };
      }
      acc[provider].requests++;
      acc[provider].cost += parseFloat(log.cost || 0);
      return acc;
    }, {});
  }

  async calculateCorporateFilterEfficiency(campaignId, filters) {
    // Lógica para calcular eficiencia de filtros corporativos
    const corporateFilters = filters.corporateClients || [];
    if (corporateFilters.length === 0) return 100; // Sin filtro = 100% eficiencia

    // Obtener resultados y calcular precisión del targeting
    const { data: results } = await supabase
      .from('campaign_results')
      .select('corporate_client_id')
      .eq('campaign_id', campaignId);

    const targetedCorporateIds = new Set(corporateFilters);
    const actualCorporateIds = new Set(results.map(r => r.corporate_client_id).filter(Boolean));

    const precision = results.length > 0
      ? (results.filter(r => targetedCorporateIds.has(r.corporate_client_id)).length / results.length) * 100
      : 100;

    return Math.min(precision, 100);
  }

  async calculateRiskFilterEfficiency(campaignId, filters) {
    const riskFilters = filters.riskLevels || [];
    if (riskFilters.length === 0) return 100;

    const { data: results } = await supabase
      .from('campaign_results')
      .select('debtor:users(risk_level)')
      .eq('campaign_id', campaignId);

    const targetedRisks = new Set(riskFilters);
    const actualRisks = results.map(r => r.debtor?.risk_level).filter(Boolean);

    const precision = actualRisks.length > 0
      ? (actualRisks.filter(risk => targetedRisks.has(risk)).length / actualRisks.length) * 100
      : 100;

    return Math.min(precision, 100);
  }

  async calculateDebtFilterEfficiency(campaignId, filters) {
    const debtFilters = filters.debtAmountRange || {};
    if (!debtFilters.min && !debtFilters.max) return 100;

    // Esta sería una implementación más compleja basada en los montos de deuda
    return 95; // Placeholder
  }

  calculateOverallEfficiency(efficiencies) {
    const validEfficiencies = efficiencies.filter(e => e !== null && e !== undefined);
    return validEfficiencies.length > 0
      ? validEfficiencies.reduce((sum, e) => sum + e, 0) / validEfficiencies.length
      : 100;
  }

  analyzeBehaviorPatterns(behaviorData) {
    // Análisis básico de patrones de comportamiento
    const patterns = {
      totalInteractions: behaviorData.length,
      conversionRate: behaviorData.length > 0
        ? (behaviorData.filter(r => r.converted_at).length / behaviorData.length) * 100
        : 0,
      avgResponseTime: this.calculateAverageResponseTime(behaviorData),
      riskLevelDistribution: this.calculateRiskDistribution(behaviorData),
      channelPreferences: this.calculateChannelPreferences(behaviorData),
      timePatterns: this.calculateTimePatterns(behaviorData)
    };

    return patterns;
  }

  calculateAverageResponseTime(data) {
    const responseTimes = data
      .filter(r => r.opened_at && r.created_at)
      .map(r => new Date(r.opened_at) - new Date(r.created_at));

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60 * 60) // en horas
      : 0;
  }

  calculateRiskDistribution(data) {
    const distribution = {};
    data.forEach(r => {
      const risk = r.debtor?.risk_level || 'unknown';
      distribution[risk] = (distribution[risk] || 0) + 1;
    });
    return distribution;
  }

  calculateChannelPreferences(data) {
    // Placeholder - en implementación real se basaría en datos de canal
    return { email: 70, sms: 20, whatsapp: 10 };
  }

  calculateTimePatterns(data) {
    const patterns = { weekday: {}, hour: {} };
    data.forEach(r => {
      const date = new Date(r.created_at);
      const day = date.getDay();
      const hour = date.getHours();

      patterns.weekday[day] = (patterns.weekday[day] || 0) + 1;
      patterns.hour[hour] = (patterns.hour[hour] || 0) + 1;
    });
    return patterns;
  }
}

// =====================================================
// INSTANCIA GLOBAL
// =====================================================

export const analyticsService = new AnalyticsService();

export default analyticsService;