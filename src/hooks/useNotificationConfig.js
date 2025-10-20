/**
 * Custom Hook para gestión de configuración de notificaciones
 *
 * Extrae toda la lógica de configuración de servicios de notificación
 * para mantener los componentes más limpios y reutilizables
 */

import { useState, useEffect } from 'react';
import { updateSystemConfig } from '../services/databaseService';
import Swal from 'sweetalert2';

export const useNotificationConfig = () => {
  const [loading, setLoading] = useState(true);
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

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadNotificationConfig = async () => {
      try {
        setLoading(true);

        const { getSystemConfig } = await import('../services/databaseService');
        const result = await getSystemConfig();

        if (result.error) {
          console.error('Config error:', result.error);
        } else {
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
      } finally {
        setLoading(false);
      }
    };

    loadNotificationConfig();
  }, []);

  // Actualizar configuración completa
  const updateConfig = (updates) => {
    setNotificationConfig(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Actualizar servicio de email
  const updateEmailService = (updates) => {
    setNotificationConfig(prev => ({
      ...prev,
      emailService: {
        ...prev.emailService,
        ...updates
      }
    }));
  };

  // Actualizar servicio push
  const updatePushService = (updates) => {
    setNotificationConfig(prev => ({
      ...prev,
      pushService: {
        ...prev.pushService,
        ...updates
      }
    }));
  };

  // Actualizar servicio SMS
  const updateSmsService = (updates) => {
    setNotificationConfig(prev => ({
      ...prev,
      smsService: {
        ...prev.smsService,
        ...updates
      }
    }));
  };

  // Guardar configuración de servicio específico
  const saveServiceConfig = async (serviceType) => {
    try {
      setSaving(true);

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

  // Probar servicio
  const testService = async (serviceType) => {
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

  return {
    // Estados
    notificationConfig,
    loading,
    saving,

    // Acciones
    updateConfig,
    updateEmailService,
    updatePushService,
    updateSmsService,
    saveServiceConfig,
    testService
  };
};