/**
 * QuickActions Component
 *
 * Quick action buttons for common company dashboard tasks
 */

import React from 'react';
import { Button, Card } from '../../../components/common';
import { Link } from 'react-router-dom';
import {
  Plus,
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  Upload,
  Download,
  Send,
  Target,
  Calendar,
  CreditCard,
  Bot,
  Brain
} from 'lucide-react';

const QuickActions = ({ profile }) => {
  const quickActions = [
    {
      title: 'IA de Negociación',
      description: 'Dashboard de IA conversacional',
      icon: Brain,
      color: 'purple',
      action: 'ai-negotiation',
      link: '/empresa/ia/negociacion'
    },
    {
      title: 'Importar Deudas',
      description: 'Cargar deudas masivamente',
      icon: Upload,
      color: 'green',
      action: 'import-debts',
      link: '/empresa/importar' // Nueva ruta creada
    },
    {
      title: 'Crear Oferta',
      description: 'Nueva propuesta de pago',
      icon: Target,
      color: 'blue',
      action: 'new-offer',
      link: '/empresa/ofertas' // Ruta existente
    },
    {
      title: 'Enviar Mensaje',
      description: 'Contactar a clientes',
      icon: MessageSquare,
      color: 'orange',
      action: 'send-message',
      link: '/empresa/mensajes' // Ruta existente
    }
  ];

  const additionalActions = [
    {
      title: 'Ver IA Dashboard',
      description: 'Dashboard completo de IA',
      icon: Brain,
      color: 'purple',
      action: 'ai-dashboard',
      link: '/empresa/ia/dashboard'
    },
    {
      title: 'Exportar Reporte',
      description: 'Descargar reportes detallados',
      icon: Download,
      color: 'blue',
      action: 'export-report',
      link: '/empresa/reportes'
    },
    {
      title: 'Programar Pago',
      description: 'Agendar pagos futuros',
      icon: Calendar,
      color: 'green',
      action: 'schedule-payment',
      link: '/empresa/pagos'
    },
    {
      title: 'Ver Pagos',
      description: 'Historial de pagos realizados',
      icon: CreditCard,
      color: 'indigo',
      action: 'view-payments',
      link: '/empresa/pagos'
    }
  ];

  const getButtonColor = (color) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      gray: 'bg-gray-600 hover:bg-gray-700'
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      indigo: 'text-indigo-600',
      gray: 'text-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          <p className="text-sm text-gray-600">Operaciones más comunes en un solo lugar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} to={action.link} className="group">
              <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 h-32">
                <div className={`p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors mb-3`}>
                  <Icon className={`w-6 h-6 ${getIconColor(action.color)}`} />
                </div>
                <h4 className="text-sm font-medium text-gray-900 text-center mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 text-center leading-tight">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Additional Actions Row */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {additionalActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.link} className="group">
                <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 h-32">
                  <div className={`p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors mb-3`}>
                    <Icon className={`w-6 h-6 ${getIconColor(action.color)}`} />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center mb-1">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-500 text-center leading-tight">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </Card>
  );
};

export default QuickActions;