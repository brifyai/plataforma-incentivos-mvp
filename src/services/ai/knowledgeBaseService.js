/**
 * Servicio de Base de Conocimiento para IA
 * 
 * Gestiona la base de conocimiento específica por cliente corporativo
 * para personalizar las respuestas de la IA con información del deudor
 */

import { supabase } from '../../config/supabase.js';

export class KnowledgeBaseService {
  
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene la base de conocimiento completa para un cliente corporativo
   * @param {string} corporateClientId - ID del cliente corporativo
   * @returns {Promise<Object>} Base de conocimiento del cliente
   */
  async getCorporateClientKnowledge(corporateClientId) {
    try {
      // Verificar caché primero
      const cacheKey = `corp_kb_${corporateClientId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      // Obtener información del cliente corporativo
      const { data: corporateClient, error: clientError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('id', corporateClientId)
        .single();

      if (clientError) {
        console.error('Error fetching corporate client:', clientError);
        return this.getDefaultKnowledge();
      }

      // Obtener deudores asociados al cliente corporativo
      const { data: debtors, error: debtorsError } = await supabase
        .from('debts')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            rut,
            email,
            phone
          )
        `)
        .eq('corporate_client_id', corporateClientId);

      if (debtorsError) {
        console.error('Error fetching debtors:', debtorsError);
      }

      // Obtener configuración de IA específica del cliente
      const { data: aiConfig, error: configError } = await supabase
        .from('negotiation_ai_config')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .single();

      // Obtener políticas y reglas del cliente
      const { data: policies, error: policiesError } = await supabase
        .from('corporate_client_policies')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true);

