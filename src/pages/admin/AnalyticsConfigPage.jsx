/**
 * Analytics Configuration Page - Configuración de Analytics
 *
 * Página dedicada a la configuración de herramientas de analytics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, Modal } from '../../components/common';
import { BarChart3, Plus, Settings, Eye, Users, RefreshCw, CheckCircle, ArrowLeft, Edit, Trash2, Zap } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const AnalyticsConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddAnalyticsModal, setShowAddAnalyticsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Estado de proveedores de analytics
  const [analyticsProviders, setAnalyticsProviders] = useState([]);

  useEffect(() => {
    loadAnalyticsConfig();
  }, []);

  // Formulario para agregar/editar analytics
  const [providerForm, setProviderForm] = useState({
    name: '',
    type: '',
    trackingId: '',
    domain: '',
    apiKey: '',
    apiSecret: '',
    isActive: true
  });

  // Proveedores disponibles
  const availableProviders = [
    { value: 'google_analytics', label: 'Google Analytics' },
    { value: 'mixpanel', label: 'Mixpanel' },
    { value: 'amplitude', label: 'Amplitude' },
    { value: 'segment', label: 'Segment' },
    { value: 'hotjar', label: 'Hotjar' },
    { value: 'fullstory', label: 'FullStory' }
  ];

  const getProviderColor = (type) => {
    const colors = {
      google_analytics: 'from-blue-500 to-blue-600',
      mixpanel: 'from-purple-500 to-purple-600',
      amplitude: 'from-green-500 to-green-600',
      segment: 'from-orange-500 to-orange-600',
      hotjar: 'from-red-500 to-red-600',
      fullstory: 'from-indigo-500 to-indigo-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getProviderIcon = (type) => {
    const icons = {
      google_analytics: BarChart3,
      mixpanel: BarChart3,
      amplitude: BarChart3,
      segment: BarChart3,
      hotjar: BarChart3,
      fullstory: BarChart3
    };
    return icons[type] || BarChart3;
  };

  const loadAnalyticsConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
        // Usar datos por defecto si hay error
        setAnalyticsProviders([]);
      } else {
        // Cargar configuración de analytics desde la base de datos
        const analyticsConfig = result.config.analyticsProviders || [];
        setAnalyticsProviders(analyticsConfig);
      }
    } catch (error) {
      console.error('Error loading analytics config:', error);
      setError('Error al cargar configuración de analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnalytics = () => {
    setSelectedProvider(null);
    setProviderForm({
      name: '',
      type: '',
      trackingId: '',
      domain: '',
      apiKey: '',
      apiSecret: '',
      isActive: true
    });
    setShowAddAnalyticsModal(true);
  };

  const handleEditAnalytics = (provider) => {
    setSelectedProvider(provider);
    setProviderForm({
      name: provider.name,
      type: provider.type,
      trackingId: provider.trackingId,
      domain: provider.domain,
      apiKey: provider.apiKey || '',
      apiSecret: provider.apiSecret || '',
      isActive: provider.isActive
    });
    setShowAddAnalyticsModal(true);
  };

  const handleDeleteAnalytics = async (providerId) => {
    const result = await Swal.fire({
      title: '¿Eliminar herramienta?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const updatedProviders = analyticsProviders.filter(p => p.id !== providerId);

        // Guardar en base de datos
        const configToSave = {
          analyticsProviders: updatedProviders
        };

        const saveResult = await updateSystemConfig(configToSave);

        if (saveResult.error) {
          throw new Error(saveResult.error);
        }

        setAnalyticsProviders(updatedProviders);

        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La herramienta de analytics ha sido eliminada',
          timer: 2000
        });
      } catch (error) {
        console.error('Error deleting analytics:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar la herramienta de analytics',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const handleSaveAnalytics = async () => {
    try {
      if (!providerForm.name || !providerForm.type || !providerForm.trackingId || !providerForm.domain) {
        await Swal.fire({
          icon: 'error',
          title: 'Campos requeridos',
          text: 'Por favor completa todos los campos obligatorios',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setSaving(true);

      let updatedProviders;
      if (selectedProvider) {
        // Editar proveedor existente
        updatedProviders = analyticsProviders.map(p =>
          p.id === selectedProvider.id
            ? { ...p, ...providerForm, updatedAt: new Date().toISOString() }
            : p
        );
      } else {
        // Agregar nuevo proveedor
        const newProvider = {
          id: Date.now().toString(),
          ...providerForm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          eventsTracked: 0,
          usersTracked: 0,
          lastSync: null
        };
        updatedProviders = [...analyticsProviders, newProvider];
      }

      // Guardar en base de datos
      const configToSave = {
        analyticsProviders: updatedProviders
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalyticsProviders(updatedProviders);
      setShowAddAnalyticsModal(false);

      await Swal.fire({
        icon: 'success',
        title: selectedProvider ? 'Actualizado' : 'Agregado',
        text: `La herramienta de analytics ha sido ${selectedProvider ? 'actualizada' : 'agregada'} exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving analytics:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider) => {
    await Swal.fire({
      icon: 'info',
      title: 'Probando conexión',
      text: `Verificando conexión con ${provider.name}...`,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar configuración</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadAnalyticsConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/configuracion')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Analytics
              </h1>
              <p className="text-purple-100 text-lg">
                Herramientas de análisis y seguimiento
              </p>
            </div>
          </div>

          <Button
            variant="gradient"
            onClick={handleAddAnalytics}
            className="bg-white text-purple-600 hover:bg-purple-50"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Agregar Analytics
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-600">Proveedores</div>
          <div className="text-2xl font-bold text-purple-900">{analyticsProviders.length}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-600">Eventos Rastreados</div>
          <div className="text-2xl font-bold text-blue-900">
            {analyticsProviders.reduce((sum, p) => sum + p.eventsTracked, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-600">Usuarios Rastreados</div>
          <div className="text-2xl font-bold text-green-900">
            {analyticsProviders.reduce((sum, p) => sum + p.usersTracked, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Analytics Providers */}
      <div className="space-y-4">
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
              onClick={handleAddAnalytics}
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
                    <BarChart3 className="w-6 h-6" />
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
                    onClick={() => handleEditAnalytics(provider)}
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
                    variant="danger"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleDeleteAnalytics(provider.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Analytics Modal */}
      <Modal
        isOpen={showAddAnalyticsModal}
        onClose={() => setShowAddAnalyticsModal(false)}
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
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
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
              onClick={() => setShowAddAnalyticsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveAnalytics}
              loading={saving}
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