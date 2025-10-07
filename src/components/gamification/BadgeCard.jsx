/**
 * Componente: Tarjeta de Insignia
 * 
 * Muestra una insignia individual con su información
 */

import React from 'react';
import { Award, Lock } from 'lucide-react';

const BadgeCard = ({ badge, unlocked = false, unlockedAt = null }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };

  const rarityLabels = {
    common: 'Común',
    rare: 'Rara',
    epic: 'Épica',
    legendary: 'Legendaria'
  };

  const gradientClass = rarityColors[badge.rarity] || rarityColors.common;

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300
        ${unlocked 
          ? 'border-transparent bg-gradient-to-br ' + gradientClass + ' shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
          : 'border-gray-300 bg-gray-100 opacity-60'
        }
      `}
    >
      {/* Indicador de rareza */}
      <div className="absolute top-2 right-2">
        <span
          className={`
            text-xs font-bold px-2 py-1 rounded-full
            ${unlocked ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'}
          `}
        >
          {rarityLabels[badge.rarity]}
        </span>
      </div>

      {/* Icono de la insignia */}
      <div className="flex justify-center mb-3">
        <div
          className={`
            w-20 h-20 rounded-full flex items-center justify-center
            ${unlocked ? 'bg-white/20' : 'bg-gray-300'}
          `}
        >
          {unlocked ? (
            <Award className="w-12 h-12 text-white" />
          ) : (
            <Lock className="w-12 h-12 text-gray-500" />
          )}
        </div>
      </div>

      {/* Información de la insignia */}
      <div className="text-center">
        <h4
          className={`
            font-bold text-lg mb-1
            ${unlocked ? 'text-white' : 'text-gray-700'}
          `}
        >
          {badge.name}
        </h4>
        <p
          className={`
            text-sm mb-2
            ${unlocked ? 'text-white/90' : 'text-gray-600'}
          `}
        >
          {badge.description}
        </p>

        {/* Puntos de recompensa */}
        <div
          className={`
            inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
            ${unlocked ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'}
          `}
        >
          <span>⭐</span>
          <span>+{badge.points_reward} puntos</span>
        </div>

        {/* Fecha de desbloqueo */}
        {unlocked && unlockedAt && (
          <p className="text-xs text-white/80 mt-2">
            Desbloqueada el {new Date(unlockedAt).toLocaleDateString('es-CL')}
          </p>
        )}
      </div>

      {/* Efecto de brillo para insignias desbloqueadas */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default BadgeCard;
