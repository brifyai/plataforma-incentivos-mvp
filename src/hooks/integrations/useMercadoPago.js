/**
 * Hook personalizado para Mercado Pago
 * 
 * Proporciona funcionalidades para procesar pagos usando Mercado Pago,
 * crear preferencias de pago, y manejar transacciones.
 * 
 * @module useMercadoPago
 */

import { useState, useCallback, useEffect } from 'react';
import mercadoPagoService from '../../services/integrations/mercadopago.service';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const useMercadoPago = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotification();

  /**
   * Verifica si Mercado Pago está configurado al montar el hook
   */
  useEffect(() => {
    const config = mercadoPagoService.isConfigured();
    setIsConfigured(config.configured);
  }, []);

  /**
   * Crea una preferencia de pago
   */
  const createPaymentPreference = useCallback(async (paymentData) => {
    if (!isConfigured) {
      addNotification({
        type: 'error',
        message: 'Mercado Pago no está configurado'
      });
      return { success: false, error: 'Mercado Pago no está configurado' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.createPaymentPreference(paymentData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Link de pago generado exitosamente'
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al crear preferencia de pago: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isConfigured, addNotification]);

  /**
   * Crea una preferencia de pago con cuotas
   */
  const createInstallmentPayment = useCallback(async (paymentData) => {
    if (!isConfigured) {
      addNotification({
        type: 'error',
        message: 'Mercado Pago no está configurado'
      });
      return { success: false, error: 'Mercado Pago no está configurado' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.createInstallmentPaymentPreference(paymentData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: `Link de pago para cuota ${paymentData.installmentNumber} generado`
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isConfigured, addNotification]);

  /**
   * Obtiene información de un pago
   */
  const getPayment = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.getPayment(paymentId);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Procesa un webhook de Mercado Pago
   */
  const processWebhook = useCallback(async (webhookData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.processWebhook(webhookData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Webhook procesado exitosamente'
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
   * Crea un reembolso
   */
  const createRefund = useCallback(async (paymentId, amount = null) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.createRefund(paymentId, amount);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Reembolso procesado exitosamente'
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al crear reembolso: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Busca pagos por filtros
   */
  const searchPayments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.searchPayments(filters);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, payments: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene estadísticas de pagos
   */
  const getPaymentStats = useCallback(async (debtorId = null, period = 'month') => {
    setLoading(true);
    setError(null);

    try {
      const result = await mercadoPagoService.getPaymentStats(debtorId, period);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Helper: Crea un pago para una deuda completa
   */
  const createDebtPayment = useCallback(async (debtData) => {
    const paymentData = {
      debtId: debtData.id,
      debtorId: user.id,
      debtorEmail: user.email,
      debtorName: user.name || `${user.first_name} ${user.last_name}`,
      amount: debtData.amount,
      description: `Pago de deuda: ${debtData.company_name}`,
      externalReference: `debt-${debtData.id}-${Date.now()}`,
      metadata: {
        debt_id: debtData.id,
        debtor_id: user.id,
        company_id: debtData.company_id,
        debt_type: 'full_payment'
      }
    };

    return await createPaymentPreference(paymentData);
  }, [user, createPaymentPreference]);

  /**
   * Helper: Crea un pago para una cuota de acuerdo
   */
  const createInstallmentPaymentForAgreement = useCallback(async (agreementData, installmentNumber) => {
    const installmentAmount = agreementData.total_amount / agreementData.installments;

    const paymentData = {
      debtId: agreementData.debt_id,
      debtorId: user.id,
      debtorEmail: user.email,
      debtorName: user.name || `${user.first_name} ${user.last_name}`,
      amount: installmentAmount,
      description: `Cuota ${installmentNumber} de ${agreementData.installments}`,
      installmentNumber,
      totalInstallments: agreementData.installments,
      externalReference: `agreement-${agreementData.id}-installment-${installmentNumber}-${Date.now()}`,
      metadata: {
        debt_id: agreementData.debt_id,
        debtor_id: user.id,
        agreement_id: agreementData.id,
        installment_number: installmentNumber,
        total_installments: agreementData.installments,
        debt_type: 'installment_payment'
      }
    };

    return await createInstallmentPayment(paymentData);
  }, [user, createInstallmentPayment]);

  /**
   * Verifica el estado de un pago
   */
  const checkPaymentStatus = useCallback(async (paymentId) => {
    const result = await getPayment(paymentId);

    if (result.success) {
      const status = result.payment.status;
      const statusMessages = {
        approved: 'Pago aprobado',
        pending: 'Pago pendiente',
        in_process: 'Pago en proceso',
        rejected: 'Pago rechazado',
        cancelled: 'Pago cancelado',
        refunded: 'Pago reembolsado'
      };

      addNotification({
        type: status === 'approved' ? 'success' : 'info',
        message: statusMessages[status] || `Estado: ${status}`
      });
    }

    return result;
  }, [getPayment, addNotification]);

  return {
    loading,
    error,
    isConfigured,
    createPaymentPreference,
    createInstallmentPayment,
    getPayment,
    processWebhook,
    createRefund,
    searchPayments,
    getPaymentStats,
    // Helpers específicos
    createDebtPayment,
    createInstallmentPaymentForAgreement,
    checkPaymentStatus
  };
};

export default useMercadoPago;