      // Construir base de conocimiento
      const knowledgeBase = {
        corporateClient: {
          id: corporateClient.id,
          name: corporateClient.business_name,
          rut: corporateClient.rut,
          industry: corporateClient.industry || 'General',
          contactInfo: {
            email: corporateClient.contact_email,
            phone: corporateClient.contact_phone,
            address: corporateClient.address
          },
          businessProfile: {
            category: corporateClient.display_category,
            description: corporateClient.description,
            website: corporateClient.website
          }
        },
        debtors: this.processDebtorsData(debtors || []),
        aiConfiguration: aiConfig || this.getDefaultAIConfig(),
        policies: policies || [],
        negotiationLimits: {
          maxDiscount: aiConfig?.max_negotiation_discount || 15,
          maxInstallments: aiConfig?.max_negotiation_term || 12,
          escalationThresholds: aiConfig?.escalation_thresholds || {}
        },
        customResponses: await this.getCustomResponses(corporateClientId),
        lastUpdated: new Date().toISOString()
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: knowledgeBase,
        timestamp: Date.now()
      });

      return knowledgeBase;
    } catch (error) {
      console.error('Error getting corporate client knowledge:', error);
      return this.getDefaultKnowledge();
    }
  }

  /**
   * Obtiene información específica de un deudor para personalización
   * @param {string} debtorId - ID del deudor
   * @param {string} corporateClientId - ID del cliente corporativo
   * @returns {Promise<Object>} Información del deudor
   */
  async getDebtorKnowledge(debtorId, corporateClientId) {
    try {
      // Obtener información completa del deudor
      const { data: debtor, error: debtorError } = await supabase
        .from('debts')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            rut,
            email,
            phone,
            created_at
          ),
          corporate_client:corporate_client_id (
            id,
            business_name,
            rut
          )
        `)
        .eq('user_id', debtorId)
        .eq('corporate_client_id', corporateClientId)
        .single();

      if (debtorError) {
        console.error('Error fetching debtor:', debtorError);
        return null;
      }

      // Obtener historial de negociaciones previas
      const { data: negotiationHistory, error: historyError } = await supabase
        .from('negotiation_conversations')
        .select('*')
        .eq('debtor_id', debtorId)
        .eq('corporate_client_id', corporateClientId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Obtener historial de pagos
      const { data: paymentHistory, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', debtorId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Procesar información del deudor
      const debtorKnowledge = {
        personalInfo: {
          id: debtor.user?.id,
          name: debtor.user?.full_name,
          rut: debtor.user?.rut,
          email: debtor.user?.email,
          phone: debtor.user?.phone,
          customerSince: debtor.user?.created_at
        },
        debtInfo: {
          totalDebt: debtor.current_amount || debtor.original_amount,
          originalAmount: debtor.original_amount,
          dueDate: debtor.due_date,
          daysOverdue: debtor.days_overdue,
          debtType: debtor.type,
          status: debtor.status
        },
        corporateContext: {
          corporateClientId: debtor.corporate_client?.id,
          corporateClientName: debtor.corporate_client?.business_name,
          corporateClientRut: debtor.corporate_client?.rut
        },
        negotiationHistory: negotiationHistory || [],
        paymentHistory: paymentHistory || [],
        behaviorProfile: this.analyzeDebtorBehavior(negotiationHistory, paymentHistory),
        personalizationData: {
          preferredContactMethod: this.detectPreferredContact(debtor.user),
          communicationStyle: this.detectCommunicationStyle(negotiationHistory),
          riskLevel: this.assessRiskLevel(debtor, paymentHistory)
        }
      };

      return debtorKnowledge;
    } catch (error) {
      console.error('Error getting debtor knowledge:', error);
      return null;
    }
  }

  /**
   * Genera un prompt personalizado para la IA usando la base de conocimiento
   * @param {Object} debtorKnowledge - Información del deudor
   * @param {Object} corporateKnowledge - Información del cliente corporativo
   * @param {string} message - Mensaje del deudor
   * @returns {Promise<string>} Prompt personalizado
   */
  async generatePersonalizedPrompt(debtorKnowledge, corporateKnowledge, message) {
    const prompt = `
Eres un asistente de negociación especializado para ${corporateKnowledge.corporateClient.name}.

INFORMACIÓN DEL CLIENTE CORPORATIVO:
- Empresa: ${corporateKnowledge.corporateClient.name}
- RUT: ${corporateKnowledge.corporateClient.rut}
- Industria: ${corporateKnowledge.corporateClient.industry}
- Categoría: ${corporateKnowledge.corporateClient.businessProfile.category}

INFORMACIÓN DEL DEUDOR:
- Nombre: ${debtorKnowledge.personalInfo.name}
- RUT: ${debtorKnowledge.personalInfo.rut}
- Cliente desde: ${new Date(debtorKnowledge.personalInfo.customerSince).toLocaleDateString('es-CL')}
- Deuda total: $${debtorKnowledge.debtInfo.totalDebt?.toLocaleString('es-CL')}
- Días de mora: ${debtorKnowledge.debtInfo.daysOverdue}
- Tipo de deuda: ${debtorKnowledge.debtInfo.debtType}

PERFIL DE COMPORTAMIENTO:
- Estilo de comunicación: ${debtorKnowledge.personalizationData.communicationStyle}
- Método de contacto preferido: ${debtorKnowledge.personalizationData.preferredContactMethod}
- Nivel de riesgo: ${debtorKnowledge.personalizationData.riskLevel}

HISTORIAL RECIENTE:
${debtorKnowledge.negotiationHistory.slice(0, 2).map(n => 
  `- ${n.created_at}: ${n.status} - ${n.summary || 'Sin resumen'}`
).join('\n')}

POLÍTICAS DE NEGOCIACIÓN:
- Descuento máximo: ${corporateKnowledge.negotiationLimits.maxDiscount}%
- Cuotas máximas: ${corporateKnowledge.negotiationLimits.maxInstallments}
- Umbrales de escalada: ${JSON.stringify(corporateKnowledge.negotiationLimits.escalationThresholds)}

RESPUESTAS PERSONALIZADAS DISPONIBLES:
${corporateKnowledge.customResponses.map(r => 
  `- ${r.trigger}: ${r.response}`
).join('\n')}

MENSAJE ACTUAL DEL DEUDOR:
"${message}"

INSTRUCCIONES ESPECÍFICAS:
1. Usa el nombre del deudor (${debtorKnowledge.personalInfo.name}) para personalizar
2. Menciona que es cliente de ${corporateKnowledge.corporateClient.name}
3. Adapta tu tono al estilo de comunicación detectado (${debtorKnowledge.personalizationData.communicationStyle})
4. Considera el nivel de riesgo (${debtorKnowledge.personalizationData.riskLevel}) en tu enfoque
5. Usa las políticas específicas de ${corporateKnowledge.corporateClient.name}
6. Si hay historial previo, haz referencia a él si es relevante
7. Mantén un tono profesional pero empático
8. Siempre incluye llamada a la acción clara

Responde de manera personalizada, considerando toda la información proporcionada.
`;

    return prompt;
  }

  /**
   * Procesa los datos de deudores para la base de conocimiento
   */
  processDebtorsData(debts) {
    const debtorsMap = new Map();
    
    debts.forEach(debt => {
      const debtorId = debt.user_id;
      
      if (!debtorsMap.has(debtorId)) {
        debtorsMap.set(debtorId, {
          id: debtorId,
          personalInfo: {
            name: debt.user?.full_name,
            rut: debt.user?.rut,
            email: debt.user?.email,
            phone: debt.user?.phone
          },
          debts: [],
          totalDebt: 0,
          riskLevel: 'medium'
        });
      }
      
      const debtor = debtorsMap.get(debtorId);
      debtor.debts.push({
        id: debt.id,
        amount: debt.current_amount || debt.original_amount,
        dueDate: debt.due_date,
        daysOverdue: debt.days_overdue,
        type: debt.type,
        status: debt.status
      });
      
      debtor.totalDebt += parseFloat(debt.current_amount || debt.original_amount);
    });
    
    return Array.from(debtorsMap.values());
  }

  /**
   * Analiza el comportamiento del deudor
   */
  analyzeDebtorBehavior(negotiationHistory, paymentHistory) {
    const behavior = {
      negotiationTendency: 'cooperative',
      paymentPattern: 'irregular',
      preferredTerms: 'standard',
      communicationFrequency: 'normal'
    };

    // Analizar historial de negociaciones
    if (negotiationHistory.length > 0) {
      const successfulNegotiations = negotiationHistory.filter(n => n.status === 'agreed').length;
      const totalNegotiations = negotiationHistory.length;
      
      if (successfulNegotiations / totalNegotiations > 0.7) {
        behavior.negotiationTendency = 'cooperative';
      } else if (successfulNegotiations / totalNegotiations < 0.3) {
        behavior.negotiationTendency = 'resistant';
      }
    }

    // Analizar patrón de pagos
    if (paymentHistory.length > 0) {
      const onTimePayments = paymentHistory.filter(p => p.status === 'on_time').length;
      const totalPayments = paymentHistory.length;
      
      if (onTimePayments / totalPayments > 0.8) {
        behavior.paymentPattern = 'regular';
      } else if (onTimePayments / totalPayments < 0.3) {
        behavior.paymentPattern = 'delinquent';
      }
    }

    return behavior;
  }

  /**
   * Detecta el método de contacto preferido
   */
  detectPreferredContact(user) {
    if (!user) return 'email';
    
    // Lógica simple - en producción sería más sofisticada
    if (user.phone && !user.email) return 'phone';
    if (user.email && !user.phone) return 'email';
    
    // Si tiene ambos, priorizar email por defecto
    return 'email';
  }

  /**
   * Detecta el estilo de comunicación
   */
  detectCommunicationStyle(negotiationHistory) {
    if (!negotiationHistory || negotiationHistory.length === 0) {
      return 'professional';
    }

    // Analizar mensajes anteriores para detectar estilo
    const messages = negotiationHistory.flatMap(n => n.messages || []);
    const formalIndicators = ['usted', 'por favor', 'agradecería', 'atentamente'];
    const informalIndicators = ['tú', 'dale', 'ok', 'gracias'];

    let formalCount = 0;
    let informalCount = 0;

    messages.forEach(msg => {
      const content = (msg.content || '').toLowerCase();
      formalIndicators.forEach(indicator => {
        if (content.includes(indicator)) formalCount++;
      });
      informalIndicators.forEach(indicator => {
        if (content.includes(indicator)) informalCount++;
      });
    });

    if (formalCount > informalCount) return 'formal';
    if (informalCount > formalCount) return 'informal';
    return 'professional';
  }

  /**
   * Evalúa el nivel de riesgo
   */
  assessRiskLevel(debtor, paymentHistory) {
    let riskScore = 0;

    // Factores de riesgo
    if (debtor.days_overdue > 90) riskScore += 3;
    else if (debtor.days_overdue > 60) riskScore += 2;
    else if (debtor.days_overdue > 30) riskScore += 1;

    if (paymentHistory) {
      const latePayments = paymentHistory.filter(p => p.status === 'late').length;
      const totalPayments = paymentHistory.length;
      
      if (totalPayments > 0) {
        const latePaymentRatio = latePayments / totalPayments;
        if (latePaymentRatio > 0.7) riskScore += 3;
        else if (latePaymentRatio > 0.4) riskScore += 2;
        else if (latePaymentRatio > 0.2) riskScore += 1;
      }
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Obtiene respuestas personalizadas del cliente
   */
  async getCustomResponses(corporateClientId) {
    try {
      const { data, error } = await supabase
        .from('corporate_client_responses')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching custom responses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting custom responses:', error);
      return [];
    }
  }

  /**
   * Obtiene configuración por defecto
   */
  getDefaultKnowledge() {
    return {
      corporateClient: {
        id: null,
        name: 'Cliente Corporativo',
        rut: 'Sin RUT',
        industry: 'General'
      },
      debtors: [],
      aiConfiguration: this.getDefaultAIConfig(),
      policies: [],
      negotiationLimits: {
        maxDiscount: 15,
        maxInstallments: 12,
        escalationThresholds: {}
      },
      customResponses: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Obtiene configuración de IA por defecto
   */
  getDefaultAIConfig() {
    return {
      max_negotiation_discount: 15,
      max_negotiation_term: 12,
      escalation_thresholds: {
        conversationLength: 15,
        discountRequested: 20,
        timeRequested: 18
      },
      auto_respond: true,
      working_hours: {
        start: '09:00',
        end: '18:00'
      }
    };
  }

  /**
   * Limpia la caché
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Invalida caché específica
   */
  invalidateCache(corporateClientId) {
    const cacheKey = `corp_kb_${corporateClientId}`;
    this.cache.delete(cacheKey);
  }
}

// Exportar instancia única
export const knowledgeBaseService = new KnowledgeBaseService();