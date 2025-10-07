/**
 * Offers Page - Company
 *
 * Página para que las empresas creen y gestionen ofertas
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, DateFilter } from '../../components/common';
import { getCompanyOffers, createOffer, getCompanyClients } from '../../services/databaseService';
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
    client_id: '',
    validity_start: '',
    validity_end: '',
    max_uses: '',
    terms_conditions: '',
  });
  const [createOfferLoading, setCreateOfferLoading] = useState(false);
  const [createOfferError, setCreateOfferError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (profile?.company?.id) {
      loadData();
    }
  }, [profile]);

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
      } else {
        setClients(clientsResult.clients);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    try {
      setCreateOfferLoading(true);
      setCreateOfferError(null);

      const offerData = {
        company_id: profile.company.id,
        title: createOfferForm.title,
        description: createOfferForm.description,
        offer_type: createOfferForm.offer_type,
        user_incentive_percentage: parseFloat(createOfferForm.user_incentive_percentage),
        client_id: createOfferForm.client_id || null,
        validity_start: createOfferForm.validity_start ? new Date(createOfferForm.validity_start).toISOString() : new Date().toISOString(),
        validity_end: createOfferForm.validity_end ? new Date(createOfferForm.validity_end).toISOString() : null,
        max_uses: createOfferForm.max_uses ? parseInt(createOfferForm.max_uses) : null,
        terms_conditions: createOfferForm.terms_conditions,
        status: 'active',
      };

      // Agregar campos específicos según el tipo de oferta
      if (createOfferForm.offer_type === 'discount') {
        offerData.discount_percentage = parseFloat(createOfferForm.discount_percentage);
      } else if (createOfferForm.offer_type === 'fixed_amount') {
        offerData.fixed_amount = parseFloat(createOfferForm.fixed_amount);
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
        client_id: '',
        validity_start: '',
        validity_end: '',
        max_uses: '',
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
                {offers.reduce((sum, o) => sum + (o.usage_count || 0), 0)}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Ofertas Utilizadas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {offers.reduce((sum, o) => sum + (o.usage_count || 0), 0)}
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
                      <span>Incentivo: {offer.user_incentive_percentage}%</span>
                      {offer.validity_end && (
                        <span>Expira: {formatDate(offer.validity_end)}</span>
                      )}
                      {offer.max_uses && (
                        <span>Máx usos: {offer.max_uses}</span>
                      )}
                      {offer.usage_count && (
                        <span>Usos: {offer.usage_count}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Incentivo al Usuario (%) *
                  </label>
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
                </div>
              </div>

              {/* Configuración adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Cliente Específico (Opcional)
                  </label>
                  <select
                    value={createOfferForm.client_id}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all appearance-none"
                  >
                    <option value="">Disponible para todos los clientes</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.business_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Máximo de Usos (Opcional)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg transition-all"
                    placeholder="Ej: 100"
                    min="1"
                    value={createOfferForm.max_uses}
                    onChange={(e) => setCreateOfferForm(prev => ({ ...prev, max_uses: e.target.value }))}
                  />
                </div>
              </div>

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
                    <h4 className="font-semibold text-info-800 mb-2">Incentivos atractivos</h4>
                    <p className="text-sm text-info-700">
                      Un buen incentivo al usuario aumenta significativamente las tasas de aceptación.
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
    </div>
  );
};

export default OffersPage;