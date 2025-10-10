/**
 * Corporate Client Manager - Gestión de Clientes Corporativos
 *
 * Interfaz para gestionar clientes corporativos, segmentos y jerarquía
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../../components/common';
import { getCorporateClients, createCorporateClient, updateCorporateClient, getCorporateSegments, createCorporateSegment } from '../../../services/databaseService';
import { hierarchicalFilterEngine } from '../../../services/hierarchicalFilterEngine';
import {
  Building,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';

const CorporateClientManager = ({ companyId }) => {
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState(null);

  const [newClient, setNewClient] = useState({
    name: '',
    display_category: 'banco',
    trust_level: 'medium',
    contact_info: {
      email: '',
      phone: '',
      contact_person: ''
    },
    business_info: {
      industry: '',
      size: '',
      location: ''
    }
  });

  const [newSegment, setNewSegment] = useState({
    corporate_id: '',
    name: '',
    criteria: '',
    debtor_count: 0
  });

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsResult, hierarchyResult] = await Promise.all([
        getCorporateClients(companyId),
        hierarchicalFilterEngine.getCompleteHierarchy(companyId)
      ]);

      if (clientsResult.error) {
        console.error('Error loading corporate clients:', clientsResult.error);
      } else {
        setCorporateClients(clientsResult.corporateClients || []);
      }

      setHierarchy(hierarchyResult);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const clientData = {
        ...newClient,
        company_id: companyId,
        is_active: true,
        segment_count: 0
      };

      const result = await createCorporateClient(clientData);
      if (result.error) throw result.error;

      setShowCreateModal(false);
      setNewClient({
        name: '',
        display_category: 'banco',
        trust_level: 'medium',
        contact_info: { email: '', phone: '', contact_person: '' },
        business_info: { industry: '', size: '', location: '' }
      });

      loadData();
    } catch (error) {
      console.error('Error creating corporate client:', error);
      alert('Error al crear cliente corporativo');
    }
  };

  const handleCreateSegment = async () => {
    try {
      const segmentData = {
        ...newSegment,
        is_active: true
      };

      const result = await createCorporateSegment(segmentData);
      if (result.error) throw result.error;

      setShowSegmentModal(false);
      setNewSegment({
        corporate_id: '',
        name: '',
        criteria: '',
        debtor_count: 0
      });

      loadData();
    } catch (error) {
      console.error('Error creating segment:', error);
      alert('Error al crear segmento');
    }
  };

  const getTrustBadge = (level) => {
    const config = {
      high: { label: 'Alta Confianza', color: 'success', icon: Shield },
      medium: { label: 'Confianza Media', color: 'warning', icon: AlertTriangle },
      low: { label: 'Baja Confianza', color: 'danger', icon: AlertTriangle }
    };

    const Icon = config[level]?.icon || AlertTriangle;
    return (
      <Badge variant={config[level]?.color || 'secondary'} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config[level]?.label || level}
      </Badge>
    );
  };

  const getCategoryBadge = (category) => {
    const categories = {
      banco: { label: 'Banco', color: 'blue' },
      retail: { label: 'Retail', color: 'green' },
      servicios: { label: 'Servicios', color: 'purple' },
      telecomunicaciones: { label: 'Telecom', color: 'orange' },
      otros: { label: 'Otros', color: 'gray' }
    };

    return (
      <Badge variant={categories[category]?.color || 'secondary'}>
        {categories[category]?.label || category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mr-3" />
          <span className="text-lg text-secondary-600">Cargando clientes corporativos...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-secondary-900">
            Clientes Corporativos
          </h2>
          <p className="text-secondary-600 mt-1">
            Gestiona tus clientes corporativos y sus segmentos
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowSegmentModal(true)}
            disabled={corporateClients.length === 0}
          >
            Nuevo Segmento
          </Button>
          <Button
            variant="gradient"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Building className="w-6 h-6 text-primary-600" />
              </div>
              <Badge variant="primary">{corporateClients.length}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Clientes Corporativos</p>
            <p className="text-2xl font-bold text-secondary-900">{corporateClients.length}</p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success-100 rounded-lg">
                <Users className="w-6 h-6 text-success-600" />
              </div>
              <Badge variant="success">
                {corporateClients.reduce((sum, client) => sum + (client.segment_count || 0), 0)}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Total Segmentos</p>
            <p className="text-2xl font-bold text-secondary-900">
              {corporateClients.reduce((sum, client) => sum + (client.segment_count || 0), 0)}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning-100 rounded-lg">
                <Target className="w-6 h-6 text-warning-600" />
              </div>
              <Badge variant="warning">
                {hierarchy?.totalCorporateDebtors || 0}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Deudores Corporativos</p>
            <p className="text-2xl font-bold text-secondary-900">
              {hierarchy?.totalCorporateDebtors || 0}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-info-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-info-600" />
              </div>
              <Badge variant="info">
                {corporateClients.filter(c => c.trust_level === 'high').length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Alta Confianza</p>
            <p className="text-2xl font-bold text-secondary-900">
              {corporateClients.filter(c => c.trust_level === 'high').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Corporate Clients List */}
      <Card title="Clientes Corporativos" className="shadow-soft">
        {corporateClients.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              No hay clientes corporativos
            </h3>
            <p className="text-secondary-600 mb-6">
              Comienza agregando tu primer cliente corporativo para segmentar mejor tus campañas
            </p>
            <Button
              variant="gradient"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Agregar Primer Cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {corporateClients.map((client) => (
              <div
                key={client.id}
                className="border border-secondary-200 rounded-xl p-6 hover:shadow-medium transition-all hover:border-primary-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-1">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryBadge(client.display_category)}
                        {getTrustBadge(client.trust_level)}
                        <Badge variant="outline">
                          {client.segment_count || 0} segmentos
                        </Badge>
                      </div>
                      <div className="text-sm text-secondary-600 space-y-1">
                        {client.contact_info?.contact_person && (
                          <p>Contacto: {client.contact_info.contact_person}</p>
                        )}
                        {client.business_info?.industry && (
                          <p>Industria: {client.business_info.industry}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => setSelectedClient(client)}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Settings className="w-4 h-4" />}
                      onClick={() => {
                        setNewSegment(prev => ({ ...prev, corporate_id: client.id }));
                        setShowSegmentModal(true);
                      }}
                    >
                      Agregar Segmento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Segments Preview */}
                {client.corporate_segments && client.corporate_segments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-secondary-200">
                    <h4 className="font-semibold text-secondary-900 mb-3">Segmentos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {client.corporate_segments.slice(0, 3).map((segment) => (
                        <div
                          key={segment.id}
                          className="bg-gradient-to-r from-info-50 to-info-100 p-3 rounded-lg border border-info-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-info-900 text-sm">
                              {segment.name}
                            </span>
                            <Badge variant="info" className="text-xs">
                              {segment.debtor_count || 0}
                            </Badge>
                          </div>
                          {segment.criteria && (
                            <p className="text-xs text-info-700 mt-1 line-clamp-2">
                              {segment.criteria}
                            </p>
                          )}
                        </div>
                      ))}
                      {client.corporate_segments.length > 3 && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-center">
                          <span className="text-sm text-gray-600">
                            +{client.corporate_segments.length - 3} más
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Corporate Client Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Cliente Corporativo"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl inline-block mb-6">
              <Building className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              Agregar Cliente Corporativo
            </h3>
            <p className="text-secondary-600">
              Registra un nuevo cliente corporativo para segmentar tus campañas
            </p>
          </div>

          <div className="space-y-6">
            {/* Información Básica */}
            <Card className="border-2 border-primary-200">
              <h4 className="font-bold text-primary-900 mb-4">Información Básica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Nombre del Cliente *
                  </label>
                  <Input
                    placeholder="Ej: Banco Estado"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Categoría
                  </label>
                  <Select
                    value={newClient.display_category}
                    onChange={(value) => setNewClient(prev => ({ ...prev, display_category: value }))}
                    options={[
                      { value: 'banco', label: 'Banco' },
                      { value: 'retail', label: 'Retail' },
                      { value: 'servicios', label: 'Servicios' },
                      { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
                      { value: 'otros', label: 'Otros' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Nivel de Confianza
                  </label>
                  <Select
                    value={newClient.trust_level}
                    onChange={(value) => setNewClient(prev => ({ ...prev, trust_level: value }))}
                    options={[
                      { value: 'high', label: 'Alta Confianza' },
                      { value: 'medium', label: 'Confianza Media' },
                      { value: 'low', label: 'Baja Confianza' }
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Información de Contacto */}
            <Card className="border-2 border-success-200">
              <h4 className="font-bold text-success-900 mb-4">Información de Contacto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Persona de Contacto
                  </label>
                  <Input
                    placeholder="Ej: María González"
                    value={newClient.contact_info.contact_person}
                    onChange={(e) => setNewClient(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, contact_person: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={newClient.contact_info.email}
                    onChange={(e) => setNewClient(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, email: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Teléfono
                  </label>
                  <Input
                    placeholder="+56 9 1234 5678"
                    value={newClient.contact_info.phone}
                    onChange={(e) => setNewClient(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, phone: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </Card>

            {/* Información de Negocio */}
            <Card className="border-2 border-warning-200">
              <h4 className="font-bold text-warning-900 mb-4">Información de Negocio</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Industria
                  </label>
                  <Input
                    placeholder="Ej: Servicios Financieros"
                    value={newClient.business_info.industry}
                    onChange={(e) => setNewClient(prev => ({
                      ...prev,
                      business_info: { ...prev.business_info, industry: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Tamaño
                  </label>
                  <Select
                    value={newClient.business_info.size}
                    onChange={(value) => setNewClient(prev => ({
                      ...prev,
                      business_info: { ...prev.business_info, size: value }
                    }))}
                    options={[
                      { value: 'small', label: 'Pequeña' },
                      { value: 'medium', label: 'Mediana' },
                      { value: 'large', label: 'Grande' },
                      { value: 'enterprise', label: 'Empresa' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary-900 mb-2">
                    Ubicación
                  </label>
                  <Input
                    placeholder="Ej: Santiago, Chile"
                    value={newClient.business_info.location}
                    onChange={(e) => setNewClient(prev => ({
                      ...prev,
                      business_info: { ...prev.business_info, location: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateClient}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              disabled={!newClient.name.trim()}
            >
              Crear Cliente Corporativo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Segment Modal */}
      <Modal
        isOpen={showSegmentModal}
        onClose={() => setShowSegmentModal(false)}
        title="Nuevo Segmento Corporativo"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-info-100 to-info-200 rounded-3xl inline-block mb-6">
              <Users className="w-12 h-12 text-info-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              Crear Nuevo Segmento
            </h3>
            <p className="text-secondary-600">
              Define un segmento específico dentro de un cliente corporativo
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Cliente Corporativo *
              </label>
              <Select
                value={newSegment.corporate_id}
                onChange={(value) => setNewSegment(prev => ({ ...prev, corporate_id: value }))}
                options={corporateClients.map(client => ({
                  value: client.id,
                  label: client.name
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Nombre del Segmento *
              </label>
              <Input
                placeholder="Ej: Jóvenes 18-25 años"
                value={newSegment.name}
                onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Criterios de Segmentación
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-500 bg-white resize-none"
                rows={3}
                placeholder="Describe los criterios para este segmento..."
                value={newSegment.criteria}
                onChange={(e) => setNewSegment(prev => ({ ...prev, criteria: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowSegmentModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateSegment}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              disabled={!newSegment.corporate_id || !newSegment.name.trim()}
            >
              Crear Segmento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CorporateClientManager;