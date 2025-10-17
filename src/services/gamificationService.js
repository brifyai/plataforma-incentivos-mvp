/**
 * Gamification Service
 * 
 * Servicio para sistema de gamificación con logros, leaderboards e incentivos
 * Motiva a usuarios y empresas mediante recompensas y reconocimiento
 */

class GamificationService {
  constructor() {
    this.achievements = new Map();
    this.leaderboards = new Map();
    this.userProgress = new Map();
    this.incentives = new Map();
    this.badges = new Map();
    this.initializeAchievements();
    this.initializeBadges();
    this.initializeIncentives();
  }

  /**
   * Inicializar logros disponibles
   */
  initializeAchievements() {
    // Logros de usuarios
    this.achievements.set('first_payment', {
      id: 'first_payment',
      name: 'Primer Paso',
      description: 'Realiza tu primer pago',
      category: 'payments',
      points: 100,
      badge: 'bronze',
      icon: '💳',
      requirements: { payments_count: 1 },
      reward: { points: 100, badge: true }
    });

    this.achievements.set('payment_streak_7', {
      id: 'payment_streak_7',
      name: 'Semana de Éxito',
      description: 'Realiza pagos durante 7 días seguidos',
      category: 'consistency',
      points: 500,
      badge: 'silver',
      icon: '🔥',
      requirements: { payment_streak_days: 7 },
      reward: { points: 500, badge: true, incentive: 'weekly_bonus' }
    });

    this.achievements.set('debt_collector', {
      id: 'debt_collector',
      name: 'Recuperador Expert',
      description: 'Recupera 10 deudas exitosamente',
      category: 'collection',
      points: 300,
      badge: 'silver',
      icon: '💰',
      requirements: { recovered_debts: 10 },
      reward: { points: 300, commission_bonus: 0.05 }
    });

    this.achievements.set('super_collector', {
      id: 'super_collector',
      name: 'Súper Recuperador',
      description: 'Recupera 50 deudas exitosamente',
      category: 'collection',
      points: 1000,
      badge: 'gold',
      icon: '🏆',
      requirements: { recovered_debts: 50 },
      reward: { points: 1000, badge: true, commission_bonus: 0.10, incentive: 'elite_status' }
    });

    // Logros de empresas
    this.achievements.set('company_verified', {
      id: 'company_verified',
      name: 'Empresa Verificada',
      description: 'Completa el proceso de verificación',
      category: 'verification',
      points: 200,
      badge: 'bronze',
      icon: '✅',
      requirements: { verification_status: 'verified' },
      reward: { points: 200, badge: true, features: ['bulk_import', 'advanced_analytics'] }
    });

    this.achievements.set('top_performer', {
      id: 'top_performer',
      name: 'Rendimiento Superior',
      description: 'Alcanza el top 10 del leaderboard mensual',
      category: 'performance',
      points: 750,
      badge: 'gold',
      icon: '⭐',
      requirements: { leaderboard_rank: 10 },
      reward: { points: 750, badge: true, visibility_boost: true }
    });

    // Logros especiales
    this.achievements.set('early_adopter', {
      id: 'early_adopter',
      name: 'Pionero',
      description: 'Únete durante los primeros 30 días',
      category: 'special',
      points: 150,
      badge: 'special',
      icon: '🚀',
      requirements: { joined_within_days: 30 },
      reward: { points: 150, badge: true, permanent_bonus: 0.02 }
    });

    this.achievements.set('perfect_month', {
      id: 'perfect_month',
      name: 'Mes Perfecto',
      description: '100% de tasa de recuperación en un mes',
      category: 'excellence',
      points: 2000,
      badge: 'platinum',
      icon: '💎',
      requirements: { monthly_recovery_rate: 1.0 },
      reward: { points: 2000, badge: true, incentive: 'platinum_status' }
    });
  }

  /**
   * Inicializar insignias disponibles
   */
  initializeBadges() {
    this.badges.set('bronze', {
      id: 'bronze',
      name: 'Bronce',
      description: 'Nivel inicial de logros',
      color: '#CD7F32',
      icon: '🥉',
      benefits: ['basic_recognition', 'profile_badge']
    });

    this.badges.set('silver', {
      id: 'silver',
      name: 'Plata',
      description: 'Nivel intermedio de logros',
      color: '#C0C0C0',
      icon: '🥈',
      benefits: ['enhanced_visibility', 'priority_support', 'profile_badge']
    });

    this.badges.set('gold', {
      id: 'gold',
      name: 'Oro',
      description: 'Nivel avanzado de logros',
      color: '#FFD700',
      icon: '🥇',
      benefits: ['premium_features', 'dedicated_support', 'featured_profile', 'profile_badge']
    });

    this.badges.set('platinum', {
      id: 'platinum',
      name: 'Platino',
      description: 'Nélite de logros',
      color: '#E5E4E2',
      icon: '🏅',
      benefits: ['all_features', 'vip_support', 'exclusive_content', 'custom_badge', 'revenue_share']
    });

    this.badges.set('special', {
      id: 'special',
      name: 'Especial',
      description: 'Logros únicos y especiales',
      color: '#9370DB',
      icon: '🌟',
      benefits: ['special_recognition', 'limited_edition_badge']
    });
  }

