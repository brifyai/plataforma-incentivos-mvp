/**
 * Hook personalizado para gestionar gamificación
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import gamificationService from '../../services/gamification/gamificationService';

export const useGamification = () => {
  const { user } = useAuth();
  const [gamification, setGamification] = useState(null);
  const [badges, setBadges] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos de gamificación
  const loadGamificationData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Handle god mode user (mock user not in database)
      if (user.id === 'god-mode-user') {
        const mockGamification = {
          user_id: 'god-mode-user',
          total_points: 0,
          current_level: 1,
          points_to_next_level: 100,
          consecutive_payments: 0,
          gamification_levels: {
            level_number: 1,
            level_name: 'Principiante',
            points_required: 0,
            benefits: 'Acceso básico al sistema',
            color: '#6B7280',
            icon_url: null
          }
        };
        setGamification(mockGamification);
        setBadges([]);
        setPointsHistory([]);
        setLoading(false);
        return;
      }

      const [gamificationData, badgesData, historyData] = await Promise.all([
        gamificationService.getUserGamification(user.id),
        gamificationService.getUserBadges(user.id),
        gamificationService.getPointsHistory(user.id, 20)
      ]);

      setGamification(gamificationData);
      setBadges(badgesData);
      setPointsHistory(historyData);
    } catch (err) {
      console.error('Error al cargar gamificación:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  // Suscribirse a actualizaciones en tiempo real
  useEffect(() => {
    if (!user?.id || user.id === 'god-mode-user') return;

    const subscription = gamificationService.subscribeToGamificationUpdates(
      user.id,
      () => {
        loadGamificationData();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadGamificationData]);

  // Calcular progreso al siguiente nivel
  const levelProgress = gamification 
    ? gamificationService.calculateLevelProgress(gamification)
    : { percentage: 0, pointsNeeded: 0 };

  return {
    gamification,
    badges,
    pointsHistory,
    levelProgress,
    loading,
    error,
    refresh: loadGamificationData
  };
};

export default useGamification;
