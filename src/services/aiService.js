/**
 * 2. INTELIGENCIA ARTIFICIAL - AI Service Manager
 *
 * APIs Autorizadas (Solo estas 2):
 * ✅ Groq: Análisis complejo, segmentación, predicción
 * ✅ Chutes: Contenido engaging, optimización, personalización
 *
 * Funciones de IA:
 * ✅ Segmentación automática de deudores
 * ✅ Personalización de ofertas por perfil
 * ✅ Optimización de campañas en tiempo real
 * ✅ Generación de contenido persuasivo
 * ✅ Análisis predictivo de conversión
 *
 * Maneja las integraciones con Groq y Chutes
 * para segmentación, personalización y optimización de campañas
 */

import { supabase } from '../config/supabase';

// =====================================================
// CONFIGURACIÓN DE PROVEEDORES
// =====================================================

const AI_PROVIDERS = {
  GROQ: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: {
      'llama-3.1-70b': {
        name: 'Llama 3.1 70B',
        contextWindow: 128000,
        costPerToken: 0.000001, // $0.001 por 1000 tokens
        capabilities: ['text_generation', 'analysis', 'segmentation']
      },
      'llama-3.1-8b': {
        name: 'Llama 3.1 8B',
        contextWindow: 128000,
        costPerToken: 0.0000005,
        capabilities: ['fast_text', 'classification']
      },
      'mixtral-8x7b': {
        name: 'Mixtral 8x7B',
        contextWindow: 32768,
        costPerToken: 0.0000007,
        capabilities: ['analysis', 'reasoning']
      }
    }
  },


  CHUTES: {
    name: 'Chutes',
    baseUrl: 'https://api.chutes.ai/v1',
    models: {
      'chutes-dobby': {
        name: 'Chutes Dobby',
        contextWindow: 32000,
        costPerToken: 0.0000008,
        capabilities: ['creative_content', 'personalization', 'engagement']
      },
      'chutes-elf': {
        name: 'Chutes Elf',
        contextWindow: 64000,
        costPerToken: 0.000001,
        capabilities: ['analysis', 'optimization', 'automation']
      }
    }
  }
};

// =====================================================
// ASIGNACIÓN DE TAREAS A MODELOS
// =====================================================

const TASK_MODEL_MAPPING = {
  debtor_segmentation: 'GROQ.llama-3.1-70b',     // Análisis complejo
  offer_personalization: 'CHUTES.chutes-dobby', // Creatividad
  risk_assessment: 'GROQ.mixtral-8x7b',          // Análisis lógico
  message_generation: 'CHUTES.chutes-dobby',     // Contenido engaging
  campaign_optimization: 'GROQ.llama-3.1-70b', // Estrategia
  predictive_analytics: 'GROQ.llama-3.1-70b'    // Predicciones complejas
};

// =====================================================
// CLASE PRINCIPAL DEL SERVICIO
// =====================================================

