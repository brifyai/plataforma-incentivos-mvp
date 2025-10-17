/**
 * Personalized Dashboard Component
 * 
 * Proporciona métricas relevantes según el rol del usuario
 * Se integra sin romper el código existente
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Eye,
  Building
} from 'lucide-react';

const PersonalizedDashboard = ({ stats, analytics, loading }) => {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [personalizedMetrics, setPersonalizedMetrics] = useState(null);

  // Calcular métricas personalizadas según el rol
  useEffect(() => {
    if (!profile?.role) return;

    // Usar datos de ejemplo si no hay stats reales
    const mockStats = stats || {
      total_debts: 150,
      recovery_rate: 75,
      active_clients: 45,
      pending_payments: 23,
      total_debt: 50000,
      payments_made: 12,
      available_offers: 3,
      credit_score: 720,
      total_users: 1250,
      active_companies: 85,
      total_transactions: 3400,
      system_health: 98
    };

    const roleMetrics = calculateRoleMetrics(profile.role, mockStats, analytics);
    setPersonalizedMetrics(roleMetrics);
  }, [profile?.role, stats, analytics]);

  const calculateRoleMetrics = (role, stats, analytics) => {
    const baseMetrics = {
      totalRevenue: stats?.total_revenue || 0,
      activeUsers: stats?.active_users || 0,
      conversionRate: stats?.conversion_rate || 0,
      pendingTasks: stats?.pending_tasks || 0,
    };

    switch (role) {
      case 'company':
        return {
          ...baseMetrics,
          kpis: [
            {
              title: 'Deudas Totales',
              value: stats?.total_debts || 0,
              change: stats?.debts_change || 0,
              icon: FileText,
              color: 'blue',
              trend: stats?.debts_trend || 'up'
            },
            {
              title: 'Tasa de Recuperación',
              value: `${stats?.recovery_rate || 0}%`,
              change: stats?.recovery_change || 0,
              icon: TrendingUp,
              color: 'green',
              trend: stats?.recovery_trend || 'up'
            },
            {
              title: 'Clientes Activos',
              value: stats?.active_clients || 0,
              change: stats?.clients_change || 0,
              icon: Users,
              color: 'purple',
              trend: stats?.clients_trend || 'up'
            },
            {
              title: 'Pagos Pendientes',
              value: stats?.pending_payments || 0,
              change: stats?.payments_change || 0,
              icon: DollarSign,
              color: 'orange',
              trend: stats?.payments_trend || 'down'
            }
          ],
          quickActions: [
            { title: 'Importar Deudores', icon: FileText, link: '/company/bulk-import', color: 'blue' },
            { title: 'Ver Analytics', icon: BarChart3, link: '/company/analytics', color: 'green' },
            { title: 'Enviar Mensajes', icon: MessageSquare, link: '/company/messages', color: 'purple' },
            { title: 'Configurar IA', icon: Zap, link: '/company/ai-config', color: 'orange' }
          ],
          alerts: [
            {
              type: 'warning',
              message: `${stats?.overdue_debts || 0} deudores con pagos vencidos`,
              action: 'Revisar',
              link: '/company/debts?filter=overdue'
            },
            {
              type: 'info',
              message: 'Nuevas funciones de IA disponibles',
              action: 'Explorar',
              link: '/company/ai-dashboard'
            }
          ]
        };

      case 'debtor':
        return {
          ...baseMetrics,
          kpis: [
            {
              title: 'Deuda Total',
              value: `$${stats?.total_debt || 0}`,
              change: stats?.debt_change || 0,
              icon: CreditCard,
              color: 'red',
              trend: stats?.debt_trend || 'down'
            },
            {
              title: 'Pagos Realizados',
              value: stats?.payments_made || 0,
              change: stats?.payments_change || 0,
              icon: CheckCircle,
              color: 'green',
              trend: stats?.payments_trend || 'up'
            },
            {
              title: 'Ofertas Disponibles',
              value: stats?.available_offers || 0,
              change: stats?.offers_change || 0,
              icon: Target,
              color: 'blue',
              trend: stats?.offers_trend || 'up'
            },
            {
              title: 'Score de Crédito',
              value: stats?.credit_score || 0,
              change: stats?.score_change || 0,
              icon: Shield,
              color: 'purple',
              trend: stats?.score_trend || 'up'
            }
          ],
          quickActions: [
            { title: 'Ver Deudas', icon: FileText, link: '/debtor/debts', color: 'red' },
            { title: 'Pagar Ahora', icon: CreditCard, link: '/debtor/payments', color: 'green' },
            { title: 'Ver Ofertas', icon: Target, link: '/debtor/offers', color: 'blue' },
            { title: 'Simular Pago', icon: Activity, link: '/debtor/simulator', color: 'purple' }
          ],
          alerts: [
            {
              type: 'success',
              message: '¡Tienes ofertas especiales disponibles!',
              action: 'Ver Ofertas',
              link: '/debtor/offers'
            },
            {
              type: 'warning',
              message: `${stats?.urgent_payments || 0} pagos próximos a vencer`,
              action: 'Pagar Ahora',
              link: '/debtor/payments'
            }
          ]
        };

      case 'god_mode':
        return {
          ...baseMetrics,
          kpis: [
            {
              title: 'Usuarios Totales',
              value: stats?.total_users || 0,
              change: stats?.users_change || 0,
              icon: Users,
              color: 'blue',
              trend: stats?.users_trend || 'up'
            },
            {
              title: 'Empresas Activas',
              value: stats?.active_companies || 0,
              change: stats?.companies_change || 0,
              icon: Building,
              color: 'green',
              trend: stats?.companies_trend || 'up'
            },
            {
              title: 'Transacciones',
              value: stats?.total_transactions || 0,
              change: stats?.transactions_change || 0,
              icon: DollarSign,
              color: 'purple',
              trend: stats?.transactions_trend || 'up'
            },
            {
              title: 'System Health',
              value: `${stats?.system_health || 100}%`,
              change: stats?.health_change || 0,
              icon: Activity,
              color: 'green',
              trend: stats?.health_trend || 'stable'
            }
          ],
          quickActions: [
            { title: 'Gestionar Usuarios', icon: Users, link: '/admin/users', color: 'blue' },
            { title: 'Ver Empresas', icon: Building, link: '/admin/companies', color: 'green' },
            { title: 'System Config', icon: Settings, link: '/admin/config', color: 'purple' },
            { title: 'Ver Analytics', icon: BarChart3, link: '/admin/analytics', color: 'orange' }
          ],
          alerts: [
            {
              type: 'info',
              message: `${stats?.pending_verifications || 0} verificaciones pendientes`,
              action: 'Revisar',
              link: '/admin/verifications'
            },
            {
              type: 'warning',
              message: `Uso del sistema: ${stats?.system_usage || 0}%`,
              action: 'Monitorear',
              link: '/admin/system-health'
            }
          ]
        };

      default:
        return baseMetrics;
    }
  };

  if (loading || !personalizedMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-secondary-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Panel de {profile?.role === 'company' ? 'Empresa' : profile?.role === 'debtor' ? 'Deudor' : 'Administración'}
        </h2>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
              }`}
            >
              {range === '24h' ? '24h' : range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personalizedMetrics.kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow"
              data-tour={`kpi-${index}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/20`}>
                  <Icon className={`w-6 h-6 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                </div>
                {getTrendIcon(kpi.trend)}
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">
                {kpi.value}
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {kpi.title}
              </p>
              {kpi.change !== 0 && (
                <p className={`text-xs mt-2 ${
                  kpi.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change}% vs período anterior
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {personalizedMetrics.quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className={`flex flex-col items-center p-4 rounded-lg bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 transition-colors group`}
                data-tour={`action-${index}`}
              >
                <Icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 text-center">
                  {action.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {personalizedMetrics.alerts.length > 0 && (
        <div className="space-y-3">
          {personalizedMetrics.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              data-tour={`alert-${index}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {alert.type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {alert.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                  {alert.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  {alert.type === 'info' && <Eye className="w-5 h-5" />}
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <Link
                  to={alert.link}
                  className="text-sm font-medium hover:underline"
                >
                  {alert.action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalizedDashboard;