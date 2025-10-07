/**
 * Custom hook for company statistics and dashboard data management
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCompanyDashboardStats,
  getCompanyClients,
  getCompanyAnalytics
} from '../services/databaseService';

export const useCompanyStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    const companyIdToUse = profile?.company?.id;

    if (!companyIdToUse) {
      setLoading(false);
      setAnalyticsLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAnalyticsLoading(true);
      setError(null);

      const [statsResult, clientsResult, analyticsResult] = await Promise.all([
        getCompanyDashboardStats(companyIdToUse),
        getCompanyClients(companyIdToUse),
        getCompanyAnalytics(companyIdToUse)
      ]);

      // Handle stats
      if (statsResult.error) {
        console.error('Error loading company stats:', statsResult.error);
        setStats({
          totalClients: 0,
          totalDebtors: 0,
          totalDebts: 0,
          totalDebtAmount: 0,
          totalRecovered: 0,
          recoveryRate: 0,
          activeAgreements: 0
        });
      } else if (statsResult.stats) {
        setStats(statsResult.stats);
      }

      // Handle clients
      if (clientsResult.error) {
        console.error('Error loading clients:', clientsResult.error);
        setClients([]);
      } else {
        setClients(clientsResult.clients);
      }

      // Handle analytics
      if (analyticsResult.error) {
        console.error('Error loading analytics:', analyticsResult.error);
        setAnalytics(null);
      } else {
        setAnalytics(analyticsResult.analytics);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos del dashboard');
      setStats({
        totalClients: 0,
        totalDebtors: 0,
        totalDebts: 0,
        totalDebtAmount: 0,
        totalRecovered: 0,
        recoveryRate: 0,
        activeAgreements: 0
      });
      setClients([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.company?.id) {
      loadStats();
    } else {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, [profile]);

  return {
    stats,
    clients,
    analytics,
    loading,
    analyticsLoading,
    error,
    loadStats,
    setClients
  };
};