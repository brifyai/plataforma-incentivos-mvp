/**
 * Admin Analytics Page - Analytics del Sistema
 *
 * Página administrativa para ver métricas y análisis del sistema
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, LoadingSpinner } from '../../components/common';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, PieChart, Calendar } from 'lucide-react';
import { getAdminAnalytics } from '../../services/databaseService';
import { formatCurrency } from '../../utils/formatters';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { analytics: data, error } = await getAdminAnalytics();

        if (error) {
          setError(error);
        } else {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Error al cargar los datos de analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);


  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-5 h-5 text-primary-600" />;
      case 'DollarSign':
        return <DollarSign className="w-5 h-5 text-success-600" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-warning-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityIconBg = (iconName) => {
    switch (iconName) {
      case 'Users':
        return 'bg-primary-100';
      case 'DollarSign':
        return 'bg-success-100';
      case 'Activity':
        return 'bg-warning-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const timeDiff = now - timestamp;
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else if (hours < 24) {
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  // Función para aplicar filtros rápidos
  const applyQuickFilter = (filterType) => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0]; // Hoy en formato YYYY-MM-DD

    switch (filterType) {
      case 'today':
        startDate = endDate; // Desde hoy hasta hoy
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      default:
        startDate = '';
        endDate = '';
    }

    setDateFilter({ startDate, endDate });
    setQuickFilter(filterType);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setQuickFilter('');
  };


  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Analytics del Sistema
                </h1>
                <p className="text-primary-100 text-sm">
                  Métricas y análisis de rendimiento de la plataforma
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <button
              onClick={() => applyQuickFilter('today')}
              className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                quickFilter === 'today'
                  ? 'bg-blue-800 border-blue-700'
                  : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter('week')}
              className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                quickFilter === 'week'
                  ? 'bg-blue-800 border-blue-700'
                  : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => applyQuickFilter('month')}
              className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                quickFilter === 'month'
                  ? 'bg-blue-800 border-blue-700'
                  : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
              }`}
            >
              Este mes
            </button>
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {analytics?.keyMetrics?.activeUsers?.toLocaleString() || 0}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Usuarios Activos</p>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {formatCurrency(analytics?.keyMetrics?.totalTransferred || 0)}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total Transferido</p>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg group-hover:shadow-glow-warning transition-all duration-300">
                <Activity className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {analytics?.keyMetrics?.systemUptime || 0}%
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Uptime Sistema</p>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <PieChart className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {analytics?.keyMetrics?.activeCompanies || 0}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Empresas Activas</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Distribución por Rol</h3>
            <div className="space-y-4">
              {analytics?.roleDistribution && Object.entries(analytics.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-secondary-700 capitalize text-sm">
                      {role === 'debtor' ? 'Deudores' : role === 'company' ? 'Empresas' : 'Administradores'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary-900 font-semibold text-sm">{count}</span>
                    <span className="text-secondary-500 text-xs">
                      ({((count / Object.values(analytics.roleDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Métricas de Rendimiento</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary-700 text-sm">Tasa de Conversión</span>
                <span className="text-secondary-900 font-semibold text-sm">
                  {analytics?.keyMetrics?.activeUsers > 0
                    ? ((analytics.keyMetrics.activeCompanies / analytics.keyMetrics.activeUsers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-700 text-sm">Pagos por Usuario</span>
                <span className="text-secondary-900 font-semibold text-sm">
                  {analytics?.keyMetrics?.activeUsers > 0
                    ? (analytics.keyMetrics.totalTransferred / analytics.keyMetrics.activeUsers).toLocaleString('es-CL', {
                        style: 'currency',
                        currency: 'CLP'
                      })
                    : '$0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-700 text-sm">Crecimiento Total</span>
                <span className="text-green-600 font-semibold text-sm">
                  +{(((analytics?.growth?.userGrowth || 0) + (analytics?.growth?.paymentGrowth || 0) + (analytics?.growth?.companyGrowth || 0)) / 3).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-6">Actividad Reciente</h3>

          <div className="space-y-4">
            {analytics?.recentActivity?.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 ${getActivityIconBg(activity.icon)} rounded-full flex items-center justify-center`}>
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900 text-sm">{activity.title}</p>
                    <p className="text-xs text-secondary-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-secondary-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay actividad reciente para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;