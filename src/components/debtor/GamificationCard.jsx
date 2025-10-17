/**
 * Gamification Card Component
 * 
 * Componente principal de gamificación que integra logros, niveles,
 * leaderboards, incentivos y recompensas
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Target, 
  Award,
  TrendingUp,
  Gift,
  Crown,
  Medal,
  Zap,
  Flame,
  Users,
  ChevronRight,
  Lock,
  Unlock,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

const GamificationCard = ({ 
  gamificationProfile, 
  loading = false,
  onRefresh,
  onAchievementUnlock,
  onRewardRedeem
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!gamificationProfile) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay datos de gamificación disponibles</p>
        </div>
      </div>
    );
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getLevelColor = (level) => {
    if (level >= 12) return 'text-purple-600';
    if (level >= 8) return 'text-blue-600';
    if (level >= 4) return 'text-green-600';
    return 'text-gray-600';
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: Trophy },
    { id: 'achievements', label: 'Logros', icon: Award },
    { id: 'leaderboards', label: 'Rankings', icon: Users },
    { id: 'rewards', label: 'Recompensas', icon: Gift }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Gamificación
            </h3>
            <p className="text-purple-100 text-sm">
              Sube de nivel, gana logros y recompensas
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            disabled={loading}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mx-auto mb-1" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Level and Experience */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-md">
                    <Crown className={`h-6 w-6 ${getLevelColor(gamificationProfile.level)}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Nivel {gamificationProfile.level}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {gamificationProfile.experience} XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    #{gamificationProfile.ranking.global}
                  </div>
                  <div className="text-sm text-gray-600">Ranking Global</div>
                </div>
              </div>
              
              {/* Experience Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progreso</span>
                  <span className="text-purple-600 font-medium">
                    {gamificationProfile.nextLevel.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${gamificationProfile.nextLevel.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {gamificationProfile.nextLevel.remaining} XP para el siguiente nivel
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Racha Actual</h5>
                    <p className="text-sm text-gray-600">
                      {gamificationProfile.streak.current} pagos consecutivos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">
                    {gamificationProfile.streak.longest}
                  </div>
                  <div className="text-sm text-gray-600">Racha más larga</div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Mis Insignias</h5>
              <div className="grid grid-cols-4 gap-3">
                {gamificationProfile.badges.map((badge, index) => (
                  <div
                    key={badge.id}
                    className={`text-center p-3 rounded-lg border-2 ${
                      badge.unlocked 
                        ? 'border-gray-200 bg-white' 
                        : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                    title={badge.description}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-medium text-gray-700 truncate">
                      {badge.name}
                    </div>
                    {badge.unlocked && (
                      <div className="text-xs text-green-600">Nivel {badge.level}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Incentives */}
            {gamificationProfile.incentives && gamificationProfile.incentives.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Incentivos Personalizados
                </h5>
                <div className="space-y-2">
                  {gamificationProfile.incentives.slice(0, 2).map((incentive) => (
                    <div
                      key={incentive.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h6 className="font-medium text-gray-900 text-sm">
                            {incentive.title}
                          </h6>
                          <p className="text-xs text-gray-600">
                            {incentive.description}
                          </p>
                        </div>
                        {incentive.priority === 'high' && (
                          <Zap className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900">Logros Desbloqueados</h5>
            <div className="grid gap-3">
              {gamificationProfile.achievements
                .filter(achievement => achievement.unlocked)
                .map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 ${getRarityColor(achievement.rarity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h6 className="font-semibold">{achievement.title}</h6>
                        <p className="text-sm opacity-80">{achievement.description}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {achievement.experience} XP • {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Unlock className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>

            <h5 className="font-semibold text-gray-900 mt-6">Próximos Logros</h5>
            <div className="grid gap-3">
              {gamificationProfile.achievements
                .filter(achievement => !achievement.unlocked)
                .map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 ${getRarityColor(achievement.rarity)} opacity-75`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl grayscale">{achievement.icon}</div>
                      <div>
                        <h6 className="font-semibold">{achievement.title}</h6>
                        <p className="text-sm opacity-80">{achievement.description}</p>
                        {achievement.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-full bg-current rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${(achievement.progress / achievement.total) * 100}%`,
                                  opacity: 0.6
                                }}
                              ></div>
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {achievement.progress}/{achievement.total}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboards Tab */}
        {activeTab === 'leaderboards' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['global', 'regional', 'payment_consistency', 'debt_reduction'].map((type) => (
                <button
                  key={type}
                  onClick={() => {/* Cambiar leaderboard */}}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    type === 'global'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'global' ? 'Global' : 
                   type === 'regional' ? 'Regional' :
                   type === 'payment_consistency' ? 'Consistencia' : 'Reducción'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {/* Mock leaderboard data */}
              {[1, 2, 3, 4, 5].map((rank) => (
                <div
                  key={rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank === 1 ? 'bg-yellow-500 text-white' :
                      rank === 2 ? 'bg-gray-400 text-white' :
                      rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {rank}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Usuario{rank}
                      </div>
                      <div className="text-sm text-gray-600">
                        Nivel {15 - rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {3000 - (rank * 200)} XP
                    </div>
                    <div className="text-sm text-gray-600">
                      {rank <= 3 ? ['👑', '🥈', '🥉'][rank - 1] : '⭐'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current user position */}
              <div className="border-2 border-purple-500 bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      42
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Tú
                      </div>
                      <div className="text-sm text-gray-600">
                        Nivel {gamificationProfile.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">
                      {gamificationProfile.experience} XP
                    </div>
                    <div className="text-sm text-purple-600">
                      🎯
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900">Recompensas Disponibles</h5>
            <div className="grid gap-3">
              {[
                { id: 'discount_5', title: '5% Descuento', description: 'En tu próximo pago', cost: 500, icon: '🎫' },
                { id: 'extension_7d', title: 'Extensión 7 días', description: 'Extiende tu fecha de pago', cost: 300, icon: '📅' },
                { id: 'priority_support', title: 'Soporte Prioritario', description: 'Atención preferencial', cost: 600, icon: '⭐' },
                { id: 'exclusive_badge', title: 'Insignia Exclusiva', description: 'Badge especial', cost: 400, icon: '🏷️' }
              ].map((reward) => (
                <div
                  key={reward.id}
                  className="border rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedReward(reward)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{reward.icon}</div>
                      <div>
                        <h6 className="font-semibold text-gray-900">{reward.title}</h6>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">
                        {reward.cost} XP
                      </div>
                      <button className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors">
                        Canjear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationCard;