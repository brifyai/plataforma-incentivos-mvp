/**
 * Gamification Card Component
 * 
 * Componente para mostrar sistema de gamificación con logros y leaderboards
 * Integración con el servicio de gamificación
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Progress } from '../common';
import { gamificationService } from '../../services/gamificationService';
import {
  Trophy,
  Medal,
  Star,
  Target,
  TrendingUp,
  Award,
  Users,
  Crown,
  Zap,
  Gift,
  RefreshCw,
  ChevronRight,
  Calendar,
  CreditCard
} from 'lucide-react';

const GamificationCard = ({ currentUserId, currentUserMetrics }) => {
  const [userProgress, setUserProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [nextAchievements, setNextAchievements] = useState([]);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('global');
  const [showAchievements, setShowAchievements] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadGamificationData();
  }, [currentUserId]);

  // Configurar actualización periódica
  useEffect(() => {
    const interval = setInterval(() => {
      loadGamificationData();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [currentUserId]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);

      // Obtener progreso del usuario
      if (currentUserId) {
        const progress = gamificationService.getUserProgress(currentUserId);
        setUserProgress(progress);

        // Verificar nuevos logros
        const newAchievements = await gamificationService.checkAndUnlockAchievements(
          currentUserId, 
          currentUserMetrics || {}
        );
        
        if (newAchievements.length > 0) {
          // Mostrar notificaciones de nuevos logros
          newAchievements.forEach(achievement => {
            showAchievementNotification(achievement);
          });
        }

        // Obtener próximos logros
        const next = gamificationService.getNextAchievements(currentUserId, 3);
        setNextAchievements(next);
      }

      // Obtener leaderboard
      const leaderboardData = gamificationService.getLeaderboard(selectedLeaderboard, 10);
      setLeaderboard(leaderboardData);

      // Obtener estadísticas de gamificación
      const stats = gamificationService.getGamificationStats();
      setGamificationStats(stats);

    } catch (error) {
      console.error('Error cargando datos de gamificación:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAchievementNotification = (achievement) => {
    // Aquí se integraría con un sistema de notificaciones
    console.log('🎉 Nuevo logro:', achievement.name);
  };

  const getLevelColor = (level) => {
    if (level >= 8) return 'text-purple-600';
    if (level >= 6) return 'text-orange-600';
    if (level >= 4) return 'text-blue-600';
    if (level >= 2) return 'text-green-600';
    return 'text-gray-600';
  };

  const getLevelIcon = (level) => {
    if (level >= 8) return Crown;
    if (level >= 6) return Star;
    if (level >= 4) return Award;
    if (level >= 2) return Medal;
    return Trophy;
  };

  const getLeaderboardIcon = (type) => {
    switch (type) {
      case 'global': return Trophy;
      case 'monthly': return Calendar;
      case 'payments': return CreditCard;
      case 'collection': return TrendingUp;
      default: return Trophy;
    }
  };

  const formatPoints = (points) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return points.toString();
  };

  const getProgressPercentage = (achievement) => {
    return Math.round((achievement.progress || 0) * 100);
  };

  if (loading && !userProgress) {
    return (
      <Card className="animate-pulse">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">🎮 Gamificación</h3>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">🎮 Gamificación</h3>
              <p className="text-sm text-secondary-600">Logros, rankings y recompensas</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadGamificationData}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualizar
          </Button>
        </div>

        {/* User Progress */}
        {userProgress && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-lg ${getLevelColor(userProgress.level)}`}>
                  {React.createElement(getLevelIcon(userProgress.level), { className: "w-5 h-5" })}
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900">Nivel {userProgress.level}</h4>
                  <p className="text-sm text-secondary-600">{formatPoints(userProgress.total_points)} puntos</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-secondary-900">
                  {userProgress.achievements.length} logros
                </div>
                <div className="text-xs text-secondary-600">
                  {userProgress.badges.length} insignias
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-secondary-600 mb-1">
                <span>Progreso al siguiente nivel</span>
                <span>{Math.round((userProgress.total_points % 1000) / 10)}%</span>
              </div>
              <Progress
                value={(userProgress.total_points % 1000) / 10}
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* Next Achievements */}
        {nextAchievements.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-secondary-900">🎯 Próximos Logros</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAchievements(!showAchievements)}
                className="text-xs"
              >
                {showAchievements ? 'Ocultar' : 'Ver todos'}
              </Button>
            </div>
            <div className="space-y-2">
              {nextAchievements.map((achievement, index) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm font-medium text-secondary-900">{achievement.name}</h5>
                      <span className="text-xs text-secondary-600">+{achievement.points} pts</span>
                    </div>
                    <p className="text-xs text-secondary-600 mb-2">{achievement.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                        style={{ width: `${getProgressPercentage(achievement)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-secondary-900">🏆 Leaderboard</h4>
            <select
              value={selectedLeaderboard}
              onChange={(e) => {
                setSelectedLeaderboard(e.target.value);
                loadGamificationData();
              }}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="global">Global</option>
              <option value="monthly">Mensual</option>
              <option value="payments">Pagos</option>
              <option value="collection">Recuperación</option>
            </select>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Sin participantes aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.user_id === currentUserId;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentUser ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-secondary-900 w-6">
                        {entry.rank_display}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-secondary-900">
                            {isCurrentUser ? 'Tú' : `Usuario ${entry.user_id.slice(-4)}`}
                          </span>
                          {entry.badge && (
                            <Badge variant="secondary" size="sm">
                              {entry.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-secondary-600">
                          {entry.achievements || 0} logros
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-secondary-900">
                        {formatPoints(entry.score)}
                      </div>
                      <div className="text-xs text-secondary-600">puntos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gamification Stats */}
        {gamificationStats && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-secondary-900 mb-3">📊 Estadísticas del Sistema</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {gamificationStats.total_users}
                </div>
                <div className="text-xs text-gray-600">Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {gamificationStats.total_unlocked}
                </div>
                <div className="text-xs text-gray-600">Logros</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(gamificationStats.engagement_rate)}%
                </div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {formatPoints(gamificationStats.average_points_per_user)}
                </div>
                <div className="text-xs text-gray-600">Pts. promedio</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAchievements(!showAchievements)}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            Ver Logros
          </Button>
          <Button
            variant="gradient"
            size="sm"
            className="flex-1"
            leftIcon={<Gift className="w-4 h-4" />}
          >
            Recompensas
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GamificationCard;