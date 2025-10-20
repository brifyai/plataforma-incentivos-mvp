/**
 * Custom Hook for Debtor Gamification
 * 
 * Hook personalizado para manejar el sistema de gamificación
 * con logros, leaderboards, incentivos y niveles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debtorGamificationService } from '../services/debtorGamificationService';

export const useDebtorGamification = (userId, options = {}) => {
  const {
    enableRealTime = true,
    autoRefresh = true,
    refreshInterval = 60000 // 1 minuto
  } = options;

  // Estados para diferentes tipos de datos
  const [gamificationProfile, setGamificationProfile] = useState(null);
  const [leaderboards, setLeaderboards] = useState({});
  const [upcomingAchievements, setUpcomingAchievements] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('global');
  
  // Estados de carga y error
  const [loading, setLoading] = useState({
    profile: false,
    leaderboards: false,
    achievements: false,
    rewards: false
  });
  
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Referencias para manejo de suscripciones
  const subscriptionRef = useRef(null);
  const intervalRef = useRef(null);

  // Cargar perfil de gamificación
  const loadGamificationProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, profile: true }));
    setError(null);
    
    try {
      const data = await debtorGamificationService.getGamificationProfile(userId);
      setGamificationProfile(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading gamification profile:', err);
      setError(err.message || 'Error loading gamification profile');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [userId]);

  // Cargar leaderboards
  const loadLeaderboards = useCallback(async (type = 'global') => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, leaderboards: true }));
    
    try {
      const data = await debtorGamificationService.getLeaderboard(type);
      setLeaderboards(prev => ({
        ...prev,
        [type]: data
      }));
    } catch (err) {
      console.error('Error loading leaderboards:', err);
      setError(err.message || 'Error loading leaderboards');
    } finally {
      setLoading(prev => ({ ...prev, leaderboards: false }));
    }
  }, [userId]);

  // Cargar próximos logros
  const loadUpcomingAchievements = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, achievements: true }));
    
    try {
      const data = await debtorGamificationService.getUpcomingAchievements(userId);
      setUpcomingAchievements(data);
    } catch (err) {
      console.error('Error loading upcoming achievements:', err);
      setError(err.message || 'Error loading achievements');
    } finally {
      setLoading(prev => ({ ...prev, achievements: false }));
    }
  }, [userId]);

  // Cargar recompensas disponibles
  const loadAvailableRewards = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, rewards: true }));
    
    try {
      const data = await debtorGamificationService.getAvailableRewards(userId);
      setAvailableRewards(data);
    } catch (err) {
      console.error('Error loading available rewards:', err);
      setError(err.message || 'Error loading rewards');
    } finally {
      setLoading(prev => ({ ...prev, rewards: false }));
    }
  }, [userId]);

  // Cargar todos los datos
  const loadAllData = useCallback(async () => {
    if (!userId) return;
    
    setLoading({
      profile: true,
      leaderboards: true,
      achievements: true,
      rewards: true
    });
    
    try {
      await Promise.all([
        loadGamificationProfile(),
        loadLeaderboards(selectedLeaderboard),
        loadUpcomingAchievements(),
        loadAvailableRewards()
      ]);
    } catch (err) {
      console.error('Error loading all gamification data:', err);
      setError(err.message || 'Error loading gamification data');
    } finally {
      setLoading({
        profile: false,
        leaderboards: false,
        achievements: false,
        rewards: false
      });
    }
  }, [userId, selectedLeaderboard, loadGamificationProfile, loadLeaderboards, loadUpcomingAchievements, loadAvailableRewards]);

  // Desbloquear logro
  const unlockAchievement = useCallback(async (achievementId) => {
    if (!userId) return;
    
    try {
      const result = await debtorGamificationService.unlockAchievement(userId, achievementId);
      
      // Recargar datos después de desbloquear
      await loadGamificationProfile();
      await loadUpcomingAchievements();
      
      return result;
    } catch (err) {
      console.error('Error unlocking achievement:', err);
      setError(err.message || 'Error unlocking achievement');
      throw err;
    }
  }, [userId, loadGamificationProfile, loadUpcomingAchievements]);

  // Canjear recompensa
  const redeemReward = useCallback(async (rewardId) => {
    if (!userId) return;
    
    try {
      const result = await debtorGamificationService.redeemReward(userId, rewardId);
      
      // Recargar perfil después de canjear
      await loadGamificationProfile();
      
      return result;
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError(err.message || 'Error redeeming reward');
      throw err;
    }
  }, [userId, loadGamificationProfile]);

  // Cambiar leaderboard
  const changeLeaderboard = useCallback(async (type) => {
    setSelectedLeaderboard(type);
    await loadLeaderboards(type);
  }, [loadLeaderboards]);

  // Configurar suscripción a actualizaciones en tiempo real
  useEffect(() => {
    if (!enableRealTime || !userId) return;

    const handleRealTimeUpdate = (data) => {
      console.log('Real-time gamification update:', data);
      
      // Actualizar timestamp
      setLastUpdated(new Date());
      
      // Recargar datos según el tipo de actualización
      if (data.type === 'achievement_unlocked') {
        loadGamificationProfile();
        loadUpcomingAchievements();
      } else if (data.type === 'reward_redeemed') {
        loadGamificationProfile();
      } else {
        // Actualización general
        loadGamificationProfile();
      }
    };

    subscriptionRef.current = debtorGamificationService.subscribe(handleRealTimeUpdate);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [enableRealTime, userId, loadGamificationProfile, loadUpcomingAchievements]);

  // Configurar auto-refresco
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    intervalRef.current = setInterval(() => {
      loadGamificationProfile();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, userId, refreshInterval, loadGamificationProfile]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, loadAllData]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calcular métricas derivadas
  const derivedMetrics = {
    levelProgress: gamificationProfile ? 
      (gamificationProfile.experience / gamificationProfile.nextLevel.experience) * 100 : 0,
    achievementProgress: gamificationProfile ? 
      (gamificationProfile.achievements.filter(a => a.unlocked).length / gamificationProfile.achievements.length) * 100 : 0,
    badgeProgress: gamificationProfile ? 
      (gamificationProfile.badges.filter(b => b.unlocked).length / gamificationProfile.badges.length) * 100 : 0,
    streakColor: gamificationProfile?.streak?.current >= 7 ? 'green' :
                 gamificationProfile?.streak?.current >= 3 ? 'yellow' : 'red',
    rankingPercentile: gamificationProfile?.ranking?.percentile || 0
  };

  return {
    // Datos
    gamificationProfile,
    leaderboards,
    upcomingAchievements,
    availableRewards,
    selectedLeaderboard,
    
    // Estados
    loading,
    error,
    lastUpdated,
    
    // Métricas derivadas
    derivedMetrics,
    
    // Métodos
    loadGamificationProfile,
    loadLeaderboards,
    loadUpcomingAchievements,
    loadAvailableRewards,
    loadAllData,
    unlockAchievement,
    redeemReward,
    changeLeaderboard,
    
    // Utilidades
    isLoading: Object.values(loading).some(Boolean),
    hasError: !!error,
    isDataLoaded: !!(gamificationProfile && leaderboards[selectedLeaderboard])
  };
};

export default useDebtorGamification;