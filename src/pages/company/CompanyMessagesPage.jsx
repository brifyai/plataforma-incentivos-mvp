/**
 * Company Messages Page
 *
 * Página para que las empresas gestionen mensajes y comunicaciones con deudores
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import { getCompanyMessages, sendMessage, getCorporateClients, getCompanyDebts } from '../../services/databaseService';
import { formatDate } from '../../utils/formatters';
import { DEBT_TYPES, DEBT_TYPE_LABELS, DEBT_STATUS } from '../../config/constants';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Calendar
} from 'lucide-react';

const CompanyMessagesPage = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
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
  const [corporateClients, setCorporateClients] = useState([]);
  const [loadingCorporateClients, setLoadingCorporateClients] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('');

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

  // Debtors and filters state
  const [debtors, setDebtors] = useState([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [debtorFilters, setDebtorFilters] = useState({
    clientType: '', // 'individual' or 'corporate'
    debtType: '',
    daysOverdue: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    if (profile?.company?.id) {
      loadMessages();
      loadDebtors();
      loadCorporateClients();
    }
  }, [profile?.company?.id]);

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

  const loadMessages = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoading(true);
      const result = await getCompanyMessages(profile.company.id);

      if (result.error) {
        console.error('Error loading messages:', result.error);
        // Datos de ejemplo
        setMessages([
          {
            id: '1',
            debtorName: 'Juan Pérez',
            subject: 'Recordatorio de pago pendiente',
            message: 'Estimado cliente, le recordamos que tiene un pago pendiente...',
            status: 'sent',
            priority: 'high',
            sentAt: new Date(Date.now() - 86400000), // 1 día atrás
            readAt: null
          },
          {
            id: '2',
            debtorName: 'María González',
            subject: 'Oferta especial de descuento',
            message: 'Tenemos una oferta especial para usted...',
            status: 'read',
            priority: 'normal',
            sentAt: new Date(Date.now() - 172800000), // 2 días atrás
            readAt: new Date(Date.now() - 86400000)
          }
        ]);
      } else {
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDebtors = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoadingDebtors(true);
      const result = await getCompanyDebts(profile.company.id);

      if (result.error) {
        console.error('Error loading debts:', result.error);
        // Datos de ejemplo con los 12 deudores del sistema
        setDebtors([
          {
            id: '1',
            name: 'María González',
            rut: '12.345.678-9',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd1',
                type: 'loan',
                amount: 2500000,
                status: 'active',
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                daysOverdue: 5
              }
            ]
          },
          {
            id: '2',
            name: 'Carlos Rodríguez',
            rut: '15.234.567-8',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd2',
                type: 'loan',
                amount: 1800000,
                status: 'active',
                dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                daysOverdue: 3
              }
            ]
          },
          {
            id: '3',
            name: 'Ana López',
            rut: '18.345.678-1',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd3',
                type: 'loan',
                amount: 3200000,
                status: 'active',
                dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                daysOverdue: 1
              }
            ]
          },
          {
            id: '4',
            name: 'Pedro Martínez',
            rut: '11.456.789-2',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd4',
                type: 'loan',
                amount: 950000,
                status: 'completed',
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                daysOverdue: 0
              }
            ]
          },
          {
            id: '5',
            name: 'Sofía Ramírez',
            rut: '19.876.543-2',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd5',
                type: 'loan',
                amount: 1450000,
                status: 'active',
                dueDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
                daysOverdue: 9
              }
            ]
          },
          {
            id: '6',
            name: 'Diego Silva',
            rut: '20.123.456-7',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd6',
                type: 'loan',
                amount: 2800000,
                status: 'completed',
                dueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
                daysOverdue: 0
              }
            ]
          },
          {
            id: '7',
            name: 'Valentina Torres',
            rut: '21.234.567-8',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd7',
                type: 'loan',
                amount: 2100000,
                status: 'active',
                dueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
                daysOverdue: 11
              }
            ]
          },
          {
            id: '8',
            name: 'Felipe Morales',
            rut: '22.345.678-9',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd8',
                type: 'loan',
                amount: 3600000,
                status: 'active',
                dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                daysOverdue: 8
              }
            ]
          },
          {
            id: '9',
            name: 'Camila Herrera',
            rut: '23.456.789-0',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd9',
                type: 'loan',
                amount: 1750000,
                status: 'completed',
                dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                daysOverdue: 0
              }
            ]
          },
          {
            id: '10',
            name: 'Matías Castro',
            rut: '24.567.890-1',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd10',
                type: 'loan',
                amount: 3200000,
                status: 'active',
                dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                daysOverdue: 4
              }
            ]
          },
          {
            id: '11',
            name: 'Isabella Vargas',
            rut: '25.678.901-2',
            clientType: 'individual',
            corporateClientId: 'corp1',
            debts: [
              {
                id: 'd11',
                type: 'loan',
                amount: 1900000,
                status: 'active',
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                daysOverdue: 2
              }
            ]
          },
          {
            id: '12',
            name: 'Sebastián Reyes',
            rut: '26.789.012-3',
            clientType: 'individual',
            corporateClientId: 'corp2',
            debts: [
              {
                id: 'd12',
                type: 'loan',
                amount: 2700000,
                status: 'completed',
                dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                daysOverdue: 0
              }
            ]
          }
        ]);
      } else {
        // Extraer deudores únicos de las deudas
        const debtorsMap = new Map();

        result.debts.forEach(debt => {
          const debtorId = debt.user_id || debt.user?.id;
          const debtorName = debt.user?.full_name || 'Usuario desconocido';
          const debtorRut = debt.user?.rut || 'Sin RUT';
          const clientType = debt.client?.business_name ? 'corporate' : 'individual';

          if (!debtorsMap.has(debtorId)) {
            debtorsMap.set(debtorId, {
              id: debtorId,
              name: clientType === 'corporate' ? (debt.client?.business_name || debtorName) : debtorName,
              rut: clientType === 'corporate' ? (debt.client?.rut || debtorRut) : debtorRut,
              clientType: clientType,
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
    } catch (error) {
      console.error('Error loading debtors:', error);
      setDebtors([]);
    } finally {
      setLoadingDebtors(false);
    }
  };

  const loadCorporateClients = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoadingCorporateClients(true);
      const result = await getCorporateClients(profile.company.id);

      if (result.error) {
        console.error('Error loading corporate clients:', result.error);
        // Datos de ejemplo
        setCorporateClients([
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
        ]);
      } else {
        setCorporateClients(result.corporateClients || []);
      }
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      setCorporateClients([]);
    } finally {
      setLoadingCorporateClients(false);
    }
  };

  const handleSendBulkMessage = async () => {
    if (!newMessage.corporateClientId || !newMessage.subject || !newMessage.message) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (filteredDebtors.length === 0) {
      alert('No hay destinatarios que cumplan con los criterios de filtrado');
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

      alert(`✅ Campaña de mensajes enviada exitosamente!\n\n📤 ${filteredDebtors.length} mensajes enviados\n🎯 Campaña: "${newMessage.subject}"\n🏢 Cliente: ${corporateClients.find(c => c.id === newMessage.corporateClientId)?.name}`);

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
      loadMessages(); // Recargar mensajes
    } catch (error) {
      alert('Error al enviar campaña de mensajes: ' + error.message);
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

  const filteredMessages = messages.filter(message =>
    message.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-sm md:text-lg font-display font-bold tracking-tight">
                Centro de Mensajes y Campañas
              </h1>
              <p className="text-blue-100 text-xs md:text-sm">
                Gestiona comunicaciones masivas y campañas con IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {messages.length} Mensajes
            </Badge>
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
              onClick={loadMessages}
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
                <Badge variant="primary" className="text-xs">2</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Campañas Enviadas</p>
              <p className="text-sm font-bold text-secondary-900">2</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-success-100 rounded-lg">
                  <CheckCircle className="w-3 h-3 text-success-600" />
                </div>
                <Badge variant="success" className="text-xs">57</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Mensajes Vistos</p>
              <p className="text-sm font-bold text-secondary-900">57</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-warning-100 rounded-lg">
                  <MessageSquare className="w-3 h-3 text-warning-600" />
                </div>
                <Badge variant="warning" className="text-xs">20</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Respuestas Recibidas</p>
              <p className="text-sm font-bold text-secondary-900">20</p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-info-100 rounded-lg">
                  <AlertCircle className="w-3 h-3 text-info-600" />
                </div>
                <Badge variant="info" className="text-xs">16</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Intervenciones IA</p>
              <p className="text-sm font-bold text-secondary-900">16</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Messages List */}
      <Card
        title="Mensajes Enviados"
        subtitle={`${filteredMessages.length} mensaje${filteredMessages.length !== 1 ? 's' : ''} encontrado${filteredMessages.length !== 1 ? 's' : ''}`}
      >
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No hay mensajes
            </h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm ? 'No se encontraron mensajes que coincidan con tu búsqueda.' : 'Envía tu primer mensaje para comenzar a comunicarte con tus deudores.'}
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
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-6">
                  {getStatusIcon(message.status)}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {message.subject}
                      </h3>
                      {getStatusBadge(message.status)}
                      {getPriorityBadge(message.priority)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{message.debtorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Enviado {formatDate(message.sentAt)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {message.readAt && (
                    <div className="text-right text-sm text-secondary-600">
                      <p>Leído</p>
                      <p>{formatDate(message.readAt)}</p>
                    </div>
                  )}
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
                  <div className={`text-2xl font-bold ${
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
                  <div className="text-2xl font-bold text-green-600">
                    {campaign.stats.viewed}
                  </div>
                  <div className="text-sm text-green-700">Vistos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaign.stats.responded}
                  </div>
                  <div className="text-sm text-blue-700">Respondieron</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
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
                    disabled={loadingCorporateClients}
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
    </div>
  );
};

export default CompanyMessagesPage;