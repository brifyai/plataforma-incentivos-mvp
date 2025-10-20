/**
 * Notifications Configuration Page - Configuración de Notificaciones
 *
 * Página dedicada a la configuración de notificaciones (Email, Push, SMS)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { Bell, Mail, Smartphone, MessageSquare, CheckCircle, ArrowLeft, TestTube, Settings, AlertTriangle } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const NotificationsConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Configuración de notificaciones
  const [notificationConfig, setNotificationConfig] = useState({
    emailService: {
      provider: 'sendgrid',
      apiKey: '',
      fromEmail: 'noreply@plataforma.com',
      fromName: 'Plataforma de Cobranzas',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      isActive: true
    },
    pushService: {
      provider: 'firebase',
      apiKey: '',
      projectId: 'plataforma-cobranzas',
      senderId: '',
      serverKey: '',
      isActive: false
    },
    smsService: {
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      apiKey: '',
      phoneNumber: '+56912345678',
      isActive: false
    }
  });

  useEffect(() => {
    loadNotificationConfig();
  }, []);

  const loadNotificationConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
        // Usar configuración por defecto si hay error
      } else {
        // Cargar configuración de notificaciones desde la base de datos
        const config = result.config;
        
        setNotificationConfig(prev => ({
          emailService: {
            ...prev.emailService,
            provider: config.email_provider || 'sendgrid',
            apiKey: config.email_api_key || '',
            fromEmail: config.email_from_address || 'noreply@plataforma.com',
            fromName: config.email_from_name || 'Plataforma de Cobranzas',
            smtpHost: config.email_smtp_host || '',
            smtpPort: config.email_smtp_port || '587',
            smtpUser: config.email_smtp_user || '',
            smtpPassword: config.email_smtp_password || '',
            isActive: config.email_service_active !== undefined ? config.email_service_active : true
          },
          pushService: {
            ...prev.pushService,
            provider: config.push_provider || 'firebase',
            apiKey: config.push_api_key || '',
            projectId: config.push_project_id || 'plataforma-cobranzas',
            senderId: config.push_sender_id || '',
            serverKey: config.push_server_key || '',
            isActive: config.push_service_active !== undefined ? config.push_service_active : false
          },
          smsService: {
            ...prev.smsService,
            provider: config.sms_provider || 'twilio',
            accountSid: config.sms_account_sid || '',
            authToken: config.sms_auth_token || '',
            apiKey: config.sms_api_key || '',
            phoneNumber: config.sms_phone_number || '+56912345678',
            isActive: config.sms_service_active !== undefined ? config.sms_service_active : false
          }
        }));
      }
    } catch (error) {
      console.error('Error loading notification config:', error);
      setError('Error al cargar configuración de notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (serviceType) => {
    try {
      setSaving(true);

      // Prepare config data based on service type
      let configToSave = {};

      if (serviceType === 'Email') {
        configToSave = {
          email_provider: notificationConfig.emailService.provider,
          email_api_key: notificationConfig.emailService.apiKey,
          email_from_address: notificationConfig.emailService.fromEmail,
          email_from_name: notificationConfig.emailService.fromName,
          email_smtp_host: notificationConfig.emailService.smtpHost,
          email_smtp_port: notificationConfig.emailService.smtpPort,
          email_smtp_user: notificationConfig.emailService.smtpUser,
          email_smtp_password: notificationConfig.emailService.smtpPassword,
          email_service_active: notificationConfig.emailService.isActive
        };
      } else if (serviceType === 'Push') {
        configToSave = {
          push_provider: notificationConfig.pushService.provider,
          push_api_key: notificationConfig.pushService.apiKey,
          push_project_id: notificationConfig.pushService.projectId,
          push_sender_id: notificationConfig.pushService.senderId,
          push_server_key: notificationConfig.pushService.serverKey,
          push_service_active: notificationConfig.pushService.isActive
        };
      } else if (serviceType === 'SMS') {
        configToSave = {
          sms_provider: notificationConfig.smsService.provider,
          sms_account_sid: notificationConfig.smsService.accountSid,
          sms_auth_token: notificationConfig.smsService.authToken,
          sms_api_key: notificationConfig.smsService.apiKey,
          sms_phone_number: notificationConfig.smsService.phoneNumber,
          sms_service_active: notificationConfig.smsService.isActive
        };
      }

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: `Configuración de ${serviceType} guardada exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error(`Error saving ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || `No se pudo guardar la configuración de ${serviceType}`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestService = async (serviceType) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando servicio',
        text: `Probando servicio de ${serviceType}...`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error(`Error testing ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: `No se pudo probar el servicio de ${serviceType}`,
        confirmButtonText: 'Aceptar'
      });
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
          <Button onClick={() => loadNotificationConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Notificaciones
                </h1>
                <p className="text-primary-100 text-sm">
                  Configuración de emails, push y SMS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 mt-2">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {notificationConfig.emailService.isActive ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Email</p>
            <div className="flex items-center justify-center mt-0.5">
              {notificationConfig.emailService.isActive ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className="text-xs text-green-600 font-medium">
                {notificationConfig.emailService.isActive ? 'Configurado' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {notificationConfig.pushService.isActive ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Push</p>
            <div className="flex items-center justify-center mt-0.5">
              {notificationConfig.pushService.isActive ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className="text-xs text-green-600 font-medium">
                {notificationConfig.pushService.isActive ? 'Configurado' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {notificationConfig.smsService.isActive ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">SMS</p>
            <div className="flex items-center justify-center mt-0.5">
              {notificationConfig.smsService.isActive ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className="text-xs text-purple-600 font-medium">
                {notificationConfig.smsService.isActive ? 'Configurado' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:shadow-glow-orange transition-all duration-300">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {(notificationConfig.emailService.isActive || notificationConfig.pushService.isActive || notificationConfig.smsService.isActive) ? 'Activos' : 'Inactivos'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total Servicios</p>
            <div className="text-xs text-orange-600 mt-0.5 font-medium">
              {[notificationConfig.emailService.isActive, notificationConfig.pushService.isActive, notificationConfig.smsService.isActive].filter(Boolean).length} de 3
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Servicios de Notificación ({3})
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {/* TODO: Save all services */}}
                loading={saving}
                leftIcon={<CheckCircle className="w-3 h-3" />}
              >
                Guardar Todos
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando servicios de notificación...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Email Service Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Servicio de Email</h3>
                        <p className="text-gray-600 text-xs">SendGrid, Mailgun, SMTP personalizado</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={notificationConfig.emailService.isActive ? 'success' : 'warning'}>
                        {notificationConfig.emailService.isActive ? 'Configurado' : 'Requiere atención'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Settings className="w-3 h-3" />}
                          onClick={() => {/* TODO: Open email config modal */}}
                          className="hover:bg-blue-50 hover:border-blue-300 px-2 py-1 text-xs"
                        >
                          Configurar
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<TestTube className="w-3 h-3" />}
                          onClick={() => handleTestService('Email')}
                          className="hover:bg-green-50 hover:border-green-300 px-2 py-1 text-xs"
                        >
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {notificationConfig.emailService.provider}
                      </div>
                      <div className="text-xs text-secondary-600">Proveedor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {notificationConfig.emailService.apiKey ? 'Configurada' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">API Key</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {notificationConfig.emailService.fromEmail ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Remitente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {notificationConfig.emailService.isActive ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="text-xs text-secondary-600">Estado</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Service Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Notificaciones Push</h3>
                        <p className="text-gray-600 text-xs">Firebase, OneSignal, Expo Push</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={notificationConfig.pushService.isActive ? 'success' : 'warning'}>
                        {notificationConfig.pushService.isActive ? 'Configurado' : 'Requiere atención'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Settings className="w-3 h-3" />}
                          onClick={() => {/* TODO: Open push config modal */}}
                          className="hover:bg-green-50 hover:border-green-300 px-2 py-1 text-xs"
                        >
                          Configurar
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<TestTube className="w-3 h-3" />}
                          onClick={() => handleTestService('Push')}
                          className="hover:bg-green-50 hover:border-green-300 px-2 py-1 text-xs"
                        >
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {notificationConfig.pushService.provider}
                      </div>
                      <div className="text-xs text-secondary-600">Proveedor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {notificationConfig.pushService.apiKey ? 'Configurada' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">API Key</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {notificationConfig.pushService.projectId ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Project ID</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {notificationConfig.pushService.isActive ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="text-xs text-secondary-600">Estado</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Service Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Servicio SMS</h3>
                        <p className="text-gray-600 text-xs">Twilio, Amazon SNS, MessageBird</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={notificationConfig.smsService.isActive ? 'success' : 'warning'}>
                        {notificationConfig.smsService.isActive ? 'Configurado' : 'Requiere atención'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Settings className="w-3 h-3" />}
                          onClick={() => {/* TODO: Open SMS config modal */}}
                          className="hover:bg-purple-50 hover:border-purple-300 px-2 py-1 text-xs"
                        >
                          Configurar
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<TestTube className="w-3 h-3" />}
                          onClick={() => handleTestService('SMS')}
                          className="hover:bg-purple-50 hover:border-purple-300 px-2 py-1 text-xs"
                        >
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {notificationConfig.smsService.provider}
                      </div>
                      <div className="text-xs text-secondary-600">Proveedor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {notificationConfig.smsService.accountSid || notificationConfig.smsService.apiKey ? 'Configurada' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Credenciales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {notificationConfig.smsService.phoneNumber ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Número</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {notificationConfig.smsService.isActive ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="text-xs text-secondary-600">Estado</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};

export default NotificationsConfigPage;
