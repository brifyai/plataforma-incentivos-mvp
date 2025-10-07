/**
 * useOffers Hook
 * 
 * Hook personalizado para gestionar ofertas
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getUserOffers, 
  getCompanyOffers,
  createOffer,
  updateOffer as updateOfferService,
} from '../services/databaseService';
import { USER_ROLES } from '../config/constants';

export const useOffers = () => {
  const { user, profile } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las ofertas según el rol del usuario
   */
  const loadOffers = useCallback(async () => {
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
        result = await getUserOffers(user.id);
      } else if (role === USER_ROLES.COMPANY && profile?.company) {
        result = await getCompanyOffers(profile.company.id);
      }

      if (result?.error) {
        console.warn('Error loading offers:', result.error);
        setOffers([]);
        setError(result.error);
      } else {
        setOffers(result?.offers || []);
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Error al cargar ofertas');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar ofertas al montar
  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  /**
   * Crea una nueva oferta (solo para empresas)
   */
  const createNewOffer = useCallback(async (offerData) => {
    try {
      const { offer, error } = await createOffer(offerData);
      if (error) throw new Error(error);
      
      // Recargar ofertas
      await loadOffers();
      
      return { success: true, offer };
    } catch (err) {
      console.error('Error creating offer:', err);
      return { success: false, error: err.message };
    }
  }, [loadOffers]);

  /**
   * Actualiza una oferta
   */
  const updateOffer = useCallback(async (offerId, updates) => {
    try {
      const { error } = await updateOfferService(offerId, updates);
      if (error) throw new Error(error);
      
      // Recargar ofertas
      await loadOffers();
      
      return { success: true };
    } catch (err) {
      console.error('Error updating offer:', err);
      return { success: false, error: err.message };
    }
  }, [loadOffers]);

  /**
   * Obtiene ofertas activas
   */
  const getActiveOffers = useCallback(() => {
    return offers.filter(offer => offer.status === 'active');
  }, [offers]);

  /**
   * Obtiene ofertas para una deuda específica
   */
  const getOffersForDebt = useCallback((debtId) => {
    return offers.filter(offer => offer.debt_id === debtId);
  }, [offers]);

  /**
   * Obtiene estadísticas de ofertas
   */
  const getStats = useCallback(() => {
    const total = offers.length;
    const active = offers.filter(o => o.status === 'active').length;
    const expired = offers.filter(o => o.status === 'expired').length;
    const used = offers.filter(o => o.status === 'used').length;

    return {
      total,
      active,
      expired,
      used,
    };
  }, [offers]);

  return {
    offers,
    loading,
    error,
    loadOffers,
    createOffer: createNewOffer,
    updateOffer,
    getActiveOffers,
    getOffersForDebt,
    getStats,
  };
};

export default useOffers;
