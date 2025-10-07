/**
 * Hook personalizado para integración con CRM
 * 
 * Proporciona funcionalidades para interactuar con sistemas CRM
 * (Salesforce, HubSpot, Zoho) de forma unificada.
 * 
 * @module useCRM
 */

import { useState, useCallback, useEffect } from 'react';
import crmService from '../../services/integrations/crm/crm.service';
import { useNotification } from '../../context/NotificationContext';

export const useCRM = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCRM, setActiveCRM] = useState(null);
  const [availableCRMs, setAvailableCRMs] = useState([]);
  const { addNotification } = useNotification();

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
      
      addNotification({
        type: 'success',
        message: `CRM activo cambiado a ${crmName}`
      });
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al cambiar CRM: ${err.message}`
      });
    }
  }, [addNotification]);

  /**
   * Sincroniza un deudor con el CRM
   */
  const syncDebtor = useCallback(async (debtorData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.syncDebtor(debtorData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: `Deudor ${result.action === 'created' ? 'creado' : 'actualizado'} en CRM`
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al sincronizar deudor: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Sincroniza múltiples deudores
   */
  const syncDebtors = useCallback(async (debtorsData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.syncDebtors(debtorsData);

      addNotification({
        type: 'info',
        message: `Sincronización: ${result.successful} exitosos, ${result.failed} fallidos`
      });

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error en sincronización masiva: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

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
      
      addNotification({
        type: 'success',
        message: `${debts.length} deudas importadas desde CRM`
      });

      return { success: true, debts };
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al importar deudas: ${err.message}`
      });
      return { success: false, error: err.message, debts: [] };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Actualiza el estado de una deuda en el CRM
   */
  const updateDebtStatus = useCallback(async (debtId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.updateDebtStatus(debtId, updateData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Estado de deuda actualizado en CRM'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al actualizar deuda: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Registra una actividad en el CRM
   */
  const logActivity = useCallback(async (activityData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.logActivity(activityData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Actividad registrada en CRM'
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
   * Registra un pago en el CRM
   */
  const logPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.logPayment(paymentData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Pago registrado en CRM'
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
   * Crea un acuerdo de pago en el CRM
   */
  const createPaymentAgreement = useCallback(async (agreementData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.createPaymentAgreement(agreementData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Acuerdo de pago creado en CRM'
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error al crear acuerdo: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Actualiza un acuerdo de pago en el CRM
   */
  const updatePaymentAgreement = useCallback(async (agreementId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await crmService.updatePaymentAgreement(agreementId, updateData);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Acuerdo de pago actualizado en CRM'
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
      addNotification({
        type: 'info',
        message: 'Iniciando sincronización completa con CRM...'
      });

      const result = await crmService.fullSync(options);

      if (result.success) {
        addNotification({
          type: 'success',
          message: `Sincronización completa: ${result.summary.debtors} deudores, ${result.summary.debts} deudas`
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: `Error en sincronización: ${err.message}`
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Sincronización incremental
   */
  const incrementalSync = useCallback(async (since) => {
    setLoading(true);
    setError(null);

    try {
      addNotification({
        type: 'info',
        message: 'Sincronizando cambios recientes...'
      });

      const result = await crmService.incrementalSync(since);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Sincronización incremental completada'
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
