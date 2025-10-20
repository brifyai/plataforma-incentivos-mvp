/**
 * Debtor Navigation Menu Component
 *
 * Menú de navegación reutilizable para las páginas del deudor
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Brain, Bot, Trophy } from 'lucide-react';

const DebtorNavigationMenu = () => {
  const currentPath = window.location.pathname;
  
  const menuItems = [
    { 
      id: 'overview', 
      label: '📊 Resumen', 
      icon: BarChart3, 
      activeClass: 'bg-blue-100 text-blue-700 border-blue-300', 
      hoverClass: 'hover:bg-blue-50', 
      path: '/personas/dashboard' 
    },
    { 
      id: 'analytics', 
      label: '🧠 Analytics', 
      icon: Brain, 
      activeClass: 'bg-purple-100 text-purple-700 border-purple-300', 
      hoverClass: 'hover:bg-purple-50', 
      path: '/personas/analytics' 
    },
    { 
      id: 'ai', 
      label: '🤖 Asistente IA', 
      icon: Bot, 
      activeClass: 'bg-indigo-100 text-indigo-700 border-indigo-300', 
      hoverClass: 'hover:bg-indigo-50', 
      path: '/personas/asistente-ia' 
    },
    { 
      id: 'gamification', 
      label: '🏆 Gamificación', 
      icon: Trophy, 
      activeClass: 'bg-orange-100 text-orange-700 border-orange-300', 
      hoverClass: 'hover:bg-orange-50', 
      path: '/personas/gamificacion' 
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 sticky top-20 z-30">
      <div className="flex flex-wrap gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all border-2 no-underline ${
              currentPath === item.path
                ? `${item.activeClass} shadow-md`
                : `bg-gray-50 text-gray-600 hover:bg-gray-100 border-transparent ${item.hoverClass}`
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DebtorNavigationMenu;