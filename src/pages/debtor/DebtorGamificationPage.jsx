/**
 * Debtor Gamification Page
 *
 * Página dedicada para la gamificación del deudor
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, Button } from '../../components/common';
import { useDebtorGamification } from '../../hooks/useDebtorGamification';
import GamificationCard from '../../components/debtor/GamificationCard';
import DebtorNavigationMenu from '../../components/debtor/DebtorNavigationMenu';
import {
  Trophy,
  ArrowLeft,
  Settings,
  AlertTriangle,
} from 'lucide-react';

const DebtorGamificationPage = () => {
  const { user } = useAuth();
  
  // Gamificación avanzada
  const {
    gamificationProfile,
    loading: gamificationLoading,
    error: gamificationError,
    lastUpdated: gamificationLastUpdated,
    loadAllData: loadGamificationData,
    unlockAchievement,
    redeemReward
  } = useDebtorGamification(user?.id, {
    enableRealTime: true,
    autoRefresh: true,
    refreshInterval: 60000
  });

  useEffect(() => {
    if (user) {
      loadGamificationData();
    }
  }, [user, loadGamificationData]);

  if (!user) {
    return <LoadingSpinner fullScreen text="Cargando..." />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Menu */}
      <DebtorNavigationMenu />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              🏆 Gamificación Motivacional
            </h1>
            <p className="text-secondary-600 text-sm">
              Sube de nivel, gana logros y recompensas exclusivas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gamificationLastUpdated && (
            <span className="text-xs text-gray-500">
              Actualizado: {gamificationLastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadGamificationData()}
            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            disabled={gamificationLoading}
          >
            <Settings className={`w-4 h-4 ${gamificationLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gamification Card */}
      <GamificationCard
        gamificationProfile={gamificationProfile}
        loading={gamificationLoading.profile}
        onRefresh={() => loadGamificationData()}
        onAchievementUnlock={(achievementId) => {
          console.log('Achievement unlocked:', achievementId);
          unlockAchievement(achievementId);
        }}
        onRewardRedeem={(rewardId) => {
          console.log('Reward redeemed:', rewardId);
          redeemReward(rewardId);
        }}
      />

      {/* Gamification Error */}
      {gamificationError && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Error en Gamificación</h3>
              <p className="text-purple-700 text-sm">{gamificationError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorGamificationPage;