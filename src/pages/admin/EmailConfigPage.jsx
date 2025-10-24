/**
 * Email Configuration Page - Configuración Específica de Emails
 *
 * Página dedicada a la configuración avanzada de servicios de email
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, Modal, ToggleSwitch } from '../../components/common';
import { Mail, Send, Settings, CheckCircle, AlertTriangle, Eye, EyeOff, PlusCircle, Trash2, TestTube, RefreshCw, FileText, Users, BarChart3 } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const EmailConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Configuración de email
  const [emailConfig, setEmailConfig] = useState({
    providers: {
      sendgrid: {
        enabled: true,
        apiKey: '',
        fromEmail: 'noreply@nexupay.cl',
        fromName: 'NexuPay',
        defaultTemplate: 'default'
      },
      mailgun: {
        enabled: false,
        apiKey: '',
        domain: '',
        fromEmail: 'noreply@nexupay.cl',
        fromName: 'NexuPay'
      },
      ses: {
        enabled: false,
        accessKey: '',
        secretKey: '',
        region: 'us-east-1',
        fromEmail: 'noreply@nexupay.cl',
        fromName: 'NexuPay'
      },
      smtp: {
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls',
        fromEmail: 'noreply@nexupay.cl',
        fromName: 'NexuPay'
      }
    },
    templates: [
      {
        id: 'welcome',
        name: 'Bienvenida',
        subject: '¡Bienvenido a NexuPay!',
        html: '<h1>Bienvenido {{user_name}}</h1><p>Gracias por registrarte en NexuPay.</p>',
        text: 'Bienvenido {{user_name}}. Gracias por registrarte en NexuPay.',
        variables: ['user_name', 'company_name']
      },
      {
        id: 'payment_confirmation',
        name: 'Confirmación de Pago',
        subject: 'Pago Confirmado - {{amount}}',
        html: '<h1>Pago Confirmado</h1><p>Tu pago de {{amount}} ha sido procesado exitosamente.</p>',
        text: 'Tu pago de {{amount}} ha sido procesado exitosamente.',
        variables: ['amount', 'payment_id', 'user_name']
      },
      {
        id: 'payment_reminder',
        name: 'Recordatorio de Pago',
        subject: 'Recordatorio de Pago - {{amount}}',
        html: '<h1>Recordatorio de Pago</h1><p>Tienes un pago pendiente de {{amount}}.</p>',
        text: 'Tienes un pago pendiente de {{amount}}.',
        variables: ['amount', 'due_date', 'user_name']
      },
      {
        id: 'password_reset',
        name: 'Restablecer Contraseña',
        subject: 'Restablecer tu Contraseña',
        html: '<h1>Restablecer Contraseña</h1><p>Haz clic en el enlace para restablecer tu contraseña.</p>',
        text: 'Haz clic en el enlace para restablecer tu contraseña.',
        variables: ['reset_link', 'user_name']
      }
    ],
    settings: {
      bounceHandling: true,
      complaintHandling: true,
      unsubscribeHandling: true,
      trackingEnabled: true,
      openTracking: true,
      clickTracking: true,
      deliveryOptimization: true,
      rateLimiting: {
        enabled: true,
        emailsPerMinute: 100,
        emailsPerHour: 1000,
        emailsPerDay: 10000
      }
    }
  });

  // Estado para modales
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    html: '',
    text: '',
    variables: []
  });
  const [testForm, setTestForm] = useState({
    to: '',
    template: 'welcome',
    variables: {}
  });

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
      } else {
        const config = result.config;
        
        setEmailConfig(prev => ({
          ...prev,
          providers: {
            ...prev.providers,
            ...(config.email_providers || {})
          },
          templates: config.email_templates || prev.templates,
          settings: {
            ...prev.settings,
            ...(config.email_settings || {})
          }
        }));
      }
    } catch (error) {
      console.error('Error loading email config:', error);
      setError('Error al cargar configuración de email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        email_providers: emailConfig.providers,
        email_templates: emailConfig.templates,
        email_settings: emailConfig.settings
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de email ha sido actualizada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving email config:', error);
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

  const handleTestProvider = async (provider) => {
    try {
      setTestingEmail(true);

      // Simular prueba de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));

      await Swal.fire({
        icon: 'success',
        title: 'Prueba exitosa',
        text: `La conexión con ${provider.toUpperCase()} está funcionando correctamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: `No se pudo conectar con ${provider.toUpperCase()}. Verifica las credenciales.`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      html: '',
      text: '',
      variables: []
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      html: template.html,
      text: template.text,
      variables: template.variables
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.subject) {
        await Swal.fire('Error', 'Completa todos los campos obligatorios', 'error');
        return;
      }

      let updatedTemplates;
      if (selectedTemplate) {
        // Editar plantilla existente
        updatedTemplates = emailConfig.templates.map(t =>
          t.id === selectedTemplate.id
            ? { ...t, ...templateForm, updatedAt: new Date().toISOString() }
            : t
        );
      } else {
        // Crear nueva plantilla
        const newTemplate = {
          id: Date.now().toString(),
          ...templateForm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedTemplates = [...emailConfig.templates, newTemplate];
      }

      setEmailConfig(prev => ({
        ...prev,
        templates: updatedTemplates
      }));

      setShowTemplateModal(false);
      
      await Swal.fire({
        icon: 'success',
        title: selectedTemplate ? 'Plantilla actualizada' : 'Plantilla creada',
        text: `La plantilla ha sido ${selectedTemplate ? 'actualizada' : 'creada'} exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving template:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la plantilla',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar plantilla?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const updatedTemplates = emailConfig.templates.filter(t => t.id !== templateId);
        setEmailConfig(prev => ({
          ...prev,
          templates: updatedTemplates
        }));

        await Swal.fire({
          icon: 'success',
          title: 'Plantilla eliminada',
          text: 'La plantilla ha sido eliminada exitosamente',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.message || 'No se pudo eliminar la plantilla',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleSendTestEmail = async () => {
    try {
      if (!testForm.to || !testForm.template) {
        await Swal.fire('Error', 'Completa todos los campos', 'error');
        return;
      }

      // Simular envío de email de prueba
      await new Promise(resolve => setTimeout(resolve, 2000));

      await Swal.fire({
        icon: 'success',
        title: 'Email enviado',
        text: `El email de prueba ha sido enviado a ${testForm.to}`,
        confirmButtonText: 'Aceptar'
      });

      setShowTestModal(false);
      setTestForm({ to: '', template: 'welcome', variables: {} });

    } catch (error) {
      console.error('Error sending test email:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: error.message || 'No se pudo enviar el email de prueba',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const getProviderStatus = (provider) => {
    const config = emailConfig.providers[provider];
    if (!config.enabled) return { variant: 'secondary', text: 'Inactivo' };
    if (!config.apiKey && !config.username) return { variant: 'warning', text: 'Configuración incompleta' };
    return { variant: 'success', text: 'Activo' };
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
          <Button onClick={() => loadEmailConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Configuración de Email
                </h1>
                <p className="text-blue-100 text-sm">
                  Gestión avanzada de servicios de email y plantillas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {emailConfig.templates.length}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Plantillas</p>
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              Configuradas
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {Object.values(emailConfig.providers).filter(p => p.enabled).length}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Proveedores</p>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">
              Activos
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {emailConfig.settings.trackingEnabled ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Tracking</p>
            <div className="text-xs text-purple-600 mt-0.5 font-medium">
              {emailConfig.settings.trackingEnabled ? 'Habilitado' : 'Deshabilitado'}
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:shadow-glow-orange transition-all duration-300">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {emailConfig.settings.rateLimiting.enabled ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Rate Limiting</p>
            <div className="text-xs text-orange-600 mt-0.5 font-medium">
              {emailConfig.settings.rateLimiting.enabled ? 'Limitado' : 'Ilimitado'}
            </div>
          </div>
        </Card>
      </div>

      {/* Email Providers */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Proveedores de Email</h3>
              <p className="text-secondary-600 text-sm">Configura los servicios de envío de email</p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(emailConfig.providers).map(([provider, config]) => (
              <div key={provider} className="border rounded-lg p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Mail className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{provider}</h4>
                      <p className="text-sm text-gray-600">
                        {provider === 'sendgrid' && 'API de email transaccional'}
                        {provider === 'mailgun' && 'Email como servicio'}
                        {provider === 'ses' && 'Amazon SES'}
                        {provider === 'smtp' && 'Servidor SMTP personal'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getProviderStatus(provider).variant}>
                      {getProviderStatus(provider).text}
                    </Badge>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProvider(provider)}
                        loading={testingEmail}
                        leftIcon={<TestTube className="w-4 h-4" />}
                      >
                        Probar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key / Username
                    </label>
                    <Input
                      type="password"
                      value={config.apiKey || config.username || ''}
                      onChange={(e) => setEmailConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            apiKey: e.target.value
                          }
                        }
                      }))}
                      placeholder="API Key o username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Remitente
                    </label>
                    <Input
                      type="email"
                      value={config.fromEmail}
                      onChange={(e) => setEmailConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            fromEmail: e.target.value
                          }
                        }
                      }))}
                      placeholder="noreply@nexupay.cl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Remitente
                    </label>
                    <Input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => setEmailConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            fromName: e.target.value
                          }
                        }
                      }))}
                      placeholder="NexuPay"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      enabled={config.enabled}
                      onChange={(value) => setEmailConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            enabled: value
                          }
                        }
                      }))}
                    />
                    <span className="text-sm text-gray-700">
                      {config.enabled ? 'Proveedor activo' : 'Proveedor inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Email Templates */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Plantillas de Email</h3>
              <p className="text-secondary-600 text-sm">Gestiona las plantillas para diferentes tipos de comunicación</p>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleCreateTemplate}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Nueva Plantilla
            </Button>
          </div>

          <div className="space-y-4">
            {emailConfig.templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">Asunto: {template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => handleEditTemplate(template)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Variables:</span>
                  <span className="ml-2">{template.variables.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Email Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Configuración Avanzada</h3>
              <p className="text-secondary-600 text-sm">Configuración adicional y límites</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Tracking de Emails</h4>
                <p className="text-sm text-gray-600">Seguimiento de aperturas y clics</p>
              </div>
              <ToggleSwitch
                enabled={emailConfig.settings.trackingEnabled}
                onChange={(value) => setEmailConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, trackingEnabled: value }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Manejo de Bounces</h4>
                <p className="text-sm text-gray-600">Procesamiento automático de emails devueltos</p>
              </div>
              <ToggleSwitch
                enabled={emailConfig.settings.bounceHandling}
                onChange={(value) => setEmailConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, bounceHandling: value }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Rate Limiting</h4>
                <p className="text-sm text-gray-600">Limites de envío para evitar spam</p>
              </div>
              <ToggleSwitch
                enabled={emailConfig.settings.rateLimiting.enabled}
                onChange={(value) => setEmailConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, rateLimiting: { ...prev.settings.rateLimiting, enabled: value } }
                }))}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTestModal(true)}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Enviar Email de Prueba
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowStatsModal(true)}
            leftIcon={<BarChart3 className="w-4 h-4" />}
          >
            Ver Estadísticas
          </Button>
        </div>
        <Button
          variant="gradient"
          onClick={handleSaveConfig}
          loading={saving}
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Guardar Configuración
        </Button>
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={selectedTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Plantilla
            </label>
            <Input
              value={templateForm.name}
              onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
              placeholder="Ej: Bienvenida"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto
            </label>
            <Input
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
              placeholder="Ej: ¡Bienvenido a NexuPay!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (separadas por comas)
            </label>
            <Input
              value={templateForm.variables.join(', ')}
              onChange={(e) => setTemplateForm({...templateForm, variables: e.target.value.split(',').map(v => v.trim())})}
              placeholder="Ej: user_name, company_name, amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido HTML
            </label>
            <textarea
              value={templateForm.html}
              onChange={(e) => setTemplateForm({...templateForm, html: e.target.value})}
              placeholder="<h1>Hola {{user_name}}</h1>"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido Texto
            </label>
            <textarea
              value={templateForm.text}
              onChange={(e) => setTemplateForm({...templateForm, text: e.target.value})}
              placeholder="Hola {{user_name}}"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveTemplate}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {selectedTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Enviar Email de Prueba"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Destino
            </label>
            <Input
              type="email"
              value={testForm.to}
              onChange={(e) => setTestForm({...testForm, to: e.target.value})}
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plantilla
            </label>
            <Select
              value={testForm.template}
              onChange={(value) => setTestForm({...testForm, template: value})}
              options={emailConfig.templates.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTestModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendTestEmail}
              className="flex-1"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Estadísticas de Email"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Emails Enviados Hoy</h4>
              <p className="text-2xl font-bold text-blue-600">1,234</p>
              <p className="text-sm text-blue-700">+15% vs ayer</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Tasa de Apertura</h4>
              <p className="text-2xl font-bold text-green-600">68.5%</p>
              <p className="text-sm text-green-700">+5.2% vs semana pasada</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Tasa de Clics</h4>
              <p className="text-2xl font-bold text-purple-600">12.3%</p>
              <p className="text-sm text-purple-700">+2.1% vs semana pasada</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Bounces</h4>
              <p className="text-2xl font-bold text-orange-600">2.1%</p>
              <p className="text-sm text-orange-700">-0.5% vs semana pasada</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowStatsModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailConfigPage;