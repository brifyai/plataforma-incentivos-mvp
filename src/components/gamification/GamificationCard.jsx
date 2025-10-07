/**
 * Componente: Tarjeta de Gamificación
 * 
 * Muestra el nivel actual, puntos y progreso del usuario
 */

import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Card } from '../common';

const GamificationCard = ({ gamification, levelProgress }) => {
  if (!gamification) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  const level = gamification.gamification_levels;
  const levelColor = level?.color || '#3B82F6';

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5" style={{ color: levelColor }} />
            <span className="text-sm font-medium text-gray-600">
              Nivel {gamification.current_level}
            </span>
          </div>
          <h3 className="text-2xl font-bold" style={{ color: levelColor }}>
            {level?.level_name || 'Principiante'}
          </h3>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-600 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-2xl font-bold">
              {gamification.total_points.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-gray-600">puntos totales</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso al siguiente nivel</span>
          <span className="font-medium">
            {levelProgress.pointsNeeded > 0 
              ? `${levelProgress.pointsNeeded} puntos restantes`
              : 'Nivel máximo'
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${levelProgress.percentage}%`,
              background: `linear-gradient(90deg, ${levelColor}, ${levelColor}dd)`
            }}
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-bold">
              {gamification.consecutive_payments}
            </span>
          </div>
          <span className="text-xs text-gray-600">Pagos consecutivos</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 mb-1">
            {gamification.total_payments_made}
          </div>
          <span className="text-xs text-gray-600">Pagos totales</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600 mb-1">
            {gamification.achievements_unlocked}
          </div>
          <span className="text-xs text-gray-600">Logros</span>
        </div>
      </div>

      {/* Beneficios del nivel */}
      {level?.benefits?.description && (
        <div className="mt-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Beneficio: </span>
            {level.benefits.description}
          </p>
        </div>
      )}
    </Card>
  );
};

export default GamificationCard;
