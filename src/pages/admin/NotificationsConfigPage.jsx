/**
 * Notifications Configuration Page - Configuración de Notificaciones
 *
 * Página dedicada a la configuración de notificaciones (Email, Push, SMS)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { Bell, Mail, Smartphone, MessageSquare, CheckCircle, ArrowLeft, TestTube, Settings } from 'lucide-react';
import { updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const NotificationsConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 rounded-3xl p-8 text-white shadow-strong">
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
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Notificaciones
              </h1>
              <p className="text-orange-100 text-lg">
                Configuración de emails, push y SMS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Service */}
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
                onClick={() => handleSaveService('Email')}
                loading={saving}
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
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="pushActive" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="gradient"
                onClick={() => handleSaveService('Push')}
                loading={saving}
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
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="smsActive" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="gradient"
                onClick={() => handleSaveService('SMS')}
                loading={saving}
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

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Templates Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Plantillas de Email</h3>
                <p className="text-secondary-600">Información sobre plantillas disponibles</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Bienvenida</span>
                <Badge variant="success">Disponible</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Recordatorio de pago</span>
                <Badge variant="success">Disponible</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Confirmación de pago</span>
                <Badge variant="success">Disponible</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Propuesta aceptada</span>
                <Badge variant="warning">En desarrollo</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Tipos de Notificación</h3>
                <p className="text-secondary-600">Eventos que generan notificaciones</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Nuevo usuario registrado</span>
                <Badge variant="success">Email + Push</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Pago realizado</span>
                <Badge variant="success">Email + SMS</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Propuesta enviada</span>
                <Badge variant="success">Email</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="font-medium text-secondary-900">Acuerdo alcanzado</span>
                <Badge variant="warning">Email</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsConfigPage;