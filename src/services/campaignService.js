/**
 * 2. INTELIGENCIA ARTIFICIAL - Campaign Service
 *
 * APIs Autorizadas (Solo estas 3):
 * ✅ Groq: Análisis complejo, segmentación, predicción
 * ✅ OpenRouter: Personalización creativa, estrategia
 * ✅ Chutes: Contenido engaging, optimización
 *
 * Funciones de IA Integradas:
 * ✅ Segmentación automática de deudores
 * ✅ Personalización de ofertas por perfil
 * ✅ Optimización de campañas en tiempo real
 * ✅ Generación de contenido persuasivo
 * ✅ Análisis predictivo de conversión
 *
 * Servicio que integra todas las funcionalidades de campañas con IA
 */

import { supabase } from '../config/supabase';
import { aiService } from './aiService';
import {
  createUnifiedCampaign,
  updateUnifiedCampaign,
  getCampaignDebtors
} from './databaseService';

export class CampaignService {
  constructor() {
    this.aiService = aiService;
  }

  /**
   * SEGMENTACIÓN AUTOMÁTICA DE DEUDORES
   * ✅ Análisis complejo con Groq
   */
  async segmentDebtors(debtors, criteria = {}) {
    console.log(`🎯 Segmentando ${debtors.length} deudores con IA`);

    try {
      const segmentation = await aiService.segmentDebtors(debtors, criteria);

      // Aplicar segmentación avanzada por riesgo y comportamiento
      const enhancedSegmentation = await this.enhanceSegmentation(segmentation, debtors);

      return enhancedSegmentation;
    } catch (error) {
      console.error('Error en segmentación automática:', error);
      return this.fallbackSegmentation(debtors);
    }
  }

  /**
   * PERSONALIZACIÓN DE OFERTAS POR PERFIL
   * ✅ Estrategia creativa con OpenRouter
   */
  async personalizeOffer(debtor, baseOffer, campaignContext = {}) {
    console.log(`🎨 Personalizando oferta para deudor ${debtor.id}`);

    try {
      const personalizedOffer = await aiService.personalizeOffer(debtor, baseOffer, campaignContext);

      // Generar contenido persuasivo adicional
      const persuasiveContent = await this.generatePersuasiveContent(debtor, personalizedOffer);

      return {
        ...personalizedOffer,
        persuasiveContent
      };
    } catch (error) {
      console.error('Error en personalización de oferta:', error);
      return baseOffer;
    }
  }

