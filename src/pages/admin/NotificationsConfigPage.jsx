/**
 * Notifications Configuration Page
 *
 * Página para configurar sistemas de notificaciones push y email
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge, Select } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Bell,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Smartphone,
  MessageSquare,
  Send,
  TestTube,
  Users,
  TrendingUp
} from 'lucide-react';

const NotificationsConfigPage = () => {
  const [loading, setLoading] = useState(true);
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
  const [testResults, setTestResults] = useState({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testType, setTestType] = useState('');

  const emailProviders = [
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'mailgun', label: 'Mailgun' },
    { value: 'aws_ses', label: 'Amazon SES' },
    { value: 'smtp', label: 'SMTP Personalizado' }
  ];

  const pushProviders = [
    { value: 'firebase', label: 'Firebase Cloud Messaging' },
    { value: 'onesignal', label: 'OneSignal' },
    { value: 'expo', label: 'Expo Push' }
  ];

  const smsProviders = [
    { value: 'twilio', label: 'Twilio' },
    { value: 'aws_sns', label: 'Amazon SNS' },
    { value: 'messagebird', label: 'MessageBird' }
  ];

  useEffect(() => {
    loadNotificationConfig();
  }, []);

  const loadNotificationConfig = async () => {
    try {
      setLoading(true);
      // Simular carga de configuración
      setTimeout(() => {
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
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading notification config:', error);
      setLoading(false);
    }
  };

  const handleSaveConfig = async (serviceType) => {
    try {
      // Aquí iría la lógica para guardar la configuración
      alert(`✅ Configuración de ${serviceType} guardada exitosamente`);
    } catch (error) {
      alert('Error al guardar configuración: ' + error.message);
    }
  };

  const handleTestService = async (serviceType) => {
    setTestType(serviceType);
    setShowTestModal(true);
    setTestResults({});

    // Simular prueba del servicio
    setTimeout(() => {
      setTestResults({
        success: true,
        message: `Prueba de ${serviceType} exitosa`,
        details: {
          responseTime: '245ms',
          statusCode: 200,
          timestamp: new Date()
        }
      });
    }, 2000);
  };

  const sendTestNotification = async (type) => {
    try {
      alert(`📤 Enviando notificación de prueba (${type})...`);
      setTimeout(() => {
        alert(`✅ Notificación de prueba enviada exitosamente`);
      }, 1500);
    } catch (error) {
      alert('Error al enviar notificación de prueba: ' + error.message);
    }
  };

  const getServiceStatus = (service) => {
    return service.isActive ? { label: 'Activo', variant: 'success' } : { label: 'Inactivo', variant: 'danger' };
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
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Configuración de Notificaciones
              </h1>
              <p className="text-green-100 text-lg">
                Gestiona sistemas de notificaciones push, email y SMS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="info" size="lg">
              {Object.values(notificationConfig).filter(s => s.isActive).length}/3 Activos
            </Badge>
            <Button
              variant="gradient"
              onClick={() => setShowTestModal(true)}
              leftIcon={<TestTube className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              Probar Servicios
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Emails Enviados</p>
                <p className="text-2xl font-bold">12,450</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Push Enviados</p>
                <p className="text-2xl font-bold">8,320</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">SMS Enviados</p>
                <p className="text-2xl font-bold">1,245</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Tasa de Apertura</p>
                <p className="text-2xl font-bold">68.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Service */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary-900">Servicio de Email</h3>
              <Badge variant={getServiceStatus(notificationConfig.emailService).variant} size="sm">
                {getServiceStatus(notificationConfig.emailService).label}
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
              options={emailProviders}
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
                onClick={() => handleSaveConfig('Email')}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestService('Email')}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar
              </Button>
            </div>
          </div>
        </Card>

        {/* Push Notifications */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary-900">Notificaciones Push</h3>
              <Badge variant={getServiceStatus(notificationConfig.pushService).variant} size="sm">
                {getServiceStatus(notificationConfig.pushService).label}
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
              options={pushProviders}
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
                onClick={() => handleSaveConfig('Push')}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestService('Push')}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar
              </Button>
            </div>
          </div>
        </Card>

        {/* SMS Service */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary-900">Servicio SMS</h3>
              <Badge variant={getServiceStatus(notificationConfig.smsService).variant} size="sm">
                {getServiceStatus(notificationConfig.smsService).label}
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
              options={smsProviders}
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
                onClick={() => handleSaveConfig('SMS')}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestService('SMS')}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={`Prueba de ${testType}`}
        size="md"
      >
        <div className="space-y-6">
          {testResults.success ? (
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                ¡Prueba Exitosa!
              </h3>
              <p className="text-secondary-600 mb-4">
                {testResults.message}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
                <h4 className="font-semibold text-secondary-900 mb-3">Detalles técnicos:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Tiempo de respuesta:</span>
                    <span className="font-semibold">{testResults.details.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Código de estado:</span>
                    <span className="font-semibold">{testResults.details.statusCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Timestamp:</span>
                    <span className="font-semibold">{formatDate(testResults.details.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => sendTestNotification(testType.toLowerCase())}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Enviar Notificación de Prueba
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => setShowTestModal(false)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                Probando servicio...
              </h3>
              <p className="text-secondary-600">
                Verificando configuración y conectividad del servicio de {testType.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsConfigPage;