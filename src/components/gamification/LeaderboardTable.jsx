/**
 * Componente: Tabla de Clasificación
 * 
 * Muestra el ranking de usuarios según puntos
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card } from '../common';
import gamificationService from '../../services/gamification/gamificationService';

const LeaderboardTable = ({ userId, period = 'all_time' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Skip user position query for god mode user (mock user not in database)
      const leaderboardPromise = gamificationService.getLeaderboard(period, 10);
      const userPosPromise = userId === 'god-mode-user'
        ? Promise.resolve(null)
        : gamificationService.getUserLeaderboardPosition(userId, period);

      const [leaderboardData, userPos] = await Promise.all([
        leaderboardPromise,
        userPosPromise
      ]);

      setLeaderboard(leaderboardData);
      setUserPosition(userPos);
    } catch (error) {
      console.error('Error al cargar leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500 fill-current" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400 fill-current" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600 fill-current" />;
      default:
        return <span className="text-lg font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankBgColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          🏆 Tabla de Clasificación
        </h3>
        <select
          value={period}
          onChange={(e) => loadLeaderboard(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="weekly">Esta Semana</option>
          <option value="monthly">Este Mes</option>
          <option value="all_time">Todos los Tiempos</option>
        </select>
      </div>

      {/* Tabla de clasificación */}
      <div className="space-y-2">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.user_id === userId;
          
          return (
            <div
              key={entry.user_id}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-all
                ${getRankBgColor(entry.rank)}
                ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* Posición */}
              <div className="flex items-center justify-center w-12">
                {getRankIcon(entry.rank)}
              </div>

              {/* Información del usuario */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {isCurrentUser ? 'Tú' : entry.users?.full_name || 'Usuario'}
                  </span>
                  {isCurrentUser && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      Tú
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span>Nivel {entry.level}</span>
                  <span>•</span>
                  <span>{entry.badges_count} insignias</span>
                </div>
              </div>

              {/* Puntos */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Award className="w-5 h-5" />
                  <span className="text-xl font-bold">
                    {entry.total_points.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-gray-600">puntos</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Posición del usuario si no está en el top 10 */}
      {userPosition && userPosition.rank > 10 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg ring-2 ring-blue-500">
            <div className="flex items-center justify-center w-12">
              <span className="text-lg font-bold text-blue-600">
                #{userPosition.rank}
              </span>
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900">Tu posición</span>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>Nivel {userPosition.level}</span>
                <span>•</span>
                <span>{userPosition.badges_count} insignias</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-600">
                <Award className="w-5 h-5" />
                <span className="text-xl font-bold">
                  {userPosition.total_points.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-gray-600">puntos</span>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay datos de clasificación para este período</p>
        </div>
      )}
    </Card>
  );
};

export default LeaderboardTable;
