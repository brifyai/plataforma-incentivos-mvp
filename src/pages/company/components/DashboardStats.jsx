/**
 * DashboardStats Component
 *
 * Statistics cards for company dashboard showing key metrics
 */

import React from 'react';
import { Card } from '../../../components/common';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Award
} from 'lucide-react';

const DashboardStats = ({ stats, analytics }) => {
  // Mock data for demonstration
  const mockStats = {
    totalClients: 247,
    activeClients: 189,
    totalDebts: 1847,
    collectedAmount: 12500000,
    pendingAmount: 8750000,
    overdueAmount: 2100000,
    successRate: 94.2,
    averagePaymentTime: 12,
    monthlyGrowth: 12.5,
    weeklyGrowth: 3.2,
    pendingPayments: 23,
    completedPayments: 156,
    totalRevenue: 1250000
  };

  const statCards = [
    {
      title: 'Clientes Totales',
      value: mockStats.totalClients,
      change: '+8.2%',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
      description: `${mockStats.activeClients} activos`
    },
    {
      title: 'Deudas Gestionadas',
      value: mockStats.totalDebts,
      change: '+15.3%',
      changeType: 'positive',
      icon: Target,
      color: 'purple',
      description: `${mockStats.pendingAmount.toLocaleString()} CLP pendiente`
    },
    {
      title: 'Monto Recaudado',
      value: `$${(mockStats.collectedAmount / 1000000).toFixed(1)}M`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green',
      description: `Este mes: $${(mockStats.totalRevenue / 1000000).toFixed(1)}M`
    },
    {
      title: 'Tasa de Éxito',
      value: `${mockStats.successRate}%`,
      change: '+2.1%',
      changeType: 'positive',
      icon: Award,
      color: 'yellow',
      description: `${mockStats.completedPayments} pagos completados`
    }
  ];

  const getChangeIcon = (changeType) => {
    return changeType === 'positive' ?
      <TrendingUp className="w-4 h-4" /> :
      <TrendingDown className="w-4 h-4" />;
  };

  const getChangeColor = (changeType) => {
    return changeType === 'positive' ?
      'text-green-600 bg-green-50' :
      'text-red-600 bg-red-50';
  };

  const getCardColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-orange-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            {/* Background gradient */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${getCardColor(stat.color)} opacity-5 rounded-full -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${getCardColor(stat.color)} rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(stat.changeType)}`}>
                  {getChangeIcon(stat.changeType)}
                  {stat.change}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;