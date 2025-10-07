/**
 * Servicio de Gamificación
 * 
 * Maneja todas las operaciones relacionadas con el sistema de gamificación:
 * - Puntos y niveles
 * - Insignias y logros
 * - Tabla de clasificación
 * - Historial de puntos
 */

import { supabase } from '../../config/supabase';

/**
 * Obtiene los datos de gamificación del usuario actual
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos de gamificación
 */
export const getUserGamification = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select(`
        *,
        gamification_levels (
          level_number,
          level_name,
          points_required,
          benefits,
          color,
          icon_url
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener gamificación del usuario:', error);
    throw error;
  }
};

/**
 * Obtiene todas las insignias disponibles
 * @returns {Promise<Array>} Lista de insignias
 */
export const getAllBadges = async () => {
  try {
    const { data, error } = await supabase
      .from('gamification_badges')
      .select('*')
      .order('rarity', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener insignias:', error);
    throw error;
  }
};

/**
 * Obtiene las insignias desbloqueadas por el usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de insignias del usuario
 */
export const getUserBadges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        gamification_badges (
          badge_type,
          name,
          description,
          icon_url,
          points_reward,
          rarity,
          color
        )
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener insignias del usuario:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de puntos del usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de registros
 * @returns {Promise<Array>} Historial de puntos
 */
export const getPointsHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener historial de puntos:', error);
    throw error;
  }
};

/**
 * Obtiene todos los niveles disponibles
 * @returns {Promise<Array>} Lista de niveles
 */
export const getAllLevels = async () => {
  try {
    const { data, error } = await supabase
      .from('gamification_levels')
      .select('*')
      .order('level_number', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener niveles:', error);
    throw error;
  }
};

/**
 * Obtiene la tabla de clasificación
 * @param {string} period - Período ('all_time', 'monthly', 'weekly')
 * @param {number} limit - Límite de usuarios
 * @returns {Promise<Array>} Tabla de clasificación
 */
export const getLeaderboard = async (period = 'all_time', limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener tabla de clasificación:', error);
    throw error;
  }
};

/**
 * Obtiene la posición del usuario en la tabla de clasificación
 * @param {string} userId - ID del usuario
 * @param {string} period - Período ('all_time', 'monthly', 'weekly')
 * @returns {Promise<Object>} Posición del usuario
 */
export const getUserLeaderboardPosition = async (userId, period = 'all_time') => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .single();

    if (error) {
      // Si no está en el leaderboard, retornar null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener posición en leaderboard:', error);
    throw error;
  }
};

/**
 * Calcula el progreso hacia el siguiente nivel
 * @param {Object} gamificationData - Datos de gamificación del usuario
 * @returns {Object} Información de progreso
 */
export const calculateLevelProgress = (gamificationData) => {
  if (!gamificationData) return { percentage: 0, pointsNeeded: 0 };

  const currentPoints = gamificationData.total_points;
  const currentLevelPoints = gamificationData.gamification_levels?.points_required || 0;
  const nextLevelPoints = gamificationData.points_to_next_level || 100;

  const pointsInCurrentLevel = currentPoints - currentLevelPoints;
  const pointsNeededForNextLevel = nextLevelPoints - currentLevelPoints;
  const percentage = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    percentage: Math.min(Math.max(percentage, 0), 100),
    pointsNeeded: nextLevelPoints - currentPoints,
    currentLevelPoints,
    nextLevelPoints
  };
};

/**
 * Obtiene estadísticas resumidas de gamificación
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas
 */
export const getGamificationStats = async (userId) => {
  try {
    const [gamification, badges, pointsHistory] = await Promise.all([
      getUserGamification(userId),
      getUserBadges(userId),
      getPointsHistory(userId, 10)
    ]);

    // Calcular puntos ganados en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPoints = pointsHistory
      .filter(p => new Date(p.created_at) >= sevenDaysAgo)
      .reduce((sum, p) => sum + p.points_change, 0);

    return {
      gamification,
      badges,
      recentPointsHistory: pointsHistory,
      stats: {
        totalPoints: gamification?.total_points || 0,
        currentLevel: gamification?.current_level || 1,
        badgesUnlocked: badges?.length || 0,
        consecutivePayments: gamification?.consecutive_payments || 0,
        pointsLast7Days: recentPoints
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de gamificación:', error);
    throw error;
  }
};

/**
 * Suscribirse a cambios en tiempo real de gamificación
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Object} Suscripción
 */
export const subscribeToGamificationUpdates = (userId, callback) => {
  const subscription = supabase
    .channel(`gamification:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_gamification',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Suscribirse a nuevas insignias desbloqueadas
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función a ejecutar cuando se desbloquea una insignia
 * @returns {Object} Suscripción
 */
export const subscribeToBadgeUnlocks = (userId, callback) => {
  const subscription = supabase
    .channel(`badges:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Actualiza el cache de la tabla de clasificación
 * (Solo para uso administrativo o cron jobs)
 * @returns {Promise<void>}
 */
export const updateLeaderboardCache = async () => {
  try {
    const { error } = await supabase.rpc('update_leaderboard_cache');
    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar cache de leaderboard:', error);
    throw error;
  }
};

export default {
  getUserGamification,
  getAllBadges,
  getUserBadges,
  getPointsHistory,
  getAllLevels,
  getLeaderboard,
  getUserLeaderboardPosition,
  calculateLevelProgress,
  getGamificationStats,
  subscribeToGamificationUpdates,
  subscribeToBadgeUnlocks,
  updateLeaderboardCache
};
