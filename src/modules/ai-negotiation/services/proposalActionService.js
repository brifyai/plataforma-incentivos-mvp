/**
 * Servicio de Acciones de Propuestas
 *
 * Maneja las respuestas a las propuestas: Aceptar, Rechazar, Renegociar
 */

import { supabase } from '../../../config/supabase.js';
import { negotiationAIService } from './negotiationAIService.js';

export class ProposalActionService {
  
  /**
   * Maneja la respuesta a una propuesta
   * @param {string} proposalId - ID de la propuesta
   * @param {string} action - Acción (ACCEPT, REJECT, NEGOTIATE)
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Resultado de la acción
   */
  async handleProposalResponse(proposalId, action, debtorData) {
    try {
      switch(action) {
        case 'ACCEPT':
          return await this.processAcceptance(proposalId, debtorData);
          
        case 'REJECT':
          return await this.processRejection(proposalId, debtorData);
          
        case 'NEGOTIATE':
          return await this.initiateNegotiation(proposalId, debtorData);
          
        default:
          throw new Error(`Acción no válida: ${action}`);
      }
    } catch (error) {
      console.error('Error handling proposal response:', error);
      throw error;
    }
  }

  /**
   * Procesa la aceptación de una propuesta
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processAcceptance(proposalId, debtorData) {
    try {
      // 1. Actualizar estado de la propuesta
      await this.updateProposalStatus(proposalId, 'accepted');
      
      // 2. Crear acuerdo de pago
      const agreement = await this.createPaymentAgreement(proposalId, debtorData);
      
      // 3. Enviar confirmación
      await this.sendAcceptanceConfirmation(proposalId, debtorData, agreement);
      
      // 4. Registrar métricas
      await this.recordMetrics(proposalId, 'accepted', {
        processingTime: Date.now(),
        debtorId: debtorData.id
      });
      
      return {
        success: true,
        action: 'accepted',
        agreementId: agreement.id,
        message: 'Propuesta aceptada exitosamente'
      };
    } catch (error) {
      console.error('Error processing acceptance:', error);
      throw error;
    }
  }

  /**
   * Procesa el rechazo de una propuesta
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processRejection(proposalId, debtorData) {
    try {
      // 1. Actualizar estado de la propuesta
      await this.updateProposalStatus(proposalId, 'rejected');
      
      // 2. Registrar motivo del rechazo (si se proporciona)
      if (debtorData.rejectionReason) {
        await this.recordRejectionReason(proposalId, debtorData.rejectionReason);
      }
      
      // 3. Enviar notificación de rechazo
      await this.sendRejectionNotification(proposalId, debtorData);
      
      // 4. Registrar métricas
      await this.recordMetrics(proposalId, 'rejected', {
        processingTime: Date.now(),
        debtorId: debtorData.id,
        reason: debtorData.rejectionReason
      });
      
      return {
        success: true,
        action: 'rejected',
        message: 'Propuesta rechazada'
      };
    } catch (error) {
      console.error('Error processing rejection:', error);
      throw error;
    }
  }

  /**
   * Inicia una negociación
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Resultado de la iniciación
   */
  async initiateNegotiation(proposalId, debtorData) {
    try {
      // 1. Actualizar estado de la propuesta
      await this.updateProposalStatus(proposalId, 'negotiating');
      
      // 2. Crear conversación de negociación
      const conversation = await this.createNegotiationConversation(proposalId, debtorData);
      
      // 3. Configurar IA para esta conversación
      await this.configureAINegotiation(conversation.id, proposalId);
      
      // 4. Enviar mensaje inicial de IA
      const initialMessage = await this.generateInitialNegotiationMessage(proposalId, debtorData);
      await this.sendNegotiationMessage(conversation.id, initialMessage, 'ai_assistant');
      
      // 5. Registrar métricas
      await this.recordMetrics(proposalId, 'negotiating', {
        processingTime: Date.now(),
        debtorId: debtorData.id,
        conversationId: conversation.id
      });
      
      return {
        success: true,
        action: 'negotiating',
        conversationId: conversation.id,
        message: 'Negociación iniciada'
      };
    } catch (error) {
      console.error('Error initiating negotiation:', error);
      throw error;
    }
  }

