/**
 * Hook personalizado para analytics de empresa
 *
 * Proporciona datos de análisis y métricas calculadas desde Supabase
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCompanyAnalytics } from '../services/databaseService';

export const useCompanyAnalytics = () => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    if (!profile?.company?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getCompanyAnalytics(profile.company.id);

      if (result.error) {
        console.error('Error loading analytics:', result.error);
        setError(result.error);
        setAnalytics(null);
      } else {
        setAnalytics(result.analytics);
        setError(null);
      }
    } catch (err) {
      console.error('Error in useCompanyAnalytics:', err);
      setError('Error al cargar los datos de análisis');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = () => {
    loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
  }, [profile?.company?.id]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics
  };
};