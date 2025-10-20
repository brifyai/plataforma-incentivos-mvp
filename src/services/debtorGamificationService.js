/**
 * Debtor Gamification Service
 * 
 * Servicio completo de gamificación para motivar a los deudores
 * con logros, leaderboards, incentivos personalizados y sistema de niveles
 */

import { realTimeAnalyticsService } from './realTimeAnalyticsService';

class DebtorGamificationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
    this.listeners = new Set();
  }

  // Obtener perfil de gamificación del usuario
  async getGamificationProfile(userId) {
    const cacheKey = `gamification_profile_${userId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Simular perfil de gamificación
      const profile = {
        userId,
        level: this.calculateUserLevel(userId),
        experience: this.calculateUserExperience(userId),
        badges: await this.getUserBadges(userId),
        achievements: await this.getUserAchievements(userId),
        streak: {
          current: 7,
          longest: 15,
          lastPaymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        ranking: {
          global: 42,
          regional: 8,
          percentile: 78
        },
        nextLevel: {
          experience: 1250,
          remaining: 180,
          progress: 85
        },
        incentives: await this.getPersonalizedIncentives(userId),
        stats: {
          totalPayments: 23,
          onTimePayments: 21,
          totalAmountPaid: 750000,
          debtReduced: 450000,
          agreementsCompleted: 3,
          perfectMonths: 4
        }
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: profile,
        timestamp: Date.now()
      });

      return profile;
    } catch (error) {
      console.error('Error getting gamification profile:', error);
      throw error;
    }
  }

  // Calcular nivel del usuario
  calculateUserLevel(userId) {
    // Simular cálculo basado en experiencia
    return Math.floor(Math.random() * 15) + 1; // Niveles 1-15
  }

  // Calcular experiencia del usuario
  calculateUserExperience(userId) {
    // Simular cálculo basado en actividad
    return Math.floor(Math.random() * 2000) + 500; // 500-2500 XP
  }

  // Obtener logros del usuario
  async getUserAchievements(userId) {
    return [
      {
        id: 'first_payment',
        title: 'Primer Paso',
        description: 'Realizaste tu primer pago',
        icon: '🎯',
        category: 'payments',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        rarity: 'common',
        experience: 50
      },
      {
        id: 'early_bird',
        title: 'Madrugador',
        description: '5 pagos consecutivos antes del vencimiento',
        icon: '🌅',
        category: 'timing',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rarity: 'rare',
        experience: 150
      },
      {
        id: 'debt_destroyer',
        title: 'Destructor de Deudas',
        description: 'Reduciste tu deuda en más del 50%',
        icon: '💥',
        category: 'debt_reduction',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        rarity: 'epic',
        experience: 300
      },
      {
        id: 'perfect_month',
        title: 'Mes Perfecto',
        description: 'Todos los pagos del mes a tiempo',
        icon: '⭐',
        category: 'consistency',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rarity: 'rare',
        experience: 100
      },
      {
        id: 'negotiation_master',
        title: 'Maestro de la Negociación',
        description: 'Completaste 5 acuerdos exitosos',
        icon: '🤝',
        category: 'negotiations',
        unlocked: false,
        progress: 3,
        total: 5,
        rarity: 'legendary',
        experience: 500
      },
      {
        id: 'speed_payer',
        title: 'Pago Relámpago',
        description: 'Pago en menos de 24 horas',
        icon: '⚡',
        category: 'speed',
        unlocked: false,
        progress: 0,
        total: 1,
        rarity: 'epic',
        experience: 200
      }
    ];
  }

  // Obtener badges del usuario
  async getUserBadges(userId) {
    return [
      {
        id: 'consistent_payer',
        name: 'Pagador Consistente',
        description: 'Más del 80% de pagos a tiempo',
        icon: '💎',
        color: 'blue',
        level: 3,
        unlocked: true
      },
      {
        id: 'debt_reducer',
        name: 'Reductor Activo',
        description: 'Deuda reducida en más del 30%',
        icon: '📉',
        color: 'green',
        level: 2,
        unlocked: true
      },
      {
        id: 'early_adopter',
        name: 'Usuario Pionero',
        description: 'Uno de los primeros 100 usuarios',
        icon: '🚀',
        color: 'purple',
        level: 1,
        unlocked: true
      },
      {
        id: 'community_helper',
        name: 'Ayudador Comunitario',
        description: 'Referido 3 nuevos usuarios',
        icon: '🤝',
        color: 'orange',
        level: 2,
        unlocked: false,
        progress: 1,
        total: 3
      }
    ];
  }

  // Obtener incentivos personalizados
  async getPersonalizedIncentives(userId) {
    return [
      {
        id: 'next_payment_bonus',
        title: 'Bonificación de Próximo Pago',
        description: 'Recibe un 5% de descuento adicional en tu próximo pago',
        type: 'discount',
        value: 5,
        condition: 'Realizar próximo pago dentro de 3 días',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        personalized: true,
        priority: 'high'
      },
      {
        id: 'streak_reward',
        title: 'Recompensa de Racha',
        description: 'Lleva 7 pagos consecutivos, ¡no pierdas tu racha!',
        type: 'bonus',
        value: 1000,
        condition: 'Mantener racha de pagos',
        personalized: true,
        priority: 'medium'
      },
      {
        id: 'level_up_bonus',
        title: 'Bonificación por Subida de Nivel',
        description: 'A solo 180 XP del siguiente nivel',
        type: 'experience',
        value: 180,
        condition: 'Alcanzar nivel 8',
        personalized: true,
        priority: 'low'
      }
    ];
  }

  // Obtener leaderboard global
  async getLeaderboard(type = 'global', timeRange = 'monthly') {
    try {
      const leaderboards = {
        global: {
          title: 'Ranking Global',
          description: 'Los mejores usuarios de la plataforma',
          users: [
            { rank: 1, userId: 'user1', username: 'UsuarioEjemplo1', score: 2850, level: 12, badge: '👑' },
            { rank: 2, userId: 'user2', username: 'UsuarioEjemplo2', score: 2650, level: 11, badge: '🥈' },
            { rank: 3, userId: 'user3', username: 'UsuarioEjemplo3', score: 2450, level: 10, badge: '🥉' },
            { rank: 4, userId: 'user4', username: 'UsuarioEjemplo4', score: 2200, level: 9, badge: '⭐' },
            { rank: 5, userId: 'user5', username: 'UsuarioEjemplo5', score: 1950, level: 8, badge: '💎' },
            { rank: 42, userId: 'current', username: 'Tú', score: 1070, level: 7, badge: '🎯', isCurrentUser: true }
          ]
        },
        regional: {
          title: 'Ranking Regional',
          description: 'Los mejores de tu región',
          users: [
            { rank: 1, userId: 'user1', username: 'UsuarioRegional1', score: 2100, level: 10, badge: '🏆' },
            { rank: 2, userId: 'user2', username: 'UsuarioRegional2', score: 1900, level: 9, badge: '🥈' },
            { rank: 3, userId: 'user3', username: 'UsuarioRegional3', score: 1750, level: 8, badge: '🥉' },
            { rank: 8, userId: 'current', username: 'Tú', score: 1070, level: 7, badge: '🎯', isCurrentUser: true }
          ]
        },
        payment_consistency: {
          title: 'Consistencia de Pagos',
          description: 'Usuarios con mejor historial de pagos',
          users: [
            { rank: 1, userId: 'user1', username: 'PagadorPerfecto1', score: 98, level: 12, badge: '💯' },
            { rank: 2, userId: 'user2', username: 'PagadorPerfecto2', score: 95, level: 11, badge: '⭐' },
            { rank: 3, userId: 'user3', username: 'PagadorPerfecto3', score: 92, level: 10, badge: '🎯' },
            { rank: 15, userId: 'current', username: 'Tú', score: 87, level: 7, badge: '📈', isCurrentUser: true }
          ]
        },
        debt_reduction: {
          title: 'Reducción de Deuda',
          description: 'Mayor porcentaje de reducción de deuda',
          users: [
            { rank: 1, userId: 'user1', username: 'ReducidorPro1', score: 75, level: 11, badge: '📉' },
            { rank: 2, userId: 'user2', username: 'ReducidorPro2', score: 68, level: 10, badge: '💪' },
            { rank: 3, userId: 'user3', username: 'ReducidorPro3', score: 62, level: 9, badge: '🎯' },
            { rank: 12, userId: 'current', username: 'Tú', score: 45, level: 7, badge: '📊', isCurrentUser: true }
          ]
        }
      };

      return leaderboards[type] || leaderboards.global;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Obtener próximos logros desbloqueables
  async getUpcomingAchievements(userId) {
    const achievements = await this.getUserAchievements(userId);
    return achievements
      .filter(achievement => !achievement.unlocked)
      .sort((a, b) => {
        // Priorizar logros más cercanos a completarse
        const progressA = (a.progress || 0) / (a.total || 1);
        const progressB = (b.progress || 0) / (b.total || 1);
        return progressB - progressA;
      })
      .slice(0, 3);
  }

  // Simular desbloqueo de logro
  async unlockAchievement(userId, achievementId) {
    try {
      // Aquí se integraría con el backend para registrar el logro
      const achievement = {
        id: achievementId,
        userId,
        unlockedAt: new Date(),
        experience: Math.floor(Math.random() * 200) + 50
      };

      // Notificar a listeners
      this.notifyListeners({
        type: 'achievement_unlocked',
        data: achievement
      });

      return achievement;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  // Obtener recompensas disponibles
  async getAvailableRewards(userId) {
    return [
      {
        id: 'discount_5',
        title: '5% de Descuento',
        description: 'Descuento en tu próximo pago',
        type: 'discount',
        value: 5,
        cost: 500,
        category: 'payment',
        available: true,
        popularity: 85
      },
      {
        id: 'discount_10',
        title: '10% de Descuento',
        description: 'Descuento en tu próximo pago',
        type: 'discount',
        value: 10,
        cost: 800,
        category: 'payment',
        available: true,
        popularity: 72
      },
      {
        id: 'extension_7d',
        title: 'Extensión 7 días',
        description: 'Extiende tu fecha de pago 7 días',
        type: 'extension',
        value: 7,
        cost: 300,
        category: 'timing',
        available: true,
        popularity: 65
      },
      {
        id: 'priority_support',
        title: 'Soporte Prioritario',
        description: 'Atención preferencial durante 30 días',
        type: 'service',
        value: 30,
        cost: 600,
        category: 'service',
        available: true,
        popularity: 45
      },
      {
        id: 'exclusive_badge',
        title: 'Insignia Exclusiva',
        description: 'Badge especial para tu perfil',
        type: 'cosmetic',
        value: 1,
        cost: 400,
        category: 'cosmetic',
        available: true,
        popularity: 38
      }
    ];
  }

  // Canjear recompensa
  async redeemReward(userId, rewardId) {
    try {
      // Aquí se integraría con el backend para procesar el canje
      const redemption = {
        userId,
        rewardId,
        redeemedAt: new Date(),
        status: 'success'
      };

      // Notificar a listeners
      this.notifyListeners({
        type: 'reward_redeemed',
        data: redemption
      });

      return redemption;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Suscribir a actualizaciones en tiempo real
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      this.notifyListeners();
    }, 60000); // Cada minuto

    return () => {
      clearInterval(interval);
      this.listeners.delete(callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners(data = null) {
    const notification = data || {
      timestamp: new Date(),
      type: 'gamification_update'
    };
    
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in gamification listener:', error);
      }
    });
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }
}

// Exportar instancia singleton
export const debtorGamificationService = new DebtorGamificationService();

export default debtorGamificationService;