  /**
   * Crea una conversación de negociación
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Conversación creada
   */
  async createNegotiationConversation(proposalId, debtorData) {
    try {
      // Obtener datos de la propuesta
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) {
        throw proposalError;
      }

      // Crear conversación en la base de datos
      const { data: conversation, error: conversationError } = await supabase
        .from('negotiation_conversations')
        .insert({
          proposal_id: proposalId,
          user_id: debtorData.id,
          company_id: debtorData.companyId,
          status: 'active',
          ai_enabled: true,
          negotiation_context: {
            proposal: proposal,
            debtor: debtorData,
            startedAt: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        throw conversationError;
      }

      console.log('Negotiation conversation created:', conversation);
      return conversation;
    } catch (error) {
      console.error('Error creating negotiation conversation:', error);
      throw error;
    }
  }

  /**
   * Configura la IA para una conversación de negociación
   * @param {string} conversationId - ID de la conversación
   * @param {string} proposalId - ID de la propuesta
   * @returns {Promise<void>}
   */
  async configureAINegotiation(conversationId, proposalId) {
    try {
      // Obtener datos de la propuesta
      const proposalData = await this.getProposalData(proposalId);
      
      // Configurar IA con el contexto de la propuesta
      await negotiationAIService.configureNegotiationContext(conversationId, proposalData);
      
      console.log(`AI configured for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error configuring AI negotiation:', error);
      throw error;
    }
  }

  /**
   * Genera el mensaje inicial de negociación
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<string>} Mensaje inicial
   */
  async generateInitialNegotiationMessage(proposalId, debtorData) {
    try {
      const proposalData = await this.getProposalData(proposalId);
      
      const message = `¡Hola ${debtorData.name}! Soy el asistente virtual de ${proposalData.companyName}.

Entiendo que estás interesado en renegociar tu propuesta de pago. Estoy aquí para ayudarte a encontrar una solución que se ajuste a tu situación.

Tu propuesta actual es:
- Monto total: $${proposalData.totalAmount.toLocaleString()}
- Cuotas propuestas: ${proposalData.installments}
- Valor por cuota: $${proposalData.installmentAmount.toLocaleString()}

¿En qué aspectos te gustaría que trabajáramos? Puedo ayudarte con:
- Ajustar el número de cuotas
- Revisar opciones de descuento
- Modificar fechas de pago
- Cualquier otra pregunta que tengas

¿Por dónde te gustaría empezar?`;
      
      return message;
    } catch (error) {
      console.error('Error generating initial negotiation message:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje de negociación
   * @param {string} conversationId - ID de la conversación
   * @param {string} content - Contenido del mensaje
   * @param {string} senderType - Tipo de remitente
   * @returns {Promise<Object>} Mensaje enviado
   */
  async sendNegotiationMessage(conversationId, content, senderType) {
    try {
      // Guardar mensaje en la base de datos
      const message = await negotiationAIService.saveMessage(
        conversationId,
        content,
        senderType,
        {
          aiGenerated: senderType === 'ai_assistant',
          timestamp: new Date().toISOString()
        }
      );
      
      console.log('Negotiation message saved:', message);
      return message;
    } catch (error) {
      console.error('Error sending negotiation message:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos de una propuesta
   * @param {string} proposalId - ID de la propuesta
   * @returns {Promise<Object>} Datos de la propuesta
   */
  async getProposalData(proposalId) {
    try {
      // Obtener datos reales de la propuesta
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select(`
          *,
          companies:company_id (
            name,
            business_name
          ),
          debts:debt_id (
            amount,
            due_date
          )
        `)
        .eq('id', proposalId)
        .single();

      if (error) {
        throw error;
      }

      return {
        id: proposal.id,
        companyName: proposal.companies?.business_name || proposal.companies?.name || 'Empresa',
        totalAmount: proposal.total_amount || proposal.debts?.amount || 0,
        installments: proposal.installments || 6,
        installmentAmount: proposal.installment_amount || 0,
        dueDate: proposal.due_date || proposal.debts?.due_date,
        status: proposal.status,
        companyId: proposal.company_id
      };
    } catch (error) {
      console.error('Error getting proposal data:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una propuesta
   * @param {string} proposalId - ID de la propuesta
   * @param {string} status - Nuevo estado
   * @returns {Promise<void>}
   */
  async updateProposalStatus(proposalId, status) {
    try {
      // Actualizar estado en la base de datos
      const { error } = await supabase
        .from('proposals')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) {
        throw error;
      }

      console.log(`Proposal ${proposalId} status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      throw error;
    }
  }

  /**
   * Crea un acuerdo de pago
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Acuerdo creado
   */
  async createPaymentAgreement(proposalId, debtorData) {
    try {
      // Obtener datos de la propuesta
      const proposalData = await this.getProposalData(proposalId);
      
      // Crear acuerdo de pago en la base de datos
      const { data: agreement, error } = await supabase
        .from('agreements')
        .insert({
          proposal_id: proposalId,
          debtor_id: debtorData.id,
          company_id: proposalData.companyId,
          total_amount: proposalData.totalAmount,
          installments: proposalData.installments,
          installment_amount: proposalData.installmentAmount,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Payment agreement created:', agreement);
      return agreement;
    } catch (error) {
      console.error('Error creating payment agreement:', error);
      throw error;
    }
  }

  /**
   * Envía confirmación de aceptación
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @param {Object} agreement - Acuerdo creado
   * @returns {Promise<void>}
   */
  async sendAcceptanceConfirmation(proposalId, debtorData, agreement) {
    try {
      console.log('Sending acceptance confirmation:', { proposalId, debtorData, agreement });
    } catch (error) {
      console.error('Error sending acceptance confirmation:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de rechazo
   * @param {string} proposalId - ID de la propuesta
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<void>}
   */
  async sendRejectionNotification(proposalId, debtorData) {
    try {
      console.log('Sending rejection notification:', { proposalId, debtorData });
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      throw error;
    }
  }

  /**
   * Registra el motivo de rechazo
   * @param {string} proposalId - ID de la propuesta
   * @param {string} reason - Motivo del rechazo
   * @returns {Promise<void>}
   */
  async recordRejectionReason(proposalId, reason) {
    try {
      console.log('Recording rejection reason:', { proposalId, reason });
    } catch (error) {
      console.error('Error recording rejection reason:', error);
      throw error;
    }
  }

  /**
   * Registra métricas
   * @param {string} proposalId - ID de la propuesta
   * @param {string} action - Acción realizada
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<void>}
   */
  async recordMetrics(proposalId, action, metadata) {
    try {
      // Guardar métricas en la tabla de analytics
      const { error } = await supabase
        .from('negotiation_analytics')
        .insert({
          proposal_id: proposalId,
          action,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log('Metrics recorded:', { proposalId, action, metadata });
    } catch (error) {
      console.error('Error recording metrics:', error);
      throw error;
    }
  }
}

// Exportar instancia única
export const proposalActionService = new ProposalActionService();