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

      // Por ahora, devolver conversaciones vacías hasta que se implemente el servicio
      // En el futuro, esto debería llamar a un servicio que obtenga conversaciones de la BD
      setConversations([]);

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