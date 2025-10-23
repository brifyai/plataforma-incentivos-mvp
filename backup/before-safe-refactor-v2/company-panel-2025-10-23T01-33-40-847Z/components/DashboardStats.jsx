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
  // Use real data from props, with fallbacks
  const realStats = stats || {};
  const realAnalytics = analytics || {};

  // Calculate derived metrics from real data
  const totalClients = realStats.totalClients || 0;
  const totalDebts = realStats.totalDebts || 0;
  const totalDebtAmount = realStats.totalDebtAmount || 0;
  const totalRecovered = realStats.totalRecovered || 0;
  const recoveryRate = realStats.recoveryRate || 0;
  const monthlyGrowth = realAnalytics.monthlyGrowth || 0;

  // Calculate success rate based on real data
  const successRate = totalDebts > 0 ? Math.round((totalRecovered / totalDebtAmount) * 100) : 0;

  const statCards = [
    {
      title: 'Clientes Totales',
      value: totalClients,
      change: monthlyGrowth >= 0 ? `+${monthlyGrowth.toFixed(1)}%` : `${monthlyGrowth.toFixed(1)}%`,
      changeType: monthlyGrowth >= 0 ? 'positive' : 'negative',
      icon: Users,
      color: 'blue',
      description: `${realStats.totalDebtors || 0} deudores activos`
    },
    {
      title: 'Deudas Gestionadas',
      value: totalDebts,
      change: '+15.3%',
      changeType: 'positive',
      icon: Target,
      color: 'blue',
      description: `$${totalDebtAmount.toLocaleString()} CLP total`
    },
    {
      title: 'Monto Recaudado',
      value: `$${(totalRecovered / 1000000).toFixed(1)}M`,
      change: monthlyGrowth >= 0 ? `+${monthlyGrowth.toFixed(1)}%` : `${monthlyGrowth.toFixed(1)}%`,
      changeType: monthlyGrowth >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'green',
      description: `${recoveryRate.toFixed(1)}% tasa de recuperación`
    },
    {
      title: 'Tasa de Éxito',
      value: `${successRate}%`,
      change: '+2.1%',
      changeType: 'positive',
      icon: Award,
      color: 'yellow',
      description: `${realStats.activeAgreements || 0} acuerdos activos`
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
      purple: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-orange-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-sm transition-all duration-300 py-2">
            {/* Background gradient */}
            <div className={`absolute top-0 right-0 w-10 h-10 bg-gradient-to-br ${getCardColor(stat.color)} opacity-5 rounded-full -mr-5 -mt-5 group-hover:opacity-10 transition-opacity`}></div>

            <div className="relative z-10 px-3">
              <div className="flex items-center justify-between mb-1">
                <div className={`p-1 bg-gradient-to-br ${getCardColor(stat.color)} rounded-sm shadow-sm`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-xs font-medium ${getChangeColor(stat.changeType)}`}>
                  {getChangeIcon(stat.changeType)}
                  {stat.change}
                </div>
              </div>

              <div className="space-y-0">
                <h3 className="text-base font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs font-medium text-gray-600">{stat.title}</p>
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