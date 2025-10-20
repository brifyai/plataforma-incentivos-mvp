/**
 * Servicio de IA para Negociación
 * 
 * Extiende el servicio de IA principal con funcionalidades específicas de negociación
 */

import { supabase } from '../../../config/supabase.js';
import { knowledgeBaseService } from '../../../services/ai/knowledgeBaseService.js';

export class NegotiationAIService {
  
  constructor() {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      defaultModel: 'gpt-4'
    };
  }

  /**
   * Configura el contexto de negociación para una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {Object} proposalData - Datos de la propuesta
   * @returns {Promise<void>}
   */
  async configureNegotiationContext(conversationId, proposalData) {
    try {
      // Obtener configuración de IA para la empresa
      const { data: aiConfig, error: configError } = await supabase
        .from('negotiation_ai_config')
        .select('*')
        .eq('company_id', proposalData.companyId)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Obtener base de conocimiento de la empresa
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('company_knowledge_base')
        .select('*')
        .eq('company_id', proposalData.companyId)
        .eq('is_active', true);

      if (kbError) {
        throw kbError;
      }

      // Actualizar contexto en la conversación
      const negotiationContext = {
        proposal: proposalData,
        aiConfig: aiConfig || this.getDefaultConfig(),
        knowledgeBase: knowledgeBase || [],
        limits: {
          maxDiscount: aiConfig?.max_negotiation_discount || 15,
          maxTerm: aiConfig?.max_negotiation_term || 12,
          escalationThresholds: aiConfig?.escalation_thresholds || {}
        }
      };

      const { error: updateError } = await supabase
        .from('negotiation_conversations')
        .update({
          negotiation_context: negotiationContext,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Negotiation context configured for conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error('Error configuring negotiation context:', error);
      throw error;
    }
  }

  /**
   * Genera una respuesta de negociación basada en el mensaje del deudor
   * @param {string} message - Mensaje del deudor
   * @param {Object} conversation - Datos de la conversación
   * @param {Object} proposalData - Datos de la propuesta
   * @returns {Promise<Object>} Respuesta generada
   */
  async generateNegotiationResponse(message, conversation, proposalData) {
    try {
      // Obtener información personalizada del deudor y cliente corporativo
      const debtorKnowledge = await knowledgeBaseService.getDebtorKnowledge(
        conversation.debtorId,
        conversation.corporateClientId
      );
      
      const corporateKnowledge = await knowledgeBaseService.getCorporateClientKnowledge(
        conversation.corporateClientId
      );

      // Analizar el mensaje para detectar intención y sentimiento
      const analysis = await this.analyzeMessage(message);
      
      // Determinar si se debe escalar a humano
      const escalationDecision = await this.evaluateEscalation(
        message,
        analysis,
        conversation,
        proposalData,
        debtorKnowledge
      );

      if (escalationDecision.shouldEscalate) {
        return {
          content: this.generateEscalationMessage(escalationDecision.reason, debtorKnowledge),
          confidence: 1.0,
          escalationTriggered: true,
          escalationReason: escalationDecision.reason,
          metadata: {
            analysis,
            escalationDecision,
            debtorInfo: debtorKnowledge?.personalInfo
          }
        };
      }

      // Generar respuesta personalizada basada en conocimiento del cliente
      const response = await this.generatePersonalizedResponse(
        message,
        analysis,
        conversation,
        proposalData,
        debtorKnowledge,
        corporateKnowledge
      );

      return {
        content: response.content,
        confidence: response.confidence,
        escalationTriggered: false,
        metadata: {
          analysis,
          keywords: response.keywords,
          responseType: response.type,
          debtorInfo: debtorKnowledge?.personalInfo,
          corporateInfo: corporateKnowledge?.corporateClient,
          personalizationLevel: response.personalizationLevel || 'high'
        }
      };
    } catch (error) {
      console.error('Error generating negotiation response:', error);
      
      // Respuesta de fallback
      return {
        content: 'Lo siento, he tenido un problema técnico. Un representante humano te atenderá en breve.',
        confidence: 0.1,
        escalationTriggered: true,
        escalationReason: 'technical_error',
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Analiza un mensaje para detectar intención y sentimiento
   * @param {string} message - Mensaje a analizar
   * @returns {Promise<Object>} Análisis del mensaje
   */
  async analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Detección de keywords
    const keywords = {
      discount: lowerMessage.includes('descuento') || lowerMessage.includes('rebaja'),
      installments: lowerMessage.includes('cuota') || lowerMessage.includes('plazo'),
      time: lowerMessage.includes('tiempo') || lowerMessage.includes('mes'),
      human: lowerMessage.includes('persona') || lowerMessage.includes('humano') || lowerMessage.includes('agente'),
      payment: lowerMessage.includes('pago') || lowerMessage.includes('pagar'),
      high: lowerMessage.includes('alto') || lowerMessage.includes('caro') || lowerMessage.includes('no puedo'),
      agreement: lowerMessage.includes('acuerdo') || lowerMessage.includes('acepto') || lowerMessage.includes('de acuerdo')
    };

    // Análisis de sentimiento simple
    let sentiment = 'neutral';
    let sentimentScore = 0.5;

    if (keywords.high || lowerMessage.includes('problema') || lowerMessage.includes('difícil')) {
      sentiment = 'negative';
      sentimentScore = 0.2;
    } else if (keywords.agreement || lowerMessage.includes('gracias') || lowerMessage.includes('bien')) {
      sentiment = 'positive';
      sentimentScore = 0.8;
    }

    // Clasificación de intención
    let intent = 'inquiry';
    if (keywords.discount) intent = 'discount_request';
    else if (keywords.installments) intent = 'installment_request';
    else if (keywords.time) intent = 'time_request';
    else if (keywords.human) intent = 'human_request';
    else if (keywords.agreement) intent = 'agreement';

    return {
      keywords,
      sentiment,
      sentimentScore,
      intent,
      messageLength: message.length,
      complexity: this.calculateComplexity(message)
    };
  }

  /**
   * Evalúa si se debe escalar a humano
   * @param {string} message - Mensaje del deudor
   * @param {Object} analysis - Análisis del mensaje
   * @param {Object} conversation - Conversación actual
   * @param {Object} proposalData - Datos de la propuesta
   * @returns {Promise<Object>} Decisión de escalamiento
   */
  async evaluateEscalation(message, analysis, conversation, proposalData, debtorKnowledge) {
    const escalationThresholds = conversation.negotiation_context?.limits?.escalationThresholds || {};
    
    // 1. Solicitud explícita de humano
    if (analysis.keywords.human) {
      return {
        shouldEscalate: true,
        reason: 'user_requested_human',
        priority: 'high'
      };
    }

    // 2. Umbral de mensajes excedido
    if (conversation.message_count >= (escalationThresholds.conversationLength || 15)) {
      return {
        shouldEscalate: true,
        reason: 'message_limit_exceeded',
        priority: 'medium'
      };
    }

    // 3. Sentimiento muy negativo
    if (analysis.sentimentScore < 0.3) {
      return {
        shouldEscalate: true,
        reason: 'negative_sentiment',
        priority: 'high'
      };
    }

    // 4. Solicitud de descuento muy alto
    if (analysis.keywords.discount) {
      const discountRequested = this.extractDiscountAmount(message);
      if (discountRequested > (escalationThresholds.discountRequested || 20)) {
        return {
          shouldEscalate: true,
          reason: 'high_discount_request',
          priority: 'medium'
        };
      }
    }

    // 5. Solicitud de tiempo muy extendido
    if (analysis.keywords.time) {
      const timeRequested = this.extractTimeAmount(message);
      if (timeRequested > (escalationThresholds.timeRequested || 18)) {
        return {
          shouldEscalate: true,
          reason: 'extended_time_request',
          priority: 'medium'
        };
      }
    }

    return {
      shouldEscalate: false,
      reason: null,
      priority: null
    };
  }

  /**
   * Genera respuesta contextual basada en el análisis
   * @param {string} message - Mensaje original
   * @param {Object} analysis - Análisis del mensaje
   * @param {Object} conversation - Conversación
   * @param {Object} proposalData - Datos de la propuesta
   * @returns {Promise<Object>} Respuesta generada
   */
  async generatePersonalizedResponse(message, analysis, conversation, proposalData, debtorKnowledge, corporateKnowledge) {
    const limits = conversation.negotiation_context?.limits || corporateKnowledge?.negotiationLimits;
    
    // Generar prompt personalizado si tenemos información del deudor
    if (debtorKnowledge && corporateKnowledge) {
      const personalizedPrompt = await knowledgeBaseService.generatePersonalizedPrompt(
        debtorKnowledge,
        corporateKnowledge,
        message
      );
      
      // Usar el prompt personalizado para generar respuesta
      return await this.generateAIPersonalizedResponse(
        personalizedPrompt,
        analysis,
        limits,
        debtorKnowledge,
        corporateKnowledge
      );
    }
    
    // Fallback a respuestas genéricas si no hay información personalizada
    switch (analysis.intent) {
      case 'discount_request':
        return this.generateDiscountResponse(analysis, limits, proposalData, debtorKnowledge);
        
      case 'installment_request':
        return this.generateInstallmentResponse(analysis, limits, proposalData, debtorKnowledge);
        
      case 'time_request':
        return this.generateTimeResponse(analysis, limits, proposalData, debtorKnowledge);
        
      case 'agreement':
        return this.generateAgreementResponse(analysis, proposalData, debtorKnowledge);
        
      default:
        return this.generateInquiryResponse(analysis, proposalData, debtorKnowledge);
    }
  }

  /**
   * Genera respuesta para solicitudes de descuento
   */
  generateDiscountResponse(analysis, limits, proposalData, debtorKnowledge = null) {
    const maxDiscount = limits?.maxDiscount || 15;
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    
    return {
      content: `${debtorName}, entiendo tu interés en obtener un mejor descuento. Como cliente de ${corporateName}, puedo ofrecerte hasta un ${maxDiscount}% de descuento adicional sobre la propuesta original.

Con este descuento, tu cuota mensual se reduciría significativamente. ¿Te gustaría que calculemos el nuevo monto con el descuento máximo aplicado?`,
      confidence: 0.9,
      keywords: ['discount', 'calculation'],
      type: 'discount_offer',
      personalizationLevel: debtorKnowledge ? 'high' : 'medium'
    };
  }

  /**
   * Genera respuesta para solicitudes de cuotas
   */
  generateInstallmentResponse(analysis, limits, proposalData, debtorKnowledge = null) {
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    const communicationStyle = debtorKnowledge?.personalizationData?.communicationStyle || 'professional';
    
    let content = `${debtorName}, claro que podemos ajustar el número de cuotas para que se adapte mejor a tu presupuesto. `;
    
    if (communicationStyle === 'formal') {
      content += `Como cliente de ${corporateName}, le ofrecemos opciones flexibles de pago en 3, 6, 9 o 12 cuotas.

¿Cuál de estas opciones le funcionaría mejor? También podemos combinar un mayor número de cuotas con algún descuento adicional si lo necesita.`;
    } else {
      content += `Tenemos opciones flexibles de pago en 3, 6, 9 o 12 cuotas.

¿Cuál de estas opciones te funcionaría mejor? También podemos combinar un mayor número de cuotas con algún descuento adicional si lo necesitas.`;
    }
    
    return {
      content,
      confidence: 0.95,
      keywords: ['installments', 'flexibility'],
      type: 'installment_options',
      personalizationLevel: debtorKnowledge ? 'high' : 'medium'
    };
  }

  /**
   * Genera respuesta para solicitudes de tiempo
   */
  generateTimeResponse(analysis, limits, proposalData, debtorKnowledge = null) {
    const maxTerm = limits?.maxTerm || 12;
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const daysOverdue = debtorKnowledge?.debtInfo?.daysOverdue || 0;
    
    let content = `${debtorName}, entiendo que necesitas más tiempo para pagar. `;
    
    if (daysOverdue > 60) {
      content += `Entendemos tu situación actual con ${daysOverdue} días de mora. `;
    }
    
    content += `El plazo máximo que podemos ofrecer es de ${maxTerm} meses adicionales.

Esto te daría más flexibilidad en tus pagos mensuales. ¿Te gustaría que evaluemos cómo quedarían tus cuotas con el plazo extendido?`;
    
    return {
      content,
      confidence: 0.85,
      keywords: ['time', 'extension'],
      type: 'time_extension',
      personalizationLevel: debtorKnowledge ? 'high' : 'medium'
    };
  }

  /**
   * Genera respuesta para acuerdos
   */
  generateAgreementResponse(analysis, proposalData, debtorKnowledge = null) {
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    const communicationStyle = debtorKnowledge?.personalizationData?.communicationStyle || 'professional';
    
    let greeting = communicationStyle === 'formal' ? `${debtorName}, excelente` : `¡Excelente, ${debtorName}!`;
    
    return {
      content: `${greeting}! Me alegra que hayamos llegado a un acuerdo como cliente de ${corporateName}. Para finalizar, te confirmaré los términos:

${this.generateAgreementSummary(proposalData, debtorKnowledge)}

¿Estás de acuerdo para proceder con el procesamiento del pago según estos términos?`,
      confidence: 1.0,
      keywords: ['agreement', 'confirmation'],
      type: 'agreement_confirmation',
      personalizationLevel: debtorKnowledge ? 'high' : 'medium'
    };
  }

  /**
   * Genera respuesta para consultas generales
   */
  generateInquiryResponse(analysis, proposalData, debtorKnowledge = null) {
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    const riskLevel = debtorKnowledge?.personalizationData?.riskLevel || 'medium';
    
    let content = `${debtorName}, gracias por tu mensaje. Como cliente de ${corporateName}, estoy aquí para ayudarte a encontrar la mejor opción de pago. `;
    
    if (riskLevel === 'high') {
      content += `Entendemos tu situación y queremos ofrecerte las mejores opciones posibles. `;
    }
    
    content += `

Basado en tu propuesta actual, podemos trabajar en:
- Ajustar el número de cuotas (3, 6, 9 o 12 meses)
- Revisar opciones de descuento adicionales
- Modificar fechas de pago
- Cualquier otra pregunta que tengas sobre tu propuesta

¿Cuál de estos aspectos te gustaría que revisáramos primero?`;
    
    return {
      content,
      confidence: 0.7,
      keywords: ['help', 'options'],
      type: 'general_inquiry',
      personalizationLevel: debtorKnowledge ? 'high' : 'medium'
    };
  }

  /**
   * Genera mensaje de escalada
   */
  generateEscalationMessage(reason, debtorKnowledge = null) {
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    
    const messages = {
      user_requested_human: `${debtorName}, entiendo que prefieres hablar con una persona. Te transferiré inmediatamente con uno de nuestros representantes especializados de ${corporateName}.`,
      message_limit_exceeded: `${debtorName}, para asegurar la mejor atención como cliente de ${corporateName}, voy a transferirte con uno de nuestros representantes humanos que podrá ayudarte mejor.`,
      negative_sentiment: `${debtorName}, noté que estás teniendo dificultades. Permíteme conectarte con un representante humano de ${corporateName} que podrá ofrecerte una asistencia más personalizada.`,
      high_discount_request: `${debtorName}, el descuento que solicitas requiere aprobación especial. Te conectaré con un representante de ${corporateName} que pueda evaluar tu caso.`,
      extended_time_request: `${debtorName}, el plazo que solicitas necesita revisión adicional. Un representante humano de ${corporateName} te ayudará a encontrar la mejor solución.`,
      technical_error: `${debtorName}, lo siento, he tenido un problema técnico. Un representante humano de ${corporateName} te atenderá en breve.`
    };

    return messages[reason] || messages.technical_error;
  }

  /**
   * Utilidades
   */
  calculateComplexity(message) {
    const words = message.split(' ').length;
    if (words < 10) return 'low';
    if (words < 25) return 'medium';
    return 'high';
  }

  extractDiscountAmount(message) {
    const match = message.match(/(\d+)%?/);
    return match ? parseInt(match[1]) : 0;
  }

  extractTimeAmount(message) {
    const match = message.match(/(\d+)\s*mes(es)?/);
    return match ? parseInt(match[1]) : 0;
  }

  generateAgreementSummary(proposalData, debtorKnowledge = null) {
    const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
    const corporateName = debtorKnowledge?.corporateContext?.corporateClientName || 'nuestra empresa';
    
    let summary = `- Monto total: $${proposalData.totalAmount?.toLocaleString() || 'N/A'}
- Número de cuotas: ${proposalData.installments || 'N/A'}
- Valor por cuota: $${proposalData.installmentAmount?.toLocaleString() || 'N/A'}`;
    
    if (debtorKnowledge) {
      summary += `
- Cliente: ${debtorName}
- Empresa: ${corporateName}
- RUT: ${debtorKnowledge.personalInfo.rut}`;
    }
    
    return summary;
  }

  getDefaultConfig() {
    return {
      max_negotiation_discount: 15,
      max_negotiation_term: 12,
      escalation_thresholds: {
        conversationLength: 15,
        discountRequested: 20,
        timeRequested: 18
      }
    };
  }

  /**
   * Guarda un mensaje en la base de datos
   * @param {string} conversationId - ID de la conversación
   * @param {string} content - Contenido del mensaje
   * @param {string} senderType - Tipo de remitente
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} Mensaje guardado
   */
  async saveMessage(conversationId, content, senderType, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('negotiation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de mensajes de una conversación
   * @param {string} conversationId - ID de la conversación
   * @returns {Promise<Array>} Lista de mensajes
   */
  async getConversationHistory(conversationId) {
    try {
      const { data, error } = await supabase
        .from('negotiation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }
  /**
   * Genera respuesta personalizada usando IA con prompt completo
   */
  async generateAIPersonalizedResponse(personalizedPrompt, analysis, limits, debtorKnowledge, corporateKnowledge) {
    try {
      // Aquí podrías integrar con un servicio de IA real como OpenAI
      // Por ahora, usamos una versión mejorada de las respuestas existentes
      
      const debtorName = debtorKnowledge?.personalInfo?.name || 'Cliente';
      const corporateName = corporateKnowledge?.corporateClient?.name || 'nuestra empresa';
      const communicationStyle = debtorKnowledge?.personalizationData?.communicationStyle || 'professional';
      const riskLevel = debtorKnowledge?.personalizationData?.riskLevel || 'medium';
      
      // Respuesta ultra-personalizada basada en todo el contexto
      let content = `${debtorName}, `;
      
      if (communicationStyle === 'formal') {
        content += `como cliente valioso de ${corporateName}, `;
      } else {
        content += `como cliente de ${corporateName}, `;
      }
      
      // Personalizar según intención
      switch (analysis.intent) {
        case 'discount_request':
          content += `he revisado tu situación y puedo ofrecerte opciones especiales de descuento. `;
          if (riskLevel === 'low') {
            content += `Por tu buen historial, calificas para nuestros mejores términos. `;
          }
          break;
        case 'installment_request':
          content += `entiendo que necesitas flexibilidad en los pagos. `;
          content += `Tenemos planes personalizados que se ajustan a tu perfil. `;
          break;
        case 'time_request':
          content += `comprendo que necesitas más tiempo. `;
          content += `Podemos evaluar opciones extendidas según tu caso particular. `;
          break;
        default:
          content += `estoy aquí para ayudarte con las mejores opciones para tu situación. `;
      }
      
      content += `¿Podrías indicarme más detalles sobre lo que necesitas para poder darte la mejor solución posible?`;
      
      return {
        content,
        confidence: 0.95,
        keywords: ['personalized', 'corporate', 'solution'],
        type: 'personalized_response',
        personalizationLevel: 'ultra_high'
      };
    } catch (error) {
      console.error('Error generating AI personalized response:', error);
      // Fallback a respuesta genérica
      return this.generateInquiryResponse(analysis, {}, debtorKnowledge);
    }
  }
}

// Exportar instancia única
export const negotiationAIService = new NegotiationAIService();