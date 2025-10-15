/**
 * useCompanyMessages Hook
 *
 * Hook personalizado para gestionar mensajes y conversaciones desde la perspectiva de empresas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import realtimeService from '../services/realtimeService';

export const useCompanyMessages = () => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [debtors, setDebtors] = useState([]);
  const [corporateClients, setCorporateClients] = useState([]);
  
  const subscriptionsRef = useRef(new Map());

  /**
   * Carga las conversaciones de la empresa desde la base de datos
   */
  const loadConversations = useCallback(async () => {
    if (!profile?.company?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const companyId = profile.company.id;
      const result = await messageService.getConversations(null, companyId);

      if (result.success) {
        // Transformar datos para el formato esperado por la UI
        const transformedConversations = result.conversations.map(conv => ({
          id: conv.id,
          debtorName: conv.debtor_name || 'Usuario desconocido',
          debtorRut: conv.debtor_rut || 'Sin RUT',
          subject: conv.subject || 'Sin asunto',
          status: conv.status,
          lastMessage: conv.last_message_content || 'Sin mensajes',
          timestamp: new Date(conv.last_message_at),
          unreadCount: conv.unread_count_company || 0,
          corporateClientId: conv.company_id,
          messages: [], // Se cargarán bajo demanda
          debtId: conv.debt_id,
          priority: conv.priority,
          metadata: conv.metadata
        }));
        
        setConversations(transformedConversations);
        
        // Cargar conteo de mensajes no leídos
        const unreadResult = await messageService.getUnreadCount(null, companyId);
        if (unreadResult.success) {
          setUnreadCount(unreadResult.unreadCount);
        }
      } else {
        setError(result.error);
        setConversations([]);
      }

    } catch (err) {
      console.error('Error loading company conversations:', err);
      
      // Si las tablas no existen, mostrar mensaje amigable
      if (err.message?.includes('relation') || err.message?.includes('does not exist') || err.code === 'PGRST116') {
        console.log('📋 Tablas de mensajería no encontradas. El sistema funcionará con datos de demo.');
        setError('Las tablas de mensajería no están configuradas. Contacta al administrador.');
        setConversations([]);
      } else {
        setError('Error al cargar conversaciones');
        setConversations([]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  /**
   * Suscripción a cambios en tiempo real de conversaciones de la empresa
   */
  const subscribeToRealtimeUpdates = useCallback(() => {
    if (!profile?.company?.id) return;

    // Limpiar suscripciones anteriores
    subscriptionsRef.current.forEach(id => {
      messageService.unsubscribe(id);
    });
    subscriptionsRef.current.clear();

    // Suscribir a cambios en conversaciones de la empresa
    const convSubscriptionId = messageService.subscribeToCompanyConversations(
      profile.company.id,
      async (payload) => {
        console.log('Realtime company conversation update:', payload);
        
        // Recargar conversaciones cuando haya cambios
        await loadConversations();
        
        // Mostrar notificación visual para nuevos mensajes
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const conversation = payload.new || payload.record;
          if (conversation.unread_count_company > 0) {
            showNotificationMessage('Nuevo mensaje de deudor', 'success');
          }
        }
      }
    );
    
    subscriptionsRef.current.set('conversations', convSubscriptionId);

  }, [profile, loadConversations]);

  /**
   * Carga una conversación específica con todos sus mensajes
   */
  const getConversation = useCallback(async (conversationId) => {
    try {
      setSendingMessage(true);
      
      const result = await messageService.getConversation(conversationId);
      
      if (result.success) {
        // Transformar datos para el formato esperado
        const transformedConversation = {
          ...result.conversation,
          debtorName: result.conversation.debtor_name || 'Usuario desconocido',
          debtorRut: result.conversation.debtor_rut || 'Sin RUT',
          messages: result.conversation.messages?.map(msg => ({
            id: msg.id,
            sender: msg.sender_type === 'debtor' ? 'debtor' : 'company',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            metadata: msg.metadata,
            aiGenerated: msg.ai_generated,
            aiConfidence: msg.ai_confidence,
            escalationTriggered: msg.escalation_triggered
          })) || []
        };
        
        setSelectedConversation(transformedConversation);
        
        // Marcar mensajes como leídos
        await messageService.markMessagesAsRead(conversationId, profile.user?.id);
        
        // Actualizar conteo de no leídos
        const unreadResult = await messageService.getUnreadCount(null, profile.company.id);
        if (unreadResult.success) {
          setUnreadCount(unreadResult.unreadCount);
        }
        
        return transformedConversation;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      console.error('Error getting company conversation:', err);
      setError('Error al cargar conversación');
      return null;
    } finally {
      setSendingMessage(false);
    }
  }, [profile]);

  /**
   * Envía un mensaje como empresa
   */
  const sendMessage = useCallback(async (conversationId, messageData) => {
    try {
      setSendingMessage(true);
      
      const result = await messageService.sendMessage(conversationId, {
        senderId: profile.user?.id,
        senderType: 'company',
        content: messageData.content,
        contentType: messageData.contentType || 'text',
        metadata: {
          ...messageData.metadata,
          aiGenerated: messageData.aiGenerated || false,
          aiConfidence: messageData.aiConfidence || null,
          escalationTriggered: messageData.escalationTriggered || false,
          escalationReason: messageData.escalationReason || null
        },
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
      console.error('Error sending company message:', err);
      const errorMessage = 'Error al enviar mensaje';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSendingMessage(false);
    }
  }, [profile, selectedConversation, getConversation]);

  /**
   * Carga deudores de la empresa
   */
  const loadDebtors = useCallback(async () => {
    if (!profile?.company?.id) return;

    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { getCompanyDebts } = await import('../services/databaseService');
      const result = await getCompanyDebts(profile.company.id);

      if (!result.error && result.debts) {
        // Extraer deudores únicos de las deudas
        const debtorsMap = new Map();

        result.debts.forEach(debt => {
          const debtorId = debt.user_id || debt.user?.id;
          const debtorName = debt.user?.full_name || 'Usuario desconocido';
          const debtorRut = debt.user?.rut || 'Sin RUT';

          if (!debtorsMap.has(debtorId)) {
            debtorsMap.set(debtorId, {
              id: debtorId,
              name: debtorName,
              rut: debtorRut,
              clientType: 'individual',
              corporateClientId: profile.company.id,
              debts: []
            });
          }

          // Agregar la deuda al deudor
          const debtor = debtorsMap.get(debtorId);
          debtor.debts.push({
            id: debt.id,
            type: debt.type,
            amount: parseFloat(debt.current_amount || debt.original_amount),
            status: debt.status,
            dueDate: new Date(debt.due_date),
            daysOverdue: debt.days_overdue || 0
          });
        });

        setDebtors(Array.from(debtorsMap.values()));
      }
    } catch (err) {
      console.error('Error loading debtors:', err);
    }
  }, [profile]);

  /**
   * Carga clientes corporativos
   */
  const loadCorporateClients = useCallback(async () => {
    if (!profile?.company?.id) return;

    try {
      const { getCorporateClients } = await import('../services/databaseService');
      const result = await getCorporateClients(profile.company.id);

      if (!result.error && result.corporateClients) {
        setCorporateClients(result.corporateClients);
      }
    } catch (err) {
      console.error('Error loading corporate clients:', err);
    }
  }, [profile]);

  /**
   * Busca conversaciones por texto
   */
  const searchConversations = useCallback(async (searchText) => {
    try {
      const result = await messageService.searchConversations(
        null,
        profile.company.id,
        searchText
      );

      if (result.success) {
        return result.conversations.map(conv => ({
          id: conv.id,
          debtorName: conv.debtor_name || 'Usuario desconocido',
          debtorRut: conv.debtor_rut || 'Sin RUT',
          subject: conv.subject || 'Sin asunto',
          status: conv.status,
          lastMessage: conv.messages?.[0]?.content || 'Sin mensajes',
          timestamp: new Date(conv.last_message_at),
          unreadCount: conv.unread_count_company || 0
        }));
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      console.error('Error searching company conversations:', err);
      setError('Error al buscar conversaciones');
      return [];
    }
  }, [profile]);

  /**
   * Obtiene estadísticas de mensajes
   */
  const getStats = useCallback(() => {
    const total = conversations.length;
    const unread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const active = conversations.filter(c => c.status === 'active').length;

    return {
      total,
      unread,
      unreadCount,
      activeConversations: active,
      debtorsCount: debtors.length,
      corporateClientsCount: corporateClients.length
    };
  }, [conversations, unreadCount, debtors, corporateClients]);

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

  // Cargar datos al montar
  useEffect(() => {
    if (profile?.company?.id) {
      loadConversations();
      loadDebtors();
      loadCorporateClients();
    }
  }, [profile, loadConversations, loadDebtors, loadCorporateClients]);

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
    debtors,
    corporateClients,
    loadConversations,
    getConversation,
    sendMessage,
    searchConversations,
    getStats,
    setSelectedConversation,
    setUnreadCount,
    loadDebtors,
    loadCorporateClients
  };
};

export default useCompanyMessages;