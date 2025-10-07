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
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-4 md:p-8 text-white shadow-strong">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-white/20 rounded-2xl backdrop-blur-sm flex-shrink-0">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                Análisis y Métricas
              </h1>
              <p className="text-indigo-100 text-base md:text-lg">
                Rendimiento detallado de tu cartera de cobranzas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="info" size="lg">
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
      <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <DateFilter
          onFilterChange={setDateFilter}
          className="mb-0"
        />
      </div>

      {/* Content */}
      <div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
                <Badge variant="primary">{formatCurrency(analytics.totalRevenue)}</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-success-100 rounded-lg">
                  <Target className="w-6 h-6 text-success-600" />
                </div>
                <Badge variant="success">
                  {formatPercentage(analytics.recoveryRate)}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Tasa de Recuperación</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(analytics.recoveryRate)}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-warning-100 rounded-lg">
                  <Users className="w-6 h-6 text-warning-600" />
                </div>
                <Badge variant="warning">
                  {analytics.totalDebtors}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Deudores Activos</p>
              <p className="text-2xl font-bold text-secondary-900">
                {analytics.totalDebtors}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-info-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-info-600" />
                </div>
                <Badge variant="info">
                  +{analytics.monthlyGrowth}%
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Crecimiento Mensual</p>
              <p className="text-2xl font-bold text-secondary-900">
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
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
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