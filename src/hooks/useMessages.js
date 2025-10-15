/**
 * useMessages Hook
 *
 * Hook personalizado para gestionar mensajes y conversaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications } from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const useMessages = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las conversaciones del usuario
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const role = profile?.role || user?.user_metadata?.role;

    try {
      setLoading(true);
      setError(null);

      // Por ahora, devolver conversaciones de ejemplo con propuestas
      // En el futuro, esto debería llamar a un servicio que obtenga conversaciones de la BD
      const mockConversations = [
        {
          id: 'conv1',
          company_name: 'Banco Estado',
          last_message: 'Tenemos una excelente propuesta de descuento del 25% para tu deuda pendiente.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          unread_count: 1,
          messages: [
            {
              id: 'msg1',
              sender: 'company',
              content: 'Hola! Hemos revisado tu situación financiera y tenemos una propuesta especial para ti.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'msg2',
              sender: 'company',
              content: 'Tenemos una excelente propuesta de descuento del 25% para tu deuda pendiente. Si aceptas, podrías ahorrar $125.000 en intereses.',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            }
          ]
        },
        {
          id: 'conv2',
          company_name: 'Cencosud',
          last_message: '¿Te interesa negociar un plan de pagos más flexible?',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
          unread_count: 0,
          messages: [
            {
              id: 'msg3',
              sender: 'company',
              content: 'Hola, somos de Cencosud y queremos ayudarte con tu deuda.',
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'msg4',
              sender: 'company',
              content: '¿Te interesa negociar un plan de pagos más flexible? Podemos ofrecerte 12 cuotas sin intereses.',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            }
          ]
        },
        {
          id: 'conv3',
          company_name: 'Ripley',
          last_message: 'Mensaje enviado',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
          unread_count: 0,
          messages: [
            {
              id: 'msg5',
              sender: 'company',
              content: 'Gracias por contactarnos. Estamos evaluando tu caso.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            }
          ]
        }
      ];

      setConversations(mockConversations);

    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error al cargar conversaciones');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar conversaciones al montar
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Obtiene una conversación específica por ID
   */
  const getConversation = useCallback(async (conversationId) => {
    try {
      // Por ahora, buscar en la lista local
      const conversation = conversations.find(c => c.id === conversationId);
      return conversation;
    } catch (err) {
      console.error('Error getting conversation:', err);
      throw err;
    }
  }, [conversations]);

  /**
   * Envía un mensaje
   */
  const sendMessage = useCallback(async (conversationId, messageData) => {
    try {
      // Por ahora, simular envío
      // En el futuro, esto debería llamar a un servicio que guarde el mensaje en la BD
      console.log('Sending message:', conversationId, messageData);
      return { success: true };
    } catch (err) {
      console.error('Error sending message:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Obtiene estadísticas de mensajes
   */
  const getStats = useCallback(() => {
    const total = conversations.length;
    const unread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    return {
      total,
      unread,
    };
  }, [conversations]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    getConversation,
    sendMessage,
    getStats,
  };
};

export default useMessages;