  /**
   * Inicializar incentivos disponibles
   */
  initializeIncentives() {
    this.incentives.set('weekly_bonus', {
      id: 'weekly_bonus',
      name: 'Bonus Semanal',
      description: 'Bonus adicional del 5% en comisiones por una semana',
      type: 'commission_bonus',
      value: 0.05,
      duration: '7d',
      category: 'financial'
    });

    this.incentives.set('elite_status', {
      id: 'elite_status',
      name: 'Status Elite',
      description: 'Acceso a funciones exclusivas y soporte prioritario',
      type: 'status',
      benefits: ['advanced_analytics', 'bulk_operations', 'priority_support'],
      duration: '30d',
      category: 'status'
    });

    this.incentives.set('platinum_status', {
      id: 'platinum_status',
      name: 'Status Platino',
      description: 'Máximo nivel de beneficios y reconocimiento',
      type: 'status',
      benefits: ['all_features', 'revenue_share', 'custom_support'],
      duration: 'permanent',
      category: 'status'
    });

    this.incentives.set('visibility_boost', {
      id: 'visibility_boost',
      name: 'Impulso de Visibilidad',
      description: 'Mayor visibilidad en búsquedas y directorios',
      type: 'visibility',
      multiplier: 2.0,
      duration: '14d',
      category: 'marketing'
    });
  }

  /**
   * Verificar y desbloquear logros para un usuario
   */
  async checkAndUnlockAchievements(userId, userMetrics) {
    const userProgress = this.getUserProgress(userId);
    const newlyUnlocked = [];

    try {
      // Iterar sobre todos los logros
      for (const [achievementId, achievement] of this.achievements) {
        // Skip si ya está desbloqueado
        if (userProgress.achievements.includes(achievementId)) {
          continue;
        }

        // Verificar requisitos
        if (this.verifyAchievementRequirements(achievement, userMetrics)) {
          // Desbloquear logro
          await this.unlockAchievement(userId, achievementId);
          newlyUnlocked.push(achievement);
        }
      }

      // Actualizar leaderboard si hay nuevos logros
      if (newlyUnlocked.length > 0) {
        await this.updateLeaderboards(userId, userMetrics);
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error verificando logros:', error);
      return [];
    }
  }

  /**
   * Verificar requisitos de un logro
   */
  verifyAchievementRequirements(achievement, userMetrics) {
    const requirements = achievement.requirements;

    for (const [key, value] of Object.entries(requirements)) {
      switch (key) {
        case 'payments_count':
          if ((userMetrics.payments_count || 0) < value) return false;
          break;
        case 'payment_streak_days':
          if ((userMetrics.payment_streak_days || 0) < value) return false;
          break;
        case 'recovered_debts':
          if ((userMetrics.recovered_debts || 0) < value) return false;
          break;
        case 'verification_status':
          if (userMetrics.verification_status !== value) return false;
          break;
        case 'leaderboard_rank':
          if ((userMetrics.leaderboard_rank || Infinity) > value) return false;
          break;
        case 'joined_within_days':
          const joinDate = new Date(userMetrics.created_at);
          const daysSinceJoin = (Date.now() - joinDate) / (1000 * 60 * 60 * 24);
          if (daysSinceJoin > value) return false;
          break;
        case 'monthly_recovery_rate':
          if ((userMetrics.monthly_recovery_rate || 0) < value) return false;
          break;
        default:
          console.warn(`Requisito desconocido: ${key}`);
      }
    }

    return true;
  }

  /**
   * Desbloquear logro para un usuario
   */
  async unlockAchievement(userId, achievementId) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error(`Logro no encontrado: ${achievementId}`);
    }

    const userProgress = this.getUserProgress(userId);
    
    // Agregar logro a la lista del usuario
    userProgress.achievements.push(achievementId);
    
    // Agregar puntos
    userProgress.total_points += achievement.reward.points || 0;
    
    // Agregar insignia si aplica
    if (achievement.reward.badge) {
      userProgress.badges.push(achievement.badge);
    }
    
    // Aplicar incentivos
    if (achievement.reward.incentive) {
      await this.applyIncentive(userId, achievement.reward.incentive);
    }

    // Aplicar bonus de comisión
    if (achievement.reward.commission_bonus) {
      userProgress.commission_bonus += achievement.reward.commission_bonus;
    }

