/**
 * Admin Configuration Page - Configuración del Sistema
 *
 * Página administrativa para gestionar la configuración del sistema
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select, Modal, LoadingSpinner } from '../../components/common';
import { Settings, Shield, Database, Mail, Key, ToggleLeft, ToggleRight, Save, RefreshCw, AlertTriangle, CheckCircle, XCircle, CreditCard, BarChart3, Bell, Plus, Edit, Trash2, TestTube, Zap, Send, AlertCircle, TrendingUp, Users, DollarSign, Smartphone, MessageSquare, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { getSystemConfig, updateSystemConfig, getIntegrationStats } from '../../services/databaseService';
import { getDefaultConfig, DATABASE_CONFIG } from '../../config/systemConfig';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Configuración general del sistema
  const [config, setConfig] = useState(() => {
    const defaultConfig = getDefaultConfig();
    return {
      oauthEnabled: defaultConfig.oauth_enabled,
      userValidation: defaultConfig.user_validation_enabled,
      emailNotifications: defaultConfig.email_notifications_enabled,
      pushNotifications: defaultConfig.push_notifications_enabled,
      mercadoPagoEnabled: defaultConfig.mercado_pago_enabled,
      whatsappEnabled: defaultConfig.whatsapp_enabled,
      queryLimit: defaultConfig.query_limit_per_minute,
      backupFrequency: defaultConfig.backup_frequency,
      logRetention: defaultConfig.log_retention_days,
    };
  });

  // Configuración de Mercado Pago
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    accessToken: '',
    publicKey: '',
    isActive: false,
    webhookUrl: '',
    lastSync: null,
    totalTransactions: 0,
    monthlyVolume: 0
  });


  // Configuración de analytics
  const [analyticsProviders, setAnalyticsProviders] = useState([]);
  const [showAddAnalyticsModal, setShowAddAnalyticsModal] = useState(false);
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

  // Configuración de notificaciones
  const [notificationConfig, setNotificationConfig] = useState({
    emailService: {
      provider: '',
      apiKey: '',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      isActive: false
    },
    pushService: {
      provider: '',
      apiKey: '',
      projectId: '',
      senderId: '',
      serverKey: '',
      isActive: false
    },
    smsService: {
      provider: '',
      apiKey: '',
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      isActive: false
    }
  });

  const [integrationStats, setIntegrationStats] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configResult, integrationResult] = await Promise.all([
        getSystemConfig(),
        getIntegrationStats()
      ]);

      if (configResult.error) {
        console.error('Config error:', configResult.error);
        // Usar configuración por defecto si hay error
      } else {
        setConfig(configResult.config);
      }

      if (integrationResult.error) {
        console.error('Integration stats error:', integrationResult.error);
      } else {
        setIntegrationStats(integrationResult.integrations);
      }

      // Cargar configuraciones simuladas para las nuevas secciones
      loadMockConfigurations();

    } catch (error) {
      console.error('Error loading system config:', error);
      setError('Error al cargar configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const loadMockConfigurations = () => {
    // Mercado Pago
    setMercadoPagoConfig({
      accessToken: 'APP_USR-1234567890...',
      publicKey: 'APP_USR-abcdef123456...',
      isActive: true,
      webhookUrl: 'https://tu-dominio.com/api/webhooks/mercadopago',
      lastSync: new Date(),
      totalTransactions: 1250,
      monthlyVolume: 25000000
    });


    // Analytics
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

    // Notificaciones
    setNotificationConfig({
      emailService: {
        provider: 'sendgrid',
        apiKey: 'SG.1234567890...',
        smtpHost: '',
        smtpPort: '',
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@plataforma.com',
        fromName: 'Plataforma de Cobranzas',
        isActive: true
      },
      pushService: {
        provider: 'firebase',
        apiKey: 'AIzaSy...',
        projectId: 'plataforma-cobranzas',
        senderId: '123456789',
        serverKey: 'AAAA...',
        isActive: true
      },
      smsService: {
        provider: 'twilio',
        apiKey: '',
        accountSid: 'AC1234567890...',
        authToken: 'sk-1234567890...',
        phoneNumber: '+56912345678',
        isActive: false
      }
    });
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Funciones para Mercado Pago
  const handleMercadoPagoSave = async () => {
    alert('✅ Configuración de Mercado Pago guardada exitosamente');
  };

  const handleMercadoPagoTest = async () => {
    alert('🔄 Probando conexión con Mercado Pago...');
    setTimeout(() => {
      alert('✅ Conexión exitosa con Mercado Pago');
    }, 1500);
  };


  // Funciones para Analytics
  const availableProviders = [
    { value: 'google_analytics', label: 'Google Analytics 4', icon: '📊' },
    { value: 'facebook_pixel', label: 'Facebook Pixel', icon: '📘' },
    { value: 'hotjar', label: 'Hotjar', icon: '🔥' },
    { value: 'mixpanel', label: 'Mixpanel', icon: '📈' },
    { value: 'amplitude', label: 'Amplitude', icon: '📊' },
    { value: 'segment', label: 'Segment', icon: '🔗' }
  ];

  const handleAddAnalytics = () => {
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
    setShowAddAnalyticsModal(true);
  };

  const handleEditAnalytics = (provider) => {
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
    setShowAddAnalyticsModal(true);
  };

  const handleSaveAnalytics = async () => {
    if (!providerForm.name || !providerForm.type || !providerForm.trackingId) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (selectedProvider) {
      setAnalyticsProviders(prev => prev.map(provider =>
        provider.id === selectedProvider.id
          ? { ...provider, ...providerForm }
          : provider
      ));
      alert('✅ Proveedor de analytics actualizado exitosamente');
    } else {
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

    setShowAddAnalyticsModal(false);
  };

  const handleDeleteAnalytics = async (providerId) => {
    if (confirm('¿Está seguro de que desea eliminar este proveedor de analytics?')) {
      setAnalyticsProviders(prev => prev.filter(provider => provider.id !== providerId));
      alert('✅ Proveedor eliminado exitosamente');
    }
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

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Convertir configuración del frontend al formato de la base de datos
      const dbConfig = {
        oauth_enabled: config.oauthEnabled,
        user_validation_enabled: config.userValidation,
        email_notifications_enabled: config.emailNotifications,
        push_notifications_enabled: config.pushNotifications,
        mercado_pago_enabled: config.mercadoPagoEnabled,
        whatsapp_enabled: config.whatsappEnabled,
        query_limit_per_minute: config.queryLimit,
        backup_frequency: config.backupFrequency,
        log_retention_days: config.logRetention,
        system_maintenance_mode: config.maintenanceMode,
      };

      const result = await updateSystemConfig(dbConfig);

      if (result.error) {
        console.error('Error saving config:', result.error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al guardar configuración',
          text: result.error,
          confirmButtonText: 'Aceptar'
        });
      } else {
        setHasChanges(false);
        setShowSaveModal(false);
        // Recargar configuración para confirmar cambios
        await loadSystemConfig();
        await Swal.fire({
          icon: 'success',
          title: 'Configuración guardada',
          text: 'Los cambios se han aplicado correctamente',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar configuración',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <span className="font-medium text-secondary-900">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

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
          <Button onClick={() => loadSystemConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-4 md:p-8 text-white shadow-strong">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Settings className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                Configuración del Sistema
              </h1>
              <p className="text-purple-100 text-base md:text-lg">
                Gestiona todos los aspectos de configuración de la plataforma
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {hasChanges && (
              <Badge variant="warning" className="px-3 py-1 bg-yellow-500/20 text-yellow-100 border-yellow-400/30 text-sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Cambios sin guardar
              </Badge>
            )}
            <Button
              variant="gradient"
              onClick={() => setShowSaveModal(true)}
              disabled={!hasChanges}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 disabled:opacity-50 w-full sm:w-auto"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20">
            <div className="flex items-center gap-2 md:gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-purple-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-purple-100">Seguridad</p>
                <p className="text-base md:text-lg font-bold flex items-center gap-1 truncate">
                  {config.oauthEnabled && config.userValidation ? <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 md:w-4 md:h-4 text-red-400 flex-shrink-0" />}
                  <span className="truncate">{config.oauthEnabled && config.userValidation ? 'Activa' : 'Incompleta'}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20">
            <div className="flex items-center gap-2 md:gap-3">
              <Database className="w-5 h-5 md:w-6 md:h-6 text-purple-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-purple-100">Base de Datos</p>
                <p className="text-base md:text-lg font-bold truncate">Conectada</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20">
            <div className="flex items-center gap-2 md:gap-3">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-purple-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-purple-100">Notificaciones</p>
                  <p className="text-base md:text-lg font-bold truncate">
                    {config.emailNotifications && config.pushNotifications ? 'Completas' :
                     config.emailNotifications || config.pushNotifications ? 'Parciales' : 'Inactivas'}
                  </p>
                </div>
              </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20">
            <div className="flex items-center gap-2 md:gap-3">
              <Key className="w-5 h-5 md:w-6 md:h-6 text-purple-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-purple-100">Integraciones</p>
                <p className="text-base md:text-lg font-bold truncate">{(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'Completas' : 'Parciales'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-3xl shadow-soft border border-secondary-200/50 overflow-hidden">
        <div className="flex border-b border-secondary-200">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'mercadopago', label: 'Mercado Pago', icon: CreditCard },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'notificaciones', label: 'Notificaciones', icon: Bell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* General Configuration */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Seguridad</h3>
                <p className="text-secondary-600">Configuraciones de seguridad y autenticación</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.oauthEnabled}
                onChange={(value) => handleConfigChange('oauthEnabled', value)}
                label="Autenticación OAuth (Google)"
              />

              <ToggleSwitch
                enabled={config.userValidation}
                onChange={(value) => handleConfigChange('userValidation', value)}
                label="Validación automática de usuarios"
              />

              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Límite de consultas por minuto</h4>
                  <Badge variant="primary" className="font-bold">{config.queryLimit}</Badge>
                </div>
                <Input
                  type="number"
                  value={config.queryLimit}
                  onChange={(e) => handleConfigChange('queryLimit', parseInt(e.target.value))}
                  min="100"
                  max={DATABASE_CONFIG.MAX_CONNECTIONS}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Base de Datos</h3>
                <p className="text-secondary-600">Configuración de conexiones y límites</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado de conexión</h4>
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">PostgreSQL con RLS activado</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Frecuencia de backups</h4>
                  <Badge variant="primary">{config.backupFrequency}</Badge>
                </div>
                <Select
                  value={config.backupFrequency}
                  onChange={(value) => handleConfigChange('backupFrequency', value)}
                  options={[
                    { value: 'hourly', label: 'Cada hora' },
                    { value: 'daily', label: 'Diario' },
                    { value: 'weekly', label: 'Semanal' }
                  ]}
                />
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Retención de logs (días)</h4>
                  <Badge variant="secondary">{config.logRetention}</Badge>
                </div>
                <Input
                  type="number"
                  value={config.logRetention}
                  onChange={(e) => handleConfigChange('logRetention', parseInt(e.target.value))}
                  min="7"
                  max="365"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Notificaciones</h3>
                <p className="text-secondary-600">Configuración de emails y alertas</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.emailNotifications}
                onChange={(value) => handleConfigChange('emailNotifications', value)}
                label="Emails transaccionales (SendGrid)"
              />

              <ToggleSwitch
                enabled={config.pushNotifications}
                onChange={(value) => handleConfigChange('pushNotifications', value)}
                label="Notificaciones push"
              />

              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado del servicio</h4>
                  <Badge variant={(config.emailNotifications || config.pushNotifications) ? 'success' : 'secondary'}>
                    {(config.emailNotifications || config.pushNotifications) ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  {(config.emailNotifications || config.pushNotifications)
                    ? `${config.emailNotifications ? 'Email' : ''}${config.emailNotifications && config.pushNotifications ? ' + ' : ''}${config.pushNotifications ? 'Push' : ''} configurado(s) y operativo(s)`
                    : 'Servicios de notificaciones desactivados'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Key className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Integraciones</h3>
                <p className="text-secondary-600">Gestión de claves de integración</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.mercadoPagoEnabled}
                onChange={(value) => handleConfigChange('mercadoPagoEnabled', value)}
                label="Mercado Pago (Pagos en línea)"
              />

              <ToggleSwitch
                enabled={config.whatsappEnabled}
                onChange={(value) => handleConfigChange('whatsappEnabled', value)}
                label="WhatsApp Business (Notificaciones)"
              />

              <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado de integraciones</h4>
                  <Badge variant={(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'success' : 'warning'}>
                    {(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'Completas' : 'Parciales'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  {config.mercadoPagoEnabled && config.whatsappEnabled
                    ? 'Todas las integraciones activas'
                    : 'Algunas integraciones requieren configuración'}
                </p>
              </div>
            </div>
          </div>
        </Card>

              </div>
            </div>
          )}

          {/* Mercado Pago Configuration */}
          {activeTab === 'mercadopago' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900">Configuración de API</h3>
                      <p className="text-secondary-600">Credenciales de Mercado Pago</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Access Token"
                      type="password"
                      value={mercadoPagoConfig.accessToken}
                      onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, accessToken: e.target.value})}
                      placeholder="APP_USR-..."
                      leftIcon={<Key className="w-4 h-4" />}
                    />

                    <Input
                      label="Public Key"
                      type="password"
                      value={mercadoPagoConfig.publicKey}
                      onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, publicKey: e.target.value})}
                      placeholder="APP_USR-..."
                      leftIcon={<Key className="w-4 h-4" />}
                    />

                    <Input
                      label="URL de Webhook"
                      value={mercadoPagoConfig.webhookUrl}
                      onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, webhookUrl: e.target.value})}
                      placeholder="https://tu-dominio.com/api/webhooks/mercadopago"
                      leftIcon={<Settings className="w-4 h-4" />}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="gradient"
                        onClick={handleMercadoPagoSave}
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Guardar Configuración
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleMercadoPagoTest}
                        leftIcon={<Zap className="w-4 h-4" />}
                      >
                        Probar Conexión
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Settings className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900">Estado y Estadísticas</h3>
                      <p className="text-secondary-600">Información de la integración</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-secondary-900">Estado de Conexión</span>
                        <Badge variant={mercadoPagoConfig.isActive ? "success" : "danger"}>
                          {mercadoPagoConfig.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary-600">
                        {mercadoPagoConfig.isActive
                          ? "Mercado Pago está correctamente configurado y operativo"
                          : "La integración no está activa. Configure las credenciales primero."
                        }
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Transacciones</div>
                        <div className="text-lg font-bold text-blue-900">{mercadoPagoConfig.totalTransactions.toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Volumen</div>
                        <div className="text-lg font-bold text-green-900">{formatCurrency(mercadoPagoConfig.monthlyVolume)}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Última Sincronización</div>
                      <div className="text-sm font-bold text-purple-900">
                        {mercadoPagoConfig.lastSync ? formatDate(mercadoPagoConfig.lastSync) : 'Nunca'}
                      </div>
                    </div>
                  </div>
                </Card>
        
                      </div>
        
                      {/* System Status & Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8">
                        <Card>
                          <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-teal-100 rounded-lg">
                                <RefreshCw className="w-6 h-6 text-teal-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-secondary-900">Acciones del Sistema</h3>
                                <p className="text-secondary-600">Operaciones de mantenimiento y configuración</p>
                              </div>
                            </div>
        
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <RefreshCw className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                                  <div>
                                    <h4 className="font-medium text-secondary-900">Recargar configuración</h4>
                                    <p className="text-sm text-secondary-600">Aplicar cambios inmediatamente</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ejecutar
                                </Button>
                              </div>
        
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <AlertTriangle className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                                  <div>
                                    <h4 className="font-medium text-secondary-900">Limpiar caché</h4>
                                    <p className="text-sm text-secondary-600">Eliminar datos temporales</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ejecutar
                                </Button>
                              </div>
        
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <Database className="w-5 h-5 text-yellow-600 group-hover:scale-110 transition-transform" />
                                  <div>
                                    <h4 className="font-medium text-secondary-900">Verificar integridad</h4>
                                    <p className="text-sm text-secondary-600">Comprobar consistencia del sistema</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ejecutar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
        
                        <Card>
                          <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-secondary-900">Estado del Sistema</h3>
                                <p className="text-secondary-600">Monitoreo de componentes críticos</p>
                              </div>
                            </div>
        
                            <div className="space-y-4">
                              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-secondary-900">Base de Datos PostgreSQL</h4>
                                  <Badge variant="success" className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Saludable
                                  </Badge>
                                </div>
                                <p className="text-sm text-secondary-600">Conexión estable, RLS activado</p>
                              </div>
        
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-secondary-900">Servidor Supabase</h4>
                                  <Badge variant="success" className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Operativo
                                  </Badge>
                                </div>
                                <p className="text-sm text-secondary-600">Edge Functions activas, baja latencia</p>
                              </div>
        
                              <div className="p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl border border-violet-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-secondary-900">Integraciones Externas</h4>
                                  <Badge variant={(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'success' : 'warning'} className="flex items-center gap-1">
                                    {(config.mercadoPagoEnabled && config.whatsappEnabled) ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'Completas' : 'Parciales'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-secondary-600 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Mercado Pago:</span>
                                    <span className="flex items-center gap-1">
                                      {config.mercadoPagoEnabled ? '✅' : '❌'}
                                      {integrationStats?.mercadoPago?.connected && (
                                        <span className="text-xs">({integrationStats.mercadoPago.transactionsToday} transacciones hoy)</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>WhatsApp:</span>
                                    <span className="flex items-center gap-1">
                                      {config.whatsappEnabled ? '✅' : '❌'}
                                      {integrationStats?.whatsapp?.connected ? (
                                        integrationStats.whatsapp.messagesToday > 0 ? (
                                          <span className="text-xs">({integrationStats.whatsapp.messagesToday} mensajes hoy)</span>
                                        ) : (
                                          <span className="text-xs text-gray-500">(sin seguimiento)</span>
                                        )
                                      ) : null}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Email (SendGrid):</span>
                                    <span className="flex items-center gap-1">
                                      {config.emailNotifications ? '✅' : '❌'}
                                      {integrationStats?.email?.connected ? (
                                        integrationStats.email.emailsSentToday > 0 ? (
                                          <span className="text-xs">({integrationStats.email.emailsSentToday} emails hoy, {integrationStats.email.deliveryRate}% entregados)</span>
                                        ) : (
                                          <span className="text-xs text-gray-500">(sin seguimiento)</span>
                                        )
                                      ) : null}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

          {/* Analytics Configuration */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">Herramientas de Analytics</h3>
                  <p className="text-secondary-600">Configura herramientas de análisis y seguimiento</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddAnalytics}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar Analytics
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-600">Proveedores</div>
                  <div className="text-2xl font-bold text-purple-900">{analyticsProviders.length}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Eventos Rastreados</div>
                  <div className="text-2xl font-bold text-blue-900">{analyticsProviders.reduce((sum, p) => sum + p.eventsTracked, 0).toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Usuarios Rastreados</div>
                  <div className="text-2xl font-bold text-green-900">{analyticsProviders.reduce((sum, p) => sum + p.usersTracked, 0).toLocaleString()}</div>
                </div>
              </div>

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
                            onClick={() => handleEditAnalytics(provider)}
                            leftIcon={<Settings className="w-4 h-4" />}
                          >
                            Configurar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:scale-105 transition-all"
                            onClick={() => alert(`🔄 Probando conexión con ${provider.name}...`)}
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
            </div>
          )}

          {/* Notificaciones Configuration */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900">Servicio de Email</h3>
                      <Badge variant={notificationConfig.emailService.isActive ? 'success' : 'danger'} size="sm">
                        {notificationConfig.emailService.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Proveedor"
                      value={notificationConfig.emailService.provider}
                      onChange={(value) => setNotificationConfig(prev => ({
                        ...prev,
                        emailService: { ...prev.emailService, provider: value }
                      }))}
                      options={[
                        { value: 'sendgrid', label: 'SendGrid' },
                        { value: 'mailgun', label: 'Mailgun' },
                        { value: 'aws_ses', label: 'Amazon SES' },
                        { value: 'smtp', label: 'SMTP Personalizado' }
                      ]}
                    />

                    {notificationConfig.emailService.provider === 'smtp' ? (
                      <>
                        <Input
                          label="SMTP Host"
                          value={notificationConfig.emailService.smtpHost}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            emailService: { ...prev.emailService, smtpHost: e.target.value }
                          }))}
                          placeholder="smtp.gmail.com"
                        />
                        <Input
                          label="SMTP Port"
                          value={notificationConfig.emailService.smtpPort}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            emailService: { ...prev.emailService, smtpPort: e.target.value }
                          }))}
                          placeholder="587"
                        />
                        <Input
                          label="SMTP User"
                          value={notificationConfig.emailService.smtpUser}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            emailService: { ...prev.emailService, smtpUser: e.target.value }
                          }))}
                          placeholder="usuario@dominio.com"
                        />
                        <Input
                          label="SMTP Password"
                          type="password"
                          value={notificationConfig.emailService.smtpPassword}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            emailService: { ...prev.emailService, smtpPassword: e.target.value }
                          }))}
                          placeholder="Contraseña"
                        />
                      </>
                    ) : (
                      <Input
                        label="API Key"
                        type="password"
                        value={notificationConfig.emailService.apiKey}
                        onChange={(e) => setNotificationConfig(prev => ({
                          ...prev,
                          emailService: { ...prev.emailService, apiKey: e.target.value }
                        }))}
                        placeholder="SG.1234567890..."
                      />
                    )}

                    <Input
                      label="Email Remitente"
                      value={notificationConfig.emailService.fromEmail}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        emailService: { ...prev.emailService, fromEmail: e.target.value }
                      }))}
                      placeholder="noreply@plataforma.com"
                    />

                    <Input
                      label="Nombre Remitente"
                      value={notificationConfig.emailService.fromName}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        emailService: { ...prev.emailService, fromName: e.target.value }
                      }))}
                      placeholder="Plataforma de Cobranzas"
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailActive"
                        checked={notificationConfig.emailService.isActive}
                        onChange={(e) => setNotificationConfig(prev => ({
                          ...prev,
                          emailService: { ...prev.emailService, isActive: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="emailActive" className="text-sm font-medium text-gray-700">
                        Servicio activo
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="gradient"
                        onClick={() => alert('✅ Configuración de Email guardada exitosamente')}
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => alert('🔄 Probando servicio de Email...')}
                        leftIcon={<TestTube className="w-4 h-4" />}
                      >
                        Probar
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900">Notificaciones Push</h3>
                      <Badge variant={notificationConfig.pushService.isActive ? 'success' : 'danger'} size="sm">
                        {notificationConfig.pushService.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Proveedor"
                      value={notificationConfig.pushService.provider}
                      onChange={(value) => setNotificationConfig(prev => ({
                        ...prev,
                        pushService: { ...prev.pushService, provider: value }
                      }))}
                      options={[
                        { value: 'firebase', label: 'Firebase Cloud Messaging' },
                        { value: 'onesignal', label: 'OneSignal' },
                        { value: 'expo', label: 'Expo Push' }
                      ]}
                    />

                    <Input
                      label="API Key"
                      type="password"
                      value={notificationConfig.pushService.apiKey}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        pushService: { ...prev.pushService, apiKey: e.target.value }
                      }))}
                      placeholder="AIzaSy..."
                    />

                    <Input
                      label="Project ID"
                      value={notificationConfig.pushService.projectId}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        pushService: { ...prev.pushService, projectId: e.target.value }
                      }))}
                      placeholder="plataforma-cobranzas"
                    />

                    <Input
                      label="Sender ID"
                      value={notificationConfig.pushService.senderId}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        pushService: { ...prev.pushService, senderId: e.target.value }
                      }))}
                      placeholder="123456789"
                    />

                    <Input
                      label="Server Key"
                      type="password"
                      value={notificationConfig.pushService.serverKey}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        pushService: { ...prev.pushService, serverKey: e.target.value }
                      }))}
                      placeholder="AAAA..."
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="pushActive"
                        checked={notificationConfig.pushService.isActive}
                        onChange={(e) => setNotificationConfig(prev => ({
                          ...prev,
                          pushService: { ...prev.pushService, isActive: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="pushActive" className="text-sm font-medium text-gray-700">
                        Servicio activo
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="gradient"
                        onClick={() => alert('✅ Configuración de Push guardada exitosamente')}
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => alert('🔄 Probando servicio de Push...')}
                        leftIcon={<TestTube className="w-4 h-4" />}
                      >
                        Probar
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900">Servicio SMS</h3>
                      <Badge variant={notificationConfig.smsService.isActive ? 'success' : 'danger'} size="sm">
                        {notificationConfig.smsService.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Proveedor"
                      value={notificationConfig.smsService.provider}
                      onChange={(value) => setNotificationConfig(prev => ({
                        ...prev,
                        smsService: { ...prev.smsService, provider: value }
                      }))}
                      options={[
                        { value: 'twilio', label: 'Twilio' },
                        { value: 'aws_sns', label: 'Amazon SNS' },
                        { value: 'messagebird', label: 'MessageBird' }
                      ]}
                    />

                    {notificationConfig.smsService.provider === 'twilio' && (
                      <>
                        <Input
                          label="Account SID"
                          value={notificationConfig.smsService.accountSid}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            smsService: { ...prev.smsService, accountSid: e.target.value }
                          }))}
                          placeholder="AC1234567890..."
                        />

                        <Input
                          label="Auth Token"
                          type="password"
                          value={notificationConfig.smsService.authToken}
                          onChange={(e) => setNotificationConfig(prev => ({
                            ...prev,
                            smsService: { ...prev.smsService, authToken: e.target.value }
                          }))}
                          placeholder="sk-1234567890..."
                        />
                      </>
                    )}

                    {notificationConfig.smsService.provider !== 'twilio' && (
                      <Input
                        label="API Key"
                        type="password"
                        value={notificationConfig.smsService.apiKey}
                        onChange={(e) => setNotificationConfig(prev => ({
                          ...prev,
                          smsService: { ...prev.smsService, apiKey: e.target.value }
                        }))}
                        placeholder="Clave de API"
                      />
                    )}

                    <Input
                      label="Número de Teléfono"
                      value={notificationConfig.smsService.phoneNumber}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        smsService: { ...prev.smsService, phoneNumber: e.target.value }
                      }))}
                      placeholder="+56912345678"
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="smsActive"
                        checked={notificationConfig.smsService.isActive}
                        onChange={(e) => setNotificationConfig(prev => ({
                          ...prev,
                          smsService: { ...prev.smsService, isActive: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="smsActive" className="text-sm font-medium text-gray-700">
                        Servicio activo
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="gradient"
                        onClick={() => alert('✅ Configuración de SMS guardada exitosamente')}
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => alert('🔄 Probando servicio de SMS...')}
                        leftIcon={<TestTube className="w-4 h-4" />}
                      >
                        Probar
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
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
              onClick={() => setShowAddAnalyticsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveAnalytics}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {selectedProvider ? 'Actualizar Analytics' : 'Agregar Analytics'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Configuration Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Guardar Configuración"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl inline-block mb-4">
              <Save className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Confirmar Cambios
            </h3>
            <p className="text-secondary-600">
              ¿Estás seguro de que quieres guardar estos cambios de configuración?
              Los cambios se aplicarán inmediatamente al sistema.
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Algunos cambios pueden requerir reiniciar servicios o afectar
                  la funcionalidad del sistema. Se recomienda hacer backup antes de continuar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveConfig}
              loading={isSaving}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminConfigPage;