export class AIServiceManager {
  constructor() {
    this.providers = {};
    this.currentProvider = null;
    this.fallbackOrder = ['GROQ', 'CHUTES'];
    this.usageStats = {
      totalTokens: 0,
      totalCost: 0,
      requestsCount: 0,
      errorsCount: 0
    };
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  async initializeProviders() {
    console.log('🤖 Inicializando proveedores de IA...');

    try {
      const apiKeys = await this.loadAPIKeys();

      for (const [providerName, config] of Object.entries(AI_PROVIDERS)) {
        if (apiKeys[providerName]) {
          this.providers[providerName] = new AIProvider(
            providerName,
            config,
            apiKeys[providerName]
          );
          console.log(`✅ ${providerName} inicializado`);
        } else {
          console.warn(`⚠️ ${providerName} no configurado (API key faltante)`);
        }
      }

      console.log('🎯 Proveedores de IA listos');
    } catch (error) {
      console.error('❌ Error inicializando proveedores de IA:', error);
      throw error;
    }
  }

  // =====================================================
  // EJECUCIÓN DE TAREAS
  // =====================================================

  async executeTask(taskType, data, options = {}) {
    const startTime = Date.now();
    const modelKey = TASK_MODEL_MAPPING[taskType];

    if (!modelKey) {
      throw new Error(`Tipo de tarea no reconocido: ${taskType}`);
    }

    const [providerName, modelName] = modelKey.split('.');

    console.log(`🚀 Ejecutando tarea ${taskType} con ${providerName}.${modelName}`);

    try {
      // Intentar con proveedor principal
      const result = await this.providers[providerName].execute(modelName, data, options);

      // Registrar uso exitoso
      await this.logUsage({
        provider: providerName,
        model: modelName,
        taskType,
        tokensUsed: result.tokensUsed || 0,
        cost: result.cost || 0,
        responseTime: Date.now() - startTime,
        success: true,
        campaignId: options.campaignId
      });

      this.updateStats(result.tokensUsed || 0, result.cost || 0, true);

      return result;

    } catch (error) {
      console.warn(`❌ Error con ${providerName}, intentando fallback...`);

      // Intentar con proveedores de fallback
      for (const fallbackProvider of this.fallbackOrder) {
        if (fallbackProvider !== providerName && this.providers[fallbackProvider]) {
          try {
            console.log(`🔄 Intentando fallback con ${fallbackProvider}`);
            const result = await this.providers[fallbackProvider].executeFallback(modelName, data, options);

            // Registrar uso exitoso del fallback
            await this.logUsage({
              provider: fallbackProvider,
              model: modelName,
              taskType,
              tokensUsed: result.tokensUsed || 0,
              cost: result.cost || 0,
              responseTime: Date.now() - startTime,
              success: true,
              campaignId: options.campaignId
            });

            this.updateStats(result.tokensUsed || 0, result.cost || 0, true);
            return result;

          } catch (fallbackError) {
            console.warn(`❌ Fallback ${fallbackProvider} también falló`);
          }
        }
      }

      // Registrar error final
      await this.logUsage({
        provider: providerName,
        model: modelName,
        taskType,
        tokensUsed: 0,
        cost: 0,
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: error.message,
        campaignId: options.campaignId
      });

      this.updateStats(0, 0, false);

      throw new Error(`Todos los proveedores de IA fallaron para tarea ${taskType}: ${error.message}`);
    }
  }

  // =====================================================
  // FUNCIONES DE SEGMENTACIÓN
  // =====================================================

  async segmentDebtors(debtors, criteria = {}) {
    console.log(`🎯 Segmentando ${debtors.length} deudores`);

    const segmentationPrompt = this.buildSegmentationPrompt(debtors, criteria);

    const result = await this.executeTask('debtor_segmentation', {
      prompt: segmentationPrompt,
      debtors: debtors.slice(0, 50) // Limitar para evitar tokens excesivos
    });

    return this.parseSegmentationResult(result.response, debtors);
  }

  async personalizeOffer(debtor, baseOffer, campaignContext = {}) {
    console.log(`🎨 Personalizando oferta para deudor ${debtor.id}`);

    const personalizationPrompt = this.buildPersonalizationPrompt(debtor, baseOffer, campaignContext);

    const result = await this.executeTask('offer_personalization', {
      prompt: personalizationPrompt,
      debtor,
      baseOffer
    });

    return this.parsePersonalizationResult(result.response, baseOffer);
  }

  async optimizeCampaign(campaignData, currentResults) {
    console.log(`📈 Optimizando campaña ${campaignData.id}`);

    const optimizationPrompt = this.buildOptimizationPrompt(campaignData, currentResults);

    const result = await this.executeTask('campaign_optimization', {
      prompt: optimizationPrompt,
      campaignData,
      currentResults
    }, { campaignId: campaignData.id });

    return this.parseOptimizationResult(result.response);
  }

  // =====================================================
  // CONSTRUCCIÓN DE PROMPTS
  // =====================================================

  buildSegmentationPrompt(debtors, criteria) {
    return `
Eres un experto en análisis de riesgo crediticio y segmentación de clientes.

Analiza los siguientes perfiles de deudores y clasifícalos en segmentos basándote en:
- Riesgo de pago (bajo, medio, alto)
- Comportamiento de pago histórico
- Características demográficas
- Monto y antigüedad de deuda

Deudores a analizar:
${JSON.stringify(debtors.map(d => ({
  id: d.id,
  riskLevel: d.riskLevel,
  paymentHistory: d.paymentHistory,
  demographics: d.demographics,
  debtAmount: d.totalDebt,
  debtAge: d.debtAge
})), null, 2)}

Criterios adicionales: ${JSON.stringify(criteria)}

Devuelve un JSON con la siguiente estructura:
{
  "segments": {
    "low_risk": { "debtors": ["id1", "id2"], "criteria": "explicación" },
    "medium_risk": { "debtors": ["id3"], "criteria": "explicación" },
    "high_risk": { "debtors": [], "criteria": "explicación" },
    "young_professionals": { "debtors": [...], "criteria": "explicación" },
    "families": { "debtors": [...], "criteria": "explicación" }
  },
  "insights": ["insight 1", "insight 2"]
}
`;
  }

  buildPersonalizationPrompt(debtor, baseOffer, campaignContext) {
    return `
Eres un experto en marketing personalizado para cobranza.

Personaliza la siguiente oferta base para este deudor específico, considerando su perfil y comportamiento.

Perfil del deudor:
${JSON.stringify({
  riskLevel: debtor.riskLevel,
  demographics: debtor.demographics,
  paymentHistory: debtor.paymentHistory,
  totalDebt: debtor.totalDebt,
  debtAge: debtor.debtAge
}, null, 2)}

Oferta base:
${JSON.stringify(baseOffer, null, 2)}

Contexto de campaña:
${JSON.stringify(campaignContext, null, 2)}

Devuelve un JSON con la oferta personalizada:
{
  "personalizedOffer": {
    "discountPercentage": 20,
    "paymentPlan": "monthly_6",
    "validityDays": 15,
    "specialConditions": "Pago puntual = descuento adicional",
    "messaging": {
      "subject": "Oferta personalizada para ti",
      "content": "Contenido personalizado...",
      "urgencyLevel": "medium"
    }
  },
  "reasoning": "Explicación de por qué esta personalización",
  "expectedConversion": 0.25
}
`;
  }

  buildOptimizationPrompt(campaignData, currentResults) {
    return `
Eres un experto en optimización de campañas de marketing.

Analiza los resultados actuales de esta campaña y proporciona recomendaciones para mejorar la conversión.

Datos de campaña:
${JSON.stringify(campaignData, null, 2)}

Resultados actuales:
${JSON.stringify(currentResults, null, 2)}

Devuelve un JSON con recomendaciones:
{
  "recommendations": [
    {
      "type": "discount_adjustment",
      "action": "Aumentar descuento a 18%",
      "reasoning": "Los deudores responden mejor a descuentos más altos",
      "expectedImpact": 0.15
    }
  ],
  "priorityActions": ["acción 1", "acción 2"],
  "predictedImprovement": 0.25
}
`;
  }

  // =====================================================
  // PARSING DE RESULTADOS
  // =====================================================

  parseSegmentationResult(response, debtors) {
    try {
      const parsed = JSON.parse(response);
      const segments = {};

      // Validar estructura
      if (!parsed.segments) {
        throw new Error('Respuesta no contiene segmentos');
      }

      // Convertir IDs de string a objetos de deudor
      Object.keys(parsed.segments).forEach(segmentName => {
        const segment = parsed.segments[segmentName];
        segments[segmentName] = {
          debtors: segment.debtors.map(debtorId =>
            debtors.find(d => d.id === debtorId)
          ).filter(Boolean),
          criteria: segment.criteria,
          count: segment.debtors.length
        };
      });

      return {
        segments,
        insights: parsed.insights || [],
        totalSegmented: Object.values(segments).reduce((sum, seg) => sum + seg.count, 0)
      };

    } catch (error) {
      console.error('Error parseando resultado de segmentación:', error);
      // Retornar segmentación básica por defecto
      return this.fallbackSegmentation(debtors);
    }
  }

  parsePersonalizationResult(response, baseOffer) {
    try {
      const parsed = JSON.parse(response);
      return {
        ...baseOffer,
        ...parsed.personalizedOffer,
        aiPersonalization: {
          reasoning: parsed.reasoning,
          expectedConversion: parsed.expectedConversion,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error parseando resultado de personalización:', error);
      return baseOffer; // Retornar oferta base si falla
    }
  }

  parseOptimizationResult(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        recommendations: parsed.recommendations || [],
        priorityActions: parsed.priorityActions || [],
        predictedImprovement: parsed.predictedImprovement || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parseando resultado de optimización:', error);
      return {
        recommendations: [],
        priorityActions: [],
        predictedImprovement: 0
      };
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  fallbackSegmentation(debtors) {
    // Segmentación básica por defecto si la IA falla
    const segments = {
      low_risk: { debtors: [], criteria: 'Riesgo bajo automático', count: 0 },
      medium_risk: { debtors: [], criteria: 'Riesgo medio automático', count: 0 },
      high_risk: { debtors: [], criteria: 'Riesgo alto automático', count: 0 }
    };

    debtors.forEach(debtor => {
      if (debtor.riskLevel === 'low') {
        segments.low_risk.debtors.push(debtor);
        segments.low_risk.count++;
      } else if (debtor.riskLevel === 'high') {
        segments.high_risk.debtors.push(debtor);
        segments.high_risk.count++;
      } else {
        segments.medium_risk.debtors.push(debtor);
        segments.medium_risk.count++;
      }
    });

    return {
      segments,
      insights: ['Segmentación básica aplicada por fallback'],
      totalSegmented: debtors.length
    };
  }

  async loadAPIKeys() {
    // En producción, cargar desde variables de entorno encriptadas
    return {
      GROQ: import.meta.env.VITE_GROQ_API_KEY,
      CHUTES: import.meta.env.VITE_CHUTES_API_KEY
    };
  }

  async logUsage(logData) {
    try {
      await supabase.from('ai_usage_logs').insert(logData);
    } catch (error) {
      console.error('Error registrando uso de IA:', error);
    }
  }

  updateStats(tokens, cost, success) {
    this.usageStats.totalTokens += tokens;
    this.usageStats.totalCost += cost;
    this.usageStats.requestsCount++;

    if (!success) {
      this.usageStats.errorsCount++;
    }
  }

  getUsageStats() {
    return { ...this.usageStats };
  }

  getAvailableProviders() {
    return Object.keys(this.providers).filter(provider => this.providers[provider]);
  }
}

// =====================================================
// CLASE PARA MANEJAR PROVEEDORES INDIVIDUALES
// =====================================================

class AIProvider {
  constructor(name, config, apiKey) {
    this.name = name;
    this.config = config;
    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl;
  }

  async execute(modelName, data, options = {}) {
    const model = this.config.models[modelName];
    if (!model) {
      throw new Error(`Modelo ${modelName} no disponible en ${this.name}`);
    }

    const startTime = Date.now();

    try {
      const response = await this.makeAPIRequest(modelName, data, options);
      const tokensUsed = this.estimateTokens(data, response);

      return {
        response,
        tokensUsed,
        cost: tokensUsed * model.costPerToken,
        responseTime: Date.now() - startTime,
        provider: this.name,
        model: modelName
      };

    } catch (error) {
      throw new Error(`${this.name} API Error: ${error.message}`);
    }
  }

  async executeFallback(modelName, data, options = {}) {
    // Lógica de fallback - usar modelo equivalente si está disponible
    const fallbackModel = this.findFallbackModel(modelName);
    if (fallbackModel) {
      console.log(`🔄 Usando modelo fallback ${fallbackModel} en ${this.name}`);
      return this.execute(fallbackModel, data, options);
    }

    throw new Error(`No hay modelo fallback disponible en ${this.name}`);
  }

  findFallbackModel(originalModel) {
    // Lógica para encontrar modelo equivalente
    const fallbacks = {
      'llama-3.1-70b': 'llama-3.1-8b',
      'anthropic/claude-3-sonnet': 'anthropic/claude-3-haiku',
      'chutes-elf': 'chutes-dobby'
    };

    return fallbacks[originalModel] || null;
  }

  async makeAPIRequest(modelName, data, options) {
    const url = `${this.baseUrl}/chat/completions`;

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: data.prompt || JSON.stringify(data)
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }

  estimateTokens(input, output) {
    // Estimación básica de tokens (4 caracteres ≈ 1 token)
    const inputTokens = Math.ceil(JSON.stringify(input).length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    return inputTokens + outputTokens;
  }
}

// =====================================================
// INSTANCIA GLOBAL
// =====================================================

export const aiService = new AIServiceManager();

// =====================================================
// FUNCIONES DE IA - CONVENIENCIA
// =====================================================

/**
 * SEGMENTACIÓN AUTOMÁTICA DE DEUDORES
 * ✅ Análisis complejo con Groq
 */
export const segmentDebtors = (debtors, criteria) => aiService.segmentDebtors(debtors, criteria);

/**
 * PERSONALIZACIÓN DE OFERTAS POR PERFIL
 * ✅ Estrategia creativa con Chutes
 */
export const personalizeOffer = (debtor, baseOffer, context) => aiService.personalizeOffer(debtor, baseOffer, context);

/**
 * OPTIMIZACIÓN DE CAMPAÑAS EN TIEMPO REAL
 * ✅ Estrategia avanzada con Groq
 */
export const optimizeCampaign = (campaignData, results) => aiService.optimizeCampaign(campaignData, results);

/**
 * GENERACIÓN DE CONTENIDO PERSUASIVO
 * ✅ Contenido engaging con Chutes
 */
export const generatePersuasiveContent = async (debtor, offer) => {
  const contentPrompt = `
Eres un experto en copywriting persuasivo para cobranza.

Crea contenido altamente persuasivo y engaging para convencer a este deudor de aceptar la oferta.

Perfil del deudor:
${JSON.stringify({
  riskLevel: debtor.riskLevel,
  demographics: debtor.demographics,
  paymentHistory: debtor.paymentHistory?.slice(-3)
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

  const result = await aiService.executeTask('message_generation', {
    prompt: contentPrompt,
    debtor,
    offer
  });

  return result.response;
};

/**
 * ANÁLISIS PREDICTIVO DE CONVERSIÓN
 * ✅ Predicciones complejas con Groq
 */
export const predictiveConversionAnalysis = async (campaign, currentResults) => {
  const analysisPrompt = `
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

Devuelve en formato JSON con predictedConversionRate, confidence, keyFactors, segmentPredictions, recommendations.
`;

  const result = await aiService.executeTask('predictive_analytics', {
    prompt: analysisPrompt,
    campaign,
    currentResults
  });

  try {
    return JSON.parse(result.response);
  } catch {
    return {
      predictedConversionRate: 0.2,
      confidence: 0.5,
      keyFactors: [],
      segmentPredictions: {},
      recommendations: []
    };
  }
};

export default aiService;