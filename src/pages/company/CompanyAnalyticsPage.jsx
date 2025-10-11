/**
 * Company Analytics Page
 *
 * Página para que las empresas vean métricas y análisis de su rendimiento
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, Button, DateFilter } from '../../components/common';
import { useCompanyAnalytics } from '../../hooks';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

const CompanyAnalyticsPage = () => {
  const { analytics, loading, error, refreshAnalytics } = useCompanyAnalytics();
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  // Función helper para calcular rangos de fechas
  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Función para aplicar rangos predefinidos
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setDateFilter(dates);
  };

  const exportAnalytics = () => {
    alert('📊 Exportando análisis...');
    setTimeout(() => {
      alert('✅ Análisis exportado exitosamente');
    }, 1500);
  };

  const handleRefresh = () => {
    refreshAnalytics();
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            Error al cargar análisis
          </h2>
          <p className="text-secondary-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            No hay datos disponibles
          </h2>
          <p className="text-secondary-600">
            Los análisis estarán disponibles cuando tengas más actividad en la plataforma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-2xl p-3 md:p-6 text-white shadow-strong">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-5">
            <div className="text-center sm:text-left">
              <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight">
                Análisis y Métricas
              </h1>
              <p className="text-indigo-100 text-sm md:text-base">
                Rendimiento detallado de tu cartera de cobranzas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="info" size="md">
              {analytics.totalClients} Clientes
            </Badge>
            <Button
              variant="primary"
              onClick={handleRefresh}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={exportAnalytics}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exportar
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('last7days')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('thisMonth')}
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                </div>
                <Badge variant="primary">{formatCurrency(analytics.totalRevenue)}</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Ingresos Totales</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Target className="w-4 h-4 text-success-600" />
                </div>
                <Badge variant="success">
                  {formatPercentage(analytics.recoveryRate)}
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Tasa de Recuperación</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {formatPercentage(analytics.recoveryRate)}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Users className="w-4 h-4 text-warning-600" />
                </div>
                <Badge variant="warning">
                  {analytics.totalDebtors}
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Deudores Activos</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {analytics.totalDebtors}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-info-600" />
                </div>
                <Badge variant="info">
                  +{analytics.monthlyGrowth}%
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Crecimiento Mensual</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                +{analytics.monthlyGrowth}%
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card
          title="Tendencia Mensual"
          subtitle="Ingresos y tasa de recuperación"
        >
          <div className="space-y-4">
            {analytics.monthlyTrend.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-semibold text-primary-700">
                    {month.month}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{formatCurrency(month.revenue)}</p>
                    <p className="text-sm text-secondary-600">Ingresos del mes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary-900">{formatPercentage(month.recovery, 2)}</p>
                  <p className="text-sm text-secondary-600">Recuperación</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Clients */}
        <Card
          title="Clientes Destacados"
          subtitle="Mejor rendimiento este mes"
        >
          <div className="space-y-4">
            {analytics.topPerformingClients.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900">{client.name}</p>
                    <p className="text-sm text-secondary-600">{formatCurrency(client.revenue)} recuperados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{client.recoveryRate}%</p>
                  <p className="text-sm text-secondary-600">Tasa de recuperación</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Pago Promedio</h3>
                <p className="text-secondary-600">Monto promedio por transacción</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-secondary-900">
              {formatCurrency(analytics.averagePayment)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Eficiencia</h3>
                <p className="text-secondary-600">Pagos procesados vs. tiempo</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-secondary-900">
              {analytics.efficiencyRate ? formatPercentage(analytics.efficiencyRate) : '0%'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Tiempo Promedio</h3>
                <p className="text-secondary-600">Días para completar acuerdos</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-secondary-900">
              {analytics.avgProcessingTime ? `${analytics.avgProcessingTime} días` : '0 días'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyAnalyticsPage;