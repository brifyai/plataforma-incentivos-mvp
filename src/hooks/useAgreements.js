/**
 * useAgreements Hook
 *
 * Hook personalizado para gestionar acuerdos
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserAgreements, getCompanyAgreements, createAgreement, updateAgreement } from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const useAgreements = () => {
  const { user, profile } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga los acuerdos según el rol del usuario
   */
  const loadAgreements = useCallback(async () => {
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
        result = await getUserAgreements(user.id);
      } else if (role === USER_ROLES.COMPANY && profile?.company) {
        result = await getCompanyAgreements(profile.company.id);
      }

      if (result?.error) {
        console.warn('Error loading agreements:', result.error);
        setAgreements([]);
        setError(result.error);
      } else {
        setAgreements(result?.agreements || []);
      }
    } catch (err) {
      console.error('Error loading agreements:', err);
      setError('Error al cargar acuerdos');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar acuerdos al montar
  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  /**
   * Obtiene un acuerdo específico por ID
   */
  const getAgreement = useCallback(async (agreementId) => {
    try {
      // Por ahora, buscar en la lista local
      const agreement = agreements.find(a => a.id === agreementId);
      return agreement;
    } catch (err) {
      console.error('Error getting agreement:', err);
      throw err;
    }
  }, [agreements]);

  /**
   * Actualiza un acuerdo
   */
  const updateAgreementData = useCallback(async (agreementId, updates) => {
    try {
      const { error } = await updateAgreement(agreementId, updates);
      if (error) throw new Error(error);

      // Recargar acuerdos
      await loadAgreements();

      return { success: true };
    } catch (err) {
      console.error('Error updating agreement:', err);
      return { success: false, error: err.message };
    }
  }, [loadAgreements]);

  /**
   * Filtra acuerdos por estado
   */
  const getAgreementsByStatus = useCallback((status) => {
    return agreements.filter(agreement => agreement.status === status);
  }, [agreements]);

  /**
   * Calcula estadísticas de acuerdos
   */
  const getStats = useCallback(() => {
    const total = agreements.length;
    const active = agreements.filter(a => a.status === 'active').length;
    const completed = agreements.filter(a => a.status === 'completed').length;
    const defaulted = agreements.filter(a => a.status === 'defaulted').length;
    const totalAmount = agreements.reduce((sum, a) => sum + parseFloat(a.total_agreed_amount || 0), 0);

    return {
      total,
      active,
      completed,
      defaulted,
      totalAmount,
    };
  }, [agreements]);

  return {
    agreements,
    loading,
    error,
    loadAgreements,
    getAgreement,
    updateAgreement: updateAgreementData,
    getAgreementsByStatus,
    getStats,
  };
};

export default useAgreements;