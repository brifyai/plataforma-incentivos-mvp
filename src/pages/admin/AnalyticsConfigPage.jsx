/**
 * Analytics Configuration Page
 *
 * Página para configurar herramientas de análisis avanzado
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge, Select } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Download,
  Share,
  Zap
} from 'lucide-react';

const AnalyticsConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsProviders, setAnalyticsProviders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    type: '',
    apiKey: '',
    apiSecret: '',
    trackingId: '',
    domain: '',
    isActive: true
  });

  const availableProviders = [
    { value: 'google_analytics', label: 'Google Analytics 4', icon: '📊' },
    { value: 'facebook_pixel', label: 'Facebook Pixel', icon: '📘' },
    { value: 'hotjar', label: 'Hotjar', icon: '🔥' },
    { value: 'mixpanel', label: 'Mixpanel', icon: '📈' },
    { value: 'amplitude', label: 'Amplitude', icon: '📊' },
    { value: 'segment', label: 'Segment', icon: '🔗' }
  ];

  useEffect(() => {
    loadAnalyticsConfig();
  }, []);

  const loadAnalyticsConfig = async () => {
    try {
      setLoading(true);
      // Simular carga de proveedores de analytics
      setTimeout(() => {
        setAnalyticsProviders([
          {
            id: '1',
            name: 'Google Analytics 4',
            type: 'google_analytics',
            trackingId: 'GA-123456789',
            domain: 'plataforma.com',
            isActive: true,
            lastSync: new Date(),
            eventsTracked: 15420,
            usersTracked: 2840
          },
          {
            id: '2',
            name: 'Facebook Pixel',
            type: 'facebook_pixel',
            trackingId: '123456789012345',
            domain: 'plataforma.com',
            isActive: true,
            lastSync: new Date(),
            eventsTracked: 8750,
            usersTracked: 1920
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics config:', error);
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    setProviderForm({
      name: '',
      type: '',
      apiKey: '',
      apiSecret: '',
      trackingId: '',
      domain: '',
      isActive: true
    });
    setSelectedProvider(null);
    setShowAddModal(true);
  };

  const handleEditProvider = (provider) => {
    setProviderForm({
      name: provider.name,
      type: provider.type,
      apiKey: provider.apiKey || '',
      apiSecret: provider.apiSecret || '',
      trackingId: provider.trackingId,
      domain: provider.domain,
      isActive: provider.isActive
    });
    setSelectedProvider(provider);
    setShowAddModal(true);
  };

  const handleSaveProvider = async () => {
    try {
      if (!providerForm.name || !providerForm.type || !providerForm.trackingId) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      if (selectedProvider) {
        // Actualizar proveedor existente
        setAnalyticsProviders(prev => prev.map(provider =>
          provider.id === selectedProvider.id
            ? { ...provider, ...providerForm }
            : provider
        ));
        alert('✅ Proveedor de analytics actualizado exitosamente');
      } else {
        // Agregar nuevo proveedor
        const newProvider = {
          id: Date.now().toString(),
          ...providerForm,
          lastSync: null,
          eventsTracked: 0,
          usersTracked: 0
        };
        setAnalyticsProviders(prev => [...prev, newProvider]);
        alert('✅ Proveedor de analytics agregado exitosamente');
      }

      setShowAddModal(false);
    } catch (error) {
      alert('Error al guardar proveedor: ' + error.message);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (confirm('¿Está seguro de que desea eliminar este proveedor de analytics?')) {
      try {
        setAnalyticsProviders(prev => prev.filter(provider => provider.id !== providerId));
        alert('✅ Proveedor eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar proveedor: ' + error.message);
      }
    }
  };

  const handleTestConnection = async (provider) => {
    alert(`🔄 Probando conexión con ${provider.name}...`);
    setTimeout(() => {
      alert(`✅ Conexión exitosa con ${provider.name}`);
    }, 1500);
  };

  const handleSyncData = async (provider) => {
    alert(`🔄 Sincronizando datos con ${provider.name}...`);
    setTimeout(() => {
      alert(`✅ Datos sincronizados exitosamente con ${provider.name}`);
      loadAnalyticsConfig();
    }, 2000);
  };

  const getProviderIcon = (type) => {
    const provider = availableProviders.find(p => p.value === type);
    return provider ? provider.icon : '📊';
  };

  const getProviderColor = (type) => {
    switch (type) {
      case 'google_analytics': return 'from-blue-500 to-blue-600';
      case 'facebook_pixel': return 'from-blue-600 to-blue-700';
      case 'hotjar': return 'from-orange-500 to-red-500';
      case 'mixpanel': return 'from-blue-400 to-blue-500';
      case 'amplitude': return 'from-purple-500 to-purple-600';
      case 'segment': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Configuración de Analytics
              </h1>
              <p className="text-purple-100 text-lg">
                Gestiona herramientas de análisis y seguimiento de usuarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="info" size="lg">
              {analyticsProviders.filter(p => p.isActive).length} Activos
            </Badge>
            <Button
              variant="secondary"
              onClick={handleAddProvider}
              leftIcon={<Settings className="w-4 h-4" />}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Agregar Analytics
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-purple-300" />
              <div>
                <p className="text-sm text-purple-100">Proveedores</p>
                <p className="text-2xl font-bold">{analyticsProviders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-purple-300" />
              <div>
                <p className="text-sm text-purple-100">Eventos Rastreados</p>
                <p className="text-2xl font-bold">{analyticsProviders.reduce((sum, p) => sum + p.eventsTracked, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-300" />
              <div>
                <p className="text-sm text-purple-100">Usuarios Rastreados</p>
                <p className="text-2xl font-bold">{analyticsProviders.reduce((sum, p) => sum + p.usersTracked, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-300" />
              <div>
                <p className="text-sm text-purple-100">Conversión</p>
                <p className="text-2xl font-bold">24.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Providers List */}
      <div className="space-y-6">
        {analyticsProviders.length === 0 ? (
          <Card className="text-center py-16">
            <div className="p-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl inline-block mb-8">
              <BarChart3 className="w-20 h-20 text-purple-600" />
            </div>
            <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              No hay herramientas de analytics configuradas
            </h3>
            <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
              Configure herramientas de análisis para rastrear el comportamiento de usuarios y mejorar la plataforma.
            </p>
            <Button
              variant="primary"
              onClick={handleAddProvider}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Configurar Primer Analytics
            </Button>
          </Card>
        ) : (
          analyticsProviders.map((provider) => (
            <Card key={provider.id} className="group hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className={`p-4 bg-gradient-to-br ${getProviderColor(provider.type)} rounded-2xl text-white text-2xl group-hover:shadow-soft transition-all duration-300`}>
                    {getProviderIcon(provider.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-secondary-900 font-display">
                        {provider.name}
                      </h3>
                      <Badge variant={provider.isActive ? "success" : "danger"}>
                        {provider.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {availableProviders.find(p => p.value === provider.type)?.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <Eye className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Eventos</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {provider.eventsTracked.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <Users className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Usuarios</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {provider.usersTracked.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <RefreshCw className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Última Sync</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {provider.lastSync ? formatDate(provider.lastSync) : 'Nunca'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-secondary-600 space-y-1">
                      <div><strong>Tracking ID:</strong> {provider.trackingId}</div>
                      <div><strong>Dominio:</strong> {provider.domain}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 ml-6">
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                    onClick={() => handleEditProvider(provider)}
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    Configurar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleTestConnection(provider)}
                    leftIcon={<Zap className="w-4 h-4" />}
                  >
                    Probar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleSyncData(provider)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Sincronizar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => window.open(`https://analytics.${provider.type}.com`, '_blank')}
                    leftIcon={<Share className="w-4 h-4" />}
                  >
                    Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Provider Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={selectedProvider ? `Editar ${selectedProvider.name}` : "Agregar Herramienta de Analytics"}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la Herramienta"
              value={providerForm.name}
              onChange={(e) => setProviderForm({...providerForm, name: e.target.value})}
              placeholder="Ej: Google Analytics Principal"
              required
            />

            <Select
              label="Tipo de Analytics"
              value={providerForm.type}
              onChange={(value) => setProviderForm({...providerForm, type: value})}
              options={availableProviders}
              required
            />
          </div>

          <Input
            label="Tracking ID / Measurement ID"
            value={providerForm.trackingId}
            onChange={(e) => setProviderForm({...providerForm, trackingId: e.target.value})}
            placeholder="Ej: GA-123456789 o G-XXXXXXXXXX"
            required
          />

          <Input
            label="Dominio Principal"
            value={providerForm.domain}
            onChange={(e) => setProviderForm({...providerForm, domain: e.target.value})}
            placeholder="Ej: plataforma.com"
            required
          />

          {(providerForm.type === 'google_analytics' || providerForm.type === 'mixpanel' || providerForm.type === 'amplitude') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="API Key"
                type="password"
                value={providerForm.apiKey}
                onChange={(e) => setProviderForm({...providerForm, apiKey: e.target.value})}
                placeholder="Clave de API"
              />

              <Input
                label="API Secret"
                type="password"
                value={providerForm.apiSecret}
                onChange={(e) => setProviderForm({...providerForm, apiSecret: e.target.value})}
                placeholder="Secreto de API"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="analyticsActive"
              checked={providerForm.isActive}
              onChange={(e) => setProviderForm({...providerForm, isActive: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="analyticsActive" className="text-sm font-medium text-gray-700">
              Herramienta activa y rastreando eventos
            </label>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Beneficios del Analytics</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Seguimiento del comportamiento de usuarios</li>
                  <li>• Análisis de conversiones y embudos</li>
                  <li>• Optimización de la experiencia de usuario</li>
                  <li>• Métricas detalladas de rendimiento</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveProvider}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {selectedProvider ? 'Actualizar Analytics' : 'Agregar Analytics'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnalyticsConfigPage;