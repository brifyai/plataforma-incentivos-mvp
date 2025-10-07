/**
 * Quick Actions Component
 * Displays quick action cards for common tasks
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/common';
import {
  CheckCircle,
  Users,
  TrendingUp,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      to: '/empresa/ofertas',
      icon: CheckCircle,
      title: 'Crear Oferta',
      description: 'Diseña nuevas ofertas para atraer más deudores',
      color: 'primary',
      bgColor: 'primary-100',
      textColor: 'primary-600',
      borderColor: 'primary-300'
    },
    {
      to: '/empresa/propuestas',
      icon: Users,
      title: 'Propuestas de Pago',
      description: 'Revisa propuestas enviadas por tus deudores',
      color: 'info',
      bgColor: 'info-100',
      textColor: 'info-600',
      borderColor: 'info-300'
    },
    {
      to: '/empresa/transferencias',
      icon: TrendingUp,
      title: '💰 Transferencias',
      description: 'Gestiona transferencias bancarias automáticas',
      color: 'info',
      bgColor: 'info-100',
      textColor: 'info-600',
      borderColor: 'info-300'
    },
    {
      to: '/empresa/analytics',
      icon: BarChart3,
      title: '📊 Analytics',
      description: 'Métricas y análisis de rendimiento detallado',
      color: 'purple',
      bgColor: 'purple-100',
      textColor: 'purple-600',
      borderColor: 'purple-300'
    },
    {
      to: '/empresa/mensajes',
      icon: MessageSquare,
      title: '💬 Mensajes',
      description: 'Centro de comunicaciones con deudores',
      color: 'green',
      bgColor: 'green-100',
      textColor: 'green-600',
      borderColor: 'green-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {actions.map((action, index) => (
        <Link key={index} to={action.to}>
          <Card
            padding={false}
            className={`hover:shadow-medium hover:border-${action.borderColor} transition-all cursor-pointer h-full`}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4 mb-3">
                <div className={`p-2 md:p-3 bg-${action.bgColor} rounded-lg flex-shrink-0`}>
                  <action.icon className={`w-5 h-5 md:w-6 md:h-6 text-${action.textColor}`} />
                </div>
                <h3 className="font-semibold text-secondary-900 text-sm md:text-base">{action.title}</h3>
              </div>
              <p className="text-xs md:text-sm text-secondary-600">
                {action.description}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;