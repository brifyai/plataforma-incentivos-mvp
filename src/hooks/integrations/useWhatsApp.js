/**
 * Hook personalizado para WhatsApp Business API
 * 
 * Proporciona funcionalidades para enviar notificaciones vía WhatsApp
 * de forma sencilla desde cualquier componente React.
 * 
 * @module useWhatsApp
 */

import { useState, useCallback } from 'react';
import whatsappService from '../../services/integrations/whatsapp.service';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { addNotification } = useNotification();

  /**
   * Verifica si WhatsApp está configurado
   */
  const isConfigured = useCallback(() => {
    return whatsappService.isConfigured();
  }, []);

  /**
   * Envía un mensaje de texto simple
   */
  const sendMessage = useCallback(async (phoneNumber, message) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendMessage(phoneNumber, message);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Mensaje de WhatsApp enviado exitosamente'
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al enviar WhatsApp: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía mensaje de bienvenida
   */
  const sendWelcome = useCallback(async (phoneNumber, userName) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendWelcomeMessage(phoneNumber, userName);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Mensaje de bienvenida enviado'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía recordatorio de pago
   */
  const sendPaymentReminder = useCallback(async (phoneNumber, userName, debtDetails, daysUntilDue) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendPaymentReminder(
        phoneNumber,
        userName,
        debtDetails,
        daysUntilDue
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Recordatorio de pago enviado'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía confirmación de acuerdo
   */
  const sendAgreementConfirmation = useCallback(async (phoneNumber, userName, agreementDetails) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendAgreementConfirmation(
        phoneNumber,
        userName,
        agreementDetails
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Confirmación de acuerdo enviada'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía confirmación de pago recibido
   */
  const sendPaymentConfirmation = useCallback(async (phoneNumber, userName, paymentDetails) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendPaymentConfirmation(
        phoneNumber,
        userName,
        paymentDetails
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Confirmación de pago enviada'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía alerta de incentivo disponible
   */
  const sendIncentiveAlert = useCallback(async (phoneNumber, userName, incentiveAmount) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendIncentiveAlert(
        phoneNumber,
        userName,
        incentiveAmount
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Alerta de incentivo enviada'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía notificación de nueva oferta
   */
  const sendNewOfferNotification = useCallback(async (phoneNumber, userName, offerDetails) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendNewOfferNotification(
        phoneNumber,
        userName,
        offerDetails
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Notificación de oferta enviada'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía alerta de oferta por vencer
   */
  const sendOfferExpiringAlert = useCallback(async (phoneNumber, userName, offerDetails, hoursLeft) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendOfferExpiringAlert(
        phoneNumber,
        userName,
        offerDetails,
        hoursLeft
      );

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Alerta de oferta enviada'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Envía notificación de logro desbloqueado
   */
  const sendAchievementNotification = useCallback(async (phoneNumber, userName, achievement) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendAchievementNotification(
        phoneNumber,
        userName,
        achievement
      );

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Envía notificación de subida de nivel
   */
  const sendLevelUpNotification = useCallback(async (phoneNumber, userName, newLevel, benefits) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatsappService.sendLevelUpNotification(
        phoneNumber,
        userName,
        newLevel,
        benefits
      );

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Envía mensajes masivos
   */
  const sendBulkMessages = useCallback(async (recipients) => {
    setLoading(true);
    setError(null);

    try {
      const phoneNumbers = recipients.map(r => r.phoneNumber);
      const message = recipients[0]?.message || '';

      const result = await whatsappService.sendBulkMessage(phoneNumbers, message);

      if (result.successful > 0) {
        addNotification({
          type: 'success',
          message: `${result.successful} mensajes enviados exitosamente`
        });
      }

      if (result.failed > 0) {
        addNotification({
          type: 'warning',
          message: `${result.failed} mensajes fallaron`
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  return {
    loading,
    error,
    isConfigured,
    sendMessage,
    sendWelcome,
    sendPaymentReminder,
    sendAgreementConfirmation,
    sendPaymentConfirmation,
    sendIncentiveAlert,
    sendNewOfferNotification,
    sendOfferExpiringAlert,
    sendAchievementNotification,
    sendLevelUpNotification,
    sendBulkMessages
  };
};

export default useWhatsApp;