    // Guardar progreso
    this.saveUserProgress(userId, userProgress);

    console.log(`🏆 Logro desbloqueado para usuario ${userId}: ${achievement.name}`);
    
    return {
      achievement,
      userProgress,
      notification: this.generateAchievementNotification(achievement)
    };
  }

  /**
   * Actualizar leaderboards
   */
  async updateLeaderboards(userId, userMetrics) {
    const userProgress = this.getUserProgress(userId);
    
    // Actualizar leaderboard global
    await this.updateLeaderboard('global', userId, {
      score: userProgress.total_points,
      achievements: userProgress.achievements.length,
      badge: this.getHighestBadge(userProgress.badges),
      last_updated: new Date()
    });

    // Actualizar leaderboard mensual
    await this.updateLeaderboard('monthly', userId, {
      score: userProgress.monthly_points || 0,
      achievements: userProgress.monthly_achievements || 0,
      recovery_rate: userMetrics.monthly_recovery_rate || 0,
      last_updated: new Date()
    });

    // Actualizar leaderboard por categoría
    const categories = ['payments', 'collection', 'verification'];
    for (const category of categories) {
      const categoryScore = this.calculateCategoryScore(userId, category);
      await this.updateLeaderboard(category, userId, {
        score: categoryScore,
        last_updated: new Date()
      });
    }
  }

  /**
   * Actualizar leaderboard específico
   */
  async updateLeaderboard(leaderboardType, userId, scoreData) {
    if (!this.leaderboards.has(leaderboardType)) {
      this.leaderboards.set(leaderboardType, new Map());
    }

    const leaderboard = this.leaderboards.get(leaderboardType);
    leaderboard.set(userId, {
      ...scoreData,
      user_id: userId
    });

    // Ordenar leaderboard
    const sortedLeaderboard = Array.from(leaderboard.entries())
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 100); // Top 100

    // Actualizar rankings
    sortedLeaderboard.forEach(([userId, data], index) => {
      data.rank = index + 1;
    });

    // Guardar leaderboard ordenado
    this.leaderboards.set(leaderboardType, new Map(sortedLeaderboard));
  }

  /**
   * Obtener leaderboard
   */
  getLeaderboard(leaderboardType, limit = 10) {
    const leaderboard = this.leaderboards.get(leaderboardType);
    if (!leaderboard) {
      return [];
    }

    return Array.from(leaderboard.values())
      .slice(0, limit)
      .map(entry => ({
        ...entry,
        rank_display: this.formatRank(entry.rank)
      }));
  }

  /**
   * Obtener progreso de usuario
   */
  getUserProgress(userId) {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        user_id: userId,
        total_points: 0,
        monthly_points: 0,
        achievements: [],
        monthly_achievements: 0,
        badges: [],
        commission_bonus: 0,
        current_streak: 0,
        longest_streak: 0,
        level: 1,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    }
    return this.userProgress.get(userId);
  }

  /**
   * Guardar progreso de usuario
   */
  async saveUserProgress(userId, progress) {
    progress.last_updated = new Date().toISOString();
    progress.level = this.calculateUserLevel(progress.total_points);
    
    this.userProgress.set(userId, progress);
    
    // Aquí se guardaría en la base de datos
    console.log(`💾 Progreso guardado para usuario ${userId}`);
  }

  /**
   * Calcular nivel de usuario
   */
  calculateUserLevel(totalPoints) {
    if (totalPoints >= 5000) return 10;
    if (totalPoints >= 4000) return 9;
    if (totalPoints >= 3000) return 8;
    if (totalPoints >= 2500) return 7;
    if (totalPoints >= 2000) return 6;
    if (totalPoints >= 1500) return 5;
    if (totalPoints >= 1000) return 4;
    if (totalPoints >= 500) return 3;
    if (totalPoints >= 250) return 2;
    return 1;
  }

  /**
   * Aplicar incentivo a usuario
   */
  async applyIncentive(userId, incentiveId) {
    const incentive = this.incentives.get(incentiveId);
    if (!incentive) {
      throw new Error(`Incentivo no encontrado: ${incentiveId}`);
    }

    const userProgress = this.getUserProgress(userId);
    
    if (!userProgress.active_incentives) {
      userProgress.active_incentives = [];
    }

    userProgress.active_incentives.push({
      incentive_id: incentiveId,
      applied_at: new Date().toISOString(),
      expires_at: this.calculateExpiryDate(incentive.duration),
      ...incentive
    });

    await this.saveUserProgress(userId, userProgress);
    
    console.log(`🎁 Incentivo aplicado a usuario ${userId}: ${incentive.name}`);
  }

  /**
   * Calcular fecha de expiración
   */
  calculateExpiryDate(duration) {
    const now = new Date();
    
    if (duration === 'permanent') {
      return null;
    }
    
    const match = duration.match(/(\d+)([hdwmy])/);
    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }
    
    const [, amount, unit] = match;
    const multiplier = {
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      m: 30 * 24 * 60 * 60 * 1000,
      y: 365 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now.getTime() + parseInt(amount) * multiplier[unit]);
  }

  /**
   * Generar notificación de logro
   */
  generateAchievementNotification(achievement) {
    return {
      type: 'achievement_unlocked',
      title: '🎉 ¡Nuevo Logro Desbloqueado!',
      message: achievement.name,
      description: achievement.description,
      points: achievement.reward.points,
      badge: achievement.badge,
      icon: achievement.icon,
      color: this.getBadgeColor(achievement.badge)
    };
  }

  /**
   * Obtener color de insignia
   */
  getBadgeColor(badgeId) {
    const badge = this.badges.get(badgeId);
    return badge ? badge.color : '#808080';
  }

  /**
   * Obtener insignia más alta
   */
  getHighestBadge(badges) {
    const badgeHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'special'];
    
    for (const badge of badgeHierarchy.reverse()) {
      if (badges.includes(badge)) {
        return badge;
      }
    }
    
    return null;
  }

  /**
   * Calcular puntaje por categoría
   */
  calculateCategoryScore(userId, category) {
    const userProgress = this.getUserProgress(userId);
    const categoryAchievements = Array.from(this.achievements.values())
      .filter(a => a.category === category);
    
    let score = 0;
    categoryAchievements.forEach(achievement => {
      if (userProgress.achievements.includes(achievement.id)) {
        score += achievement.points;
      }
    });
    
    return score;
  }

  /**
   * Formatear ranking para display
   */
  formatRank(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return `Top ${rank}`;
    return `#${rank}`;
  }

  /**
   * Obtener logros disponibles por categoría
   */
  getAchievementsByCategory(category) {
    return Array.from(this.achievements.values())
      .filter(a => a.category === category);
  }

  /**
   * Obtener próximos logros para un usuario
   */
  getNextAchievements(userId, limit = 3) {
    const userProgress = this.getUserProgress(userId);
    const availableAchievements = Array.from(this.achievements.values())
      .filter(a => !userProgress.achievements.includes(a.id));
    
    // Calcular progreso para cada logro disponible
    const achievementsWithProgress = availableAchievements.map(achievement => {
      const progress = this.calculateAchievementProgress(userId, achievement);
      return { ...achievement, progress };
    });
    
    // Ordenar por progreso y retornar los más cercanos
    return achievementsWithProgress
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);
  }

  /**
   * Calcular progreso de logro para usuario
   */
  calculateAchievementProgress(userId, achievement) {
    // Implementación simplificada
    // En producción, se calcularía basado en métricas reales del usuario
    return Math.random() * 0.8; // Simulación de progreso
  }

  /**
   * Obtener estadísticas de gamificación
   */
  getGamificationStats() {
    const totalUsers = this.userProgress.size;
    const totalAchievements = this.achievements.size;
    const totalBadges = this.badges.size;
    
    let totalUnlocked = 0;
    let totalPoints = 0;
    const badgeDistribution = {};
    
    this.userProgress.forEach(progress => {
      totalUnlocked += progress.achievements.length;
      totalPoints += progress.total_points;
      
      progress.badges.forEach(badge => {
        badgeDistribution[badge] = (badgeDistribution[badge] || 0) + 1;
      });
    });
    
    return {
      total_users: totalUsers,
      total_achievements: totalAchievements,
      total_badges: totalBadges,
      total_unlocked: totalUnlocked,
      total_points: totalPoints,
      average_points_per_user: totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
      badge_distribution: badgeDistribution,
      engagement_rate: totalUsers > 0 ? (totalUnlocked / (totalUsers * totalAchievements)) * 100 : 0
    };
  }

  /**
   * Limpiar incentivos expirados
   */
  async cleanupExpiredIncentives() {
    const now = new Date();
    let cleanedCount = 0;
    
    this.userProgress.forEach((progress, userId) => {
      if (progress.active_incentives) {
        const validIncentives = progress.active_incentives.filter(incentive => {
          if (!incentive.expires_at) return true;
          return new Date(incentive.expires_at) > now;
        });
        
        if (validIncentives.length !== progress.active_incentives.length) {
          progress.active_incentives = validIncentives;
          this.saveUserProgress(userId, progress);
          cleanedCount++;
        }
      }
    });
    
    console.log(`🧹 Limpieza completada: ${cleanedCount} incentivos expirados removidos`);
    return cleanedCount;
  }
}

// Exportar el servicio
export const gamificationService = new GamificationService();
export default gamificationService;