/**
 * Hook personalizado para integración con CRM
 *
 * Proporciona funcionalidades para interactuar con sistemas CRM
 * (Salesforce, HubSpot, Zoho, Upnify, Pipedrive) de forma unificada.
 *
 * @module useCRM
 */

import { useState, useCallback, useEffect } from 'react';
import crmService from '../../services/integrations/crm/crm.service';

export const useCRM = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCRM, setActiveCRM] = useState(null);
  const [availableCRMs, setAvailableCRMs] = useState([]);

  /**
   * Detecta y obtiene información de CRMs disponibles al montar el hook
   */
  useEffect(() => {
    const crms = crmService.getAvailableCRMs();
    setAvailableCRMs(crms);

    const active = crms.find(crm => crm.active);
    if (active) {
      setActiveCRM(active.name);
    }
  }, []);

  /**
   * Cambia el CRM activo
   */
  const changeCRM = useCallback((crmName) => {
    try {
      crmService.setActiveCRM(crmName);
      setActiveCRM(crmName);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  /**
   * Sincroniza un deudor con el CRM
   */
  const syncDebtor = useCallback(async (debtorData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.syncDebtor(debtorData);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sincroniza múltiples deudores
   */
  const syncDebtors = useCallback(async (debtorsData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.syncDebtors(debtorsData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene deudores desde el CRM
   */
  const getDebtors = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const debtors = await crmService.getDebtors(filters);
      return { success: true, debtors };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, debtors: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene un deudor específico
   */
  const getDebtor = useCallback(async (crmId) => {
    setLoading(true);
    setError(null);

    try {
      const debtor = await crmService.getDebtor(crmId);
      return { success: true, debtor };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, debtor: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Importa deudas desde el CRM
   */
  const importDebts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const debts = await crmService.importDebts(filters);
      return { success: true, debts };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, debts: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualiza el estado de una deuda en el CRM
   */
  const updateDebtStatus = useCallback(async (debtId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.updateDebtStatus(debtId, updateData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra una actividad en el CRM
   */
  const logActivity = useCallback(async (activityData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.logActivity(activityData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un pago en el CRM
   */
  const logPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.logPayment(paymentData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crea un acuerdo de pago en el CRM
   */
  const createPaymentAgreement = useCallback(async (agreementData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.createPaymentAgreement(agreementData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualiza un acuerdo de pago en el CRM
   */
  const updatePaymentAgreement = useCallback(async (agreementId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.updatePaymentAgreement(agreementId, updateData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene el historial de actividades de un deudor
   */
  const getDebtorHistory = useCallback(async (debtorId) => {
    setLoading(true);
    setError(null);

    try {
      const history = await crmService.getDebtorHistory(debtorId);
      return { success: true, history };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, history: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca deudores en el CRM
   */
  const searchDebtors = useCallback(async (query) => {
    setLoading(true);
    setError(null);

    try {
      const results = await crmService.searchDebtors(query);
      return { success: true, results };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, results: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sincronización completa
   */
  const fullSync = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.fullSync(options);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sincronización incremental
   */
  const incrementalSync = useCallback(async (since) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.incrementalSync(since);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    activeCRM,
    availableCRMs,
    changeCRM,
    syncDebtor,
    syncDebtors,
    getDebtors,
    getDebtor,
    importDebts,
    updateDebtStatus,
    logActivity,
    logPayment,
    createPaymentAgreement,
    updatePaymentAgreement,
    getDebtorHistory,
    searchDebtors,
    fullSync,
    incrementalSync
  };
};

export default useCRM;
