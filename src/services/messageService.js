/**
 * Message Service
 * 
 * Servicio central para todas las operaciones de mensajería
 */

import { supabase } from '../config/supabase';
import realtimeService from './realtimeService';

class MessageService {
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Crea una nueva conversación
   */
  async createConversation(data) {
    try {
      const conversationData = {
        debtor_id: data.debtorId,
        debtor_name: data.debtorName || 'Usuario desconocido',
        debtor_rut: data.debtorRut || 'Sin RUT',
        company_id: data.companyId,
        company_name: data.companyName || 'Empresa',
        subject: data.subject,
        status: data.status || 'active',
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) throw error;

      // Si hay mensaje inicial, crearlo
      if (data.initialMessage) {
        await this.sendMessage(conversation.id, {
          senderId: data.senderId,
          senderType: data.senderType || 'company',
          content: data.initialMessage,
          contentType: 'text'
        });
      }

      return { success: true, conversation };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía un mensaje a una conversación
   */
  async sendMessage(conversationId, messageData) {
    try {
      const message = {
        conversation_id: conversationId,
        sender_id: messageData.senderId,
        sender_type: messageData.senderType,
        content: messageData.content,
        content_type: messageData.contentType || 'text',
        metadata: messageData.metadata || {},
        ai_generated: messageData.aiGenerated || false,
        ai_confidence: messageData.aiConfidence || null,
        escalation_triggered: messageData.escalationTriggered || false,
        escalation_reason: messageData.escalationReason || null,
        created_at: new Date().toISOString()
      };

      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      // Actualizar último mensaje de la conversación
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_content: messageData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return { success: true, message: newMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene conversaciones de un usuario o empresa
   */
  async getConversations(userId = null, companyId = null) {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            sender_type,
            created_at
          )
        `)
        .order('last_message_at', { ascending: false });

      if (userId) {
        query = query.eq('debtor_id', userId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: conversations, error } = await query;

      if (error) throw error;

      return { success: true, conversations };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene una conversación específica con sus mensajes
   */
  async getConversation(conversationId) {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            sender_id,
            sender_type,
            content,
            content_type,
            metadata,
            ai_generated,
            ai_confidence,
            escalation_triggered,
            escalation_reason,
            read_at,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return { success: true, conversation };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marca mensajes como leídos
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_type', 'company'); // Solo marcar mensajes que no son de la empresa

      if (error) throw error;

      // Actualizar contador de no leídos
      await supabase
        .from('conversations')
        .update({ 
          unread_count_company: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el conteo de mensajes no leídos
   */
  async getUnreadCount(userId = null, companyId = null) {
    try {
      let query = supabase
        .from('conversations')
        .select('unread_count_company');

      if (userId) {
        query = query.eq('debtor_id', userId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const unreadCount = data.reduce((sum, conv) => sum + (conv.unread_count_company || 0), 0);

      return { success: true, unreadCount };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: error.message, unreadCount: 0 };
    }
  }

  /**
   * Busca conversaciones por texto
   */
  async searchConversations(userId = null, companyId = null, searchText) {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          messages (
            content,
            created_at
          )
        `)
        .or(`subject.ilike.%${searchText}%,debtor_name.ilike.%${searchText}%`);

      if (userId) {
        query = query.eq('debtor_id', userId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: conversations, error } = await query;

      if (error) throw error;

      return { success: true, conversations };
    } catch (error) {
      console.error('Error searching conversations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suscribe a conversaciones de una empresa
   */
  subscribeToCompanyConversations(companyId, callback) {
    const subscriptionId = `company_conversations_${companyId}`;
    
    const channel = realtimeService.subscribeToTable(
      'conversations',
      '*',
      callback,
      `company_id=eq.${companyId}`
    );

    this.subscriptions.set(subscriptionId, channel);
    return subscriptionId;
  }

  /**
   * Suscribe a mensajes de una conversación
   */
  subscribeToConversationMessages(conversationId, callback) {
    const subscriptionId = `conversation_messages_${conversationId}`;
    
    const channel = realtimeService.subscribeToTable(
      'messages',
      '*',
      callback,
      `conversation_id=eq.${conversationId}`
    );

    this.subscriptions.set(subscriptionId, channel);
    return subscriptionId;
  }

  /**
   * Cancela una suscripción
   */
  unsubscribe(subscriptionId) {
    const channel = this.subscriptions.get(subscriptionId);
    if (channel) {
      realtimeService.unsubscribe(channel);
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Cancela todas las suscripciones
   */
  unsubscribeAll() {
    this.subscriptions.forEach((channel, subscriptionId) => {
      realtimeService.unsubscribe(channel);
    });
    this.subscriptions.clear();
  }
}

// Crear y exportar instancia única
const messageService = new MessageService();
export default messageService;