/**
 * useDebts Hook
 * 
 * Hook personalizado para gestionar deudas
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserDebts, getCompanyDebts, getDebtById, updateDebt } from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const useDebts = () => {
  const { user, profile } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las deudas según el rol del usuario
   */
  const loadDebts = useCallback(async () => {
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
        result = await getUserDebts(user.id);
      } else if (role === USER_ROLES.COMPANY && profile?.company) {
        result = await getCompanyDebts(profile.company.id);
      }

      if (result?.error) {
        console.warn('Error loading debts:', result.error);
        setDebts([]);
        setError(result.error);
      } else {
        setDebts(result?.debts || []);
      }
    } catch (err) {
      console.error('Error loading debts:', err);
      setError('Error al cargar deudas');
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar deudas al montar
  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  /**
   * Obtiene una deuda específica por ID
   */
  const getDebt = useCallback(async (debtId) => {
    try {
      const { debt, error } = await getDebtById(debtId);
      if (error) throw new Error(error);
      return debt;
    } catch (err) {
      console.error('Error getting debt:', err);
      throw err;
    }
  }, []);

  /**
   * Actualiza una deuda
   */
  const updateDebtData = useCallback(async (debtId, updates) => {
    try {
      const { error } = await updateDebt(debtId, updates);
      if (error) throw new Error(error);
      
      // Recargar deudas
      await loadDebts();
      
      return { success: true };
    } catch (err) {
      console.error('Error updating debt:', err);
      return { success: false, error: err.message };
    }
  }, [loadDebts]);

  /**
   * Filtra deudas por estado
   */
  const getDebtsByStatus = useCallback((status) => {
    return debts.filter(debt => debt.status === status);
  }, [debts]);

  /**
   * Calcula el total de deudas
   */
  const getTotalDebt = useCallback(() => {
    return debts.reduce((sum, debt) => sum + parseFloat(debt.current_amount || 0), 0);
  }, [debts]);

  /**
   * Obtiene estadísticas de deudas
   */
  const getStats = useCallback(() => {
    const total = debts.length;
    const active = debts.filter(d => d.status === 'active').length;
    const inNegotiation = debts.filter(d => d.status === 'in_negotiation').length;
    const paid = debts.filter(d => d.status === 'paid').length;
    const totalAmount = getTotalDebt();

    return {
      total,
      active,
      inNegotiation,
      paid,
      totalAmount,
    };
  }, [debts, getTotalDebt]);

  return {
    debts,
    loading,
    error,
    loadDebts,
    getDebt,
    updateDebt: updateDebtData,
    getDebtsByStatus,
    getTotalDebt,
    getStats,
  };
};

export default useDebts;
