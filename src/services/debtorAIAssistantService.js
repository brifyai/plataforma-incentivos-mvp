/**
 * Debtor AI Assistant Service
 * 
 * Servicio de IA personalizado para asistentes financieros inteligentes
 * con chatbot, análisis predictivo, negociación y educación financiera
 */

import { realTimeAnalyticsService } from './realTimeAnalyticsService';

class DebtorAIAssistantService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutos
    this.listeners = new Set();
    this.conversationHistory = new Map();
  }

  // Obtener perfil financiero para análisis IA
  async getFinancialProfile(userId) {
    const cacheKey = `financial_profile_${userId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Simular perfil financiero completo para IA
      const profile = {
        userId,
        financialHealth: {
          score: 72,
          level: 'moderate',
          factors: {
            paymentHistory: 85,
            debtToIncome: 0.45,
            creditUtilization: 0.65,
            savingsRate: 0.08,
            investmentDiversification: 0.3
          },
          trends: {
            paymentConsistency: 'improving',
            debtReduction: 'stable',
            savingsGrowth: 'increasing'
          }
        },
        behaviorPatterns: {
          paymentFrequency: 'monthly',
          preferredPaymentMethod: 'bank_transfer',
          averagePaymentTiming: 3, // días antes del vencimiento
          seasonalFactors: {
            bonusMonths: [6, 12], // Junio y Diciembre
            lowCashFlowMonths: [1, 2, 8]
          },
          riskTolerance: 'moderate',
          financialLiteracy: 'intermediate'
        },
        debtAnalysis: {
          totalDebt: 2500000,
          debtComposition: {
            creditCards: 0.4,
            personalLoans: 0.3,
            mortgage: 0.2,
            other: 0.1
          },
          interestRates: {
            average: 28.5,
            highest: 45.0,
            lowest: 12.0
          },
          debtAge: {
            oldest: 24, // meses
            average: 18,
            newest: 6
          }
        },
        negotiationOpportunities: [
          {
            debtId: 'debt_1',
            creditor: 'Banco ABC',
            currentRate: 35.0,
            potentialReduction: 0.25,
            bestNegotiationTime: 'within_2_weeks',
            strategy: 'settlement_offer',
            confidence: 0.85
          },
          {
            debtId: 'debt_2',
            creditor: 'Financiera XYZ',
            currentRate: 28.0,
            potentialReduction: 0.15,
            bestNegotiationTime: 'end_of_month',
            strategy: 'interest_reduction',
            confidence: 0.70
          }
        ],
        personalizedRecommendations: {
          paymentStrategy: 'avalanche_method', // pagar deudas más altas primero
          monthlySavingsTarget: 150000,
          emergencyFundTarget: 600000,
          investmentSuggestions: [
            { type: 'conservative_bonds', allocation: 0.4 },
            { type: 'balanced_fund', allocation: 0.3 },
            { type: 'index_fund', allocation: 0.3 }
          ]
        }
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: profile,
        timestamp: Date.now()
      });

      return profile;
    } catch (error) {
      console.error('Error getting financial profile:', error);
      throw error;
    }
  }

  // Chatbot financiero inteligente
  async processMessage(userId, message, context = {}) {
    try {
      const conversationKey = `conversation_${userId}`;
      const history = this.conversationHistory.get(conversationKey) || [];
      
      // Obtener perfil financiero para contexto
      const financialProfile = await this.getFinancialProfile(userId);
      
      // Analizar intención del mensaje
      const intent = await this.analyzeIntent(message, context);
      
      // Generar respuesta basada en intención y perfil
      const response = await this.generateResponse(intent, financialProfile, history, message);
      
      // Actualizar historial de conversación
      const newHistory = [
        ...history.slice(-10), // Mantener últimas 10 interacciones
        { role: 'user', message, timestamp: new Date(), intent },
        { role: 'assistant', message: response, timestamp: new Date() }
      ];
      
      this.conversationHistory.set(conversationKey, newHistory);
      
      return {
        response,
        intent,
        suggestions: await this.generateSuggestions(intent, financialProfile),
        followUpActions: await this.generateFollowUpActions(intent, financialProfile)
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  // Analizar intención del mensaje
  async analyzeIntent(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Patrones de intención
    const intents = {
      debt_advice: {
        keywords: ['deuda', 'pagar', 'reducir', 'negociar', 'acuerdo'],
        patterns: ['cómo pago', 'qué hago con', 'mejor forma de'],
        confidence: 0
      },
      financial_education: {
        keywords: ['aprender', 'educación', 'finanzas', 'invertir', 'ahorrar'],
        patterns: ['enseñame sobre', 'qué es', 'cómo funciona'],
        confidence: 0
      },
      negotiation_help: {
        keywords: ['negociar', 'hablar', 'acuerdo', 'descuento', 'reducir tasa'],
        patterns: ['puedo negociar', 'cómo negociar', 'mejor momento para'],
        confidence: 0
      },
      payment_strategy: {
        keywords: ['estrategia', 'plan', 'método', 'orden', 'prioridad'],
        patterns: ['qué método', 'cuál estrategia', 'mejor orden'],
        confidence: 0
      },
      budget_planning: {
        keywords: ['presupuesto', 'gastos', 'ingresos', 'planificar', 'controlar'],
        patterns: ['cómo hacer presupuesto', 'planificar gastos'],
        confidence: 0
      },
      credit_improvement: {
        keywords: ['crédito', 'score', 'mejorar', 'historial', 'buró'],
        patterns: ['subir score', 'mejorar crédito', 'limpiar historial'],
        confidence: 0
      }
    };

    // Calcular confianza para cada intención
    Object.keys(intents).forEach(intentKey => {
      const intent = intents[intentKey];
      let matches = 0;
      
      // Contar keywords
      intent.keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) matches++;
      });
      
      // Contar patrones
      intent.patterns.forEach(pattern => {
        if (lowerMessage.includes(pattern)) matches += 2;
      });
      
      intent.confidence = matches / (intent.keywords.length + intent.patterns.length * 2);
    });

    // Encontrar la intención con mayor confianza
    const bestIntent = Object.keys(intents).reduce((best, current) => 
      intents[current].confidence > intents[best].confidence ? current : best
    );

    return {
      type: bestIntent,
      confidence: intents[bestIntent].confidence,
      entities: this.extractEntities(message)
    };
  }

  // Extraer entidades del mensaje
  extractEntities(message) {
    const entities = {
      amounts: [],
      dates: [],
      creditors: [],
      timeframes: []
    };

    // Extraer montos (números seguidos de palabras de dinero)
    const amountPattern = /\$?(\d+(?:\.\d+)?)(?:\s*(?:mil|millón|pesos|clp|dollars?))?/gi;
    const amountMatches = message.match(amountPattern);
    if (amountMatches) {
      entities.amounts = amountMatches.map(match => {
        const number = parseFloat(match.replace(/[^0-9.]/g, ''));
        return { value: number, original: match };
      });
    }

    // Extraer fechas
    const datePattern = /\b(?:hoy|mañana|pasado|próximo|último)\s+(?:mes|semana|año|día)\b/gi;
    entities.dates = message.match(datePattern) || [];

    // Extraer plazos
    const timeframePattern = /\b(?:en\s*\d+\s*(?:días|meses|años)|\d+\s*(?:días|meses|años)\s*(?:más|menos)?)\b/gi;
    entities.timeframes = message.match(timeframePattern) || [];

    return entities;
  }

  // Generar respuesta inteligente
  async generateResponse(intent, financialProfile, history, message) {
    const responses = {
      debt_advice: {
        general: `Basado en tu perfil financiero actual con un score de ${financialProfile.financialHealth.score}/100, te recomiendo seguir una estrategia de avalancha. Prioriza las deudas con tasas más altas (${financialProfile.debtAnalysis.interestRates.highest}% anual) para maximizar el ahorro en intereses.`,
        specific: `He identificado ${financialProfile.negotiationOpportunities.length} oportunidades de negociación inmediatas. La más prometedora es con ${financialProfile.negotiationOpportunities[0].creditor}, donde podrías reducir tu tasa en un ${(financialProfile.negotiationOpportunities[0].potentialReduction * 100).toFixed(0)}%.`
      },
      financial_education: {
        general: `Tu nivel de literacidad financiera es ${financialProfile.behaviorPatterns.financialLiteracy}. Te recomiendo empezar con conceptos básicos de presupuesto y luego avanzar a estrategias de inversión diversificadas.`,
        specific: `Basado en tu perfil, deberías enfocarte en entender mejor la composición de tu deuda actual: ${Object.entries(financialProfile.debtAnalysis.debtComposition).map(([key, value]) => `${(value * 100).toFixed(0)}% ${key}`).join(', ')}.`
      },
      negotiation_help: {
        general: `El mejor momento para negociar es cuando tienes un flujo de caja estable y puedes hacer una oferta de pago lump sum. Tu patrón de pago actual (${financialProfile.behaviorPatterns.averagePaymentTiming} días antes del vencimiento) es excelente.`,
        specific: `Para ${financialProfile.negotiationOpportunities[0].creditor}, el momento óptimo es ${financialProfile.negotiationOpportunities[0].bestNegotiationTime}. Usa la estrategia de ${financialProfile.negotiationOpportunities[0].strategy} con una confianza del ${(financialProfile.negotiationOpportunities[0].confidence * 100).toFixed(0)}%.`
      },
      payment_strategy: {
        general: `Tu estrategia actual de ${financialProfile.personalizedRecommendations.paymentStrategy} es adecuada. Considera aumentar tu ahorro mensual a ${financialProfile.personalizedRecommendations.monthlySavingsTarget.toLocaleString('es-CL')} para acelerar el proceso.`,
        specific: `Con tu tasa promedio de ${financialProfile.debtAnalysis.interestRates.average}%, cada ${financialProfile.personalizedRecommendations.monthlySavingsTarget.toLocaleString('es-CL')} adicional que ahorres te ahorrará aproximadamente ${(financialProfile.personalizedRecommendations.monthlySavingsTarget * financialProfile.debtAnalysis.interestRates.average / 100 / 12).toLocaleString('es-CL')} en intereses anuales.`
      },
      budget_planning: {
        general: `Tu tasa de ahorro actual del ${(financialProfile.financialHealth.factors.savingsRate * 100).toFixed(0)}% está por debajo del recomendado (20%). Considera reducir gastos no esenciales para alcanzar este objetivo.`,
        specific: `Basado en tus factores estacionales, los meses ${financialProfile.behaviorPatterns.seasonalFactors.lowCashFlowMonths} son de bajo flujo. Planifica un presupuesto más conservador para esos meses.`
      },
      credit_improvement: {
        general: `Tu historial de pagos del ${financialProfile.financialHealth.factors.paymentHistory}% es bueno, pero necesitas mejorar tu utilización de crédito del ${(financialProfile.financialHealth.factors.creditUtilization * 100).toFixed(0)}% manteniéndola por debajo del 30%.`,
        specific: `Con tu comportamiento de pago consistente, podrías mejorar tu score en 6-12 meses manteniendo todos los pagos a tiempo y reduciendo el uso de tarjetas de crédito.`
      }
    };

    const intentResponses = responses[intent.type] || responses.debt_advice;
    const baseResponse = intentResponses.specific || intentResponses.general;

    // Agregar contexto personalizado
    const personalizedResponse = `${baseResponse}\n\n💡 **Consejo personalizado**: ${this.generatePersonalizedTip(financialProfile, intent.type)}`;

    return personalizedResponse;
  }

  // Generar consejos personalizados
  generatePersonalizedTip(financialProfile, intentType) {
    const tips = {
      debt_advice: [
        `Considera usar tus bonos de ${financialProfile.behaviorPatterns.seasonalFactors.bonusMonths.join(' y ')} para hacer pagos extra y acelerar la reducción de deuda.`,
        `Tu método de pago preferido (${financialProfile.behaviorPatterns.preferredPaymentMethod}) es eficiente, considera configurar pagos automáticos.`,
        `Con tu tolerancia al riesgo ${financialProfile.behaviorPatterns.riskTolerance}, podrías considerar opciones de consolidación de deuda.`
      ],
      financial_education: [
        `Tu nivel de literatura ${financialProfile.behaviorPatterns.financialLiteracy} te permite entender conceptos más avanzados como diversificación y optimización fiscal.`,
        `Con tu score de salud financiera de ${financialProfile.financialHealth.score}, estás listo para aprender sobre estrategias de inversión moderadas.`
      ],
      negotiation_help: [
        `Tu patrón de pago ${financialProfile.behaviorPatterns.paymentConsistency} te da una excelente posición de negociación.`,
        `Con ${financialProfile.debtAnalysis.debtAge.average} meses de edad promedio de deuda, tienes buenas oportunidades de negociación.`
      ],
      payment_strategy: [
        `Tu estrategia actual es buena, pero considera ajustarla según los factores estacionales de bajo flujo.`,
        `Con tu tasa de ahorro actual, podrías alcanzar tu meta de fondo de emergencia en ${Math.ceil(600000 / financialProfile.personalizedRecommendations.monthlySavingsTarget)} meses.`
      ],
      budget_planning: [
        `Tu comportamiento financiero ${financialProfile.behaviorPatterns.riskTolerance} sugiere un presupuesto equilibrado entre ahorro y calidad de vida.`,
        `Considera crear un fondo para gastos variables en los meses de bajo flujo: ${financialProfile.behaviorPatterns.seasonalFactors.lowCashFlowMonths.join(', ')}.`
      ],
      credit_improvement: [
        `Tu consistencia de pagos del ${financialProfile.financialHealth.factors.paymentHistory}% es excelente para mejorar tu score.`,
        `Reduce tu utilización de crédito del ${(financialProfile.financialHealth.factors.creditUtilization * 100).toFixed(0)}% al 30% para ver mejoras significativas.`
      ]
    };

    const intentTips = tips[intentType] || tips.debt_advice;
    return intentTips[Math.floor(Math.random() * intentTips.length)];
  }

  // Generar sugerencias adicionales
  async generateSuggestions(intent, financialProfile) {
    const suggestions = [];

    if (intent.type === 'debt_advice') {
      suggestions.push({
        type: 'action',
        title: 'Plan de Pagos Optimizado',
        description: 'Genera un plan personalizado basado en tus deudas y flujo de caja',
        action: 'generate_payment_plan'
      });
    }

    if (intent.type === 'negotiation_help') {
      suggestions.push({
        type: 'tool',
        title: 'Simulador de Negociación',
        description: 'Prueba diferentes escenarios de negociación',
        action: 'open_negotiation_simulator'
      });
    }

    if (financialProfile.negotiationOpportunities.length > 0) {
      suggestions.push({
        type: 'opportunity',
        title: 'Oportunidad de Negociación',
        description: `${financialProfile.negotiationOpportunities[0].creditor} - ${(financialProfile.negotiationOpportunities[0].potentialReduction * 100).toFixed(0)}% de reducción potencial`,
        action: 'view_negotiation_details'
      });
    }

    return suggestions;
  }

  // Generar acciones de seguimiento
  async generateFollowUpActions(intent, financialProfile) {
    const actions = [];

    if (intent.type === 'debt_advice') {
      actions.push({
        type: 'calculation',
        title: 'Calcular Ahorro en Intereses',
        description: 'Ve cuánto podrías ahorrar con diferentes estrategias',
        action: 'calculate_interest_savings'
      });
    }

    if (intent.type === 'payment_strategy') {
      actions.push({
        type: 'planning',
        title: 'Crear Cronograma de Pagos',
        description: 'Planifica tus pagos para los próximos 12 meses',
        action: 'create_payment_schedule'
      });
    }

    if (financialProfile.financialHealth.score < 70) {
      actions.push({
        type: 'improvement',
        title: 'Plan de Mejora Financiera',
        description: 'Pasos específicos para mejorar tu salud financiera',
        action: 'create_improvement_plan'
      });
    }

    return actions;
  }

  // Análisis predictivo avanzado
  async getPredictiveAnalysis(userId) {
    try {
      const financialProfile = await this.getFinancialProfile(userId);
      
      const analysis = {
        paymentPredictions: {
          nextPaymentProbability: 0.87,
          nextPaymentAmount: 125000,
          nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          monthlyPaymentTrend: 'increasing',
          riskOfDefault: 0.15,
          recommendedPaymentAmount: 150000,
          seasonalAdjustments: {
            nextMonth: 1.1,
            followingMonth: 0.95
          }
        },
        debtProjection: {
          currentTotal: financialProfile.debtAnalysis.totalDebt,
          projectedPayoffDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          totalInterestToPay: 450000,
          potentialSavings: 120000,
          bestCaseScenario: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          worstCaseScenario: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000)
        },
        optimizationOpportunities: [
          {
            type: 'interest_reduction',
            potentialSavings: 85000,
            probability: 0.75,
            timeframe: '3-6 months',
            effort: 'medium'
          },
          {
            type: 'debt_consolidation',
            potentialSavings: 45000,
            probability: 0.60,
            timeframe: '1-2 months',
            effort: 'low'
          },
          {
            type: 'payment_acceleration',
            potentialSavings: 35000,
            probability: 0.90,
            timeframe: 'immediate',
            effort: 'low'
          }
        ],
        riskFactors: [
          {
            factor: 'seasonal_income_variation',
            level: 'medium',
            impact: 0.3,
            mitigation: 'build_emergency_fund'
          },
          {
            factor: 'high_interest_debt',
            level: 'high',
            impact: 0.5,
            mitigation: 'prioritize_high_interest'
          }
        ],
        recommendations: [
          {
            priority: 'high',
            action: 'increase_monthly_payment',
            amount: 25000,
            reasoning: 'Acelerar reducción de deuda y ahorrar intereses',
            impact: 'reduce_payoff_time_by_6_months'
          },
          {
            priority: 'medium',
            action: 'negotiate_interest_rates',
            targetDebts: ['debt_1', 'debt_2'],
            reasoning: 'Reducir carga financiera mensual',
            impact: 'save_85000_in_interests'
          }
        ]
      };

      return analysis;
    } catch (error) {
      console.error('Error getting predictive analysis:', error);
      throw error;
    }
  }

  // Estrategias de negociación inteligente
  async getNegotiationStrategies(userId, debtId) {
    try {
      const financialProfile = await this.getFinancialProfile(userId);
      const debt = financialProfile.negotiationOpportunities.find(op => op.debtId === debtId);
      
      if (!debt) {
        throw new Error('Debt not found');
      }

      const strategies = {
        settlementOffer: {
          description: 'Ofrecer pago lump sum por menos del saldo total',
          successProbability: debt.confidence,
          expectedReduction: debt.potentialReduction,
          bestTiming: debt.bestNegotiationTime,
          preparationSteps: [
            'Calcular capacidad de pago lump sum',
            'Preparar documentación financiera',
            'Investigar políticas del acreedor',
            'Practicar discurso de negociación'
          ],
          talkingPoints: [
            'Dificultades financieras temporales',
            'Compromiso de pago',
            'Comparación con otras opciones',
            'Beneficios para ambas partes'
          ],
          fallbackOptions: [
            'Plan de pagos estructurado',
            'Reducción temporal de tasas',
            'Extensión de plazos'
          ]
        },
        interestReduction: {
          description: 'Negociar reducción de tasa de interés',
          successProbability: debt.confidence * 0.8,
          expectedReduction: debt.potentialReduction * 0.6,
          bestTiming: 'end_of_month',
          preparationSteps: [
            'Investigar tasas de mercado',
            'Documentar historial de pagos',
            'Preparar propuesta de pago',
            'Identificar contacto correcto'
          ],
          talkingPoints: [
            'Historial de pagos puntuales',
            'Ofertas competitivas',
            'Situación financiera actual',
            'Lealtad como cliente'
          ],
          fallbackOptions: [
            'Tasa fija temporal',
            'Waiver de cargos',
            'Programa de recompensas'
          ]
        },
        paymentPlanModification: {
          description: 'Modificar términos del plan de pagos existente',
          successProbability: debt.confidence * 0.9,
          expectedReduction: debt.potentialReduction * 0.3,
          bestTiming: 'any_time',
          preparationSteps: [
            'Analizar capacidad de pago actual',
            'Revisar términos existentes',
            'Identificar necesidades específicas',
            'Preparar propuesta realista'
          ],
          talkingPoints: [
            'Cambios en situación financiera',
            'Dificultades temporales',
            'Compromiso de pago',
            'Flexibilidad requerida'
          ],
          fallbackOptions: [
            'Extensión breve',
            'Pago parcial temporal',
            'Reestructuración completa'
          ]
        }
      };

      return {
        debt,
        recommendedStrategy: debt.strategy,
        strategies,
        personalizedTips: this.generateNegotiationTips(debt, financialProfile),
        successFactors: this.calculateSuccessFactors(debt, financialProfile)
      };
    } catch (error) {
      console.error('Error getting negotiation strategies:', error);
      throw error;
    }
  }

  // Generar consejos de negociación personalizados
  generateNegotiationTips(debt, financialProfile) {
    return [
      `Tu historial de pagos consistentes (${financialProfile.behaviorPatterns.paymentConsistency}) aumenta tu poder de negociación.`,
      `Con tu patrón de pago ${financialProfile.behaviorPatterns.averagePaymentTiming} días antes del vencimiento, demuestras responsabilidad financiera.`,
      `Tu tolerancia al riesgo ${financialProfile.behaviorPatterns.riskTolerance} sugiere enfoque en seguridad estabilidad.`,
      `Considera usar factores estacionales a tu favor: los meses ${financialProfile.behaviorPatterns.seasonalFactors.bonusMonths.join(' y ')} son ideales para negociaciones.`
    ];
  }

  // Calcular factores de éxito
  calculateSuccessFactors(debt, financialProfile) {
    return {
      paymentHistory: {
        weight: 0.3,
        score: financialProfile.financialHealth.factors.paymentHistory / 100,
        description: 'Historial de pagos puntuales'
      },
      debtToIncome: {
        weight: 0.2,
        score: Math.max(0, 1 - financialProfile.financialHealth.factors.debtToIncome),
        description: 'Ratio deuda-ingresos'
      },
      timing: {
        weight: 0.2,
        score: this.calculateTimingScore(debt.bestNegotiationTime),
        description: 'Momento óptimo para negociar'
      },
      preparation: {
        weight: 0.3,
        score: 0.8, // Asumiendo buena preparación
        description: 'Nivel de preparación'
      }
    };
  }

  // Calcular puntuación de timing
  calculateTimingScore(bestTime) {
    const timingScores = {
      'immediate': 0.9,
      'within_1_week': 0.8,
      'within_2_weeks': 0.7,
      'end_of_month': 0.6,
      'any_time': 0.5
    };
    return timingScores[bestTime] || 0.5;
  }

  // Educación financiera personalizada
  async getEducationalContent(userId, topic, level = 'intermediate') {
    try {
      const financialProfile = await this.getFinancialProfile(userId);
      
      const content = {
        topic,
        level,
        personalizedContent: this.generatePersonalizedContent(topic, level, financialProfile),
        learningPath: this.generateLearningPath(topic, financialProfile),
        resources: this.getRelevantResources(topic, level),
        quizzes: this.generateQuizzes(topic, level),
        nextSteps: this.getNextSteps(topic, level, financialProfile)
      };

      return content;
    } catch (error) {
      console.error('Error getting educational content:', error);
      throw error;
    }
  }

  // Generar contenido educativo personalizado
  generatePersonalizedContent(topic, level, financialProfile) {
    const contentMap = {
      budgeting: {
        intermediate: `Con tu tasa de ahorro actual del ${(financialProfile.financialHealth.factors.savingsRate * 100).toFixed(0)}%, necesitas enfocarte en crear un presupuesto que te permita alcanzar el 20% recomendado. Considera tus patrones estacionales y los meses de bajo flujo.`,
        advanced: `Tu perfil financiero ${financialProfile.behaviorPatterns.riskTolerance} sugiere un presupuesto dinámico que se ajuste según los factores estacionales. Implementa reglas de ahorro automático y considera inversiones diversificadas.`
      },
      debt_management: {
        intermediate: `Tu estrategia actual de ${financialProfile.personalizedRecommendations.paymentStrategy} es buena, pero con tu tasa promedio de ${financialProfile.debtAnalysis.interestRates.average}%, podrías optimizarla priorizando deudas de alto interés.`,
        advanced: `Analizando tu composición de deuda (${Object.entries(financialProfile.debtAnalysis.debtComposition).map(([k, v]) => `${(v * 100).toFixed(0)}% ${k}`).join(', ')}), considera consolidación estratégica y negociación basada en tu excelente historial de pagos.`
      },
      investing: {
        intermediate: `Con tu nivel de literacidad financiera ${financialProfile.behaviorPatterns.financialLiteracy}, estás listo para aprender sobre diversificación básica. Tu tolerancia al riesgo ${financialProfile.behaviorPatterns.riskTolerance} sugiere un portafolio balanceado.`,
        advanced: `Tu perfil actual permite estrategias avanzadas. Considera optimización fiscal, rebalanceo trimestral y estrategias de acumulación de wealth basadas en tus patrones estacionales identificados.`
      }
    };

    return contentMap[topic]?.[level] || 'Contenido no disponible para este nivel.';
  }

  // Generar ruta de aprendizaje
  generateLearningPath(topic, financialProfile) {
    return {
      currentLevel: financialProfile.behaviorPatterns.financialLiteracy,
      recommendedPath: [
        {
          step: 1,
          title: 'Fundamentos',
          description: 'Conceptos básicos de gestión financiera',
          estimatedTime: '2 semanas',
          prerequisites: []
        },
        {
          step: 2,
          title: 'Aplicación Práctica',
          description: 'Implementar estrategias en tu situación actual',
          estimatedTime: '4 semanas',
          prerequisites: ['Fundamentos']
        },
        {
          step: 3,
          title: 'Optimización Avanzada',
          description: 'Técnicas sofisticadas de gestión financiera',
          estimatedTime: '6 semanas',
          prerequisites: ['Aplicación Práctica']
        }
      ],
      personalizedAdjustments: [
        `Enfocate en tu patrón de pago ${financialProfile.behaviorPatterns.paymentConsistency}`,
        `Considera tus factores estacionales: ${financialProfile.behaviorPatterns.seasonalFactors.bonusMonths.join(', ')}`,
        `Adapta a tu tolerancia al riesgo ${financialProfile.behaviorPatterns.riskTolerance}`
      ]
    };
  }

  // Obtener recursos relevantes
  getRelevantResources(topic, level) {
    const resources = {
      budgeting: {
        intermediate: [
          { type: 'article', title: 'Guía de Presupuesto Personalizado', url: '#' },
          { type: 'tool', title: 'Calculadora de Presupuesto', url: '#' },
          { type: 'video', title: 'Técnicas de Control de Gastos', url: '#' }
        ],
        advanced: [
          { type: 'course', title: 'Presupuesto Dinámico Avanzado', url: '#' },
          { type: 'tool', title: 'Optimizador de Flujo de Caja', url: '#' },
          { type: 'book', title: 'Financial Freedom', url: '#' }
        ]
      },
      debt_management: {
        intermediate: [
          { type: 'article', title: 'Estrategias de Reducción de Deuda', url: '#' },
          { type: 'tool', title: 'Calculadora de Intereses', url: '#' },
          { type: 'video', title: 'Negociación con Acreedores', url: '#' }
        ],
        advanced: [
          { type: 'course', title: 'Debt Optimization Mastery', url: '#' },
          { type: 'tool', title: 'Debt Consolidation Planner', url: '#' },
          { type: 'book', title: 'The Total Money Makeover', url: '#' }
        ]
      }
    };

    return resources[topic]?.[level] || [];
  }

  // Generar cuestionarios
  generateQuizzes(topic, level) {
    return [
      {
        id: 1,
        question: '¿Cuál es la tasa de ahorro recomendada?',
        options: ['10%', '20%', '30%', '40%'],
        correct: 1,
        explanation: 'Se recomienda ahorrar el 20% de los ingresos para alcanzar metas financieras.'
      },
      {
        id: 2,
        question: '¿Qué método de pago de deudas es generalmente más efectivo?',
        options: ['Mínimo pago', 'Avalancha', 'Bola de nieve', 'Aleatorio'],
        correct: 1,
        explanation: 'El método avalancha (priorizar deudas altas) ahorra más en intereses a largo plazo.'
      }
    ];
  }

  // Obtener siguientes pasos
  getNextSteps(topic, level, financialProfile) {
    return [
      {
        action: 'practice',
        title: 'Practicar con tus finanzas reales',
        description: 'Aplica lo aprendido a tu situación específica',
        priority: 'high'
      },
      {
        action: 'track',
        title: 'Monitorear tu progreso',
        description: 'Usa las herramientas de seguimiento para medir mejoras',
        priority: 'medium'
      },
      {
        action: 'advance',
        title: 'Siguiente nivel',
        description: 'Cuando domines estos conceptos, pasa al nivel avanzado',
        priority: 'low'
      }
    ];
  }

  // Suscribir a actualizaciones en tiempo real
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      this.notifyListeners();
    }, 120000); // Cada 2 minutos

    return () => {
      clearInterval(interval);
      this.listeners.delete(callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners(data = null) {
    const notification = data || {
      timestamp: new Date(),
      type: 'ai_assistant_update'
    };
    
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in AI assistant listener:', error);
      }
    });
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }
}

// Exportar instancia singleton
export const debtorAIAssistantService = new DebtorAIAssistantService();

export default debtorAIAssistantService;