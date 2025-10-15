/**
 * Company Messages Page
 *
 * Página para que las empresas gestionen mensajes y comunicaciones con deudores
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import AIMessageHandler from '../../components/messaging/AIMessageHandler';
import HumanResponseHandler from '../../components/messaging/HumanResponseHandler';
import ConnectionStatus from '../../components/messaging/ConnectionStatus';
import ErrorDisplay from '../../components/messaging/ErrorDisplay';
import { useCompanyMessages, useMessagingErrors } from '../../hooks';
import { getCorporateClients, getCompanyDebts } from '../../services/databaseService';
import messageService from '../../services/messageService';
import { formatDate } from '../../utils/formatters';
import { DEBT_TYPES, DEBT_TYPE_LABELS, DEBT_STATUS } from '../../config/constants';
import Swal from 'sweetalert2';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Search,
  Calendar
} from 'lucide-react';

const CompanyMessagesPage = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Usar el nuevo hook de mensajes de empresa
  const {
    conversations,
    loading,
    loadingCorporateClients,
    error,
    unreadCount,
    selectedConversation,
    sendingMessage,
    debtors,
    corporateClients,
    getConversation,
    sendMessage: sendCompanyMessage,
    loadConversations,
    loadDebtors,
    loadCorporateClients
  } = useCompanyMessages();
  
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [newMessage, setNewMessage] = useState({
    corporateClientId: '',
    subject: '',
    message: '',
    priority: 'normal',
    selectedDebtors: [],
    showDebtorSelection: false,
    offerDetails: {
      discount: 0,
      installmentPlan: false,
      totalInstallments: 1
    }
  });
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [showErrorPanel, setShowErrorPanel] = useState(false);

  // Hook para manejo de errores
  const {
    errors,
    connectionStatus,
    isReconnecting,
    hasErrors,
    hasConnectionIssues,
    isHealthy,
    addError,
    resolveError,
    clearErrors,
    attemptReconnection,
    testMessageSending
  } = useMessagingErrors();

  // Función helper para calcular rangos de fechas
  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Función para aplicar rangos predefinidos
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setDateFilter(dates);
  };

  // Filters state
  const [debtorFilters, setDebtorFilters] = useState({
    clientType: '', // 'individual' or 'corporate'
    debtType: '',
    daysOverdue: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    if (profile?.company?.id) {
      loadConversations();
      loadDebtors();
      loadCorporateClients();
    }
  }, [profile?.company?.id]);

  // Monitorear errores de carga
  useEffect(() => {
    if (error) {
      addError({
        type: 'message',
        message: 'Error al cargar conversaciones',
        details: error,
        severity: 'high'
      });
    }
  }, [error, addError]);

  useEffect(() => {
    if (showNewMessageModal) {
      // Los datos ya están cargados, no necesitamos hacer nada adicional aquí
    }
  }, [showNewMessageModal]);

  // Check for client parameter and auto-open message modal
  useEffect(() => {
    const clientId = searchParams.get('client');
    if (clientId && debtors.length > 0 && !showNewMessageModal) {
      const client = debtors.find(d => d.id === parseInt(clientId));
      if (client) {
        setNewMessage(prev => ({ ...prev, debtorId: clientId }));
        setShowNewMessageModal(true);
        // Remove the client parameter from URL
        setSearchParams({});
      }
    }
  }, [searchParams, debtors, showNewMessageModal, setSearchParams]);

  // loadMessages ya no es necesario - usamos loadConversations del hook

  // loadConversations ya no es necesario - usamos el hook

  const handleOpenConversation = async (conversation) => {
    // Cargar conversación completa con mensajes
    const fullConversation = await getConversation(conversation.id);
    if (fullConversation) {
      // Enriquecer la conversación con información adicional para la IA
      const enrichedConversation = {
        ...fullConversation,
        debtorId: fullConversation.debtorRut, // Usar RUT como identificador único
        corporateClientId: fullConversation.corporateClientId || profile?.company?.id,
        companyId: profile?.company?.id
      };
      setSelectedConversation(enrichedConversation);
      setShowConversationModal(true);
    }
  };

  // Función para obtener el ID del cliente corporativo basado en el nombre del deudor
  const getCorporateClientIdFromDebtor = (debtorName) => {
    const debtor = debtors.find(d => d.name === debtorName);
    return debtor?.corporateClientId || 'corp1'; // Fallback a corp1 para demo
  };

  const handleSendMessage = async (message) => {
    if (!selectedConversation) return;

    try {
      const result = await sendCompanyMessage(selectedConversation.id, {
        content: message.content,
        contentType: 'text',
        metadata: message.metadata || {},
        aiGenerated: message.metadata?.aiGenerated || false,
        aiConfidence: message.metadata?.aiConfidence || null,
        escalationTriggered: message.metadata?.escalationTriggered || false,
        escalationReason: message.metadata?.escalationReason || null
      });

      if (!result.success) {
        console.error('Error sending message:', result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEscalateToHuman = (conversation) => {
    console.log('Escalating to human:', conversation);
    
    // Mostrar confirmación con SweetAlert2
    Swal.fire({
      title: '¿Escalar a Representante Humano?',
      html: `
        <div class="text-left">
          <p>¿Estás seguro que deseas escalar esta conversación con <strong>${conversation.debtorName}</strong> a un representante humano?</p>
          <br>
          <p class="text-sm text-gray-600">Esta acción desactivará la respuesta automática de IA y te permitirá responder manualmente.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, escalar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Actualizar estado de la conversación para indicar que fue escalada
        const updatedConversations = conversations.map(conv =>
          conv.id === conversation.id
            ? { ...conv, escalatedToHuman: true, aiActive: false }
            : conv
        );
        
        // El hook se encargará de actualizar el estado
        
        // Actualizar la conversación seleccionada si está en el modal
        if (showConversationModal && selectedConversation?.id === conversation.id) {
          const updatedSelectedConversation = {
            ...selectedConversation,
            escalatedToHuman: true,
            aiActive: false
          };
          setSelectedConversation(updatedSelectedConversation);
        }
        
        // Mostrar notificación de éxito con SweetAlert2
        Swal.fire({
          title: '¡Conversación Escalada!',
          html: `
            <div class="text-left">
              <div class="mb-3">
                <span class="text-2xl">✅</span>
              </div>
              <p class="mb-2"><strong>Modo humano activado:</strong></p>
              <ul class="text-sm space-y-1">
                <li>👤 <strong>Deudor:</strong> ${conversation.debtorName}</li>
                <li>📞 <strong>RUT:</strong> ${conversation.debtorRut}</li>
                <li>✍️ <strong>Acción:</strong> Ya puedes responder manualmente</li>
              </ul>
              <br>
              <p class="text-sm text-orange-600">El campo de respuesta humana está habilitado en la ventana de chat.</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Entendido'
        });
        
        // Aquí iría la lógica para notificar al sistema de asignación de casos
        // Por ejemplo: enviar notificación, actualizar base de datos, etc.
      }
    });
  };

  // loadDebtors ahora viene del hook useCompanyMessages

  // loadCorporateClients ahora viene del hook useCompanyMessages

  const handleSendBulkMessage = async () => {
    if (!newMessage.corporateClientId || !newMessage.subject || !newMessage.message) {
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (filteredDebtors.length === 0) {
      Swal.fire({
        title: 'Sin Destinatarios',
        text: 'No hay destinatarios que cumplan con los criterios de filtrado',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setSending(true);
    try {
      // Crear campaña de mensajes masivos
      const campaignData = {
        companyId: profile.company.id,
        corporateClientId: newMessage.corporateClientId,
        subject: newMessage.subject,
        message: newMessage.message,
        priority: newMessage.priority,
        offerDetails: newMessage.offerDetails,
        filters: debtorFilters,
        selectedDebtors: filteredDebtors.map(d => d.id),
        totalRecipients: filteredDebtors.length,
        sentBy: profile.id,
        campaignType: 'bulk_offer'
      };

      // Aquí iría la lógica para enviar mensajes masivos
      // Por ahora, simulamos el envío
      console.log('Enviando campaña masiva:', campaignData);

      const clientName = corporateClients.find(c => c.id === newMessage.corporateClientId)?.name;

      Swal.fire({
        title: '¡Campaña Enviada Exitosamente!',
        html: `
          <div class="text-left">
            <div class="mb-3">
              <span class="text-3xl">📤</span>
            </div>
            <p class="mb-3"><strong>Resumen de la campaña:</strong></p>
            <ul class="text-sm space-y-2">
              <li>📊 <strong>Mensajes enviados:</strong> ${filteredDebtors.length}</li>
              <li>🎯 <strong>Campaña:</strong> "${newMessage.subject}"</li>
              <li>🏢 <strong>Cliente:</strong> ${clientName}</li>
              <li>📧 <strong>Asunto:</strong> ${newMessage.subject}</li>
            </ul>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: '¡Perfecto!'
      });

      setShowNewMessageModal(false);
      setNewMessage({
        corporateClientId: '',
        subject: '',
        message: '',
        priority: 'normal',
        selectedDebtors: [],
        showDebtorSelection: false,
        offerDetails: {
          discount: 0,
          installmentPlan: false,
          totalInstallments: 1
        }
      });
      setDebtorFilters({
        clientType: '',
        debtType: '',
        daysOverdue: '',
        minAmount: '',
        maxAmount: ''
      });
      loadConversations(); // Recargar conversaciones
    } catch (error) {
      Swal.fire({
        title: 'Error al Enviar Campaña',
        html: `
          <div class="text-left">
            <p class="mb-2">Ha ocurrido un error al enviar la campaña de mensajes:</p>
            <p class="text-sm text-red-600 bg-red-50 p-2 rounded">${error.message}</p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge variant="warning">Enviado</Badge>;
      case 'read':
        return <Badge variant="success">Leído</Badge>;
      case 'failed':
        return <Badge variant="danger">Fallido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">Alta</Badge>;
      case 'normal':
        return <Badge variant="warning">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary">Baja</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const filteredMessages = conversations.filter(conversation =>
    conversation.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conversation.subject && conversation.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Determine which list to show based on selections
  const availableRecipients = newMessage.corporateClientId
    ? (newMessage.selectedDebtors.length > 0
        ? debtors.filter(d => newMessage.selectedDebtors.includes(d.id))
        : debtors.filter(d => d.corporateClientId === newMessage.corporateClientId))
    : (debtorFilters.clientType === 'corporate' ? corporateClients : debtors);

  // Si no hay datos cargados aún, usar datos de ejemplo
  const effectiveRecipients = availableRecipients.length > 0 ? availableRecipients :
    (newMessage.corporateClientId ? [
      {
        id: '1',
        name: 'María González',
        rut: '12.345.678-9',
        clientType: 'individual',
        corporateClientId: 'corp1',
        debts: [{ id: 'd1', type: 'loan', amount: 2500000, status: 'active', daysOverdue: 5 }]
      },
      {
        id: '3',
        name: 'Ana López',
        rut: '18.345.678-1',
        clientType: 'individual',
        corporateClientId: 'corp1',
        debts: [{ id: 'd3', type: 'loan', amount: 3200000, status: 'active', daysOverdue: 1 }]
      }
    ] : (debtorFilters.clientType === 'corporate' ? [
      {
        id: 'corp1',
        name: 'Empresa XYZ S.A.',
        display_category: 'Corporativo',
        contact_email: 'contacto@empresa-xyz.cl',
        contact_phone: '+56912345678'
      },
      {
        id: 'corp2',
        name: 'Corporación ABC Ltda.',
        display_category: 'Corporativo',
        contact_email: 'info@corporacion-abc.cl',
        contact_phone: '+56987654321'
      }
    ] : [
      {
        id: '1',
        name: 'Juan Pérez',
        rut: '12.345.678-9',
        clientType: 'individual',
        debts: [{ id: 'd1', type: 'credit_card', amount: 500000, status: 'active', daysOverdue: 30 }]
      },
      {
        id: '2',
        name: 'María González',
        rut: '9.876.543-2',
        clientType: 'individual',
        debts: [{ id: 'd2', type: 'mortgage', amount: 2500000, status: 'active', daysOverdue: 15 }]
      }
    ]));

  // Debug logs removed for production

  const filteredDebtors = effectiveRecipients.filter(recipient => {
    // For corporate clients, we don't apply debt filters since they don't have individual debts
    if (debtorFilters.clientType === 'corporate' && !newMessage.corporateClientId) {
      return true; // Show all corporate clients
    }

    // For individual debtors, apply all filters
    // Filter by client type (only if not already filtered by corporate client)
    if (debtorFilters.clientType && recipient.clientType !== debtorFilters.clientType && !newMessage.corporateClientId) {
      return false;
    }

    // Filter by debt type
    if (debtorFilters.debtType) {
      const hasMatchingDebt = recipient.debts?.some(debt => debt.type === debtorFilters.debtType);
      if (!hasMatchingDebt) return false;
    }

    // Filter by days overdue
    if (debtorFilters.daysOverdue) {
      const daysRange = debtorFilters.daysOverdue.split('-');
      const minDays = parseInt(daysRange[0]);
      const maxDays = daysRange[1] ? parseInt(daysRange[1]) : Infinity;

      const hasMatchingOverdue = recipient.debts?.some(debt =>
        debt.daysOverdue >= minDays && debt.daysOverdue <= maxDays
      );
      if (!hasMatchingOverdue) return false;
    }

    // Filter by amount range
    if (debtorFilters.minAmount || debtorFilters.maxAmount) {
      const minAmount = debtorFilters.minAmount ? parseInt(debtorFilters.minAmount) : 0;
      const maxAmount = debtorFilters.maxAmount ? parseInt(debtorFilters.maxAmount) : Infinity;

      const hasMatchingAmount = recipient.debts?.some(debt =>
        debt.amount >= minAmount && debt.amount <= maxAmount
      );
      if (!hasMatchingAmount) return false;
    }

    return true;
  });


  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-4 text-white shadow-strong">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 md:gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight">
                Centro de Mensajes y Campañas
              </h1>
              <p className="text-blue-100 text-xs md:text-sm">
                Gestiona comunicaciones masivas y campañas con IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {conversations.length} Conversaciones
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="warning" size="sm">
                {unreadCount} No leídos
              </Badge>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/empresa/mensajes/nuevo')}
              leftIcon={<Plus className="w-3 h-3" />}
            >
              Nuevo Mensaje
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={loadConversations}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Actualizar
            </Button>
          </div>
        </div>

      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('last7days')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('thisMonth')}
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <Send className="w-3 h-3 text-primary-600" />
                </div>
                <Badge variant="primary" className="text-sm">2</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1 font-medium">Campañas Enviadas</p>
              <p className="text-lg font-bold text-secondary-900">2</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-success-100 rounded-lg">
                  <CheckCircle className="w-3 h-3 text-success-600" />
                </div>
                <Badge variant="success" className="text-sm">57</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1 font-medium">Mensajes Vistos</p>
              <p className="text-lg font-bold text-secondary-900">57</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-warning-100 rounded-lg">
                  <MessageSquare className="w-3 h-3 text-warning-600" />
                </div>
                <Badge variant="warning" className="text-sm">20</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1 font-medium">Respuestas Recibidas</p>
              <p className="text-lg font-bold text-secondary-900">20</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-info-100 rounded-lg">
                  <AlertCircle className="w-3 h-3 text-info-600" />
                </div>
                <Badge variant="info" className="text-sm">16</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1 font-medium">Intervenciones IA</p>
              <p className="text-lg font-bold text-secondary-900">16</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Conversaciones Activas con IA */}
      <Card
        title="🤖 Conversaciones Activas con IA"
        subtitle={`${conversations.length} conversación${conversations.length !== 1 ? 'es' : ''} con respuestas de deudores`}
        className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              No hay conversaciones activas
            </h3>
            <p className="text-blue-700">
              Las respuestas de los deudores aparecerán aquí para que la IA pueda gestionarlas automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpenConversation(conversation)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">{conversation.debtorName}</h4>
                        <p className="text-sm text-blue-700">{conversation.debtorRut}</p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Asunto: </span>
                      <span className="text-sm text-gray-900">{conversation.subject}</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{conversation.lastMessage}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={conversation.unreadCount > 0 ? 'warning' : 'success'} className="text-xs">
                      {conversation.unreadCount > 0 ? `${conversation.unreadCount} nuevo${conversation.unreadCount > 1 ? 's' : ''}` : 'Leído'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(conversation.timestamp)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>IA Activa</span>
                    </div>
                    <Badge variant="info" className="text-xs">
                      Automático
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConversation(conversation);
                      }}
                      className="text-xs"
                    >
                      Ver Conversación
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEscalateToHuman(conversation);
                      }}
                      className="text-xs"
                    >
                      Escalar a Humano
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Messages List */}
      <Card
        title="Conversaciones Activas"
        subtitle={`${filteredMessages.length} conversación${filteredMessages.length !== 1 ? 'es' : ''} encontrada${filteredMessages.length !== 1 ? 's' : ''}`}
      >
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No hay conversaciones
            </h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm ? 'No se encontraron conversaciones que coincidan con tu búsqueda.' : 'Las conversaciones con deudores aparecerán aquí cuando respondan a tus mensajes.'}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                onClick={() => navigate('/empresa/mensajes/nuevo')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Enviar Primer Mensaje
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleOpenConversation(conversation)}
              >
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {conversation.debtorName}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="warning" className="text-xs">
                          {conversation.unreadCount} nuevo{conversation.unreadCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {getPriorityBadge(conversation.priority)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{conversation.debtorRut}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Último mensaje {formatDate(conversation.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                      {conversation.subject}: {conversation.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConversation(conversation);
                    }}
                  >
                    Ver Conversación
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Campaigns Reports */}
      <Card
        title="📊 Reportes de Campañas"
        subtitle="Seguimiento automático de campañas enviadas"
      >
        {/* Filter by Corporate Client */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-secondary-900 font-display mb-2">
                🏢 Filtrar por Empresa Corporativa
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">🏢</span>
                <select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all appearance-none"
                >
                  <option value="">Todas las empresas</option>
                  {corporateClients.map(client => (
                    <option key={client.id} value={client.id}>
                      🏢 {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {campaignFilter && (
              <Button
                variant="outline"
                onClick={() => setCampaignFilter('')}
                className="mt-7"
              >
                🗑️ Limpiar Filtro
              </Button>
            )}
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-secondary-900 font-display mb-2">
                🔍 Buscar Campañas
              </label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre de campaña..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-7"
              >
                🗑️ Limpiar Búsqueda
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Mock campaign data - In a real implementation, this would come from the database */}
          {[
            {
              id: 'camp1',
              title: 'Oferta Especial Descuento 15%',
              clientId: 'corp1',
              clientName: 'Empresa XYZ S.A.',
              sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              status: 'active',
              stats: { sent: 45, viewed: 32, responded: 8, notViewed: 13 }
            },
            {
              id: 'camp2',
              title: 'Recordatorio Pago Pendiente',
              clientId: 'corp2',
              clientName: 'Corporación ABC Ltda.',
              sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              status: 'completed',
              stats: { sent: 28, viewed: 25, responded: 12, notViewed: 3 }
            },
            {
              id: 'camp3',
              title: 'Plan de Cuotas Especial',
              clientId: 'corp1',
              clientName: 'Empresa XYZ S.A.',
              sentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
              status: 'completed',
              stats: { sent: 62, viewed: 48, responded: 15, notViewed: 14 }
            },
            {
              id: 'camp4',
              title: 'Oferta Urgente - 20% Descuento',
              clientId: 'corp2',
              clientName: 'Corporación ABC Ltda.',
              sentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
              status: 'completed',
              stats: { sent: 35, viewed: 28, responded: 9, notViewed: 7 }
            }
          ].filter(campaign => !campaignFilter || campaign.clientId === campaignFilter).map((campaign, index) => (
            <div
              key={campaign.id}
              className={`p-4 rounded-lg border ${
                index % 2 === 0
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className={`font-semibold ${
                    index % 2 === 0 ? 'text-blue-900' : 'text-green-900'
                  }`}>
                    Campaña: "{campaign.title}"
                  </h4>
                  <p className={`text-sm ${
                    index % 2 === 0 ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    Cliente: {campaign.clientName} • Enviada: hace {Math.floor((Date.now() - campaign.sentDate.getTime()) / (1000 * 60 * 60 * 24))} día{Math.floor((Date.now() - campaign.sentDate.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={campaign.status === 'active' ? 'success' : 'info'}>
                  {campaign.status === 'active' ? 'Activa' : 'Completada'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-xl font-bold ${
                    index % 2 === 0 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {campaign.stats.sent}
                  </div>
                  <div className={`text-sm ${
                    index % 2 === 0 ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    Enviados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {campaign.stats.viewed}
                  </div>
                  <div className="text-sm text-green-700">Vistos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {campaign.stats.responded}
                  </div>
                  <div className="text-sm text-blue-700">Respondieron</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${
                    campaign.stats.notViewed > 10 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {campaign.stats.notViewed}
                  </div>
                  <div className={`text-sm ${
                    campaign.stats.notViewed > 10 ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    Sin Ver
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title=""
        size="xl"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl inline-block mb-6">
              <Send className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              Enviar Nuevo Mensaje
            </h2>
            <p className="text-secondary-600 text-lg">
              Comunícate efectivamente con tus deudores
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newMessage.selectedDebtors.length > 0 ? 'bg-green-500' : 'bg-blue-500'}`}>
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className={`text-sm font-medium ${newMessage.selectedDebtors.length > 0 ? 'text-green-700' : 'text-blue-700'}`}>Seleccionar Cliente y Deudores</span>
            </div>
            <div className={`w-8 h-0.5 ${newMessage.selectedDebtors.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newMessage.selectedDebtors.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <span className={`${newMessage.selectedDebtors.length > 0 ? 'text-white' : 'text-gray-500'} font-bold text-sm`}>2</span>
              </div>
              <span className={`text-sm font-medium ${newMessage.selectedDebtors.length > 0 ? 'text-blue-700' : 'text-gray-500'}`}>Aplicar Filtros</span>
            </div>
            <div className={`w-8 h-0.5 ${filteredDebtors.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${filteredDebtors.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`${filteredDebtors.length > 0 ? 'text-white' : 'text-gray-500'} font-bold text-sm`}>3</span>
              </div>
              <span className={`text-sm font-medium ${filteredDebtors.length > 0 ? 'text-green-700' : 'text-gray-500'}`}>Ver Resumen</span>
            </div>
            <div className={`w-8 h-0.5 ${newMessage.subject && newMessage.message ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newMessage.subject && newMessage.message ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`${newMessage.subject && newMessage.message ? 'text-white' : 'text-gray-500'} font-bold text-sm`}>4</span>
              </div>
              <span className={`text-sm font-medium ${newMessage.subject && newMessage.message ? 'text-green-700' : 'text-gray-500'}`}>Enviar Mensaje</span>
            </div>
          </div>

          {/* Paso 1: Seleccionar Cliente Corporativo y Deudores */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-blue-900">
                🏢 Paso 1: Seleccionar Cliente Corporativo y Deudores
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Cliente Corporativo *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">🏢</span>
                  <select
                    value={newMessage.corporateClientId}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, corporateClientId: e.target.value, selectedDebtors: [], showDebtorSelection: false }))}
                    className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all appearance-none"
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loadingCorporateClients ? 'Cargando clientes corporativos...' : 'Seleccionar cliente corporativo...'}
                    </option>
                    {corporateClients.map(client => (
                      <option key={client.id} value={client.id}>
                        🏢 {client.name} - {client.display_category || 'Corporativo'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seleccionar Deudores Específicos - Movido aquí */}
              {newMessage.corporateClientId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      👥 Seleccionar Deudores Específicos
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allDebtorIds = debtors
                            .filter(d => d.corporateClientId === newMessage.corporateClientId)
                            .map(d => d.id);
                          setNewMessage(prev => ({ ...prev, selectedDebtors: allDebtorIds }));
                        }}
                      >
                        Seleccionar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewMessage(prev => ({ ...prev, selectedDebtors: [] }))}
                      >
                        Deseleccionar Todos
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {debtors
                      .filter(d => d.corporateClientId === newMessage.corporateClientId)
                      .map(debtor => (
                        <div key={debtor.id} className="flex items-center gap-3 p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            id={`debtor-${debtor.id}`}
                            checked={newMessage.selectedDebtors.includes(debtor.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMessage(prev => ({
                                  ...prev,
                                  selectedDebtors: [...prev.selectedDebtors, debtor.id]
                                }));
                              } else {
                                setNewMessage(prev => ({
                                  ...prev,
                                  selectedDebtors: prev.selectedDebtors.filter(id => id !== debtor.id)
                                }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor={`debtor-${debtor.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-gray-900">{debtor.name}</div>
                            <div className="text-sm text-gray-600">
                              RUT: {debtor.rut} • Deuda: ${debtor.debts?.reduce((sum, debt) => sum + debt.amount, 0)?.toLocaleString('es-CL') || 'N/A'}
                            </div>
                          </label>
                        </div>
                      ))}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>📊 Segmentación:</strong> {debtors.filter(d => d.corporateClientId === newMessage.corporateClientId).length} deudor{debtors.filter(d => d.corporateClientId === newMessage.corporateClientId).length !== 1 ? 'es' : ''} encontrado{debtors.filter(d => d.corporateClientId === newMessage.corporateClientId).length !== 1 ? 's' : ''} para este cliente corporativo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Paso 2: Aplicar Filtros de Segmentación */}
          {newMessage.selectedDebtors.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-blue-900">
                  🎯 Paso 2: Aplicar Filtros de Segmentación (Opcional)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    💳 Tipo de Deuda
                  </label>
                  <select
                    value={debtorFilters.debtType}
                    onChange={(e) => setDebtorFilters(prev => ({ ...prev, debtType: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="credit_card">💳 Tarjeta de Crédito</option>
                    <option value="mortgage">🏠 Crédito Hipotecario</option>
                    <option value="loan">🚗 Crédito Automotriz</option>
                    <option value="service">🛒 Crédito de Consumo</option>
                    <option value="other">📋 Otros</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    ⏰ Días de Vencimiento
                  </label>
                  <select
                    value={debtorFilters.daysOverdue}
                    onChange={(e) => setDebtorFilters(prev => ({ ...prev, daysOverdue: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="1-30">1-30 días</option>
                    <option value="31-60">31-60 días</option>
                    <option value="61-90">61-90 días</option>
                    <option value="91-999">Más de 90 días</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    💰 Monto Mínimo
                  </label>
                  <input
                    type="number"
                    value={debtorFilters.minAmount}
                    onChange={(e) => setDebtorFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    💰 Monto Máximo
                  </label>
                  <input
                    type="number"
                    value={debtorFilters.maxAmount}
                    onChange={(e) => setDebtorFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    placeholder="Sin límite"
                    className="w-full px-3 py-2 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setDebtorFilters({
                      clientType: 'corporate', // Mantener corporate
                      debtType: '',
                      daysOverdue: '',
                      minAmount: '',
                      maxAmount: ''
                    })}
                    className="w-full"
                  >
                    🗑️ Limpiar Filtros
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📊 Segmentación:</strong> {filteredDebtors.length} deudor{filteredDebtors.length !== 1 ? 'es' : ''} encontrado{filteredDebtors.length !== 1 ? 's' : ''} para este cliente corporativo
                </p>
              </div>
            </div>
          )}

          {/* Paso 3: Resumen de Destinatarios */}
          {newMessage.selectedDebtors.length > 0 && filteredDebtors.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-blue-900">
                  📋 Paso 3: Resumen de Destinatarios
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">👥 Destinatarios Seleccionados ({filteredDebtors.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredDebtors.slice(0, 5).map(debtor => (
                      <div key={debtor.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div>
                          <span className="font-medium text-blue-900">{debtor.name}</span>
                          {debtor.debts?.length > 0 && (
                            <span className="text-sm text-blue-700 ml-2">
                              - {debtor.debts.length} deuda{debtor.debts.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-blue-600">
                          Total: ${debtor.debts?.reduce((sum, debt) => sum + debt.amount, 0)?.toLocaleString('es-CL') || 'N/A'}
                        </div>
                      </div>
                    ))}
                    {filteredDebtors.length > 5 && (
                      <p className="text-sm text-blue-600 text-center py-2">
                        ... y {filteredDebtors.length - 5} más
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{filteredDebtors.length}</div>
                    <div className="text-sm text-blue-700">Destinatarios</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredDebtors.reduce((sum, d) => sum + (d.debts?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-blue-700">Total Deudas</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${filteredDebtors.reduce((sum, d) => sum + d.debts?.reduce((debtSum, debt) => debtSum + debt.amount, 0) || 0, 0).toLocaleString('es-CL')}
                    </div>
                    <div className="text-sm text-blue-700">Monto Total</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(filteredDebtors.reduce((sum, d) => sum + d.debts?.reduce((debtSum, debt) => debtSum + debt.amount, 0) || 0, 0) / filteredDebtors.length).toLocaleString('es-CL')}
                    </div>
                    <div className="text-sm text-blue-700">Promedio</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Configurar Mensaje y Oferta */}
          {newMessage.selectedDebtors.length > 0 && filteredDebtors.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-blue-900">
                  📤 Paso 4: Configurar Mensaje y Oferta de Pago
                </h3>
              </div>

              <div className="space-y-6">
                {/* Configuración de Oferta */}
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">🎁 Configuración de Oferta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-700">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newMessage.offerDetails.discount}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          offerDetails: { ...prev.offerDetails, discount: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-700">
                        Plan de Cuotas
                      </label>
                      <select
                        value={newMessage.offerDetails.installmentPlan}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          offerDetails: { ...prev.offerDetails, installmentPlan: e.target.value === 'true' }
                        }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value={false}>Sin cuotas</option>
                        <option value={true}>Con cuotas</option>
                      </select>
                    </div>
                    {newMessage.offerDetails.installmentPlan && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-blue-700">
                          Número de Cuotas
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={newMessage.offerDetails.totalInstallments}
                          onChange={(e) => setNewMessage(prev => ({
                            ...prev,
                            offerDetails: { ...prev.offerDetails, totalInstallments: parseInt(e.target.value) || 1 }
                          }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido del Mensaje */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      📧 Asunto del Mensaje *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">📧</span>
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all"
                        placeholder="Ej: Oferta Especial de Descuento"
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      💬 Mensaje Detallado *
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all resize-none"
                      rows={8}
                      placeholder="Escribe un mensaje claro y profesional con la oferta de pago..."
                      value={newMessage.message}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                      required
                    />
                    <p className="text-sm text-secondary-600 mt-2">
                      💡 Tip: Incluye detalles de la oferta, beneficios y llamado a la acción
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      🚨 Prioridad del Mensaje
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">🚨</span>
                      <select
                        value={newMessage.priority}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all appearance-none"
                      >
                        <option value="low">🟢 Baja - Información general</option>
                        <option value="normal">🟡 Normal - Oferta estándar</option>
                        <option value="high">🔴 Alta - Oferta urgente/limitada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consejos y Recomendaciones */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-blue-900 mb-4">
                  💡 Consejos para Mensajes Efectivos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🎯 Sé específico</h4>
                    <p className="text-sm text-blue-700">
                      Incluye montos exactos, fechas límite y consecuencias claras.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🤝 Mantén el respeto</h4>
                    <p className="text-sm text-blue-700">
                      Usa un tono profesional y cortés, incluso en recordatorios urgentes.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">⏰ Incluye plazos</h4>
                    <p className="text-sm text-blue-700">
                      Especifica cuándo vence el pago y qué sucede si no se realiza.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">📱 Multi-canal</h4>
                    <p className="text-sm text-blue-700">
                      Los mensajes se envían por email y notificaciones push automáticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-display font-bold text-amber-900 mb-3">
                  ⚠️ Información Importante
                </h4>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Los mensajes se envían automáticamente por email y notificaciones push</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Verifica que el contenido sea claro, profesional y sin errores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Una vez enviado, el mensaje no puede ser editado o eliminado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Los deudores recibirán confirmación de lectura cuando abran el mensaje</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewMessageModal(false);
                setDebtorFilters({
                  clientType: '',
                  debtType: '',
                  daysOverdue: '',
                  minAmount: '',
                  maxAmount: ''
                });
                setNewMessage({
                  corporateClientId: '',
                  subject: '',
                  message: '',
                  priority: 'normal',
                  selectedDebtors: [],
                  offerDetails: {
                    discount: 0,
                    installmentPlan: false,
                    totalInstallments: 1
                  }
                });
              }}
              className="flex-1 hover:scale-105 transition-all py-3"
            >
              Cancelar
            </Button>
            {newMessage.corporateClientId && newMessage.selectedDebtors.length > 0 && filteredDebtors.length > 0 && newMessage.subject && newMessage.message && (
              <Button
                variant="gradient"
                onClick={handleSendBulkMessage}
                className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
                loading={sending}
                leftIcon={<Send className="w-5 h-5" />}
              >
                {sending ? '🚀 Enviando Campaña...' : `📤 Enviar a ${filteredDebtors.length} Destinatarios`}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Conversation Modal */}
      <Modal
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        title=""
        size="lg"
      >
        {selectedConversation && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl inline-block mb-4">
                <MessageSquare className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-secondary-900 mb-2">
                Conversación con {selectedConversation.debtorName}
              </h2>
              <p className="text-secondary-600">
                RUT: {selectedConversation.debtorRut} • {selectedConversation.subject}
              </p>
            </div>

            {/* Status */}
            <div className={`rounded-xl p-4 border-2 ${
              selectedConversation.escalatedToHuman
                ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedConversation.escalatedToHuman
                        ? 'bg-orange-500'
                        : 'bg-green-500 animate-pulse'
                    }`}></div>
                    <span className={`font-semibold ${
                      selectedConversation.escalatedToHuman
                        ? 'text-orange-800'
                        : 'text-green-800'
                    }`}>
                      {selectedConversation.escalatedToHuman ? 'Asignado a Humano' : 'IA Activa'}
                    </span>
                  </div>
                  <Badge variant={selectedConversation.escalatedToHuman ? 'warning' : 'info'} className="text-xs">
                    {selectedConversation.escalatedToHuman ? 'Respuesta Manual' : 'Respuesta Automática'}
                  </Badge>
                </div>
                {!selectedConversation.escalatedToHuman && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEscalateToHuman(selectedConversation)}
                    className="text-xs"
                  >
                    Escalar a Humano
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'company' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.sender === 'company'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender === 'company' ? 'Empresa' : 'Deudor'}
                        </span>
                        {message.sender === 'company' && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedConversation.escalatedToHuman ? 'Humano' : 'IA'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'company' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Area */}
            {selectedConversation.escalatedToHuman ? (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Respuesta Humana</h4>
                </div>
                <HumanResponseHandler
                  conversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                />
              </div>
            ) : (
              <AIMessageHandler
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onEscalate={handleEscalateToHuman}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConversationModal(false)}
                className="flex-1"
              >
                Cerrar
              </Button>
              {!selectedConversation.escalatedToHuman && (
                <Button
                  variant="primary"
                  onClick={() => handleEscalateToHuman(selectedConversation)}
                  className="flex-1"
                >
                  Escalar a Humano
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyMessagesPage;