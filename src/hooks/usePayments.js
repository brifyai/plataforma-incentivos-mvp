/**
 * usePayments Hook
 *
 * Hook personalizado para gestionar pagos
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPayments, getCompanyPayments, createPayment, updatePayment } from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const usePayments = () => {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga los pagos según el rol del usuario
   */
  const loadPayments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const role = profile?.role || user?.user_metadata?.role;

    try {
      setLoading(true);
      setError(null);

      let result;

      if (role === USER_ROLES.DEBTOR) {
        result = await getUserPayments(user.id);
      } else if (role === USER_ROLES.COMPANY && profile?.company) {
        result = await getCompanyPayments(profile.company.id);
      }

      if (result?.error) {
        console.warn('Error loading payments:', result.error);
        setPayments([]);
        setError(result.error);
      } else {
        setPayments(result?.payments || []);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar pagos al montar
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  /**
   * Obtiene un pago específico por ID
   */
  const getPayment = useCallback(async (paymentId) => {
    try {
      // Por ahora, buscar en la lista local
      const payment = payments.find(p => p.id === paymentId);
      return payment;
    } catch (err) {
      console.error('Error getting payment:', err);
      throw err;
    }
  }, [payments]);

  /**
   * Actualiza un pago
   */
  const updatePaymentData = useCallback(async (paymentId, updates) => {
    try {
      const { error } = await updatePayment(paymentId, updates);
      if (error) throw new Error(error);

      // Recargar pagos
      await loadPayments();

      return { success: true };
    } catch (err) {
      console.error('Error updating payment:', err);
      return { success: false, error: err.message };
    }
  }, [loadPayments]);

  /**
   * Filtra pagos por estado
   */
  const getPaymentsByStatus = useCallback((status) => {
    return payments.filter(payment => payment.status === status);
  }, [payments]);

  /**
   * Calcula estadísticas de pagos
   */
  const getStats = useCallback(() => {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const pendingValidation = payments.filter(p => p.status === 'pending_validation').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    const totalAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return {
      total,
      completed,
      pending,
      pendingValidation,
      failed,
      totalAmount,
    };
  }, [payments]);

  return {
    payments,
    loading,
    error,
    loadPayments,
    getPayment,
    updatePayment: updatePaymentData,
    getPaymentsByStatus,
    getStats,
  };
};

export default usePayments;