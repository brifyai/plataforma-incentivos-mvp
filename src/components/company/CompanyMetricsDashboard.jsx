/**
 * Company Metrics Dashboard
 *
 * Dashboard ejecutivo con métricas clave para empresas
 */

import { useState, useEffect } from 'react';
import { Card } from '../common';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentGoals } from '../../services/databaseService';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const CompanyMetricsDashboard = ({ analytics, loading }) => {
  const [metrics, setMetrics] = useState({
    totalDebts: 0,
    totalRecovered: 0,
    recoveryRate: 0,
    activeClients: 0,
    monthlyGrowth: 0,
    avgRecoveryTime: 0
  });

  const [additionalMetrics, setAdditionalMetrics] = useState({
    bestMonth: null,
    monthlyGoalProgress: 0,
    paymentGoals: null
  });

  useEffect(() => {
    const loadAdditionalMetrics = async () => {
      if (analytics) {
        // Calcular métricas básicas
        const totalDebts = analytics.total_debts || 0;
        const totalRecovered = analytics.total_recovered || 0;
        const recoveryRate = totalDebts > 0 ? (totalRecovered / totalDebts) * 100 : 0;
        const activeClients = analytics.active_clients || 0;
        const monthlyGrowth = analytics.monthly_growth || 0;
        const avgRecoveryTime = analytics.avgRecoveryTime || analytics.avg_recovery_time || 45;

        setMetrics({
          totalDebts,
          totalRecovered,
          recoveryRate,
          activeClients,
          monthlyGrowth,
          avgRecoveryTime
        });

        // Calcular métricas adicionales
        try {
          // Obtener objetivos de pago
          const { goals } = await getPaymentGoals();
          const monthlyGoal = goals?.monthlyCommissionGoal || 2500000;

          // Usar mejor mes calculado desde analytics o calcular desde monthlyTrend
          let bestMonth = analytics.bestMonth || 'Sin datos';
          if (bestMonth === 'Sin datos' && analytics.monthlyTrend && analytics.monthlyTrend.length > 0) {
            let bestMonthRevenue = 0;
            analytics.monthlyTrend.forEach(month => {
              if (month.revenue > bestMonthRevenue) {
                bestMonthRevenue = month.revenue;
                bestMonth = month.month;
              }
            });
          }

          // Calcular progreso de meta mensual (último mes vs meta)
          const currentMonthRevenue = analytics.monthlyTrend?.[analytics.monthlyTrend.length - 1]?.revenue || 0;
          const monthlyGoalProgress = monthlyGoal > 0 ? (currentMonthRevenue / monthlyGoal) * 100 : 0;

          setAdditionalMetrics({
            bestMonth,
            monthlyGoalProgress: Math.min(monthlyGoalProgress, 100), // Máximo 100%
            paymentGoals: goals
          });

        } catch (error) {
          console.error('Error loading additional metrics:', error);
          setAdditionalMetrics({
            bestMonth: analytics?.bestMonth || 'Sin datos',
            monthlyGoalProgress: 0,
            paymentGoals: null
          });
        }
      }
    };

    loadAdditionalMetrics();
  }, [analytics]);

  const MetricCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => {
    const getTrendIcon = () => {
      if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
      if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
      return <Minus className="w-4 h-4 text-gray-500" />;
    };

    const getTrendColor = () => {
      if (trend === 'up') return 'text-green-600';
      if (trend === 'down') return 'text-red-600';
      return 'text-gray-600';
    };

    return (
      <Card className="relative overflow-hidden group hover:shadow-sm transition-all duration-300 py-2">
        <div className="relative z-10 px-3">
          <div className="flex items-center justify-between mb-1">
            <div className={`p-1 bg-gradient-to-br ${color} rounded-sm shadow-sm`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {trendValue}%
              </div>
            )}
          </div>
          <div className="space-y-0">
            <h3 className="text-xs font-medium text-gray-600">{title}</h3>
            <p className="text-base font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="py-2 animate-pulse">
            <div className="px-3">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-gray-200 rounded-sm"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-0">
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
                <div className="w-12 h-5 bg-gray-200 rounded"></div>
                <div className="w-20 h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          title="Total Deudas Activas"
          value={formatCurrency(metrics.totalDebts)}
          icon={DollarSign}
          color="from-red-500 to-pink-600"
          trend={metrics.monthlyGrowth > 0 ? 'up' : metrics.monthlyGrowth < 0 ? 'down' : null}
          trendValue={Math.abs(metrics.monthlyGrowth)}
          subtitle="Monto total por recuperar"
        />

        <MetricCard
          title="Monto Recuperado"
          value={formatCurrency(metrics.totalRecovered)}
          icon={Target}
          color="from-green-500 to-emerald-600"
          trend="up"
          trendValue={15.2}
          subtitle="Este mes"
        />

        <MetricCard
          title="Tasa de Recuperación"
          value={`${metrics.recoveryRate.toFixed(1)}%`}
          icon={Activity}
          color="from-blue-500 to-indigo-600"
          trend="up"
          trendValue={8.1}
          subtitle="Promedio del último trimestre"
        />

        <MetricCard
          title="Clientes Activos"
          value={metrics.activeClients.toLocaleString()}
          icon={Users}
          color="from-blue-500 to-blue-600"
          trend="up"
          trendValue={12.5}
          subtitle="Con deudas activas"
        />
      </div>

      {/* Additional insights */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-900">Mejor Mes</p>
              <p className="text-sm font-bold text-blue-700">
                {additionalMetrics.bestMonth === 'Sin datos' ? 'Sin datos históricos' : additionalMetrics.bestMonth}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Target className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-900">Meta Mensual</p>
              <p className="text-sm font-bold text-green-700">
                {additionalMetrics.monthlyGoalProgress.toFixed(1)}% alcanzado
              </p>
              {additionalMetrics.paymentGoals && (
                <p className="text-xs text-green-600 mt-0.5">
                  Meta: {formatCurrency(additionalMetrics.paymentGoals.monthlyCommissionGoal)}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-900">Tiempo Promedio</p>
              <p className="text-sm font-bold text-blue-700">
                {Math.round(metrics.avgRecoveryTime || 45)} días
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Tiempo de recuperación promedio
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyMetricsDashboard;