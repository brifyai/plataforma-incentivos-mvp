/**
 * Offers Page - Company
 *
 * Página para que las empresas creen y gestionen ofertas
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, DateFilter } from '../../components/common';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { getCompanyOffers, createOffer, getCompanyClients, updateOffer, deleteOffer } from '../../services/databaseService';
import { calculateCommissions } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  Calendar,
  Target,
  TrendingUp,
  XCircle,
  HelpCircle,
  CreditCard,
  Banknote,
} from 'lucide-react';

const OffersPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createOfferForm, setCreateOfferForm] = useState({
    title: '',
    description: '',
    offer_type: 'discount',
    discount_percentage: '',
    fixed_amount: '',
    user_incentive_percentage: 5,
    user_incentive_fixed: '', // Nuevo: monto fijo para comisión persona/deudor
    user_incentive_type: 'percentage', // Nuevo: 'percentage' o 'fixed'
    nexupay_commission_percentage: 5,
    nexupay_commission_fixed: '', // Nuevo: monto fijo para comisión NexuPay
    nexupay_commission_type: 'percentage', // Nuevo: 'percentage' o 'fixed'
    payment_method: 'both', // Nuevo campo: método de pago (ambos por defecto)
    client_id: '',
    validity_start: '',
    validity_end: '',
    terms_conditions: '',
  });
  const [createOfferLoading, setCreateOfferLoading] = useState(false);
  const [createOfferError, setCreateOfferError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [commissionInfo, setCommissionInfo] = useState(null);

  // View/Edit Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [editOfferForm, setEditOfferForm] = useState({
    nexupay_commission_percentage: 5, // Valor por defecto
    payment_method: 'both', // Valor por defecto
    max_uses: '', // Ya no se usa pero mantenemos por compatibilidad
  });
  const [editOfferLoading, setEditOfferLoading] = useState(false);
  const [editOfferError, setEditOfferError] = useState(null);

  useEffect(() => {
    if (profile?.company?.id) {
      loadData();
    }
  }, [profile]);

  // Sincronizar comisiones: cuando se cambia una, la otra se actualiza automáticamente
  useEffect(() => {
    if (createOfferForm.user_incentive_type === 'percentage' && createOfferForm.nexupay_commission_type === 'percentage') {
      setCreateOfferForm(prev => ({
        ...prev,
        nexupay_commission_percentage: prev.user_incentive_percentage
      }));
    }
  }, [createOfferForm.user_incentive_percentage, createOfferForm.user_incentive_type, createOfferForm.nexupay_commission_type]);

  useEffect(() => {
    if (createOfferForm.user_incentive_type === 'percentage' && createOfferForm.nexupay_commission_type === 'percentage') {
      setCreateOfferForm(prev => ({
        ...prev,
        user_incentive_percentage: prev.nexupay_commission_percentage
      }));
    }
  }, [createOfferForm.nexupay_commission_percentage, createOfferForm.user_incentive_type, createOfferForm.nexupay_commission_type]);

  // Sincronizar tipos: cuando persona/deudor cambia a fijo, NexuPay también cambia a fijo
  useEffect(() => {
    if (createOfferForm.user_incentive_type === 'fixed') {
      setCreateOfferForm(prev => ({
        ...prev,
        nexupay_commission_type: 'fixed',
        nexupay_commission_fixed: prev.user_incentive_fixed
      }));
    }
  }, [createOfferForm.user_incentive_type, createOfferForm.user_incentive_fixed]);

  // Sincronizar montos fijos: cuando cambia el monto fijo de persona/deudor, se copia a NexuPay
  useEffect(() => {
    if (createOfferForm.user_incentive_type === 'fixed' && createOfferForm.nexupay_commission_type === 'fixed') {
      setCreateOfferForm(prev => ({
        ...prev,
        nexupay_commission_fixed: prev.user_incentive_fixed
      }));
    }
  }, [createOfferForm.user_incentive_fixed, createOfferForm.user_incentive_type, createOfferForm.nexupay_commission_type]);

  // Calcular comisiones cuando cambien los parámetros relevantes
  useEffect(() => {
    if (createOfferForm.offer_type && createOfferForm.payment_method) {
      let baseAmount = 100000; // Monto base para cálculo de ejemplo

      if (createOfferForm.offer_type === 'discount') {
        // Para descuentos, calculamos sobre un monto base
        const discountAmount = baseAmount * (parseFloat(createOfferForm.discount_percentage || 0) / 100);
        baseAmount = baseAmount - discountAmount;
      } else if (createOfferForm.offer_type === 'fixed_amount') {
        baseAmount = parseFloat(createOfferForm.fixed_amount || 0);
      }

      if (baseAmount > 0) {
        // Calcular comisiones de NexuPay y usuario (manejar porcentajes y montos fijos)
        let nexupayCommission = 0;
        let userCommission = 0;

        if (createOfferForm.nexupay_commission_type === 'percentage') {
          nexupayCommission = baseAmount * (parseFloat(createOfferForm.nexupay_commission_percentage || 0) / 100);
        } else {
          nexupayCommission = parseFloat(createOfferForm.nexupay_commission_fixed || 0);
        }

        if (createOfferForm.user_incentive_type === 'percentage') {
          userCommission = baseAmount * (parseFloat(createOfferForm.user_incentive_percentage || 0) / 100);
        } else {
          userCommission = parseFloat(createOfferForm.user_incentive_fixed || 0);
        }

        const totalCommissions = nexupayCommission + userCommission;

        if (createOfferForm.payment_method === 'both') {
          // Para "ambos", calcular comisiones de MP para ambos métodos
          const bankTransferCommission = calculateCommissions(baseAmount, 'bank_transfer');
          const mercadopagoCommission = calculateCommissions(baseAmount, 'mercadopago');

          // Agregar comisiones de NexuPay y usuario
          bankTransferCommission.nexupayCommission = nexupayCommission;
          bankTransferCommission.userCommission = userCommission;
          bankTransferCommission.totalCommissions = totalCommissions;
          bankTransferCommission.breakdown.amountReceivedByCompany = baseAmount - totalCommissions - (bankTransferCommission.mercadopagoCommission || 0);

          mercadopagoCommission.nexupayCommission = nexupayCommission;
          mercadopagoCommission.userCommission = userCommission;
          mercadopagoCommission.totalCommissions = totalCommissions;
          mercadopagoCommission.breakdown.amountReceivedByCompany = baseAmount - totalCommissions - mercadopagoCommission.mercadopagoCommission;

          setCommissionInfo({
            both: true,
            bankTransfer: bankTransferCommission,
            mercadopago: mercadopagoCommission
          });
        } else {
          const paymentMethod = createOfferForm.payment_method === 'mercadopago' ? 'mercadopago' : 'bank_transfer';
          const commission = calculateCommissions(baseAmount, paymentMethod);

          // Agregar comisiones de NexuPay y usuario
          commission.nexupayCommission = nexupayCommission;
          commission.userCommission = userCommission;
          commission.totalCommissions = totalCommissions;
          commission.breakdown.amountReceivedByCompany = baseAmount - totalCommissions - (commission.mercadopagoCommission || 0);

          setCommissionInfo(commission);
        }
      } else {
        setCommissionInfo(null);
      }
    } else {
      setCommissionInfo(null);
    }
  }, [
    createOfferForm.offer_type,
    createOfferForm.discount_percentage,
    createOfferForm.fixed_amount,
    createOfferForm.payment_method,
    createOfferForm.nexupay_commission_percentage,
    createOfferForm.nexupay_commission_fixed,
    createOfferForm.nexupay_commission_type,
    createOfferForm.user_incentive_percentage,
    createOfferForm.user_incentive_fixed,
    createOfferForm.user_incentive_type
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersResult, clientsResult] = await Promise.all([
        getCompanyOffers(profile.company.id),
        getCompanyClients(profile.company.id)
      ]);

      if (offersResult.error) {
        console.error('Error loading offers:', offersResult.error);
      } else {
        setOffers(offersResult.offers);
      }

      if (clientsResult.error) {
        console.error('Error loading clients:', clientsResult.error);
        // Fallback con datos mock si no hay clientes en la BD
        setClients([
          {
            id: '1',
            business_name: 'TechCorp S.A.',
            rut: '76.543.210-1',
            contact_email: 'cobranzas@techcorp.cl',
            contact_phone: '+56912345678'
          },
          {
            id: '2',
            business_name: 'RetailMax Ltda.',
            rut: '87.654.321-2',
            contact_email: 'pagos@retailmax.cl',
            contact_phone: '+56987654321'
          }
        ]);
      } else {
        // Si hay clientes en la BD, úsalos; si no, usa los mock
        setClients(clientsResult.clients && clientsResult.clients.length > 0 ? clientsResult.clients : [
          {
            id: '1',
            business_name: 'TechCorp S.A.',
            rut: '76.543.210-1',
            contact_email: 'cobranzas@techcorp.cl',
            contact_phone: '+56912345678'
          },
          {
            id: '2',
            business_name: 'RetailMax Ltda.',
            rut: '87.654.321-2',
            contact_email: 'pagos@retailmax.cl',
            contact_phone: '+56987654321'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback con datos mock en caso de error
      setClients([
        {
          id: '1',
          business_name: 'TechCorp S.A.',
          rut: '76.543.210-1',
          contact_email: 'cobranzas@techcorp.cl',
          contact_phone: '+56912345678'
        },
        {
          id: '2',
          business_name: 'RetailMax Ltda.',
          rut: '87.654.321-2',
          contact_email: 'pagos@retailmax.cl',
          contact_phone: '+56987654321'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    try {
      setCreateOfferLoading(true);
      setCreateOfferError(null);

      // Validar que se haya seleccionado un cliente corporativo
      if (!createOfferForm.client_id) {
        setCreateOfferError('Debes seleccionar un cliente corporativo para asignar la oferta.');
        return;
      }

      const offerData = {
        company_id: profile.company.id,
        title: createOfferForm.title,
        description: createOfferForm.description,
        offer_type: createOfferForm.offer_type,
        user_incentive_percentage: createOfferForm.user_incentive_type === 'percentage' ? parseFloat(createOfferForm.user_incentive_percentage) : 0,
        user_incentive_fixed: createOfferForm.user_incentive_type === 'fixed' ? parseFloat(createOfferForm.user_incentive_fixed) : 0,
        user_incentive_type: createOfferForm.user_incentive_type,
        nexupay_commission_percentage: createOfferForm.nexupay_commission_type === 'percentage' ? parseFloat(createOfferForm.nexupay_commission_percentage) : 0,
        nexupay_commission_fixed: createOfferForm.nexupay_commission_type === 'fixed' ? parseFloat(createOfferForm.nexupay_commission_fixed) : 0,
        nexupay_commission_type: createOfferForm.nexupay_commission_type,
        payment_method: createOfferForm.payment_method, // Nuevo campo: método de pago
        client_id: createOfferForm.client_id, // Ahora es obligatorio
        validity_start: createOfferForm.validity_start ? new Date(createOfferForm.validity_start).toISOString() : new Date().toISOString(),
        validity_end: createOfferForm.validity_end ? new Date(createOfferForm.validity_end).toISOString() : null,
        terms_conditions: createOfferForm.terms_conditions,
        status: 'active',
        offered_amount: 0, // Valor por defecto para compatibilidad con esquema antiguo
      };

      // Agregar campos específicos según el tipo de oferta
      if (createOfferForm.offer_type === 'discount') {
        offerData.discount_percentage = parseFloat(createOfferForm.discount_percentage);
        offerData.offered_amount = 0; // Para descuentos, el monto ofrecido es 0 (se calcula como porcentaje)
      } else if (createOfferForm.offer_type === 'fixed_amount') {
        offerData.fixed_amount = parseFloat(createOfferForm.fixed_amount);
        offerData.offered_amount = parseFloat(createOfferForm.fixed_amount); // Para montos fijos, usar el mismo valor
      }

      const { offer, error } = await createOffer(offerData);

      if (error) {
        setCreateOfferError(error);
        return;
      }

      // Reset form and close modal
      setCreateOfferForm({
        title: '',
        description: '',
        offer_type: 'discount',
        discount_percentage: '',
        fixed_amount: '',
        user_incentive_percentage: 5,
        user_incentive_fixed: '',
        user_incentive_type: 'percentage',
        nexupay_commission_percentage: 5,
        nexupay_commission_fixed: '',
        nexupay_commission_type: 'percentage',
        payment_method: 'both', // Reset método de pago
        client_id: '', // Se mantiene vacío para forzar selección
        validity_start: '',
        validity_end: '',
        terms_conditions: '',
      });
      setShowCreateModal(false);

      // Reload data
      loadData();
    } catch (error) {
      setCreateOfferError('Error al crear oferta. Por favor, intenta de nuevo.');
    } finally {
      setCreateOfferLoading(false);
    }
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setShowViewModal(true);
  };

  const handleEditOffer = (offer) => {
    const userCommission = offer.user_incentive_percentage || 5;
    const nexuPayCommission = offer.nexupay_commission_percentage || offer.user_incentive_percentage || 5;

    // Usar el valor más alto de las dos comisiones para sincronizar
    const syncedCommission = Math.max(userCommission, nexuPayCommission);

    setSelectedOffer(offer);
    setEditOfferForm({
      title: offer.title || '',
      description: offer.description || '',
      offer_type: offer.offer_type || 'discount',
      discount_percentage: offer.discount_percentage || '',
      fixed_amount: offer.fixed_amount || '',
      user_incentive_percentage: syncedCommission,
      nexupay_commission_percentage: syncedCommission, // Nuevo campo - sincronizado
      payment_method: offer.payment_method || 'bank_transfer', // Nuevo campo
      client_id: offer.client_id || '',
      validity_start: offer.validity_start ? new Date(offer.validity_start).toISOString().slice(0, 16) : '',
      validity_end: offer.validity_end ? new Date(offer.validity_end).toISOString().slice(0, 16) : '',
      terms_conditions: offer.terms_conditions || '',
      status: offer.status || 'active'
    });
    setShowEditModal(true);
  };

  // Sincronizar comisiones en formulario de editar: cuando se cambia una, la otra se actualiza automáticamente
  useEffect(() => {
    if (showEditModal) {
      setEditOfferForm(prev => ({
        ...prev,
        nexupay_commission_percentage: prev.user_incentive_percentage
      }));
    }
  }, [editOfferForm.user_incentive_percentage, showEditModal]);

  useEffect(() => {
    if (showEditModal) {
      setEditOfferForm(prev => ({
        ...prev,
        user_incentive_percentage: prev.nexupay_commission_percentage
      }));
    }
  }, [editOfferForm.nexupay_commission_percentage, showEditModal]);

  const handleUpdateOffer = async () => {
    try {
      setEditOfferLoading(true);
      setEditOfferError(null);

      // Validar que se haya seleccionado un cliente corporativo
      if (!editOfferForm.client_id) {
        setEditOfferError('Debes seleccionar un cliente corporativo para asignar la oferta.');
        return;
      }

      const updateData = {
        title: editOfferForm.title,
        description: editOfferForm.description,
        offer_type: editOfferForm.offer_type,
        user_incentive_percentage: parseFloat(editOfferForm.user_incentive_percentage),
        nexupay_commission_percentage: parseFloat(editOfferForm.nexupay_commission_percentage), // Nuevo campo
        payment_method: editOfferForm.payment_method, // Nuevo campo
        client_id: editOfferForm.client_id || null,
        validity_start: editOfferForm.validity_start ? new Date(editOfferForm.validity_start).toISOString() : new Date().toISOString(),
        validity_end: editOfferForm.validity_end ? new Date(editOfferForm.validity_end).toISOString() : null,
        terms_conditions: editOfferForm.terms_conditions,
        status: editOfferForm.status,
        offered_amount: 0, // Valor por defecto para compatibilidad
      };

      // Agregar campos específicos según el tipo de oferta
      if (editOfferForm.offer_type === 'discount') {
        updateData.discount_percentage = parseFloat(editOfferForm.discount_percentage);
        updateData.offered_amount = 0;
      } else if (editOfferForm.offer_type === 'fixed_amount') {
        updateData.fixed_amount = parseFloat(editOfferForm.fixed_amount);
        updateData.offered_amount = parseFloat(editOfferForm.fixed_amount);
      }

      const { error } = await updateOffer(selectedOffer.id, updateData);

      if (error) {
        setEditOfferError(error);
        return;
      }

      // Close modal and reload data
      setShowEditModal(false);
      setSelectedOffer(null);
      loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Oferta actualizada',
        text: 'La oferta ha sido actualizada exitosamente.',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      setEditOfferError('Error al actualizar oferta. Por favor, intenta de nuevo.');
    } finally {
      setEditOfferLoading(false);
    }
  };

  const handleDeleteOffer = async (offer) => {
    const result = await Swal.fire({
      title: '¿Eliminar oferta?',
      text: `¿Estás seguro de que quieres eliminar la oferta "${offer.title}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await deleteOffer(offer.id);

        if (error) {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al eliminar la oferta. Por favor, intenta de nuevo.',
            confirmButtonText: 'Aceptar'
          });
          return;
        }

        loadData();

        await Swal.fire({
          icon: 'success',
          title: 'Oferta eliminada',
          text: 'La oferta ha sido eliminada exitosamente.',
          confirmButtonText: 'Aceptar'
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la oferta. Por favor, intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activa</Badge>;
      case 'expired':
        return <Badge variant="danger">Expirada</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Desconocida</Badge>;
    }
  };

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case 'discount':
        return 'Descuento';
      case 'fixed_amount':
        return 'Monto Fijo';
      case 'installment_plan':
        return 'Plan de Cuotas';
      case 'renegotiation':
        return 'Renegociación';
      case 'partial_condonation':
        return 'Condonación Parcial';
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando ofertas..." />;
  }

  if (!profile?.company?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes una empresa registrada. Crea una empresa primero para gestionar ofertas.
          </p>
          <Button onClick={() => navigate('/company/dashboard')}>
            Ir al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gestión de Ofertas</h1>
          <p className="text-primary-100">
            Crea y administra ofertas para atraer más deudores
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <DateFilter
          onFilterChange={setDateFilter}
          className="mb-0"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <Badge variant="primary">{offers.filter(o => o.status === 'active').length}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Ofertas Activas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {offers.filter(o => o.status === 'active').length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success-100 rounded-lg">
                <Users className="w-6 h-6 text-success-600" />
              </div>
              <Badge variant="success">
                {offers.filter(o => o.status === 'active').length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Ofertas Disponibles</p>
            <p className="text-2xl font-bold text-secondary-900">
              {offers.filter(o => o.status === 'active').length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-warning-600" />
              </div>
              <Badge variant="warning">
                {offers.filter(o => o.status === 'expired').length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Ofertas Expiradas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {offers.filter(o => o.status === 'expired').length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-info-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-info-600" />
              </div>
              <Badge variant="info">
                {formatCurrency(offers.reduce((sum, o) => sum + (o.total_savings || 0), 0))}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Ahorro Total</p>
            <p className="text-2xl font-bold text-secondary-900">
              {formatCurrency(offers.reduce((sum, o) => sum + (o.total_savings || 0), 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Offers List */}
      <Card
        title="Ofertas Disponibles"
        subtitle={`${offers.length} oferta${offers.length !== 1 ? 's' : ''} creada${offers.length !== 1 ? 's' : ''}`}
      >
        {offers.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600 mb-4">
              No tienes ofertas creadas todavía
            </p>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primera Oferta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Target className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                      {getStatusBadge(offer.status)}
                      <Badge variant="outline">{getOfferTypeLabel(offer.offer_type)}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Comisión persona/deudor: {offer.user_incentive_percentage}%</span>
                      <span>Pago: {offer.payment_method === 'mercadopago' ? 'MP' : offer.payment_method === 'both' ? 'Ambos' : 'Transferencia'}</span>
                      {offer.validity_end && (
                        <span>Expira: {formatDate(offer.validity_end)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOffer(offer)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditOffer(offer)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteOffer(offer)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Offer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title=""
        size="xl"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl inline-block mb-6">
              <Target className="w-16 h-16 text-primary-600" />
            </div>
            <h2 className="text-xl md:text-3xl font-display font-bold text-secondary-900 mb-2">
              Crear Nueva Oferta
            </h2>
            <p className="text-secondary-600 text-lg">
              Diseña una oferta atractiva para aumentar tus tasas de recuperación
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-primary-700">Información Básica</span>
            </div>
            <div className="w-12 h-0.5 bg-primary-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">2</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Configuración</span>
            </div>
            <div className="w-12 h-0.5 bg-primary-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">3</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Finalizar</span>
            </div>
          </div>

          {/* Información Básica */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-2 border-primary-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-primary-900">
                Información Básica
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Cliente Corporativo *
                </label>
                <select
                  value={createOfferForm.client_id}
                  onChange={(e) => setCreateOfferForm(prev => ({ ...prev, client_id: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white text-lg transition-all appearance-none ${
                    createOfferError && !createOfferForm.client_id
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-secondary-200 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  required
                >
                  <option value="">Seleccionar cliente corporativo...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.business_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-secondary-600 mt-1">
                  Cada oferta debe estar asignada a un cliente corporativo específico
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Título de la Oferta *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all"
                    placeholder="Ej: Descuento especial del 20%"
                    value={createOfferForm.title}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Tipo de Oferta *
                  </label>
                  <select
                    value={createOfferForm.offer_type}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, offer_type: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all appearance-none"
                  >
                    <option value="discount">Descuento por Porcentaje</option>
                    <option value="fixed_amount">Monto Fijo de Descuento</option>
                    <option value="installment_plan">Plan de Cuotas</option>
                    <option value="renegotiation">Renegociación</option>
                    <option value="partial_condonation">Condonación Parcial</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Método de Pago *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                      createOfferForm.payment_method === 'bank_transfer'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          value="bank_transfer"
                          checked={createOfferForm.payment_method === 'bank_transfer'}
                          onChange={(e) => setCreateOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <Banknote className="w-6 h-6 flex-shrink-0" />
                      </div>
                      <span className="font-semibold text-center">Transferencia Bancaria</span>
                    </label>

                    <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                      createOfferForm.payment_method === 'mercadopago'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          value="mercadopago"
                          checked={createOfferForm.payment_method === 'mercadopago'}
                          onChange={(e) => setCreateOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <CreditCard className="w-6 h-6 flex-shrink-0" />
                      </div>
                      <span className="font-semibold text-center">Mercado Pago</span>
                    </label>

                    <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                      createOfferForm.payment_method === 'both'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          value="both"
                          checked={createOfferForm.payment_method === 'both'}
                          onChange={(e) => setCreateOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          <Banknote className="w-5 h-5" />
                          <CreditCard className="w-5 h-5" />
                        </div>
                      </div>
                      <span className="font-semibold text-center">Ambos Métodos</span>
                    </label>
                  </div>
                  <p className="text-xs text-secondary-600 mt-2">
                    Selecciona el método de pago que usarán los deudores para completar la oferta.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Descripción Detallada *
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all resize-none"
                  rows={4}
                  placeholder="Describe claramente los beneficios de esta oferta para atraer a los deudores..."
                  value={createOfferForm.description}
                  onChange={(e) => setCreateOfferForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Configuración de la Oferta */}
          <div className="bg-gradient-to-r from-success-50 to-success-100/50 border-2 border-success-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-success-900">
                Configuración de la Oferta
              </h3>
            </div>

            <div className="space-y-6">
              {/* Parámetros específicos por tipo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {createOfferForm.offer_type === 'discount' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Porcentaje de Descuento *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 15"
                      min="0"
                      max="100"
                      value={createOfferForm.discount_percentage}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      required
                    />
                  </div>
                )}

                {createOfferForm.offer_type === 'fixed_amount' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Monto Fijo de Descuento *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 50000"
                      value={createOfferForm.fixed_amount}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, fixed_amount: e.target.value }))}
                      required
                    />
                  </div>
                )}

                {/* Espaciador para mantener el grid consistente cuando no hay descuento/monto fijo */}
                {createOfferForm.offer_type !== 'discount' && createOfferForm.offer_type !== 'fixed_amount' && (
                  <div></div>
                )}

                {/* Comisión persona/deudor */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-secondary-900 font-display">
                    Comisión persona/deudor
                    <div className="relative group">
                      <HelpCircle className="w-5 h-5 text-blue-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
                        Comisión que recibe la persona/deudor por aceptar la oferta. Puede ser porcentaje o monto fijo.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </label>

                  {/* Selector de tipo */}
                  <div className="flex gap-2">
                    <label className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      createOfferForm.user_incentive_type === 'percentage'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        value="percentage"
                        checked={createOfferForm.user_incentive_type === 'percentage'}
                        onChange={(e) => setCreateOfferForm(prev => ({ ...prev, user_incentive_type: e.target.value }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Porcentaje (%)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      createOfferForm.user_incentive_type === 'fixed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        value="fixed"
                        checked={createOfferForm.user_incentive_type === 'fixed'}
                        onChange={(e) => setCreateOfferForm(prev => ({ ...prev, user_incentive_type: e.target.value }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Monto fijo ($)</span>
                    </label>
                  </div>

                  {/* Campo de input según tipo */}
                  {createOfferForm.user_incentive_type === 'percentage' ? (
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 5"
                      min="0"
                      max="50"
                      value={createOfferForm.user_incentive_percentage}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, user_incentive_percentage: e.target.value }))}
                      required
                    />
                  ) : (
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 5000"
                      min="0"
                      value={createOfferForm.user_incentive_fixed}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, user_incentive_fixed: e.target.value }))}
                      required
                    />
                  )}
                </div>

                {/* Comisión NexuPay */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-secondary-900 font-display">
                    Comisión NexuPay
                    <div className="relative group">
                      <HelpCircle className="w-5 h-5 text-purple-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
                        Comisión que cobra NexuPay por facilitar la transacción. Puede ser porcentaje o monto fijo.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </label>

                  {/* Selector de tipo */}
                  <div className="flex gap-2">
                    <label className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      createOfferForm.nexupay_commission_type === 'percentage'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}>
                      <input
                        type="radio"
                        value="percentage"
                        checked={createOfferForm.nexupay_commission_type === 'percentage'}
                        onChange={(e) => setCreateOfferForm(prev => ({ ...prev, nexupay_commission_type: e.target.value }))}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Porcentaje (%)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      createOfferForm.nexupay_commission_type === 'fixed'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}>
                      <input
                        type="radio"
                        value="fixed"
                        checked={createOfferForm.nexupay_commission_type === 'fixed'}
                        onChange={(e) => setCreateOfferForm(prev => ({ ...prev, nexupay_commission_type: e.target.value }))}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Monto fijo ($)</span>
                    </label>
                  </div>

                  {/* Campo de input según tipo */}
                  {createOfferForm.nexupay_commission_type === 'percentage' ? (
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 5"
                      min="0"
                      max="50"
                      value={createOfferForm.nexupay_commission_percentage}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, nexupay_commission_percentage: e.target.value }))}
                      required
                    />
                  ) : (
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                      placeholder="Ej: 3000"
                      min="0"
                      value={createOfferForm.nexupay_commission_fixed}
                      onChange={(e) => setCreateOfferForm(prev => ({ ...prev, nexupay_commission_fixed: e.target.value }))}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Configuración adicional - Campo Máximo de Usos eliminado */}

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                    value={createOfferForm.validity_start}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, validity_start: e.target.value }))}
                  />
                  <p className="text-xs text-blue-600 mt-1">💡 Los valores se sincronizan automáticamente</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Fecha de Expiración (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                    value={createOfferForm.validity_end}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, validity_end: e.target.value }))}
                  />
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Términos y Condiciones
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all resize-none"
                  rows={3}
                  placeholder="Especifica las condiciones, restricciones o requisitos de la oferta..."
                  value={createOfferForm.terms_conditions}
                  onChange={(e) => setCreateOfferForm(prev => ({ ...prev, terms_conditions: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Comisiones Transparentes */}
          {commissionInfo && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-100/50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-amber-900">
                  Comisiones Asociadas
                </h3>
              </div>

              <div className="bg-white/60 rounded-lg p-4 space-y-4">
                {/* Cuadro Comisión NexuPay */}
                <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Comisión NexuPay ({createOfferForm.nexupay_commission_type === 'percentage'
                      ? `${createOfferForm.nexupay_commission_percentage}%`
                      : `$${parseFloat(createOfferForm.nexupay_commission_fixed || 0).toLocaleString('es-CL')}`})
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">
                        {createOfferForm.nexupay_commission_type === 'percentage'
                          ? 'Sobre monto base ($100.000):'
                          : 'Monto fijo:'}
                      </span>
                      <span className="font-semibold text-purple-600">
                        {createOfferForm.nexupay_commission_type === 'percentage'
                          ? `$${(100000 * (createOfferForm.nexupay_commission_percentage / 100)).toLocaleString('es-CL')}`
                          : `$${parseFloat(createOfferForm.nexupay_commission_fixed || 0).toLocaleString('es-CL')}`}
                      </span>
                    </div>
                    <div className="text-xs text-purple-600/70 space-y-1">
                      <div>💰 <strong>Pago:</strong> Cada 30 días</div>
                      <div>🏢 <strong>Define:</strong> La empresa que envía la oferta</div>
                      <div>🔧 <strong>Por:</strong> Facilitar la transacción</div>
                    </div>
                  </div>
                </div>

                {/* Cuadro Comisión Persona/Deudor */}
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Comisión persona/deudor ({createOfferForm.user_incentive_type === 'percentage'
                      ? `${createOfferForm.user_incentive_percentage}%`
                      : `$${parseFloat(createOfferForm.user_incentive_fixed || 0).toLocaleString('es-CL')}`})
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">
                        {createOfferForm.user_incentive_type === 'percentage'
                          ? 'Sobre monto base ($100.000):'
                          : 'Monto fijo:'}
                      </span>
                      <span className="font-semibold text-blue-600">
                        {createOfferForm.user_incentive_type === 'percentage'
                          ? `$${(100000 * (createOfferForm.user_incentive_percentage / 100)).toLocaleString('es-CL')}`
                          : `$${parseFloat(createOfferForm.user_incentive_fixed || 0).toLocaleString('es-CL')}`}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600/70 space-y-1">
                      <div>⚡ <strong>Pago:</strong> En 48 horas</div>
                      <div>🏢 <strong>Define:</strong> La empresa que envía la oferta</div>
                      <div>🎯 <strong>Por:</strong> Incentivo por aceptar la oferta</div>
                    </div>
                  </div>
                </div>

                {/* Información por Método de Pago */}
                <div className="border-t border-amber-200 pt-3">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-amber-700 font-medium">Método de pago seleccionado:</span>
                    <span className="font-semibold">
                      {createOfferForm.payment_method === 'mercadopago' ? 'Mercado Pago' :
                       createOfferForm.payment_method === 'bank_transfer' ? 'Transferencia Bancaria' :
                       'Ambos métodos'}
                    </span>
                  </div>

                  {commissionInfo.both ? (
                    // Mostrar información para ambos métodos
                    <div className="space-y-3">
                      {/* Transferencia Bancaria */}
                      <div className="border border-green-200 rounded-lg p-3 bg-green-50/30">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                          <Banknote className="w-3 h-3" />
                          Transferencia Bancaria
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-green-700">Empresa recibe:</span>
                            <span className="font-semibold text-green-700">${commissionInfo.bankTransfer.breakdown.amountReceivedByCompany.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mercado Pago */}
                      <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30">
                        <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
                          <CreditCard className="w-3 h-3" />
                          Mercado Pago
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Comisión MP adicional:</span>
                            <span className="font-semibold text-red-600">-${commissionInfo.mercadopago.mercadopagoCommission.toLocaleString('es-CL')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Empresa recibe:</span>
                            <span className="font-semibold text-blue-700">${commissionInfo.mercadopago.breakdown.amountReceivedByCompany.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mostrar información para un solo método
                    <div className="space-y-2">
                      {commissionInfo.mercadopagoCommission > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Comisión Mercado Pago adicional:</span>
                          <span className="font-semibold text-red-600">-${commissionInfo.mercadopagoCommission.toLocaleString('es-CL')}</span>
                        </div>
                      )}

                      <div className="border-t border-amber-300 pt-2 flex justify-between text-sm font-semibold">
                        <span className="text-green-700">Empresa recibe:</span>
                        <span className="text-green-700">${commissionInfo.breakdown.amountReceivedByCompany.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-3">
                  <p className="text-xs text-amber-700">
                    <strong>Transparencia total:</strong> Estas comisiones se calculan sobre un monto de ejemplo de $100.000.
                    La empresa paga tanto la comisión de NexuPay como el incentivo al usuario.
                    {commissionInfo.both
                      ? ' Las comisiones de Mercado Pago también son asumidas por la empresa. Las transferencias bancarias no tienen costo adicional.'
                      : commissionInfo.mercadopagoCommission > 0
                        ? ' Las comisiones de Mercado Pago también son asumidas por la empresa.'
                        : ' Las transferencias bancarias no tienen costo adicional.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Consejos y Recomendaciones */}
          <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-info-500 rounded-lg flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-info-900 mb-4">
                  Consejos para una Oferta Exitosa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-info-800 mb-2">Define claramente los beneficios</h4>
                    <p className="text-sm text-info-700">
                      Los deudores deben entender inmediatamente qué ganan al aceptar tu oferta.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-info-800 mb-2">Establece fechas realistas</h4>
                    <p className="text-sm text-info-700">
                      Las ofertas con tiempo limitado generan mayor urgencia y conversión.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-info-800 mb-2">Comisiones atractivas</h4>
                    <p className="text-sm text-info-700">
                      Una buena comisión a la persona/deudor aumenta significativamente las tasas de aceptación.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-info-800 mb-2">Limita los usos</h4>
                    <p className="text-sm text-info-700">
                      Las ofertas exclusivas generan mayor valor percibido y urgencia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {createOfferError && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 font-display">Error al crear oferta</h4>
                  <p className="text-red-700 mt-1">{createOfferError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 hover:scale-105 transition-all py-3"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateOffer}
              className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
              loading={createOfferLoading}
            >
              {createOfferLoading ? 'Creando Oferta...' : 'Crear Oferta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Offer Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOffer(null);
        }}
        title="Detalles de la Oferta"
        size="lg"
      >
        {selectedOffer && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl inline-block mb-4">
                <Target className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
                {selectedOffer.title}
              </h3>
              <div className="flex items-center justify-center gap-2">
                {getStatusBadge(selectedOffer.status)}
                <Badge variant="outline">{getOfferTypeLabel(selectedOffer.offer_type)}</Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Descripción</h4>
                  <p className="text-secondary-700 bg-gray-50 p-3 rounded-lg">
                    {selectedOffer.description || 'Sin descripción'}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Tipo y Parámetros</h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Tipo:</span>
                      <span className="font-medium">{getOfferTypeLabel(selectedOffer.offer_type)}</span>
                    </div>
                    {selectedOffer.discount_percentage && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Descuento:</span>
                        <span className="font-medium">{selectedOffer.discount_percentage}%</span>
                      </div>
                    )}
                    {selectedOffer.fixed_amount && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Monto fijo:</span>
                        <span className="font-medium">${selectedOffer.fixed_amount.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Comisión persona/deudor:</span>
                      <span className="font-medium">{selectedOffer.user_incentive_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Método de pago:</span>
                      <span className="font-medium">
                        {selectedOffer.payment_method === 'mercadopago' ? 'Mercado Pago' :
                         selectedOffer.payment_method === 'both' ? 'Ambos métodos' :
                         'Transferencia Bancaria'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Configuración</h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Estado:</span>
                      <span>{getStatusBadge(selectedOffer.status)}</span>
                    </div>
                    {selectedOffer.validity_start && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Inicio:</span>
                        <span className="font-medium">{formatDate(selectedOffer.validity_start)}</span>
                      </div>
                    )}
                    {selectedOffer.validity_end && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Expiración:</span>
                        <span className="font-medium">{formatDate(selectedOffer.validity_end)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOffer.terms_conditions && (
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-2">Términos y Condiciones</h4>
                    <p className="text-secondary-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedOffer.terms_conditions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOffer(null);
                }}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditOffer(selectedOffer);
                }}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Oferta
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Offer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOffer(null);
          setEditOfferError(null);
        }}
        title="Editar Oferta"
        size="xl"
      >
        {selectedOffer && (
          <div className="space-y-8">
            {/* Modern Header */}
            <div className="text-center">
              <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl inline-block mb-6">
                <Edit className="w-16 h-16 text-orange-600" />
              </div>
              <h2 className="text-xl md:text-3xl font-display font-bold text-secondary-900 mb-2">
                Editar Oferta
              </h2>
              <p className="text-secondary-600 text-lg">
                Modifica los detalles de tu oferta
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <span className="text-sm font-medium text-orange-700">Editar Información</span>
              </div>
              <div className="w-12 h-0.5 bg-orange-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">2</span>
                </div>
                <span className="text-sm font-medium text-secondary-500">Guardar Cambios</span>
              </div>
            </div>

            {/* Información Básica */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-orange-900">
                  Información Básica
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Cliente Corporativo *
                  </label>
                  <select
                    value={editOfferForm.client_id}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, client_id: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white text-lg transition-all appearance-none ${
                      editOfferError && !editOfferForm.client_id
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-secondary-200 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                    required
                  >
                    <option value="">Seleccionar cliente corporativo...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.business_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-600 mt-1">
                    Cada oferta debe estar asignada a un cliente corporativo específico
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Título de la Oferta *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-lg transition-all"
                      placeholder="Ej: Descuento especial del 20%"
                      value={editOfferForm.title}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Tipo de Oferta *
                    </label>
                    <select
                      value={editOfferForm.offer_type}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, offer_type: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-lg transition-all appearance-none"
                    >
                      <option value="discount">Descuento por Porcentaje</option>
                      <option value="fixed_amount">Monto Fijo de Descuento</option>
                      <option value="installment_plan">Plan de Cuotas</option>
                      <option value="renegotiation">Renegociación</option>
                      <option value="partial_condonation">Condonación Parcial</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Método de Pago *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                        editOfferForm.payment_method === 'bank_transfer'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            value="bank_transfer"
                            checked={editOfferForm.payment_method === 'bank_transfer'}
                            onChange={(e) => setEditOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <Banknote className="w-6 h-6 flex-shrink-0" />
                        </div>
                        <span className="font-semibold text-center">Transferencia Bancaria</span>
                      </label>

                      <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                        editOfferForm.payment_method === 'mercadopago'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            value="mercadopago"
                            checked={editOfferForm.payment_method === 'mercadopago'}
                            onChange={(e) => setEditOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <CreditCard className="w-6 h-6 flex-shrink-0" />
                        </div>
                        <span className="font-semibold text-center">Mercado Pago</span>
                      </label>

                      <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all h-24 ${
                        editOfferForm.payment_method === 'both'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            value="both"
                            checked={editOfferForm.payment_method === 'both'}
                            onChange={(e) => setEditOfferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex gap-1 flex-shrink-0">
                            <Banknote className="w-5 h-5" />
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="font-semibold text-center">Ambos Métodos</span>
                      </label>
                    </div>
                    <p className="text-xs text-secondary-600 mt-2">
                      Selecciona el método de pago que usarán los deudores para completar la oferta.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Descripción Detallada *
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-lg transition-all resize-none"
                    rows={4}
                    placeholder="Describe claramente los beneficios de esta oferta para atraer a los deudores..."
                    value={editOfferForm.description}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Configuración de la Oferta */}
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-red-900">
                  Configuración de la Oferta
                </h3>
              </div>

              <div className="space-y-6">
                {/* Parámetros específicos por tipo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {editOfferForm.offer_type === 'discount' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-secondary-900 font-display">
                        Porcentaje de Descuento *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                        placeholder="Ej: 15"
                        min="0"
                        max="100"
                        value={editOfferForm.discount_percentage}
                        onChange={(e) => setEditOfferForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                        required
                      />
                    </div>
                  )}
 
                  {editOfferForm.offer_type === 'fixed_amount' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-secondary-900 font-display">
                        Monto Fijo de Descuento *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                        placeholder="Ej: 50000"
                        value={editOfferForm.fixed_amount}
                        onChange={(e) => setEditOfferForm(prev => ({ ...prev, fixed_amount: e.target.value }))}
                        required
                      />
                    </div>
                  )}
 
                  {/* Espaciador para mantener el grid consistente cuando no hay descuento/monto fijo */}
                  {editOfferForm.offer_type !== 'discount' && editOfferForm.offer_type !== 'fixed_amount' && (
                    <div></div>
                  )}
 
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-secondary-900 font-display">
                      Comisión persona/deudor (%)
                      <div className="relative group">
                        <HelpCircle className="w-5 h-5 text-blue-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
                          Comisión que recibe la persona/deudor por aceptar la oferta. Se sincroniza automáticamente con la comisión de NexuPay.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                      placeholder="Ej: 5"
                      min="0"
                      max="50"
                      value={editOfferForm.user_incentive_percentage}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, user_incentive_percentage: e.target.value }))}
                      required
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-secondary-900 font-display">
                      Comisión NexuPay (%)
                      <div className="relative group">
                        <HelpCircle className="w-5 h-5 text-purple-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
                          Comisión que cobra NexuPay por facilitar la transacción. Se sincroniza automáticamente con la comisión de la persona/deudor.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                      placeholder="Ej: 5"
                      min="0"
                      max="50"
                      value={editOfferForm.nexupay_commission_percentage}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, nexupay_commission_percentage: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Configuración adicional */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Estado
                    </label>
                    <select
                      value={editOfferForm.status}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all appearance-none"
                    >
                      <option value="active">Activa</option>
                      <option value="expired">Expirada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="used">Utilizada</option>
                    </select>
                  </div>
                </div>

                {/* Campo Máximo de Usos eliminado */}

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Fecha de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                      value={editOfferForm.validity_start}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, validity_start: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Fecha de Expiración (Opcional)
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                      value={editOfferForm.validity_end}
                      onChange={(e) => setEditOfferForm(prev => ({ ...prev, validity_end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Máximo de Usos (Opcional)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all"
                    placeholder="Ej: 100"
                    min="1"
                    value={editOfferForm.max_uses}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, max_uses: e.target.value }))}
                  />
                </div>

                {/* Términos y condiciones */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Términos y Condiciones
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg transition-all resize-none"
                    rows={3}
                    placeholder="Especifica las condiciones, restricciones o requisitos de la oferta..."
                    value={editOfferForm.terms_conditions}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, terms_conditions: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {editOfferError && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900 font-display">Error al actualizar oferta</h4>
                    <p className="text-red-700 mt-1">{editOfferError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedOffer(null);
                  setEditOfferError(null);
                }}
                className="flex-1 hover:scale-105 transition-all py-3"
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleUpdateOffer}
                className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
                loading={editOfferLoading}
              >
                {editOfferLoading ? 'Actualizando Oferta...' : 'Actualizar Oferta'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OffersPage;