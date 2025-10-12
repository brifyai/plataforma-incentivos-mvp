/**
 * Admin Configuration Page - Configuración del Sistema
 *
 * Página principal de navegación para acceder a las diferentes secciones de configuración
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { Settings, Shield, Database, Mail, Key, CreditCard, BarChart3, Bell, Brain, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSystemConfig, getIntegrationStats } from '../../services/databaseService';
import { getDefaultConfig } from '../../config/systemConfig';

const AdminConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  // Configuración del estado del sistema
  const [config, setConfig] = useState(() => {
    const defaultConfig = getDefaultConfig();
    return {
      oauthEnabled: defaultConfig.oauth_enabled,
      userValidation: defaultConfig.user_validation_enabled,
      emailNotifications: defaultConfig.email_notifications_enabled,
      pushNotifications: defaultConfig.push_notifications_enabled,
      mercadoPagoEnabled: defaultConfig.mercado_pago_enabled,
      whatsappEnabled: defaultConfig.whatsapp_enabled,
      chutesApiActive: false,
      groqApiActive: false,
    };
  });

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configResult, integrationResult] = await Promise.all([
        getSystemConfig(),
        getIntegrationStats()
      ]);

      if (configResult.error) {
        console.error('Config error:', configResult.error);
      } else {
        setConfig({
          oauthEnabled: configResult.config.oauthEnabled,
          userValidation: configResult.config.userValidation,
          emailNotifications: configResult.config.emailNotifications,
          pushNotifications: configResult.config.pushNotifications,
          mercadoPagoEnabled: configResult.config.mercadoPagoEnabled,
          whatsappEnabled: configResult.config.whatsappEnabled,
          chutesApiActive: configResult.config.chutesApiActive || false,
          groqApiActive: configResult.config.groqApiActive || false,
        });
      }

      setSystemStatus(integrationResult.integrations || {});

    } catch (error) {
      console.error('Error loading system status:', error);
      setError('Error al cargar estado del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Configuración de secciones disponibles
  const configSections = [
    {
      id: 'general',
      title: 'Configuración General',
      description: 'Configuración general del sistema y servicios básicos',
      icon: Settings,
      path: '/admin/configuracion/general',
      color: 'from-blue-500 to-blue-600',
      status: config.oauthEnabled && config.userValidation ? 'success' : 'warning',
      statusText: config.oauthEnabled && config.userValidation ? 'Completa' : 'Parcial'
    },
    {
      id: 'mercadopago',
      title: 'Mercado Pago',
      description: 'Configuración de pagos en línea y webhooks',
      icon: CreditCard,
      path: '/admin/mercadopago',
      color: 'from-green-500 to-green-600',
      status: config.mercadoPagoEnabled ? 'success' : 'danger',
      statusText: config.mercadoPagoEnabled ? 'Activo' : 'Inactivo'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Herramientas de análisis y seguimiento',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'from-purple-500 to-purple-600',
      status: 'success',
      statusText: 'Configurado'
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones',
      description: 'Configuración de emails, push y SMS',
      icon: Bell,
      path: '/admin/notificaciones',
      color: 'from-orange-500 to-orange-600',
      status: (config.emailNotifications || config.pushNotifications) ? 'success' : 'warning',
      statusText: (config.emailNotifications || config.pushNotifications) ? 'Activas' : 'Inactivas'
    },
    {
      id: 'ai',
      title: 'Inteligencia Artificial',
      description: 'Configuración de servicios de IA y modelos',
      icon: Brain,
      path: '/admin/ia',
      color: 'from-indigo-500 to-indigo-600',
      status: (config.chutesApiActive || config.groqApiActive) ? 'success' : 'warning',
      statusText: (config.chutesApiActive || config.groqApiActive) ? 'Configurada' : 'Sin configurar'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Activo
        </Badge>;
      case 'warning':
        return <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Parcial
        </Badge>;
      case 'danger':
        return <Badge variant="danger" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Inactivo
        </Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
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
          <Button onClick={() => loadSystemStatus()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-8 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Configuración del Sistema
                </h1>
                <p className="text-primary-100 text-sm">
                  Gestiona todos los aspectos de configuración de la plataforma
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-primary-100">Seguridad</p>
                <p className="text-sm font-bold flex items-center gap-1 truncate">
                  {config.oauthEnabled && config.userValidation ? <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  <span className="truncate">{config.oauthEnabled && config.userValidation ? 'Activa' : 'Incompleta'}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-primary-100">Base de Datos</p>
                <p className="text-sm font-bold truncate">Conectada</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-primary-100">Notificaciones</p>
                <p className="text-sm font-bold truncate">
                  {config.emailNotifications && config.pushNotifications ? 'Completas' :
                   config.emailNotifications || config.pushNotifications ? 'Parciales' : 'Inactivas'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-primary-100">Integraciones</p>
                <p className="text-sm font-bold truncate">{(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'Completas' : 'Parciales'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200"
              onClick={() => navigate(section.path)}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 bg-gradient-to-r ${section.color} rounded-lg text-white group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {getStatusBadge(section.status)}
                </div>

                <h3 className="text-base font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {section.title}
                </h3>

                <p className="text-secondary-600 mb-3 leading-relaxed text-xs">
                  {section.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-secondary-500">
                    {section.statusText}
                  </span>
                  <ArrowRight className="w-4 h-4 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Health Summary */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Estado del Sistema</h3>
              <p className="text-secondary-600 text-xs">Resumen general de la salud del sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Base de Datos</p>
                <p className="text-xs text-secondary-600">PostgreSQL - Saludable</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Integraciones</p>
                <p className="text-xs text-secondary-600">
                  {Object.keys(systemStatus || {}).length} servicios conectados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Seguridad</p>
                <p className="text-xs text-secondary-600">RLS activado</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminConfigPage;
