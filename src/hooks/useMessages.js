/**
 * useMessages Hook
 *
 * Hook personalizado para gestionar mensajes y conversaciones en tiempo real
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import realtimeService from '../services/realtimeService';

export const useMessages = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const subscriptionsRef = useRef(new Map());

  /**
   * Carga las conversaciones del usuario desde la base de datos
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = user.id;
      const result = await messageService.getConversations(userId);

      if (result.success) {
        setConversations(result.conversations);
        
        // Cargar conteo de mensajes no leídos
        const unreadResult = await messageService.getUnreadCount(userId);
        if (unreadResult.success) {
          setUnreadCount(unreadResult.unreadCount);
        }
      } else {
        setError(result.error);
        setConversations([]);
      }

    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error al cargar conversaciones');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Suscripción a cambios en tiempo real de conversaciones
   */
  const subscribeToRealtimeUpdates = useCallback(() => {
    if (!user) return;

    // Limpiar suscripciones anteriores
    subscriptionsRef.current.forEach(id => {
      messageService.unsubscribe(id);
    });
    subscriptionsRef.current.clear();

    // Suscribir a cambios en conversaciones del usuario
    const convSubscriptionId = messageService.subscribeToUserConversations(
      user.id,
      async (payload) => {
        console.log('Realtime conversation update:', payload);
        
        // Recargar conversaciones cuando haya cambios
        await loadConversations();
        
        // Mostrar notificación visual para nuevos mensajes
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const conversation = payload.new || payload.record;
          if (conversation.unread_count_user > 0) {
            showNotificationMessage('Nuevo mensaje recibido', 'success');
          }
        }
      }
    );
    
    subscriptionsRef.current.set('conversations', convSubscriptionId);

  }, [user, loadConversations]);

  /**
   * Carga una conversación específica con todos sus mensajes
   */
  const getConversation = useCallback(async (conversationId) => {
    try {
      setSendingMessage(true);
      
      const result = await messageService.getConversation(conversationId);
      
      if (result.success) {
        setSelectedConversation(result.conversation);
        
        // Marcar mensajes como leídos
        await messageService.markMessagesAsRead(conversationId, user.id);
        
        // Actualizar conteo de no leídos
        const unreadResult = await messageService.getUnreadCount(user.id);
        if (unreadResult.success) {
          setUnreadCount(unreadResult.unreadCount);
        }
        
        return result.conversation;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      console.error('Error getting conversation:', err);
      setError('Error al cargar conversación');
      return null;
    } finally {
      setSendingMessage(false);
    }
  }, [user]);

  /**
   * Envía un mensaje a una conversación
   */
  const sendMessage = useCallback(async (conversationId, messageData) => {
    try {
      setSendingMessage(true);
      
      const result = await messageService.sendMessage(conversationId, {
        senderId: user.id,
        senderType: 'user',
        content: messageData.content,
        contentType: messageData.contentType || 'text',
        metadata: messageData.metadata || {},
        attachments: messageData.attachments || []
      });

      if (result.success) {
        // Recargar conversación actual si está seleccionada
        if (selectedConversation && selectedConversation.id === conversationId) {
          await getConversation(conversationId);
        }
        
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = 'Error al enviar mensaje';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSendingMessage(false);
    }
  }, [user, selectedConversation, getConversation]);

  /**
   * Crea una nueva conversación
   */
  const createConversation = useCallback(async (conversationData) => {
    try {
      setSendingMessage(true);
      
      const result = await messageService.createConversation({
        userId: user.id,
        companyId: conversationData.companyId,
        debtId: conversationData.debtId || null,
        subject: conversationData.subject,
        priority: conversationData.priority || 'normal',
        metadata: conversationData.metadata || {}
      });

      if (result.success) {
        // Enviar mensaje inicial si se proporciona
        if (conversationData.initialMessage) {
          await sendMessage(result.conversation.id, {
            content: conversationData.initialMessage,
            contentType: 'text'
          });
        }
        
        // Recargar lista de conversaciones
        await loadConversations();
        
        return { success: true, conversation: result.conversation };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      const errorMessage = 'Error al crear conversación';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSendingMessage(false);
    }
  }, [user, sendMessage, loadConversations]);

  /**
   * Busca conversaciones por texto
   */
  const searchConversations = useCallback(async (searchText) => {
    try {
      const result = await messageService.searchConversations(
        user.id,
        null,
        searchText
      );

      if (result.success) {
        return result.conversations;
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      console.error('Error searching conversations:', err);
      setError('Error al buscar conversaciones');
      return [];
    }
  }, [user]);

  /**
   * Obtiene estadísticas de mensajes
   */
  const getStats = useCallback(() => {
    const total = conversations.length;
    const unread = conversations.reduce((sum, c) => sum + (c.unread_count_user || 0), 0);

    return {
      total,
      unread,
      unreadCount,
      activeConversations: conversations.filter(c => c.status === 'active').length
    };
  }, [conversations, unreadCount]);

  /**
   * Muestra una notificación visual temporal
   */
  const showNotificationMessage = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-in-right ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '💬'}
        </div>
        <div class="flex-1">
          <p class="font-medium">${message}</p>
          <p class="text-sm opacity-90">Ahora mismo</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-slide-out-right');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Cargar conversaciones al montar
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    subscribeToRealtimeUpdates();
    
    return () => {
      // Limpiar suscripciones al desmontar
      subscriptionsRef.current.forEach(id => {
        messageService.unsubscribe(id);
      });
    };
  }, [subscribeToRealtimeUpdates]);

  return {
    conversations,
    loading,
    error,
    unreadCount,
    selectedConversation,
    sendingMessage,
    loadConversations,
    getConversation,
    sendMessage,
    createConversation,
    searchConversations,
    getStats,
    setSelectedConversation,
    setUnreadCount
  };
};

export default useMessages;