/**
 * WhatsApp Configuration Page - Configuración de WhatsApp Business
 *
 * Página dedicada a la configuración avanzada de WhatsApp Business API
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, Modal, ToggleSwitch } from '../../components/common';
import { MessageCircle, Send, Settings, CheckCircle, AlertTriangle, Eye, EyeOff, PlusCircle, Trash2, TestTube, RefreshCw, FileText, Users, BarChart3, Phone, QrCode, Link2 } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const WhatsAppConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [testingMessage, setTestingMessage] = useState(false);

  // Configuración de WhatsApp
  const [whatsappConfig, setWhatsappConfig] = useState({
    providers: {
      twilio: {
        enabled: true,
        accountSid: '',
        authToken: '',
        fromNumber: '',
        webhookUrl: 'https://nexupay.cl/webhooks/whatsapp/twilio'
      },
      messagebird: {
        enabled: false,
        accessKey: '',
        channelId: '',
        webhookUrl: 'https://nexupay.cl/webhooks/whatsapp/messagebird'
      },
      meta: {
        enabled: false,
        accessToken: '',
        phoneNumberId: '',
        appId: '',
        appSecret: '',
        webhookVerifyToken: '',
        webhookUrl: 'https://nexupay.cl/webhooks/whatsapp/meta'
      },
      gupshup: {
        enabled: false,
        apiKey: '',
        appName: '',
        sourceNumber: '',
        webhookUrl: 'https://nexupay.cl/webhooks/whatsapp/gupshup'
      }
    },
    templates: [
      {
        id: 'payment_reminder',
        name: 'Recordatorio de Pago',
        category: 'payment',
        language: 'es',
        components: [
          {
            type: 'header',
            format: 'text',
            text: 'Recordatorio de Pago'
          },
          {
            type: 'body',
            text: 'Hola {{1}}, este es un recordatorio de tu pago pendiente de {{2}} que vence el {{3}}. Puedes realizar el pago aquí: {{4}}'
          },
          {
            type: 'footer',
            text: 'NexuPay - Gestión de Pagos'
          }
        ],
        variables: ['cliente_nombre', 'monto', 'fecha_vencimiento', 'link_pago'],
        status: 'approved'
      },
      {
        id: 'payment_confirmation',
        name: 'Confirmación de Pago',
        category: 'payment',
        language: 'es',
        components: [
          {
            type: 'header',
            format: 'text',
            text: 'Pago Confirmado'
          },
          {
            type: 'body',
            text: 'Hola {{1}}, hemos confirmado tu pago de {{2}} por {{3}}. Tu referencia es {{4}}. ¡Gracias por pagar a tiempo!'
          },
          {
            type: 'footer',
            text: 'NexuPay - Gestión de Pagos'
          }
        ],
        variables: ['cliente_nombre', 'monto', 'concepto', 'referencia'],
        status: 'approved'
      },
      {
        id: 'welcome_message',
        name: 'Mensaje de Bienvenida',
        category: 'marketing',
        language: 'es',
        components: [
          {
            type: 'header',
            format: 'text',
            text: '¡Bienvenido a NexuPay!'
          },
          {
            type: 'body',
            text: 'Hola {{1}}, gracias por unirte a NexuPay. Estamos aquí para ayudarte a gestionar tus pagos de forma sencilla y segura.'
          },
          {
            type: 'footer',
            text: 'NexuPay - Tu Aliado Financiero'
          }
        ],
        variables: ['cliente_nombre'],
        status: 'approved'
      }
    ],
    settings: {
      autoReply: {
        enabled: true,
        responseDelay: 5,
        businessHours: {
          enabled: true,
          startTime: '09:00',
          endTime: '18:00',
          timezone: 'America/Santiago',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      rateLimiting: {
        enabled: true,
        messagesPerMinute: 30,
        messagesPerHour: 1000,
        messagesPerDay: 10000
      },
      optOut: {
        enabled: true,
        keyword: 'STOP',
        confirmationMessage: 'Has sido eliminado de nuestras comunicaciones. Para volver a suscribirte, envía START.'
      },
      quality: {
        enabled: true,
        templateQualityCheck: true,
        messagePreview: true,
        spamProtection: true
      }
    }
  });

  // Estado para modales
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'utility',
    language: 'es',
    components: [],
    variables: []
  });
  const [testForm, setTestForm] = useState({
    to: '',
    template: 'payment_reminder',
    variables: {}
  });

  useEffect(() => {
    loadWhatsAppConfig();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
      } else {
        const config = result.config;
        
        setWhatsappConfig(prev => ({
          ...prev,
          providers: {
            ...prev.providers,
            ...(config.whatsapp_providers || {})
          },
          templates: config.whatsapp_templates || prev.templates,
          settings: {
            ...prev.settings,
            ...(config.whatsapp_settings || {})
          }
        }));
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
      setError('Error al cargar configuración de WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        whatsapp_providers: whatsappConfig.providers,
        whatsapp_templates: whatsappConfig.templates,
        whatsapp_settings: whatsappConfig.settings
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de WhatsApp ha sido actualizada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
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
      setTestingMessage(true);

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
      setTestingMessage(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      name: '',
      category: 'utility',
      language: 'es',
      components: [],
      variables: []
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      category: template.category,
      language: template.language,
      components: template.components,
      variables: template.variables
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.category) {
        await Swal.fire('Error', 'Completa todos los campos obligatorios', 'error');
        return;
      }

      let updatedTemplates;
      if (selectedTemplate) {
        // Editar plantilla existente
        updatedTemplates = whatsappConfig.templates.map(t =>
          t.id === selectedTemplate.id
            ? { ...t, ...templateForm, updatedAt: new Date().toISOString() }
            : t
        );
      } else {
        // Crear nueva plantilla
        const newTemplate = {
          id: Date.now().toString(),
          ...templateForm,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedTemplates = [...whatsappConfig.templates, newTemplate];
      }

      setWhatsappConfig(prev => ({
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
        const updatedTemplates = whatsappConfig.templates.filter(t => t.id !== templateId);
        setWhatsappConfig(prev => ({
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

  const handleSendTestMessage = async () => {
    try {
      if (!testForm.to || !testForm.template) {
        await Swal.fire('Error', 'Completa todos los campos', 'error');
        return;
      }

      // Simular envío de mensaje de prueba
      await new Promise(resolve => setTimeout(resolve, 2000));

      await Swal.fire({
        icon: 'success',
        title: 'Mensaje enviado',
        text: `El mensaje de prueba ha sido enviado a ${testForm.to}`,
        confirmButtonText: 'Aceptar'
      });

      setShowTestModal(false);
      setTestForm({ to: '', template: 'payment_reminder', variables: {} });

    } catch (error) {
      console.error('Error sending test message:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: error.message || 'No se pudo enviar el mensaje de prueba',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleGenerateQR = async (provider) => {
    try {
      // Simular generación de QR
      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowQRModal(true);
    } catch (error) {
      console.error('Error generating QR:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al generar QR',
        text: 'No se pudo generar el código QR',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const getProviderStatus = (provider) => {
    const config = whatsappConfig.providers[provider];
    if (!config.enabled) return { variant: 'secondary', text: 'Inactivo' };
    if (!config.accountSid && !config.accessKey && !config.accessToken) return { variant: 'warning', text: 'Configuración incompleta' };
    return { variant: 'success', text: 'Activo' };
  };

  const getTemplateStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: 'success', text: 'Aprobada' },
      pending: { variant: 'warning', text: 'Pendiente' },
      rejected: { variant: 'error', text: 'Rechazada' },
      draft: { variant: 'secondary', text: 'Borrador' }
    };
    return statusConfig[status] || statusConfig.draft;
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
          <Button onClick={() => loadWhatsAppConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Configuración de WhatsApp
                </h1>
                <p className="text-green-100 text-sm">
                  Gestión avanzada de WhatsApp Business API
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
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {whatsappConfig.templates.length}
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
              {Object.values(whatsappConfig.providers).filter(p => p.enabled).length}
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
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {whatsappConfig.settings.autoReply.enabled ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Auto-Respuesta</p>
            <div className="text-xs text-purple-600 mt-0.5 font-medium">
              {whatsappConfig.settings.autoReply.enabled ? 'Habilitado' : 'Deshabilitado'}
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:shadow-glow-orange transition-all duration-300">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {whatsappConfig.settings.rateLimiting.enabled ? 'Limitado' : 'Ilimitado'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Rate Limiting</p>
            <div className="text-xs text-orange-600 mt-0.5 font-medium">
              {whatsappConfig.settings.rateLimiting.enabled ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </Card>
      </div>

      {/* WhatsApp Providers */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Proveedores de WhatsApp</h3>
              <p className="text-secondary-600 text-sm">Configura los servicios de mensajería de WhatsApp</p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(whatsappConfig.providers).map(([provider, config]) => (
              <div key={provider} className="border rounded-lg p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{provider}</h4>
                      <p className="text-sm text-gray-600">
                        {provider === 'twilio' && 'Twilio WhatsApp API'}
                        {provider === 'messagebird' && 'MessageBird WhatsApp API'}
                        {provider === 'meta' && 'Meta WhatsApp Business API'}
                        {provider === 'gupshup' && 'Gupshup WhatsApp API'}
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
                        loading={testingMessage}
                        leftIcon={<TestTube className="w-4 h-4" />}
                      >
                        Probar
                      </Button>
                      {provider === 'meta' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateQR(provider)}
                          leftIcon={<QrCode className="w-4 h-4" />}
                        >
                          QR
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {provider === 'twilio' ? 'Account SID' : 
                       provider === 'messagebird' ? 'Access Key' :
                       provider === 'meta' ? 'Access Token' : 'API Key'}
                    </label>
                    <Input
                      type="password"
                      value={config.accountSid || config.accessKey || config.accessToken || config.apiKey || ''}
                      onChange={(e) => setWhatsappConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            accountSid: e.target.value,
                            accessKey: e.target.value,
                            accessToken: e.target.value,
                            apiKey: e.target.value
                          }
                        }
                      }))}
                      placeholder="Credencial de API"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {provider === 'meta' ? 'Phone Number ID' : 
                       provider === 'messagebird' ? 'Channel ID' :
                       provider === 'gupshup' ? 'App Name' : 'From Number'}
                    </label>
                    <Input
                      type="text"
                      value={config.phoneNumberId || config.channelId || config.appName || config.fromNumber || ''}
                      onChange={(e) => setWhatsappConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            phoneNumberId: e.target.value,
                            channelId: e.target.value,
                            appName: e.target.value,
                            fromNumber: e.target.value
                          }
                        }
                      }))}
                      placeholder="Identificador"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <Input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setWhatsappConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [provider]: {
                            ...prev.providers[provider],
                            webhookUrl: e.target.value
                          }
                        }
                      }))}
                      placeholder="https://nexupay.cl/webhooks/whatsapp"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      enabled={config.enabled}
                      onChange={(value) => setWhatsappConfig(prev => ({
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

      {/* WhatsApp Templates */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Plantillas de WhatsApp</h3>
              <p className="text-secondary-600 text-sm">Gestiona las plantillas de mensaje aprobadas por WhatsApp</p>
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
            {whatsappConfig.templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" size="sm">{template.category}</Badge>
                      <Badge variant="outline" size="sm">{template.language}</Badge>
                      <Badge variant={getTemplateStatusBadge(template.status).variant} size="sm">
                        {getTemplateStatusBadge(template.status).text}
                      </Badge>
                    </div>
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

                {template.components && template.components.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Componentes:</span>
                    <span className="ml-2">{template.components.map(c => c.type).join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* WhatsApp Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Configuración Avanzada</h3>
              <p className="text-secondary-600 text-sm">Configuración adicional y automatización</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Respuesta</h4>
                <p className="text-sm text-gray-600">Respuestas automáticas fuera de horario laboral</p>
              </div>
              <ToggleSwitch
                enabled={whatsappConfig.settings.autoReply.enabled}
                onChange={(value) => setWhatsappConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, autoReply: { ...prev.settings.autoReply, enabled: value } }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Rate Limiting</h4>
                <p className="text-sm text-gray-600">Límites de envío para evitar bloqueos</p>
              </div>
              <ToggleSwitch
                enabled={whatsappConfig.settings.rateLimiting.enabled}
                onChange={(value) => setWhatsappConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, rateLimiting: { ...prev.settings.rateLimiting, enabled: value } }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Opt-Out</h4>
                <p className="text-sm text-gray-600">Gestión de cancelación de suscripción</p>
              </div>
              <ToggleSwitch
                enabled={whatsappConfig.settings.optOut.enabled}
                onChange={(value) => setWhatsappConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, optOut: { ...prev.settings.optOut, enabled: value } }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Control de Calidad</h4>
                <p className="text-sm text-gray-600">Verificación de calidad de plantillas y mensajes</p>
              </div>
              <ToggleSwitch
                enabled={whatsappConfig.settings.quality.enabled}
                onChange={(value) => setWhatsappConfig(prev => ({
                  ...prev,
                  settings: { ...prev.settings, quality: { ...prev.settings.quality, enabled: value } }
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
            Enviar Mensaje de Prueba
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Plantilla
              </label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                placeholder="Ej: Recordatorio de Pago"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <Select
                value={templateForm.category}
                onChange={(value) => setTemplateForm({...templateForm, category: value})}
                options={[
                  { value: 'utility', label: 'Utilidad' },
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'authentication', label: 'Autenticación' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (separadas por comas)
            </label>
            <Input
              value={templateForm.variables.join(', ')}
              onChange={(e) => setTemplateForm({...templateForm, variables: e.target.value.split(',').map(v => v.trim())})}
              placeholder="Ej: cliente_nombre, monto, fecha_vencimiento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido del Mensaje
            </label>
            <textarea
              value={templateForm.components.find(c => c.type === 'body')?.text || ''}
              onChange={(e) => setTemplateForm({
                ...templateForm,
                components: [
                  {
                    type: 'body',
                    text: e.target.value
                  }
                ]
              })}
              placeholder="Hola {{1}}, este es un recordatorio de tu pago de {{2}}."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* Test Message Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Enviar Mensaje de Prueba"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de WhatsApp
            </label>
            <Input
              type="tel"
              value={testForm.to}
              onChange={(e) => setTestForm({...testForm, to: e.target.value})}
              placeholder="+56912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plantilla
            </label>
            <Select
              value={testForm.template}
              onChange={(value) => setTestForm({...testForm, template: value})}
              options={whatsappConfig.templates.map(t => ({ value: t.id, label: t.name }))}
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
              onClick={handleSendTestMessage}
              className="flex-1"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Mensaje
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Código QR de WhatsApp"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-8 bg-gray-100 rounded-lg inline-block">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="mt-4 text-gray-600">
              Escanea este código QR con WhatsApp para conectar la cuenta
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowQRModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Estadísticas de WhatsApp"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Mensajes Enviados Hoy</h4>
              <p className="text-2xl font-bold text-green-600">856</p>
              <p className="text-sm text-green-700">+12% vs ayer</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tasa de Respuesta</h4>
              <p className="text-2xl font-bold text-blue-600">34.2%</p>
              <p className="text-sm text-blue-700">+3.1% vs semana pasada</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Mensajes Leídos</h4>
              <p className="text-2xl font-bold text-purple-600">89.5%</p>
              <p className="text-sm text-purple-700">+2.3% vs semana pasada</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Opt-Outs</h4>
              <p className="text-2xl font-bold text-orange-600">1.2%</p>
              <p className="text-sm text-orange-700">-0.3% vs semana pasada</p>
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

export default WhatsAppConfigPage;