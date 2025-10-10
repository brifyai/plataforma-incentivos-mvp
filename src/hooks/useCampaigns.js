/**
 * useCampaigns Hook
 *
 * Hook personalizado para gestionar campañas unificadas con IA
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCompanyCampaigns,
  createUnifiedCampaign,
  updateUnifiedCampaign,
  getCorporateClients,
  getCampaignResults,
  getCampaignSecureMessages
} from '../services/databaseService';
import { campaignService } from '../services/campaignService';

export const useCampaigns = () => {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [corporateClients, setCorporateClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las campañas de la empresa
   */
  const loadCampaigns = useCallback(async () => {
    if (!user || !profile?.company?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [campaignsResult, clientsResult] = await Promise.all([
        getCompanyCampaigns(profile.company.id),
        getCorporateClients(profile.company.id)
      ]);

      if (campaignsResult.error) {
        console.warn('Error loading campaigns:', campaignsResult.error);
        setCampaigns([]);
        setError(campaignsResult.error);
      } else {
        setCampaigns(campaignsResult.campaigns || []);
      }

      if (clientsResult.error) {
        console.warn('Error loading corporate clients:', clientsResult.error);
      } else {
        setCorporateClients(clientsResult.corporateClients || []);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Error al cargar campañas');
      setCampaigns([]);
      setCorporateClients([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Cargar campañas al montar
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  /**
   * Crea una nueva campaña inteligente
   */
  const createCampaign = useCallback(async (campaignData) => {
    try {
      const result = await campaignService.createIntelligentCampaign(
        campaignData,
        profile.company.id
      );

      // Recargar campañas
      await loadCampaigns();

      return { success: true, campaign: result.campaign, segmentation: result.segmentation };
    } catch (err) {
      console.error('Error creating campaign:', err);
      return { success: false, error: err.message };
    }
  }, [profile, loadCampaigns]);

  /**
   * Actualiza una campaña
   */
  const updateCampaign = useCallback(async (campaignId, updates) => {
    try {
      const { error } = await updateUnifiedCampaign(campaignId, updates);
      if (error) throw new Error(error);

      // Recargar campañas
      await loadCampaigns();

      return { success: true };
    } catch (err) {
      console.error('Error updating campaign:', err);
      return { success: false, error: err.message };
    }
  }, [loadCampaigns]);

  /**
   * Ejecuta una campaña
   */
  const executeCampaign = useCallback(async (campaignId) => {
    try {
      const result = await campaignService.executeCampaign(campaignId);

      // Recargar campañas para actualizar estado
      await loadCampaigns();

      return { success: true, results: result };
    } catch (err) {
      console.error('Error executing campaign:', err);
      return { success: false, error: err.message };
    }
  }, [loadCampaigns]);

  /**
   * Obtiene resultados detallados de una campaña
   */
  const getCampaignAnalytics = useCallback(async (campaignId) => {
    try {
      const [resultsResult, messagesResult] = await Promise.all([
        getCampaignResults(campaignId),
        getCampaignSecureMessages(campaignId)
      ]);

      if (resultsResult.error || messagesResult.error) {
        return {
          success: false,
          error: resultsResult.error || messagesResult.error
        };
      }

      // Calcular métricas
      const results = resultsResult.results || [];
      const messages = messagesResult.messages || [];

      const metrics = {
        totalSent: messages.length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        opened: messages.filter(m => m.status === 'opened').length,
        converted: results.filter(r => r.converted_at).length,
        conversionRate: results.length > 0 ?
          (results.filter(r => r.converted_at).length / results.length) * 100 : 0,
        avgPersonalizationScore: results.length > 0 ?
          results.reduce((sum, r) => sum + (r.ai_personalization_score || 0), 0) / results.length : 0
      };

      return {
        success: true,
        results,
        messages,
        metrics
      };
    } catch (err) {
      console.error('Error getting campaign analytics:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Obtiene campañas activas
   */
  const getActiveCampaigns = useCallback(() => {
    return campaigns.filter(campaign =>
      ['scheduled', 'running'].includes(campaign.status)
    );
  }, [campaigns]);

  /**
   * Obtiene campañas completadas
   */
  const getCompletedCampaigns = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'completed');
  }, [campaigns]);

  /**
   * Obtiene estadísticas generales de campañas
   */
  const getCampaignStats = useCallback(() => {
    const total = campaigns.length;
    const active = campaigns.filter(c => ['scheduled', 'running'].includes(c.status)).length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const aiEnabled = campaigns.filter(c => c.ai_config?.enabled).length;

    const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.actualSent || 0), 0);
    const totalConverted = campaigns.reduce((sum, c) => {
      const results = c.results || [];
      return sum + results.filter(r => r.converted_at).length;
    }, 0);

    const avgConversionRate = completed > 0 ?
      campaigns
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.metrics?.conversionRate || 0), 0) / completed : 0;

    return {
      total,
      active,
      completed,
      aiEnabled,
      totalSent,
      totalConverted,
      avgConversionRate
    };
  }, [campaigns]);

  /**
   * Optimización en tiempo real de campaña
   */
  const optimizeCampaignRealtime = useCallback(async (campaignId, currentResults) => {
    try {
      const optimization = await campaignService.optimizeCampaignRealtime(
        campaignId,
        currentResults
      );

      return { success: true, optimization };
    } catch (err) {
      console.error('Error optimizing campaign:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    campaigns,
    corporateClients,
    loading,
    error,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    executeCampaign,
    getCampaignAnalytics,
    getActiveCampaigns,
    getCompletedCampaigns,
    getCampaignStats,
    optimizeCampaignRealtime,
  };
};

export default useCampaigns;