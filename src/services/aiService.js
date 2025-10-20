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
  predictive_analytics: 'GROQ.llama-3.1-70b',   // Predicciones complejas
  negotiation_response: 'CHUTES.chutes-dobby'   // Respuestas de negociación
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

  // =====================================================
  // FUNCIONES PARA OBTENER MODELOS DINÁMICOS
  // =====================================================

  // =====================================================
  // FUNCIONES PARA OBTENER MODELOS DINÁMICAMENTE
  // =====================================================

  async getGroqModels(apiKey) {
    if (!apiKey) return [];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // MOSTRAR TODOS LOS MODELOS DISPONIBLES sin filtrar
      return data.data
        .filter(model => model.id) // Solo filtrar modelos sin ID
        .map(model => ({
          value: model.id,
          label: this.formatModelName(model.id),
          id: model.id,
          owned_by: model.owned_by,
          created: model.created,
          object: model.object,
          context_window: model.context_window || null
        }))
        .sort((a, b) => {
          // Ordenar: primero modelos de Groq, luego por nombre
          const aIsGroq = a.owned_by === 'groq';
          const bIsGroq = b.owned_by === 'groq';
          if (aIsGroq && !bIsGroq) return -1;
          if (!aIsGroq && bIsGroq) return 1;
          return a.label.localeCompare(b.label);
        });

    } catch (error) {
      console.error('Error obteniendo modelos de Groq:', error);
      // Retornar TODOS los modelos conocidos de Groq si falla la API
      return [
        { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile', id: 'llama-3.1-70b-versatile', owned_by: 'groq' },
        { value: 'llama-3.1-70b-preview', label: 'Llama 3.1 70B Preview', id: 'llama-3.1-70b-preview', owned_by: 'groq' },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', id: 'llama-3.1-8b-instant', owned_by: 'groq' },
        { value: 'llama-3.1-8b-preview', label: 'Llama 3.1 8B Preview', id: 'llama-3.1-8b-preview', owned_by: 'groq' },
        { value: 'llama-3.2-1b-preview', label: 'Llama 3.2 1B Preview', id: 'llama-3.2-1b-preview', owned_by: 'groq' },
        { value: 'llama-3.2-3b-preview', label: 'Llama 3.2 3B Preview', id: 'llama-3.2-3b-preview', owned_by: 'groq' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32K', id: 'mixtral-8x7b-32768', owned_by: 'groq' },
        { value: 'gemma-7b-it', label: 'Gemma 7B IT', id: 'gemma-7b-it', owned_by: 'google' }
      ];
    }
  }

  async getChutesModels(apiKey) {
    if (!apiKey) return [];

    try {
      // Intentar obtener modelos desde la API de Chutes
      const response = await fetch('https://api.chutes.ai/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Transformar la respuesta a formato compatible con el frontend
        if (data.models && Array.isArray(data.models)) {
          return data.models.map(model => ({
            value: model.id || model.name,
            label: this.formatModelName(model.name || model.id),
            id: model.id || model.name,
            owned_by: model.provider || 'chutes',
            created: model.created_at || Date.now(),
            description: model.description,
            context_window: model.context_window || null
          }));
        }

        // Si la respuesta tiene otro formato, intentar adaptarse
        if (Array.isArray(data)) {
          return data.map(model => ({
            value: model.id || model.name,
            label: this.formatModelName(model.name || model.id),
            id: model.id || model.name,
            owned_by: model.provider || 'chutes',
            created: model.created_at || Date.now(),
            context_window: model.context_window || null
          }));
        }
      }

      console.warn('Respuesta de Chutes API no tiene el formato esperado, usando modelos conocidos');

    } catch (error) {
      console.error('Error obteniendo modelos de Chutes API:', error);
    }

    // Retornar TODOS los modelos conocidos que Chutes podría ofrecer
    // Chutes es un agregador que da acceso a múltiples proveedores
    return [
      // Modelos propios de Chutes
      { value: 'chutes-dobby', label: 'Chutes Dobby', id: 'chutes-dobby', owned_by: 'chutes', description: 'Modelo propio optimizado para contenido creativo' },
      { value: 'chutes-elf', label: 'Chutes Elf', id: 'chutes-elf', owned_by: 'chutes', description: 'Modelo propio para análisis y automatización' },
      { value: 'chutes-goblin', label: 'Chutes Goblin', id: 'chutes-goblin', owned_by: 'chutes', description: 'Modelo optimizado para tareas rápidas' },
      
      // Modelos OpenAI (disponibles vía Chutes)
      { value: 'gpt-4o', label: 'GPT-4o', id: 'gpt-4o', owned_by: 'openai', description: 'Modelo multimodal avanzado' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', id: 'gpt-4o-mini', owned_by: 'openai', description: 'Versión ligera y económica' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', id: 'gpt-4-turbo', owned_by: 'openai', description: 'GPT-4 con mayor velocidad' },
      { value: 'gpt-4', label: 'GPT-4', id: 'gpt-4', owned_by: 'openai', description: 'Modelo flagship de OpenAI' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', id: 'gpt-3.5-turbo', owned_by: 'openai', description: 'Modelo rápido y eficiente' },
      { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K', id: 'gpt-3.5-turbo-16k', owned_by: 'openai', description: 'GPT-3.5 con contexto extendido' },
      
      // Modelos Anthropic (disponibles vía Chutes)
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', id: 'claude-3-5-sonnet-20241022', owned_by: 'anthropic', description: 'Último modelo con capacidades avanzadas' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', id: 'claude-3-5-haiku-20241022', owned_by: 'anthropic', description: 'Modelo rápido y económico' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', id: 'claude-3-opus-20240229', owned_by: 'anthropic', description: 'Modelo más potente de Claude 3' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', id: 'claude-3-sonnet-20240229', owned_by: 'anthropic', description: 'Modelo balanceado de Claude 3' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', id: 'claude-3-haiku-20240307', owned_by: 'anthropic', description: 'Modelo rápido y económico' },
      
      // Modelos Meta (disponibles vía Chutes)
      { value: 'llama-3.1-405b', label: 'Llama 3.1 405B', id: 'llama-3.1-405b', owned_by: 'meta', description: 'Modelo gigante de Meta' },
      { value: 'llama-3.1-70b', label: 'Llama 3.1 70B', id: 'llama-3.1-70b', owned_by: 'meta', description: 'Modelo grande de Meta' },
      { value: 'llama-3.1-8b', label: 'Llama 3.1 8B', id: 'llama-3.1-8b', owned_by: 'meta', description: 'Modelo eficiente de Meta' },
      { value: 'llama-3-70b', label: 'Llama 3 70B', id: 'llama-3-70b', owned_by: 'meta', description: 'Llama 3 con 70B parámetros' },
      { value: 'llama-3-8b', label: 'Llama 3 8B', id: 'llama-3-8b', owned_by: 'meta', description: 'Llama 3 con 8B parámetros' },
      
      // Modelos Google (disponibles vía Chutes)
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', id: 'gemini-1.5-pro', owned_by: 'google', description: 'Modelo avanzado de Google' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', id: 'gemini-1.5-flash', owned_by: 'google', description: 'Modelo rápido de Google' },
      { value: 'gemini-pro', label: 'Gemini Pro', id: 'gemini-pro', owned_by: 'google', description: 'Modelo Pro de Google' },
      { value: 'gemma-7b-it', label: 'Gemma 7B IT', id: 'gemma-7b-it', owned_by: 'google', description: 'Modelo optimizado para instrucciones' },
      { value: 'gemma-2b-it', label: 'Gemma 2B IT', id: 'gemma-2b-it', owned_by: 'google', description: 'Modelo ligero de Gemma' },
      
      // Modelos Mistral (disponibles vía Chutes)
      { value: 'mixtral-8x7b', label: 'Mixtral 8x7B', id: 'mixtral-8x7b', owned_by: 'mistral', description: 'Modelo de mezcla de expertos' },
      { value: 'mistral-7b', label: 'Mistral 7B', id: 'mistral-7b', owned_by: 'mistral', description: 'Modelo base de Mistral' },
      { value: 'mistral-large', label: 'Mistral Large', id: 'mistral-large', owned_by: 'mistral', description: 'Modelo grande de Mistral' },
      { value: 'mistral-medium', label: 'Mistral Medium', id: 'mistral-medium', owned_by: 'mistral', description: 'Modelo mediano de Mistral' },
      { value: 'mistral-small', label: 'Mistral Small', id: 'mistral-small', owned_by: 'mistral', description: 'Modelo pequeño de Mistral' },
      
      // Modelos Cohere (disponibles vía Chutes)
      { value: 'command-r-plus', label: 'Command R+', id: 'command-r-plus', owned_by: 'cohere', description: 'Modelo avanzado de Cohere' },
      { value: 'command-r', label: 'Command R', id: 'command-r', owned_by: 'cohere', description: 'Modelo de Cohere' },
      { value: 'command', label: 'Command', id: 'command', owned_by: 'cohere', description: 'Modelo base de Cohere' }
    ].sort((a, b) => {
      // Ordenar por proveedor luego por nombre
      const providerOrder = ['chutes', 'openai', 'anthropic', 'meta', 'google', 'mistral', 'cohere'];
      const aProviderIndex = providerOrder.indexOf(a.owned_by);
      const bProviderIndex = providerOrder.indexOf(b.owned_by);
      
      if (aProviderIndex !== bProviderIndex) {
        return aProviderIndex - bProviderIndex;
      }
      
      return a.label.localeCompare(b.label);
    });
  }

  // =====================================================
  // FUNCIONES PARA OBTENER MODELOS DE EMBEDDING
  // =====================================================

  async getGroqEmbeddingModels(apiKey) {
    if (!apiKey) return [];

    try {
      // Groq no tiene modelos de embedding propios, pero ofrece acceso a modelos de OpenAI
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Filtrar SOLO modelos de embedding (Groq principalmente ofrece OpenAI embeddings)
      const embeddingModels = data.data
        .filter(model =>
          model.id && (
            model.id.includes('embedding') ||
            model.id.includes('embed') ||
            model.object === 'embedding'
          )
        )
        .map(model => ({
          value: model.id,
          label: `${this.formatModelName(model.id)} (via Groq)`,
          id: model.id,
          owned_by: model.owned_by || 'openai',
          created: model.created,
          object: model.object,
          context_window: model.context_window || null,
          provider: 'groq'
        }));

      // Si no se encuentran modelos de embedding, retornar los conocidos
      if (embeddingModels.length === 0) {
        return [
          { value: 'text-embedding-ada-002', label: 'Text Embedding Ada 002 (via Groq)', id: 'text-embedding-ada-002', owned_by: 'openai', provider: 'groq' },
          { value: 'text-embedding-3-small', label: 'Text Embedding 3 Small (via Groq)', id: 'text-embedding-3-small', owned_by: 'openai', provider: 'groq' },
          { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large (via Groq)', id: 'text-embedding-3-large', owned_by: 'openai', provider: 'groq' }
        ];
      }

      return embeddingModels.sort((a, b) => a.label.localeCompare(b.label));

    } catch (error) {
      console.error('Error obteniendo modelos de embedding de Groq:', error);
      // Retornar modelos de embedding conocidos de Groq
      return [
        { value: 'text-embedding-ada-002', label: 'Text Embedding Ada 002 (via Groq)', id: 'text-embedding-ada-002', owned_by: 'openai', provider: 'groq' },
        { value: 'text-embedding-3-small', label: 'Text Embedding 3 Small (via Groq)', id: 'text-embedding-3-small', owned_by: 'openai', provider: 'groq' },
        { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large (via Groq)', id: 'text-embedding-3-large', owned_by: 'openai', provider: 'groq' }
      ];
    }
  }

  async getChutesEmbeddingModels(apiKey) {
    if (!apiKey) return [];

    try {
      // Chutes es un agregador - intentar obtener modelos desde su API
      const response = await fetch('https://api.chutes.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Transformar la respuesta y filtrar SOLO modelos de embedding
        let models = [];
        if (data.models && Array.isArray(data.models)) {
          models = data.models;
        } else if (Array.isArray(data)) {
          models = data;
        }

        const embeddingModels = models
          .filter(model =>
            (model.id || model.name) && (
              (model.id || model.name).includes('embedding') ||
              (model.id || model.name).includes('embed') ||
              model.object === 'embedding' ||
              model.type === 'embedding' ||
              model.capabilities?.includes('embedding')
            )
          )
          .map(model => ({
            value: model.id || model.name,
            label: `${this.formatModelName(model.name || model.id)} (via Chutes)`,
            id: model.id || model.name,
            owned_by: model.provider || 'chutes',
            created: model.created_at || Date.now(),
            description: model.description,
            context_window: model.context_window || null,
            provider: 'chutes'
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        if (embeddingModels.length > 0) {
          return embeddingModels;
        }
      }

      console.warn('Respuesta de Chutes API no tiene modelos de embedding, usando catálogo conocido');

    } catch (error) {
      console.error('Error obteniendo modelos de embedding de Chutes API:', error);
    }

    // Retornar modelos de embedding conocidos que Chutes ofrece (diferentes a Groq)
    return [
      // Modelos OpenAI (disponibles vía Chutes)
      { value: 'text-embedding-ada-002', label: 'Text Embedding Ada 002 (via Chutes)', id: 'text-embedding-ada-002', owned_by: 'openai', description: 'Modelo estándar de OpenAI vía Chutes', provider: 'chutes' },
      { value: 'text-embedding-3-small', label: 'Text Embedding 3 Small (via Chutes)', id: 'text-embedding-3-small', owned_by: 'openai', description: 'Modelo pequeño y eficiente vía Chutes', provider: 'chutes' },
      { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large (via Chutes)', id: 'text-embedding-3-large', owned_by: 'openai', description: 'Modelo grande y preciso vía Chutes', provider: 'chutes' },
      
      // Modelos Cohere (disponibles vía Chutes - NO disponibles en Groq)
      { value: 'embed-english-v3.0', label: 'Embed English v3.0 (via Chutes)', id: 'embed-english-v3.0', owned_by: 'cohere', description: 'Modelo de embedding para inglés vía Chutes', provider: 'chutes' },
      { value: 'embed-multilingual-v3.0', label: 'Embed Multilingual v3.0 (via Chutes)', id: 'embed-multilingual-v3.0', owned_by: 'cohere', description: 'Modelo multilingüe vía Chutes', provider: 'chutes' },
      { value: 'embed-english-light-v3.0', label: 'Embed English Light v3.0 (via Chutes)', id: 'embed-english-light-v3.0', owned_by: 'cohere', description: 'Modelo ligero para inglés vía Chutes', provider: 'chutes' },
      
      // Modelos Google (disponibles vía Chutes - NO disponibles en Groq)
      { value: 'text-embedding-004', label: 'Text Embedding 004 (via Chutes)', id: 'text-embedding-004', owned_by: 'google', description: 'Modelo de Google vía Chutes', provider: 'chutes' },
      
      // Modelos propios de Chutes (NO disponibles en Groq)
      { value: 'chutes-embed-v1', label: 'Chutes Embed v1', id: 'chutes-embed-v1', owned_by: 'chutes', description: 'Modelo propio de Chutes', provider: 'chutes' },
      { value: 'chutes-embed-multilingual', label: 'Chutes Embed Multilingual', id: 'chutes-embed-multilingual', owned_by: 'chutes', description: 'Modelo multilingüe de Chutes', provider: 'chutes' }
    ].sort((a, b) => {
      // Ordenar por proveedor luego por nombre
      const providerOrder = ['chutes', 'cohere', 'google', 'openai'];
      const aProviderIndex = providerOrder.indexOf(a.owned_by);
      const bProviderIndex = providerOrder.indexOf(b.owned_by);
      
      if (aProviderIndex !== bProviderIndex) {
        return aProviderIndex - bProviderIndex;
      }
      
      return a.label.localeCompare(b.label);
    });
  }

  formatModelName(modelId) {
    // Formatear nombres de modelos para mejor legibilidad
    const nameMap = {
      // Groq Models
      'llama-3.1-70b-versatile': 'Llama 3.1 70B Versatile',
      'llama-3.1-70b-preview': 'Llama 3.1 70B Preview',
      'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
      'llama-3.1-8b-preview': 'Llama 3.1 8B Preview',
      'llama-3.2-1b-preview': 'Llama 3.2 1B Preview',
      'llama-3.2-3b-preview': 'Llama 3.2 3B Preview',
      'mixtral-8x7b-32768': 'Mixtral 8x7B 32K',
      'gemma-7b-it': 'Gemma 7B IT',
      
      // Chutes Models
      'chutes-dobby': 'Chutes Dobby',
      'chutes-elf': 'Chutes Elf',
      'chutes-goblin': 'Chutes Goblin',
      'chutes-embed-v1': 'Chutes Embed v1',
      'chutes-embed-multilingual': 'Chutes Embed Multilingual',
      
      // OpenAI Models
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
      
      // OpenAI Embedding Models
      'text-embedding-ada-002': 'Text Embedding Ada 002',
      'text-embedding-3-small': 'Text Embedding 3 Small',
      'text-embedding-3-large': 'Text Embedding 3 Large',
      
      // Anthropic Models
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      
      // Meta Models
      'llama-3.1-405b': 'Llama 3.1 405B',
      'llama-3.1-70b': 'Llama 3.1 70B',
      'llama-3.1-8b': 'Llama 3.1 8B',
      'llama-3-70b': 'Llama 3 70B',
      'llama-3-8b': 'Llama 3 8B',
      
      // Google Models
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-pro': 'Gemini Pro',
      'gemma-2b-it': 'Gemma 2B IT',
      'text-embedding-004': 'Text Embedding 004',
      
      // Mistral Models
      'mistral-large': 'Mistral Large',
      'mistral-medium': 'Mistral Medium',
      'mistral-small': 'Mistral Small',
      
      // Cohere Models
      'command-r-plus': 'Command R+',
      'command-r': 'Command R',
      'command': 'Command',
      'embed-english-v3.0': 'Embed English v3.0',
      'embed-multilingual-v3.0': 'Embed Multilingual v3.0',
      'embed-english-light-v3.0': 'Embed English Light v3.0'
    };

    // Si tenemos un mapeo exacto, usarlo
    if (nameMap[modelId]) {
      return nameMap[modelId];
    }

    // Formateo automático para modelos no mapeados
    return modelId
      .split(/[-_]/)
      .map(word => {
        // Manejar casos especiales
        if (word.toLowerCase() === 'ai') return 'AI';
        if (word.toLowerCase() === 'gpt') return 'GPT';
        if (word.toLowerCase() === 'it') return 'IT';
        if (/^\d+b$/.test(word)) return word.toUpperCase(); // 70b -> 70B
        if (/^\d+$/.test(word)) return word; // números保持原样
        
        // Capitalizar primera letra
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
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

// Exportar funciones para obtener modelos de embedding
export const getGroqEmbeddingModels = (apiKey) => aiService.getGroqEmbeddingModels(apiKey);
export const getChutesEmbeddingModels = (apiKey) => aiService.getChutesEmbeddingModels(apiKey);

export default aiService;