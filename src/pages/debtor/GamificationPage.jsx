/**
 * Página: Gamificación
 * 
 * Muestra el sistema completo de gamificación para el deudor
 */

import React, { useState } from 'react';
import { Trophy, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GamificationCard from '../../components/gamification/GamificationCard';
import BadgeCard from '../../components/gamification/BadgeCard';
import LeaderboardTable from '../../components/gamification/LeaderboardTable';
import { Card, LoadingSpinner } from '../../components/common';
import { useGamification } from '../../hooks/gamification/useGamification';
import { useAuth } from '../../context/AuthContext';
import gamificationService from '../../services/gamification/gamificationService';

const GamificationPage = () => {
  const { user } = useAuth();
  const { gamification, badges, pointsHistory, levelProgress, loading } = useGamification();
  const [allBadges, setAllBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  React.useEffect(() => {
    loadAllBadges();
  }, []);

  const loadAllBadges = async () => {
    try {
      const badgesData = await gamificationService.getAllBadges();
      setAllBadges(badgesData);
    } catch (error) {
      console.error('Error al cargar insignias:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  if (loading || loadingBadges) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  const unlockedBadgeIds = badges.map(b => b.badge_id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Sistema de Gamificación
          </h1>
          <p className="text-gray-600">
            Gana puntos, desbloquea logros y compite con otros usuarios
          </p>
        </div>

        {/* Tarjeta de gamificación principal */}
        <GamificationCard 
          gamification={gamification} 
          levelProgress={levelProgress} 
        />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
              <Award className="w-5 h-5 inline mr-2" />
              Mis Logros
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Historial
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              <Trophy className="w-5 h-5 inline mr-2" />
              Clasificación
            </button>
          </nav>
        </div>

        {/* Insignias */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎖️ Insignias ({badges.length}/{allBadges.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allBadges.map((badge) => {
              const userBadge = badges.find(b => b.badge_id === badge.id);
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={!!userBadge}
                  unlockedAt={userBadge?.unlocked_at}
                />
              );
            })}
          </div>
        </div>

        {/* Historial de puntos */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Historial de Puntos
          </h2>
          
          {pointsHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aún no tienes historial de puntos</p>
              <p className="text-sm">Realiza pagos para empezar a ganar puntos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointsHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{entry.reason}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(entry.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      entry.points_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.points_change > 0 ? '+' : ''}{entry.points_change}
                    </p>
                    <p className="text-sm text-gray-600">
                      Balance: {entry.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tabla de clasificación */}
        <LeaderboardTable userId={user.id} period="all_time" />
      </div>
    </DashboardLayout>
  );
};

export default GamificationPage;
