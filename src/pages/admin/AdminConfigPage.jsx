/**
 * Admin Configuration Page - Configuración del Sistema
 *
 * Página principal de navegación para acceder a las diferentes secciones de configuración
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { Settings, Shield, Database, Mail, Key, CreditCard, BarChart3, Bell, Brain, ArrowRight, CheckCircle, XCircle, AlertCircle, MessageCircle, Archive, FileText, Lock, Activity, Users } from 'lucide-react';
import { getSystemConfig, getIntegrationStats } from '../../services/databaseService';
import { getDefaultConfig } from '../../config/systemConfig';
// import AIModuleControl from '../../components/admin/AIModuleControl'; // Movido a /admin/ia

const AdminConfigPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    // Configuración Principal
    {
      id: 'general',
      title: 'Configuración General',
      description: 'Configuración general del sistema y servicios básicos',
      icon: Settings,
      path: '/admin/configuracion/general',
      color: 'from-blue-500 to-blue-600',
      status: config.oauthEnabled && config.userValidation ? 'success' : 'warning',
      statusText: config.oauthEnabled && config.userValidation ? 'Completa' : 'Parcial',
      category: 'principal'
    },
    {
      id: 'ai',
      title: 'Inteligencia Artificial',
      description: 'Configuración completa de IA: modelos, conversacional y control del sistema',
      icon: Brain,
      path: '/admin/ia',
      color: 'from-indigo-500 to-purple-600',
      status: (config.chutesApiActive || config.groqApiActive) ? 'success' : 'warning',
      statusText: (config.chutesApiActive || config.groqApiActive) ? 'Activa' : 'Inactiva',
      category: 'principal'
    },
    
    // Comunicaciones
    {
      id: 'email-config',
      title: 'Email Marketing',
      description: 'Configuración avanzada de servicios de email y plantillas',
      icon: Mail,
      path: '/admin/configuracion/email',
      color: 'from-green-500 to-green-600',
      status: config.emailNotifications ? 'success' : 'warning',
      statusText: config.emailNotifications ? 'Configurado' : 'Sin configurar',
      category: 'comunicaciones'
    },
    {
      id: 'whatsapp-config',
      title: 'WhatsApp Business',
      description: 'Configuración de WhatsApp Business API y plantillas',
      icon: MessageCircle,
      path: '/admin/configuracion/whatsapp',
      color: 'from-emerald-500 to-emerald-600',
      status: config.whatsappEnabled ? 'success' : 'warning',
      statusText: config.whatsappEnabled ? 'Activo' : 'Inactivo',
      category: 'comunicaciones'
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones Push',
      description: 'Configuración de notificaciones push y SMS',
      icon: Bell,
      path: '/admin/notificaciones',
      color: 'from-orange-500 to-orange-600',
      status: config.pushNotifications ? 'success' : 'warning',
      statusText: config.pushNotifications ? 'Activas' : 'Inactivas',
      category: 'comunicaciones'
    },
    
    // Pagos y Finanzas
    {
      id: 'mercadopago',
      title: 'Mercado Pago',
      description: 'Configuración de pagos en línea y webhooks',
      icon: CreditCard,
      path: '/admin/mercadopago',
      color: 'from-cyan-500 to-cyan-600',
      status: config.mercadoPagoEnabled ? 'success' : 'danger',
      statusText: config.mercadoPagoEnabled ? 'Activo' : 'Inactivo',
      category: 'pagos'
    },
    
    // Seguridad y Sistema
    {
      id: 'security-config',
      title: 'Seguridad Avanzada',
      description: 'Configuración de seguridad, autenticación y permisos',
      icon: Shield,
      path: '/admin/configuracion/security',
      color: 'from-red-500 to-red-600',
      status: 'success',
      statusText: 'Configurado',
      category: 'seguridad'
    },
    {
      id: 'logs',
      title: 'Logs del Sistema',
      description: 'Visualización y análisis de logs del sistema',
      icon: FileText,
      path: '/admin/configuracion/logs',
      color: 'from-amber-500 to-amber-600',
      status: 'success',
      statusText: 'Disponible',
      category: 'seguridad'
    },
    {
      id: 'backup',
      title: 'Backup y Restauración',
      description: 'Gestión de backups y restauración del sistema',
      icon: Archive,
      path: '/admin/configuracion/backup',
      color: 'from-slate-500 to-slate-600',
      status: 'success',
      statusText: 'Configurado',
      category: 'seguridad'
    },
    
    // Analytics y Monitoreo
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Herramientas de análisis y seguimiento',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'from-purple-500 to-purple-600',
      status: 'success',
      statusText: 'Configurado',
      category: 'analytics'
    },
    {
      id: 'activity',
      title: 'Actividad del Sistema',
      description: 'Monitoreo de actividad y rendimiento del sistema',
      icon: Activity,
      path: '/admin/configuracion/activity',
      color: 'from-teal-500 to-teal-600',
      status: 'success',
      statusText: 'Activo',
      category: 'analytics'
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

      {/* Configuration Sections by Category */}
      <div className="space-y-8">
        {/* Configuración Principal */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Configuración Principal</h2>
              <p className="text-secondary-600 text-sm">Configuración fundamental del sistema</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.filter(section => section.category === 'principal').map((section) => {
              const Icon = section.icon;
              const hasSubSections = section.subSections && section.subSections.length > 0;
              
              return (
                <Card
                  key={section.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200 ${
                    location.pathname === section.path ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
                  onClick={() => {
                    if (section.id === 'ai') {
                      // Para IA, navegar al dashboard principal
                      navigate(section.path);
                    } else {
                      navigate(section.path);
                    }
                  }}
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

                    {hasSubSections && (
                      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-2">Subsecciones:</p>
                        <div className="space-y-1">
                          {section.subSections.map((subSection) => {
                            const SubIcon = subSection.icon;
                            return (
                              <div
                                key={subSection.id}
                                className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(subSection.path);
                                }}
                              >
                                <SubIcon className="w-3 h-3" />
                                <span>{subSection.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
        </div>

        {/* Comunicaciones */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Comunicaciones</h2>
              <p className="text-secondary-600 text-sm">Email, WhatsApp y notificaciones</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.filter(section => section.category === 'comunicaciones').map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200 ${
                    location.pathname === section.path ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
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
        </div>

        {/* Pagos y Finanzas */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Pagos y Finanzas</h2>
              <p className="text-secondary-600 text-sm">Procesamiento de pagos y métodos de pago</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.filter(section => section.category === 'pagos').map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200 ${
                    location.pathname === section.path ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
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
        </div>

        {/* Seguridad y Sistema */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Seguridad y Sistema</h2>
              <p className="text-secondary-600 text-sm">Seguridad, logs y backups del sistema</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.filter(section => section.category === 'seguridad').map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200 ${
                    location.pathname === section.path ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
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
        </div>

        {/* Analytics y Monitoreo */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Analytics y Monitoreo</h2>
              <p className="text-secondary-600 text-sm">Análisis de datos y monitoreo del sistema</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.filter(section => section.category === 'analytics').map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary-200 ${
                    location.pathname === section.path ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                  }`}
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
        </div>
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

      {/* AI Module Control movido a /admin/ia */}
    </div>
  );
};

export default AdminConfigPage;
