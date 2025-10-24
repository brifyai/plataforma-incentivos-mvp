/**
 * New Message Page
 *
 * Página dedicada para crear y enviar nuevos mensajes a deudores
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { getCorporateClients, getCompanyDebts, sendMessage, getCompanyOffers } from '../../services/databaseService';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Paperclip,
  X,
  Target
} from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const NewMessagePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [corporateClients, setCorporateClients] = useState([]);
  const [loadingCorporateClients, setLoadingCorporateClients] = useState(false);
  const [debtors, setDebtors] = useState([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);

  // Form state
  const [newMessage, setNewMessage] = useState({
    corporateClientId: '',
    subject: '',
    message: '',
    priority: 'normal',
    selectedDebtors: [], // Deudores seleccionados manualmente (opcional)
    useSpecificDebtors: false, // Flag para usar selección específica de deudores
    offerDetails: {
      discount: 0,
      installmentPlan: false,
      totalInstallments: 1
    },
    attachments: []
  });

  // Filters state
  const [debtorFilters, setDebtorFilters] = useState({
    clientType: 'corporate',
    debtType: '',
    daysOverdue: '',
    minAmount: '',
    maxAmount: ''
  });

  const [sending, setSending] = useState(false);
  const [filtersConfirmed, setFiltersConfirmed] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  // Estados para selección opcional de deudores
  const [debtorSearchTerm, setDebtorSearchTerm] = useState('');
  const handleConfirmFilters = async () => {
    if (filteredDebtors.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Sin destinatarios',
        text: 'No hay destinatarios que cumplan con los criterios de filtrado.',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal-wide' }
      });
      return;
    }
    setFiltersConfirmed(true);
    const anchor = document.getElementById('step-3');
    if (anchor && anchor.scrollIntoView) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Funciones para selección opcional de deudores
  const handleToggleDebtorSelection = () => {
    setNewMessage(prev => ({
      ...prev,
      useSpecificDebtors: !prev.useSpecificDebtors,
      selectedDebtors: prev.useSpecificDebtors ? [] : prev.selectedDebtors // Limpiar selección si se desactiva
    }));
    setFiltersConfirmed(false); // Reiniciar confirmación de filtros
  };

  const handleDebtorSelect = (debtorId) => {
    setNewMessage(prev => ({
      ...prev,
      selectedDebtors: prev.selectedDebtors.includes(debtorId)
        ? prev.selectedDebtors.filter(id => id !== debtorId)
        : [...prev.selectedDebtors, debtorId]
    }));
  };

  const handleRemoveSelectedDebtor = (debtorId) => {
    setNewMessage(prev => ({
      ...prev,
      selectedDebtors: prev.selectedDebtors.filter(id => id !== debtorId)
    }));
  };

  // Filtrar deudores por búsqueda
  const filteredDebtorsBySearch = debtors.filter(debtor =>
    debtor.name.toLowerCase().includes(debtorSearchTerm.toLowerCase()) ||
    (debtor.rut && debtor.rut.toLowerCase().includes(debtorSearchTerm.toLowerCase()))
  );

  // Adjuntos
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(2)} ${sizes[i]}`;
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let next = [...(newMessage.attachments || [])];

    for (const f of files) {
      const typeOk = ACCEPTED_TYPES.includes(f.type) || /\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx)$/i.test(f.name);
      if (!typeOk) {
        await Swal.fire({
          icon: 'warning',
          title: 'Tipo de archivo no permitido',
          text: f.name,
          confirmButtonText: 'Entendido'
        });
        continue;
      }

      if (f.size > MAX_FILE_SIZE) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo demasiado grande',
          text: `${f.name} supera 5 MB`,
          confirmButtonText: 'Entendido'
        });
        continue;
      }

      if (next.length >= MAX_ATTACHMENTS) {
        await Swal.fire({
          icon: 'info',
          title: 'Límite de adjuntos',
          text: `Máximo ${MAX_ATTACHMENTS} archivos`,
          confirmButtonText: 'Ok'
        });
        break;
      }

      next.push({
        name: f.name,
        size: f.size,
        type: f.type
      });
    }

    setNewMessage(prev => ({ ...prev, attachments: next }));
    // limpiar input para poder volver a seleccionar el mismo archivo si se desea
    e.target.value = '';
  };

  const handleAttachmentRemove = (index) => {
    setNewMessage(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    if (profile?.company?.id) {
      loadCorporateClients();
      loadDebtors();
      loadOffers();
    }
  }, [profile?.company?.id]);

  const loadOffers = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoadingOffers(true);
      const result = await getCompanyOffers(profile.company.id);

      if (result.error) {
        console.error('Error loading offers:', result.error);
        setOffers([]);
      } else {
        setOffers(result.offers || []);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadCorporateClients = async () => {
    // Si no hay company.id disponible, no cargar nada
    if (!profile?.company?.id) {
      setCorporateClients([]);
      return;
    }

    try {
      setLoadingCorporateClients(true);
      
      // Cargar clientes corporativos con soporte para god_mode
      let corporateClientsData;
      if (profile?.role === 'god_mode') {
        console.log('🔑 God Mode: Cargando todos los clientes corporativos para NewMessagePage');
        const { data: allClients, error } = await supabase
          .from('corporate_clients')
          .select('*')
          .order('contact_email');
        
        if (error) {
          console.error('Error loading all corporate clients:', error);
          setCorporateClients([]);
        } else {
          corporateClientsData = { corporateClients: allClients };
        }
      } else {
        corporateClientsData = await getCorporateClients(profile.company.id);
      }

      if (corporateClientsData?.error || !corporateClientsData?.corporateClients || corporateClientsData.corporateClients.length === 0) {
        console.warn('No se encontraron clientes corporativos.');
        setCorporateClients([]);
      } else {
        setCorporateClients(corporateClientsData.corporateClients);
      }
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      setCorporateClients([]);
    } finally {
      setLoadingCorporateClients(false);
    }
  };

  const loadDebtors = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoadingDebtors(true);

      // Cargar solo datos reales
      const result = await getCompanyDebts(profile.company.id);

      if (result.error || !result.debts || result.debts.length === 0) {
        console.warn('No se encontraron deudas reales.');
        setDebtors([]);
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


  // Determine which list to show based on client type filter
  const availableRecipients = debtorFilters.clientType === 'corporate' ? corporateClients : debtors;

  // Apply filters to recipients
  // Corporate: mostrar deudores según selección específica o filtros aplicados
  const filteredDebtors = debtorFilters.clientType === 'corporate'
    ? (newMessage.useSpecificDebtors
        ? debtors.filter(debtor => newMessage.selectedDebtors.includes(debtor.id))
        : debtors.filter(debtor => {
            // Primero filtrar por cliente corporativo seleccionado
            if (newMessage.corporateClientId && debtor.clientId !== newMessage.corporateClientId) {
              return false;
            }

            // Aplicar filtros adicionales
            // Filter by debt type
            if (debtorFilters.debtType) {
              const hasMatchingDebt = debtor.debts?.some(debt => debt.type === debtorFilters.debtType);
              if (!hasMatchingDebt) return false;
            }

            // Filter by days overdue
            if (debtorFilters.daysOverdue) {
              const daysRange = debtorFilters.daysOverdue.split('-');
              const minDays = parseInt(daysRange[0]);
              const maxDays = daysRange[1] ? parseInt(daysRange[1]) : Infinity;

              const hasMatchingOverdue = debtor.debts?.some(debt =>
                debt.daysOverdue >= minDays && debt.daysOverdue <= maxDays
              );
              if (!hasMatchingOverdue) return false;
            }

            // Filter by amount range
            if (debtorFilters.minAmount || debtorFilters.maxAmount) {
              const minAmount = debtorFilters.minAmount ? parseInt(debtorFilters.minAmount) : 0;
              const maxAmount = debtorFilters.maxAmount ? parseInt(debtorFilters.maxAmount) : Infinity;

              const hasMatchingAmount = debtor.debts?.some(debt =>
                debt.amount >= minAmount && debt.amount <= maxAmount
              );
              if (!hasMatchingAmount) return false;
            }

            return true;
          })
      )
    : availableRecipients.filter(recipient => {
        // For individual debtors, apply all filters
        // Filter by client type
        if (debtorFilters.clientType && recipient.clientType !== debtorFilters.clientType) {
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

  const handleSendBulkMessage = async () => {
    if (!newMessage.corporateClientId || !selectedOfferId || !newMessage.subject || !newMessage.message) {
      const missingFields = [];
      if (!newMessage.corporateClientId) missingFields.push('Empresa corporativa');
      if (!selectedOfferId) missingFields.push('Oferta de pago');
      if (!newMessage.subject) missingFields.push('Asunto');
      if (!newMessage.message) missingFields.push('Mensaje');

      await Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        html: 'Por favor completa: <ul style="text-align:left;margin:8px 0 0 18px;list-style:disc;">' +
              missingFields.map(field => `<li>${field}</li>`).join('') + '</ul>',
        confirmButtonText: 'Completar',
        customClass: { popup: 'swal-wide' }
      });
      return;
    }

    if (filteredDebtors.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin destinatarios',
        text: 'Ajusta los filtros para obtener al menos un destinatario.',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal-wide' }
      });
      return;
    }

    setSending(true);
    try {
      // Obtener la oferta seleccionada
      const selectedOffer = offers.find(o => o.id === selectedOfferId);

      // Crear campaña de mensajes masivos
      const campaignData = {
        companyId: profile.company.id,
        corporateClientId: newMessage.corporateClientId,
        subject: newMessage.subject,
        message: newMessage.message,
        priority: newMessage.priority,
        selectedOffer: selectedOffer,
        offerDetails: {
          offerId: selectedOffer.id,
          offerTitle: selectedOffer.title,
          offerType: selectedOffer.offer_type,
          discountPercentage: selectedOffer.discount_percentage,
          fixedAmount: selectedOffer.fixed_amount,
          userIncentivePercentage: selectedOffer.user_incentive_percentage
        },
        attachments: newMessage.attachments || [],
        filters: debtorFilters,
        selectedDebtors: filteredDebtors.map(d => d.id),
        totalRecipients: filteredDebtors.length,
        sentBy: profile.id,
        campaignType: 'bulk_offer',
        useSpecificDebtors: newMessage.useSpecificDebtors,
        selectedDebtorIds: newMessage.useSpecificDebtors ? newMessage.selectedDebtors : null
      };

      // Aquí iría la lógica para enviar mensajes masivos
      // Por ahora, simulamos el envío
      console.log('Enviando campaña masiva:', campaignData);

      {
        const clientName = corporateClients.find(c => c.id === newMessage.corporateClientId)?.name || 'Cliente';

        await Swal.fire({
          icon: 'success',
          title: 'Campaña enviada',
          html: `📤 <b>${filteredDebtors.length}</b> mensajes enviados<br/>🎯 <b>${newMessage.subject}</b><br/>🏢 <b>${clientName}</b>${
            newMessage.useSpecificDebtors && newMessage.selectedDebtors.length > 0
              ? `<br/>👥 <b>${newMessage.selectedDebtors.length}</b> deudor${newMessage.selectedDebtors.length !== 1 ? 'es' : ''} seleccionado${newMessage.selectedDebtors.length !== 1 ? 's' : ''} específicamente`
              : ''
          }`,
          confirmButtonText: 'Continuar',
          customClass: { popup: 'swal-wide' }
        });
      }

      // Reset form and navigate back
      setNewMessage({
        corporateClientId: '',
        subject: '',
        message: '',
        priority: 'normal',
        selectedDebtors: [],
        useSpecificDebtors: false,
        offerDetails: {
          discount: 0,
          installmentPlan: false,
          totalInstallments: 1
        },
        attachments: []
      });
      setDebtorSearchTerm('');
      setDebtorFilters({
        clientType: '',
        debtType: '',
        daysOverdue: '',
        minAmount: '',
        maxAmount: ''
      });
      navigate('/empresa/mensajes');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: 'Error al enviar campaña de mensajes: ' + error.message,
        confirmButtonText: 'Reintentar',
        customClass: { popup: 'swal-wide' }
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight">
                Nuevo Mensaje
              </h1>
              <p className="text-blue-100 text-lg">
                Crear y enviar campaña de mensajes masivos
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate('/empresa/mensajes')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newMessage.corporateClientId ? 'bg-green-500' : 'bg-blue-500'}`}>
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <span className={`text-sm font-medium ${newMessage.corporateClientId ? 'text-green-700' : 'text-blue-700'}`}>Seleccionar Empresa</span>
          </div>
          <div className={`w-8 h-0.5 ${newMessage.corporateClientId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newMessage.corporateClientId ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`${newMessage.corporateClientId ? 'text-white' : 'text-gray-500'} font-bold text-sm`}>2</span>
            </div>
            <span className={`text-sm font-medium ${newMessage.corporateClientId ? 'text-blue-700' : 'text-gray-500'}`}>Seleccionar Destinatarios</span>
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOfferId && newMessage.subject && newMessage.message ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`${selectedOfferId && newMessage.subject && newMessage.message ? 'text-white' : 'text-gray-500'} font-bold text-sm`}>4</span>
            </div>
            <span className={`text-sm font-medium ${selectedOfferId && newMessage.subject && newMessage.message ? 'text-green-700' : 'text-gray-500'}`}>Enviar Mensaje</span>
          </div>
        </div>

        {/* Paso 1: Seleccionar Cliente Corporativo */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-blue-100/50">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-display font-bold text-blue-900">
              🏢 Paso 1: Seleccionar Cliente Corporativo
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-secondary-900 font-display">
                Cliente Corporativo *
              </label>
              <div className="relative">
                <select
                  value={newMessage.corporateClientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMessage(prev => ({ ...prev, corporateClientId: val, selectedDebtors: [] })); // Limpiar selección de deudores al cambiar empresa
                    // Forzar vista de clientes corporativos como destinatarios por defecto
                    setDebtorFilters(prev => ({ ...prev, clientType: 'corporate' }));
                    // Reiniciar confirmación de filtros al cambiar de cliente
                    setFiltersConfirmed(false);
                    // Reiniciar selección específica de deudores
                    setNewMessage(prev => ({ ...prev, useSpecificDebtors: false }));
                  }}
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
          </div>
        </Card>

        {/* Paso 2: Seleccionar Destinatarios */}
        {newMessage.corporateClientId && (
          <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-blue-900">
                🎯 Paso 2: Aplicar Filtros de Segmentación
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

            {/* Opción opcional: Selección específica de deudores */}
            {newMessage.corporateClientId && (
              <div className="space-y-4 border-t border-secondary-200 pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Selección Específica de Deudores
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDebtorSelection}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {newMessage.useSpecificDebtors ? 'Usar todos los deudores' : 'Seleccionar deudores específicos'}
                  </Button>
                </div>

                {newMessage.useSpecificDebtors && (
                  <div className="space-y-4">
                    {/* Barra de búsqueda de deudores */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-secondary-900 font-display">
                        🔍 Buscar Deudores
                      </label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o RUT..."
                          value={debtorSearchTerm}
                          onChange={(e) => setDebtorSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all"
                        />
                      </div>
                    </div>

                    {/* Lista de deudores con selección múltiple */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-secondary-900 font-display">
                        👥 Seleccionar Deudores Específicos
                      </label>
                      <div className="max-h-64 overflow-y-auto border-2 border-secondary-200 rounded-xl bg-white">
                        {filteredDebtorsBySearch.length === 0 ? (
                          <div className="p-4 text-center text-secondary-500">
                            {debtorSearchTerm ? 'No se encontraron deudores con ese criterio' : 'No hay deudores disponibles'}
                          </div>
                        ) : (
                          filteredDebtorsBySearch.map(debtor => {
                            const isSelected = newMessage.selectedDebtors.includes(debtor.id);
                            return (
                              <div
                                key={debtor.id}
                                className={`p-4 border-b border-secondary-100 last:border-b-0 cursor-pointer transition-all hover:bg-secondary-50 ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => handleDebtorSelect(debtor.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-secondary-300'
                                    }`}>
                                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-secondary-900">{debtor.name}</div>
                                      <div className="text-sm text-secondary-600">
                                        RUT: {debtor.rut} • {debtor.debts?.length || 0} deuda{debtor.debts?.length !== 1 ? 's' : ''}
                                      </div>
                                      {debtor.debts?.length > 0 && (
                                        <div className="text-xs text-secondary-500 mt-1">
                                          Total: ${debtor.debts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString('es-CL')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSelectedDebtor(debtor.id);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Deudores seleccionados */}
                    {newMessage.selectedDebtors.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Deudores Seleccionados ({newMessage.selectedDebtors.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {newMessage.selectedDebtors.map(debtorId => {
                            const debtor = debtors.find(d => d.id === debtorId);
                            return debtor ? (
                              <div key={debtorId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                <span>{debtor.name}</span>
                                <button
                                  onClick={() => handleRemoveSelectedDebtor(debtorId)}
                                  className="hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="p-3 bg-blue-100 rounded-lg w-full sm:w-auto">
                <p className="text-sm text-blue-800">
                  <strong>📊 Segmentación:</strong> {filteredDebtors.length} deudor{filteredDebtors.length !== 1 ? 'es' : ''} encontrado{filteredDebtors.length !== 1 ? 's' : ''} para este cliente corporativo
                  {newMessage.useSpecificDebtors && newMessage.selectedDebtors.length > 0 && (
                    <span className="block mt-1 text-blue-700">
                      🎯 Selección específica: {newMessage.selectedDebtors.length} deudor{newMessage.selectedDebtors.length !== 1 ? 'es' : ''} elegido{newMessage.selectedDebtors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleConfirmFilters}
                className="w-full sm:w-auto"
              >
                Continuar
              </Button>
            </div>
          </Card>
        )}

        {/* Paso 3: Resumen de Destinatarios */}
        {newMessage.corporateClientId && (filtersConfirmed || filteredDebtors.length > 0) && (
          <Card id="step-3" className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-blue-100">
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
          </Card>
        )}

        {/* Paso 4: Configurar Mensaje y Oferta */}
        {newMessage.corporateClientId && (filtersConfirmed || filteredDebtors.length > 0) && (
          <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-blue-100/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-blue-900">
                📤 Paso 4: Configurar Mensaje y Oferta de Pago
              </h3>
            </div>

            <div className="space-y-6">
              {/* Selector de Ofertas */}
              <div className="bg-white/60 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-3">🎁 Seleccionar Oferta</h4>

                {loadingOffers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-blue-600 mt-2">Cargando ofertas...</p>
                  </div>
                ) : offers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-blue-700 mb-4">No tienes ofertas creadas</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/empresa/ofertas', '_blank')}
                    >
                      Crear Oferta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedOfferId === offer.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-blue-200 hover:border-blue-300 bg-white'
                        }`}
                        onClick={() => setSelectedOfferId(offer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-blue-900">{offer.title}</h5>
                              <Badge variant={offer.status === 'active' ? 'success' : 'secondary'} size="sm">
                                {offer.status === 'active' ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <p className="text-sm text-blue-700 mb-2">{offer.description}</p>
                            <div className="flex items-center gap-4 text-xs text-blue-600">
                              <span>Tipo: {offer.offer_type === 'discount' ? 'Descuento' : offer.offer_type === 'fixed_amount' ? 'Monto Fijo' : offer.offer_type}</span>
                              {offer.discount_percentage && <span>Descuento: {offer.discount_percentage}%</span>}
                              {offer.fixed_amount && <span>Monto: ${offer.fixed_amount.toLocaleString('es-CL')}</span>}
                              <span>Incentivo: {offer.user_incentive_percentage}%</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {selectedOfferId === offer.id ? (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-blue-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedOfferId && (
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✅ <strong>Oferta seleccionada:</strong> {offers.find(o => o.id === selectedOfferId)?.title}
                    </p>
                  </div>
                )}
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
                      placeholder="Ej: Oferta Especial de Descuento 15%"
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

                {/* Adjuntos */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    📎 Adjuntar archivos
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFilesSelected}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="w-full px-3 py-2 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                  />
                  <p className="text-xs text-secondary-600">
                    Máximo 5 archivos, 5 MB c/u. Tipos: PDF, JPG, PNG, DOC(X), XLS(X).
                  </p>

                  {newMessage.attachments && newMessage.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {newMessage.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-secondary-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-secondary-500">({formatBytes(file.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAttachmentRemove(idx)}
                            className="text-danger-600 hover:text-danger-700 text-sm"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
          </Card>
        )}

        {/* Consejos y Recomendaciones */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-blue-100/50">
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
        </Card>

        {/* Información Importante */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-amber-50 to-orange-50">
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
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/empresa/mensajes')}
            className="flex-1 hover:scale-105 transition-all py-3"
          >
            Cancelar
          </Button>
          {newMessage.corporateClientId && filteredDebtors.length > 0 && selectedOfferId && newMessage.subject && newMessage.message && (
            <Button
              variant="gradient"
              onClick={handleSendBulkMessage}
              className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
              loading={sending}
              leftIcon={<Send className="w-5 h-5" />}
            >
              {sending ? '📤 Enviando Campaña...' : `📤 Enviar a ${filteredDebtors.length} Destinatarios`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessagePage;