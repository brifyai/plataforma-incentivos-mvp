/**
 * Campaigns Page - Company
 *
 * Página para gestionar campañas masivas inteligentes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, DateFilter } from '../../components/common';
import {
  getCompanyCampaigns,
  getCorporateClients,
  createIntelligentCampaign
} from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Target,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Zap,
  BarChart3,
} from 'lucide-react';

const CampaignsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [corporateClients, setCorporateClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCampaignForm, setCreateCampaignForm] = useState({
    name: '',
    description: '',
    campaign_type: 'mass_offers',
    scope_config: {
      allCorporateClients: true,
      selectedCorporateClients: [],
      excludeCorporateClients: []
    },
    filter_config: {
      corporateFilters: {},
      debtorFilters: {
        riskLevel: { min: 'low', max: 'high' },
        debtAmount: { min: 0, max: 10000000 },
        debtAge: { min: 0, max: 365 },
        paymentBehavior: [],
        geographicLocation: [],
        demographicProfile: {}
      }
    },
    offer_config: {
      discountPercentage: 15,
      paymentPlan: 'monthly_6',
      validityDays: 30,
      specialConditions: ''
    },
    ai_config: {
      enabled: true,
      segmentation: true,
      personalization: true,
      optimization: true,
      abTesting: false
    },
    communication_config: {
      showCompanyName: true,
      hideContactData: true,
      channel: 'email_to_platform',
      aiPersonalization: true
    },
    scheduled_at: '',
    conversion_goal: 15
  });
  const [createCampaignLoading, setCreateCampaignLoading] = useState(false);
  const [createCampaignError, setCreateCampaignError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (profile?.company?.id) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar campañas
      const campaignsResult = await getCompanyCampaigns(profile.company.id);
      if (campaignsResult.error) {
        console.error('Error loading campaigns:', campaignsResult.error);
      } else {
        setCampaigns(campaignsResult.campaigns);
      }

      // Cargar clientes corporativos con soporte para god_mode
      let corporateClientsData;
      if (profile?.role === 'god_mode') {
        console.log('🔑 God Mode: Cargando todos los clientes corporativos para CampaignsPage');
        const { data: allClients, error } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('Error loading all corporate clients:', error);
          setCorporateClients([]);
        } else {
          corporateClientsData = { corporateClients: allClients };
        }
      } else {
        corporateClientsData = await getCorporateClients(profile.company.id);
      }

      if (corporateClientsData?.error) {
        console.error('Error loading corporate clients:', corporateClientsData.error);
      } else {
        setCorporateClients(corporateClientsData.corporateClients || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setCreateCampaignLoading(true);
      setCreateCampaignError(null);

      const campaignData = {
        ...createCampaignForm,
        created_by: profile.id,
        scheduled_at: createCampaignForm.scheduled_at ?
          new Date(createCampaignForm.scheduled_at).toISOString() : null
      };

      const { campaign, segmentation } = await createIntelligentCampaign(
        campaignData,
        profile.company.id
      );

      // Reset form and close modal
      setCreateCampaignForm({
        name: '',
        description: '',
        campaign_type: 'mass_offers',
        scope_config: {
          allCorporateClients: true,
          selectedCorporateClients: [],
          excludeCorporateClients: []
        },
        filter_config: {
          corporateFilters: {},
          debtorFilters: {
            riskLevel: { min: 'low', max: 'high' },
            debtAmount: { min: 0, max: 10000000 },
            debtAge: { min: 0, max: 365 },
            paymentBehavior: [],
            geographicLocation: [],
            demographicProfile: {}
          }
        },
        offer_config: {
          discountPercentage: 15,
          paymentPlan: 'monthly_6',
          validityDays: 30,
          specialConditions: ''
        },
        ai_config: {
          enabled: true,
          segmentation: true,
          personalization: true,
          optimization: true,
          abTesting: false
        },
        communication_config: {
          showCompanyName: true,
          hideContactData: true,
          channel: 'email_to_platform',
          aiPersonalization: true
        },
        scheduled_at: '',
        conversion_goal: 15
      });
      setShowCreateModal(false);

      // Reload data
      loadData();
    } catch (error) {
      setCreateCampaignError('Error al crear campaña. Por favor, intenta de nuevo.');
      console.error('Error creating campaign:', error);
    } finally {
      setCreateCampaignLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'scheduled':
        return <Badge variant="warning">Programada</Badge>;
      case 'running':
        return <Badge variant="info">Ejecutándose</Badge>;
      case 'paused':
        return <Badge variant="danger">Pausada</Badge>;
      case 'completed':
        return <Badge variant="success">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Desconocida</Badge>;
    }
  };

  const getCampaignTypeLabel = (type) => {
    switch (type) {
      case 'mass_offers':
        return 'Ofertas Masivas';
      case 'segmented':
        return 'Segmentadas';
      case 'personalized':
        return 'Personalizadas';
      case 'ab_test':
        return 'A/B Testing';
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando campañas..." />;
  }

  if (!profile?.company?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes una empresa registrada. Crea una empresa primero para gestionar campañas.
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Campañas Inteligentes</h1>
            <p className="text-primary-100">
              Gestiona campañas masivas con IA y segmentación automática
            </p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 hover:bg-white/20 border-white/30"
          >
            Nueva Campaña
          </Button>
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
              <Badge variant="primary">{campaigns.filter(c => c.status === 'active').length}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Campañas Activas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').length}
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
                {campaigns.reduce((sum, c) => sum + (c.metrics?.actualSent || 0), 0)}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Mensajes Enviados</p>
            <p className="text-2xl font-bold text-secondary-900">
              {campaigns.reduce((sum, c) => sum + (c.metrics?.actualSent || 0), 0)}
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
                {Math.round(campaigns.reduce((sum, c) => sum + (c.metrics?.conversionRate || 0), 0) / Math.max(campaigns.length, 1))}%
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Conversión Promedio</p>
            <p className="text-2xl font-bold text-secondary-900">
              {Math.round(campaigns.reduce((sum, c) => sum + (c.metrics?.conversionRate || 0), 0) / Math.max(campaigns.length, 1))}%
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-info-100 rounded-lg">
                <Zap className="w-6 h-6 text-info-600" />
              </div>
              <Badge variant="info">
                {campaigns.filter(c => c.ai_config?.enabled).length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Campañas con IA</p>
            <p className="text-2xl font-bold text-secondary-900">
              {campaigns.filter(c => c.ai_config?.enabled).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card
        title="Campañas Disponibles"
        subtitle={`${campaigns.length} campaña${campaigns.length !== 1 ? 's' : ''} creada${campaigns.length !== 1 ? 's' : ''}`}
      >
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600 mb-4">
              No tienes campañas creadas todavía
            </p>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primera Campaña
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Target className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                      <Badge variant="outline">{getCampaignTypeLabel(campaign.campaign_type)}</Badge>
                      {campaign.ai_config?.enabled && (
                        <Badge variant="gradient" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Alcance estimado: {campaign.estimated_reach || 0}</span>
                      {campaign.metrics?.actualSent && (
                        <span>Enviados: {campaign.metrics.actualSent}</span>
                      )}
                      {campaign.metrics?.conversionRate && (
                        <span>Conversión: {Math.round(campaign.metrics.conversionRate)}%</span>
                      )}
                      {campaign.scheduled_at && (
                        <span>Programada: {formatDate(campaign.scheduled_at)}</span>
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
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  {campaign.status === 'draft' && (
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                      <Play className="w-4 h-4 mr-1" />
                      Ejecutar
                    </Button>
                  )}
                  {campaign.status === 'running' && (
                    <Button variant="outline" size="sm" className="text-yellow-600 hover:text-yellow-700">
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </Button>
                  )}
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

      {/* Create Campaign Modal */}
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
              Crear Campaña Inteligente
            </h2>
            <p className="text-secondary-600 text-lg">
              Diseña una campaña masiva con segmentación automática por IA
            </p>
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
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all"
                    placeholder="Ej: Campaña Descuentos Especiales"
                    value={createCampaignForm.name}
                    onChange={(e) => setCreateCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    Tipo de Campaña *
                  </label>
                  <select
                    value={createCampaignForm.campaign_type}
                    onChange={(e) => setCreateCampaignForm(prev => ({ ...prev, campaign_type: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all appearance-none"
                  >
                    <option value="mass_offers">Ofertas Masivas</option>
                    <option value="segmented">Segmentadas</option>
                    <option value="personalized">Personalizadas</option>
                    <option value="ab_test">A/B Testing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Descripción
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg transition-all resize-none"
                  rows={3}
                  placeholder="Describe el objetivo de esta campaña..."
                  value={createCampaignForm.description}
                  onChange={(e) => setCreateCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Configuración de Alcance */}
          <div className="bg-gradient-to-r from-success-50 to-success-100/50 border-2 border-success-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success-500 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-success-900">
                Alcance y Filtros
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={createCampaignForm.scope_config.allCorporateClients}
                    onChange={(e) => setCreateCampaignForm(prev => ({
                      ...prev,
                      scope_config: {
                        ...prev.scope_config,
                        allCorporateClients: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-success-600 bg-gray-100 border-gray-300 rounded focus:ring-success-500"
                  />
                  <span className="text-sm font-medium text-secondary-900">
                    Incluir todos los clientes corporativos
                  </span>
                </label>

                {!createCampaignForm.scope_config.allCorporateClients && (
                  <div className="ml-7 space-y-2">
                    <label className="block text-sm font-bold text-secondary-900 font-display">
                      Seleccionar Clientes Corporativos
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {corporateClients.map(client => (
                        <label key={client.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={createCampaignForm.scope_config.selectedCorporateClients.includes(client.id)}
                            onChange={(e) => {
                              const selected = e.target.checked
                                ? [...createCampaignForm.scope_config.selectedCorporateClients, client.id]
                                : createCampaignForm.scope_config.selectedCorporateClients.filter(id => id !== client.id);
                              setCreateCampaignForm(prev => ({
                                ...prev,
                                scope_config: {
                                  ...prev.scope_config,
                                  selectedCorporateClients: selected
                                }
                              }));
                            }}
                            className="w-3 h-3 text-success-600"
                          />
                          <span className="text-sm">{client.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Oferta */}
          <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 border-2 border-warning-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-warning-900">
                Configuración de Oferta
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white text-lg transition-all"
                  placeholder="15"
                  min="0"
                  max="50"
                  value={createCampaignForm.offer_config.discountPercentage}
                  onChange={(e) => setCreateCampaignForm(prev => ({
                    ...prev,
                    offer_config: {
                      ...prev.offer_config,
                      discountPercentage: parseInt(e.target.value) || 0
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Plan de Pago
                </label>
                <select
                  value={createCampaignForm.offer_config.paymentPlan}
                  onChange={(e) => setCreateCampaignForm(prev => ({
                    ...prev,
                    offer_config: {
                      ...prev.offer_config,
                      paymentPlan: e.target.value
                    }
                  }))}
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white text-lg transition-all appearance-none"
                >
                  <option value="monthly_3">3 cuotas mensuales</option>
                  <option value="monthly_6">6 cuotas mensuales</option>
                  <option value="monthly_12">12 cuotas mensuales</option>
                  <option value="lump_sum">Pago único</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Validez (días)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white text-lg transition-all"
                  placeholder="30"
                  min="1"
                  max="90"
                  value={createCampaignForm.offer_config.validityDays}
                  onChange={(e) => setCreateCampaignForm(prev => ({
                    ...prev,
                    offer_config: {
                      ...prev.offer_config,
                      validityDays: parseInt(e.target.value) || 30
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Configuración de IA */}
          <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-info-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-info-900">
                Inteligencia Artificial
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={createCampaignForm.ai_config.enabled}
                    onChange={(e) => setCreateCampaignForm(prev => ({
                      ...prev,
                      ai_config: {
                        ...prev.ai_config,
                        enabled: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-info-600 bg-gray-100 border-gray-300 rounded focus:ring-info-500"
                  />
                  <span className="text-sm font-medium text-secondary-900">
                    Habilitar IA en esta campaña
                  </span>
                </label>

                {createCampaignForm.ai_config.enabled && (
                  <>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={createCampaignForm.ai_config.segmentation}
                        onChange={(e) => setCreateCampaignForm(prev => ({
                          ...prev,
                          ai_config: {
                            ...prev.ai_config,
                            segmentation: e.target.checked
                          }
                        }))}
                        className="w-3 h-3 text-info-600"
                      />
                      <span className="text-sm">Segmentación automática</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={createCampaignForm.ai_config.personalization}
                        onChange={(e) => setCreateCampaignForm(prev => ({
                          ...prev,
                          ai_config: {
                            ...prev.ai_config,
                            personalization: e.target.checked
                          }
                        }))}
                        className="w-3 h-3 text-info-600"
                      />
                      <span className="text-sm">Personalización individual</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={createCampaignForm.ai_config.optimization}
                        onChange={(e) => setCreateCampaignForm(prev => ({
                          ...prev,
                          ai_config: {
                            ...prev.ai_config,
                            optimization: e.target.checked
                          }
                        }))}
                        className="w-3 h-3 text-info-600"
                      />
                      <span className="text-sm">Optimización en tiempo real</span>
                    </label>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Meta de Conversión (%)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-500 bg-white text-lg transition-all"
                  placeholder="15"
                  min="1"
                  max="100"
                  value={createCampaignForm.conversion_goal}
                  onChange={(e) => setCreateCampaignForm(prev => ({
                    ...prev,
                    conversion_goal: parseInt(e.target.value) || 15
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Programación */}
          <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 border-2 border-secondary-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-secondary-900">
                Programación
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  Fecha de Ejecución (Opcional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white text-lg transition-all"
                  value={createCampaignForm.scheduled_at}
                  onChange={(e) => setCreateCampaignForm(prev => ({
                    ...prev,
                    scheduled_at: e.target.value
                  }))}
                />
                <p className="text-xs text-secondary-600">
                  Si no se especifica, la campaña se ejecutará inmediatamente después de crear.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {createCampaignError && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <span className="text-white font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-bold text-red-900 font-display">Error al crear campaña</h4>
                  <p className="text-red-700 mt-1">{createCampaignError}</p>
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
              onClick={handleCreateCampaign}
              className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
              loading={createCampaignLoading}
            >
              {createCampaignLoading ? 'Creando Campaña...' : 'Crear Campaña Inteligente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignsPage;