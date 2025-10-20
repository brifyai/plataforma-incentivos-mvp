/**
 * useProposals Hook
 *
 * Hook personalizado para gestionar propuestas de pago
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCompanyProposals,
  createProposal,
  updateProposal as updateProposalService,
} from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const useProposals = () => {
  const { user, profile } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las propuestas según el rol del usuario
   */
  const loadProposals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const role = profile?.role || user?.user_metadata?.role;

    try {
      setLoading(true);
      setError(null);

      let result;

      if (role === USER_ROLES.COMPANY && profile?.company) {
        result = await getCompanyProposals(profile.company.id);
      } else {
        // Para otros roles, devolver array vacío por ahora
        result = { proposals: [], error: null };
      }

      if (result?.error) {
        console.warn('Error loading proposals:', result.error);
        setProposals([]);
        setError(result.error);
      } else {
        setProposals(result?.proposals || []);
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
      setError('Error al cargar propuestas');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar propuestas al montar
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  /**
   * Crea una nueva propuesta (desde el lado del deudor)
   */
  const createNewProposal = useCallback(async (proposalData) => {
    try {
      const { proposal, error } = await createProposal(proposalData);
      if (error) throw new Error(error);

      // Recargar propuestas
      await loadProposals();

      return { success: true, proposal };
    } catch (err) {
      console.error('Error creating proposal:', err);
      return { success: false, error: err.message };
    }
  }, [loadProposals]);

  /**
   * Actualiza una propuesta (respuesta de la empresa)
   */
  const updateProposalResponse = useCallback(async (proposalId, updates) => {
    try {
      const { success, error } = await updateProposalService(proposalId, updates);
      if (!success) throw new Error(error);

      // Recargar propuestas
      await loadProposals();

      return { success: true };
    } catch (err) {
      console.error('Error updating proposal:', err);
      return { success: false, error: err.message };
    }
  }, [loadProposals]);

  /**
   * Obtiene propuestas activas (pendientes de respuesta)
   */
  const getActiveProposals = useCallback(() => {
    return proposals.filter(proposal => proposal.status === 'pending');
  }, [proposals]);

  /**
   * Obtiene propuestas respondidas
   */
  const getRespondedProposals = useCallback(() => {
    return proposals.filter(proposal => proposal.status === 'responded');
  }, [proposals]);

  /**
   * Obtiene propuestas aceptadas
   */
  const getAcceptedProposals = useCallback(() => {
    return proposals.filter(proposal => proposal.status === 'accepted');
  }, [proposals]);

  /**
   * Obtiene propuestas para una deuda específica
   */
  const getProposalsForDebt = useCallback((debtId) => {
    return proposals.filter(proposal => proposal.debtReference === debtId);
  }, [proposals]);

  /**
   * Obtiene estadísticas de propuestas
   */
  const getStats = useCallback(() => {
    const total = proposals.length;
    const pending = proposals.filter(p => p.status === 'pending').length;
    const responded = proposals.filter(p => p.status === 'responded').length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const rejected = proposals.filter(p => p.status === 'rejected').length;

    return {
      total,
      pending,
      responded,
      accepted,
      rejected,
    };
  }, [proposals]);

  return {
    proposals,
    loading,
    error,
    loadProposals,
    createProposal: createNewProposal,
    updateProposal: updateProposalResponse,
    getActiveProposals,
    getRespondedProposals,
    getAcceptedProposals,
    getProposalsForDebt,
    getStats,
  };
};

export default useProposals;