  /**
   * OPTIMIZACIÓN DE CAMPAÑAS EN TIEMPO REAL
   * ✅ Estrategia avanzada con OpenRouter
   */
  async optimizeCampaignRealtime(campaignId, currentResults) {
    console.log(`📈 Optimizando campaña ${campaignId} en tiempo real`);

    try {
      // Obtener datos de campaña
      const { data: campaign, error } = await supabase
        .from('unified_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // Análisis predictivo de conversión
      const predictiveAnalysis = await this.predictiveConversionAnalysis(campaign, currentResults);

      // Optimización con IA
      const optimization = await aiService.optimizeCampaign(campaign, {
        ...currentResults,
        predictiveAnalysis
      });

      // Aplicar optimizaciones automáticamente
      await this.applyRealtimeOptimizations(campaignId, optimization);

      return {
        optimization,
        predictiveAnalysis,
        appliedChanges: optimization.recommendations.filter(r => r.autoApplied)
      };
    } catch (error) {
      console.error('Error en optimización en tiempo real:', error);
      return { recommendations: [], predictedImprovement: 0 };
    }
  }

  /**
   * GENERACIÓN DE CONTENIDO PERSUASIVO
   * ✅ Contenido engaging con Chutes
   */
  async generatePersuasiveContent(debtor, offer) {
    console.log(`✍️ Generando contenido persuasivo para deudor ${debtor.id}`);

    try {
      const contentPrompt = this.buildPersuasiveContentPrompt(debtor, offer);

      const result = await aiService.executeTask('message_generation', {
        prompt: contentPrompt,
        debtor,
        offer
      });

      return this.parsePersuasiveContent(result.response);
    } catch (error) {
      console.error('Error generando contenido persuasivo:', error);
      return this.fallbackPersuasiveContent(debtor, offer);
    }
  }

  /**
   * ANÁLISIS PREDICTIVO DE CONVERSIÓN
   * ✅ Predicciones complejas con Groq
   */
  async predictiveConversionAnalysis(campaign, currentResults) {
    console.log(`🔮 Análisis predictivo para campaña ${campaign.id}`);

    try {
      const analysisPrompt = this.buildPredictiveAnalysisPrompt(campaign, currentResults);

      const result = await aiService.executeTask('predictive_analytics', {
        prompt: analysisPrompt,
        campaign,
        currentResults
      });

      return this.parsePredictiveAnalysis(result.response);
    } catch (error) {
      console.error('Error en análisis predictivo:', error);
      return this.fallbackPredictiveAnalysis(currentResults);
    }
  }

  /**
   * CREA UNA CAMPAÑA INTELIGENTE
   */
  async createIntelligentCampaign(campaignData, companyId) {
    console.log(`🚀 Creando campaña inteligente para empresa ${companyId}`);

    try {
      // Obtener deudores objetivo
      const debtors = await this.getTargetDebtors(campaignData.filters, companyId);

      // Segmentación automática
      const segmentation = await this.segmentDebtors(debtors, campaignData.aiConfig);

      // Crear campaña en base de datos
      const campaign = await createUnifiedCampaign({
        ...campaignData,
        company_id: companyId,
        ai_config: {
          ...campaignData.aiConfig,
          segmentation: segmentation
        },
        status: 'draft'
      });

      return {
        campaign,
        segmentation,
        targetDebtors: debtors.length
      };
    } catch (error) {
      console.error('Error creando campaña inteligente:', error);
      throw error;
    }
  }

  /**
   * EJECUTA UNA CAMPAÑA
   */
  async executeCampaign(campaignId) {
    console.log(`▶️ Ejecutando campaña ${campaignId}`);

    try {
      // Obtener campaña
      const { data: campaign, error } = await supabase
        .from('unified_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // Obtener deudores segmentados
      const debtors = await getCampaignDebtors(campaignId);

      // Ejecutar campaña con personalización individual
      const results = await this.executePersonalizedCampaign(campaign, debtors);

      // Actualizar estado de campaña
      await updateUnifiedCampaign(campaignId, {
        status: 'running',
        executed_at: new Date().toISOString(),
        metrics: {
          ...campaign.metrics,
          actualSent: results.length
        }
      });

      return results;
    } catch (error) {
      console.error('Error ejecutando campaña:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  async getTargetDebtors(filters, companyId) {
    // Implementar lógica para obtener deudores según filtros jerárquicos
    const { data: debtors, error } = await supabase
      .from('debtors')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;
    return debtors || [];
  }

  async executePersonalizedCampaign(campaign, debtors) {
    const results = [];

    for (const debtor of debtors) {
      try {
        // Personalizar oferta
        const personalizedOffer = await this.personalizeOffer(
          debtor,
          campaign.base_offer,
          { campaignId: campaign.id }
        );

        // Generar contenido persuasivo
        const persuasiveContent = await this.generatePersuasiveContent(debtor, personalizedOffer);

        // Crear mensaje seguro
        const secureMessage = await supabase
          .from('secure_messages')
          .insert({
            campaign_id: campaign.id,
            debtor_id: debtor.id,
            offer_data: personalizedOffer,
            content: persuasiveContent,
            status: 'pending'
          })
          .select()
          .single();

        results.push({
          debtorId: debtor.id,
          secureMessageId: secureMessage.id,
          personalizedOffer,
          persuasiveContent
        });

      } catch (error) {
        console.error(`Error procesando deudor ${debtor.id}:`, error);
        results.push({
          debtorId: debtor.id,
          error: error.message
        });
      }
    }

    return results;
  }

  async applyRealtimeOptimizations(campaignId, optimization) {
    // Aplicar recomendaciones de optimización automáticamente
    const autoAppliedRecommendations = [];

    for (const recommendation of optimization.recommendations) {
      if (recommendation.autoApply && recommendation.type === 'discount_adjustment') {
        // Actualizar oferta base de la campaña
        await updateUnifiedCampaign(campaignId, {
          base_offer: {
            ...optimization.campaignData.base_offer,
            discountPercentage: recommendation.newDiscount
          }
        });

        autoAppliedRecommendations.push(recommendation);
        recommendation.autoApplied = true;
      }
    }

    return autoAppliedRecommendations;
  }

  enhanceSegmentation(segmentation, debtors) {
    // Mejorar segmentación con análisis avanzado
    const enhancedSegments = { ...segmentation };
    
    // Análisis de riesgo adicional
    if (debtors && debtors.length > 0) {
      const riskDistribution = debtors.reduce((acc, debtor) => {
        const risk = debtor.riskLevel || 'unknown';
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      }, {});
      
      enhancedSegments.riskDistribution = riskDistribution;
      enhancedSegments.insights.push(`Análisis de riesgo: ${JSON.stringify(riskDistribution)}`);
    }
    
    return enhancedSegments;
  }

  fallbackSegmentation(debtors) {
    return {
      segments: {
        low_risk: { debtors: debtors.filter(d => d.riskLevel === 'low'), count: 0 },
        medium_risk: { debtors: debtors.filter(d => d.riskLevel === 'medium'), count: 0 },
        high_risk: { debtors: debtors.filter(d => d.riskLevel === 'high'), count: 0 }
      },
      insights: ['Segmentación básica aplicada']
    };
  }

  buildPersuasiveContentPrompt(debtor, offer) {
    return `
Eres un experto en copywriting persuasivo para cobranza.

Crea contenido altamente persuasivo y engaging para convencer a este deudor de aceptar la oferta.

Perfil del deudor:
${JSON.stringify({
  riskLevel: debtor.riskLevel,
  demographics: debtor.demographics,
  paymentHistory: debtor.paymentHistory?.slice(-3) // últimos 3 pagos
}, null, 2)}

Oferta personalizada:
${JSON.stringify(offer, null, 2)}

Genera contenido persuasivo que incluya:
- Saludo personalizado
- Recordatorio empático de la situación
- Beneficios claros de la oferta
- Urgencia sin presión
- Llamado a la acción motivador

El tono debe ser: profesional, empático y motivador.
Longitud: 150-300 palabras.
`;
  }

  parsePersuasiveContent(response) {
    try {
      const parsed = JSON.parse(response);
      return parsed.content || response;
    } catch {
      return response; // Si no es JSON, devolver como texto
    }
  }

  fallbackPersuasiveContent(debtor, offer) {
    return `Hola ${debtor.demographics?.name || 'estimado cliente'},

Tenemos una oferta especial para ti: ${offer.discountPercentage}% de descuento en tu deuda.

Beneficios:
- Reduce tu deuda actual
- Plan de pagos flexible
- Sin intereses adicionales

No pierdas esta oportunidad. Contáctanos hoy mismo.

Atentamente,
Tu equipo de NexuPay`;
  }

  buildPredictiveAnalysisPrompt(campaign, currentResults) {
    return `
Eres un analista predictivo experto en marketing de cobranza.

Analiza los resultados actuales de esta campaña y predice la conversión futura.

Datos de campaña:
${JSON.stringify(campaign, null, 2)}

Resultados actuales:
${JSON.stringify(currentResults, null, 2)}

Proporciona un análisis predictivo que incluya:
- Tasa de conversión proyectada
- Factores que afectan la conversión
- Recomendaciones para mejorar
- Probabilidad de éxito por segmento

Devuelve en formato JSON:
{
  "predictedConversionRate": 0.25,
  "confidence": 0.85,
  "keyFactors": ["descuento", "urgencia", "personalización"],
  "segmentPredictions": {
    "low_risk": { "conversion": 0.35, "confidence": 0.9 },
    "medium_risk": { "conversion": 0.25, "confidence": 0.8 },
    "high_risk": { "conversion": 0.15, "confidence": 0.7 }
  },
  "recommendations": ["Aumentar descuento", "Personalizar más"]
}
`;
  }

  parsePredictiveAnalysis(response) {
    try {
      return JSON.parse(response);
    } catch {
      return {
        predictedConversionRate: 0.2,
        confidence: 0.5,
        keyFactors: [],
        segmentPredictions: {},
        recommendations: []
      };
    }
  }

  fallbackPredictiveAnalysis(currentResults) {
    const currentRate = currentResults.converted / currentResults.sent || 0;

    return {
      predictedConversionRate: Math.max(currentRate, 0.15),
      confidence: 0.6,
      keyFactors: ['datos históricos limitados'],
      segmentPredictions: {},
      recommendations: ['Continuar monitoreando']
    };
  }
}

// =====================================================
// INSTANCIA GLOBAL
// =====================================================

export const campaignService = new CampaignService();

export default campaignService;