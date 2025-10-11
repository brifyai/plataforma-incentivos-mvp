/**
 * Admin Analytics Page - Analytics del Sistema
 *
 * Página administrativa para ver métricas y análisis del sistema
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, LoadingSpinner, DateFilter } from '../../components/common';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, PieChart, Calendar, Building } from 'lucide-react';
import { getAdminAnalytics, getAllCorporateClients } from '../../services/databaseService';
import { formatCurrency } from '../../utils/formatters';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'
  const [filterCorporateClient, setFilterCorporateClient] = useState('all');
  const [corporateClients, setCorporateClients] = useState([]);

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
    loadCorporateClients();
  }, []);

  const loadCorporateClients = async () => {
    try {
      const { corporateClients, error } = await getAllCorporateClients();
      if (error) {
        console.error('Error loading corporate clients:', error);
      } else {
        setCorporateClients(corporateClients || []);
      }
    } catch (error) {
      console.error('Error in loadCorporateClients:', error);
    }
  };

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
    setFilterCorporateClient('all');
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
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Analytics del Sistema
              </h1>
              <p className="text-blue-100 text-lg">
                Métricas y análisis de rendimiento de la plataforma
              </p>
            </div>
          </div>
<div className="flex flex-col gap-4">
  {/* Quick Filter Buttons */}
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-blue-300" />
      <span className="text-sm font-medium text-blue-100">Filtrar por período:</span>
    </div>
    <div className="flex items-center gap-2">
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
        Semana
      </button>
      <button
        onClick={() => applyQuickFilter('month')}
        className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
          quickFilter === 'month'
            ? 'bg-blue-800 border-blue-700'
            : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
        }`}
      >
        Mes
      </button>
      {(dateFilter.startDate || dateFilter.endDate || filterCorporateClient !== 'all') && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  </div>

  {/* Corporate Client Filter */}
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Building className="w-5 h-5 text-blue-300" />
      <span className="text-sm font-medium text-blue-100">Filtrar por cliente:</span>
    </div>
    <div className="flex items-center gap-2">
      <select
        value={filterCorporateClient}
        onChange={(e) => setFilterCorporateClient(e.target.value)}
        className="px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-white/50 focus:border-white text-sm min-w-[200px]"
      >
        <option value="all" className="text-gray-900">Todos los Clientes</option>
        <option value="none" className="text-gray-900">Sin Cliente Corporativo</option>
        {corporateClients.map(client => (
          <option key={client.id} value={client.id} className="text-gray-900">
            {client.name}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* Custom Date Range */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <label htmlFor="startDate" className="text-sm text-blue-200">Desde:</label>
      <input
        id="startDate"
        type="date"
        value={dateFilter.startDate}
        onChange={(e) => {
          setDateFilter(prev => ({ ...prev, startDate: e.target.value }));
          setQuickFilter(''); // Clear quick filter when manual date is selected
        }}
        className="px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm"
      />
    </div>
    <div className="flex items-center gap-2">
      <label htmlFor="endDate" className="text-sm text-blue-200">Hasta:</label>
      <input
        id="endDate"
        type="date"
        value={dateFilter.endDate}
        onChange={(e) => {
          setDateFilter(prev => ({ ...prev, endDate: e.target.value }));
          setQuickFilter(''); // Clear quick filter when manual date is selected
        }}
        className="px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm"
      />
    </div>
  </div>

</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics?.keyMetrics?.activeUsers?.toLocaleString() || 0}
            </h3>
            <p className="text-secondary-600">Usuarios Activos</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{analytics?.growth?.userGrowth || 0}% este mes</span>
            </div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {formatCurrency(analytics?.keyMetrics?.totalTransferred || 0)}
            </h3>
            <p className="text-secondary-600">Total Transferido</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{analytics?.growth?.paymentGrowth || 0}% este mes</span>
            </div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-warning-100 rounded-lg mx-auto mb-4">
              <Activity className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics?.keyMetrics?.systemUptime || 0}%
            </h3>
            <p className="text-secondary-600">Uptime del Sistema</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Estable</span>
            </div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-info-100 rounded-lg mx-auto mb-4">
              <PieChart className="w-6 h-6 text-info-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics?.keyMetrics?.activeCompanies || 0}
            </h3>
            <p className="text-secondary-600">Empresas Activas</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{analytics?.growth?.companyGrowth || 0} este mes</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-secondary-900 mb-4">Distribución por Rol</h3>
            <div className="space-y-4">
              {analytics?.roleDistribution && Object.entries(analytics.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-secondary-700 capitalize">
                      {role === 'debtor' ? 'Deudores' : role === 'company' ? 'Empresas' : 'Administradores'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary-900 font-semibold">{count}</span>
                    <span className="text-secondary-500 text-sm">
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
            <h3 className="text-xl font-semibold text-secondary-900 mb-4">Métricas de Rendimiento</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary-700">Tasa de Conversión</span>
                <span className="text-secondary-900 font-semibold">
                  {analytics?.keyMetrics?.activeUsers > 0
                    ? ((analytics.keyMetrics.activeCompanies / analytics.keyMetrics.activeUsers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-700">Pagos por Usuario</span>
                <span className="text-secondary-900 font-semibold">
                  {analytics?.keyMetrics?.activeUsers > 0
                    ? (analytics.keyMetrics.totalTransferred / analytics.keyMetrics.activeUsers).toLocaleString('es-CL', {
                        style: 'currency',
                        currency: 'CLP'
                      })
                    : '$0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-700">Crecimiento Total</span>
                <span className="text-green-600 font-semibold">
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
          <h3 className="text-xl font-semibold text-secondary-900 mb-6">Actividad Reciente</h3>

          <div className="space-y-4">
            {analytics?.recentActivity?.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 ${getActivityIconBg(activity.icon)} rounded-full flex items-center justify-center`}>
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{activity.title}</p>
                    <p className="text-sm text-secondary-600">{activity.description}</p>
                  </div>
                  <span className="text-sm text-secondary-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay actividad reciente para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;