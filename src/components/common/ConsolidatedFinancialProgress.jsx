/**
 * Consolidated Financial Progress Component
 * 
 * Componente que muestra la vista consolidada del progreso financiero
 * entre portales empresas-personas con métricas compartidas
 */

import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge } from './index';
import { useEcosystemSync } from '../../hooks/useEcosystemSync';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  Users,
  Building,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Award,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingDown as Debt,
  Calculator,
  Percent,
  Timer
} from 'lucide-react';

const ConsolidatedFinancialProgress = ({ 
  userType = 'company',
  timeRange = '30d',
  compact = false,
  showCharts = true,
  showPredictions = true
}) => {
  const {
    isConnected,
    syncStatus,
    sharedStates,
    unifiedMetrics,
    forceSync,
    getSyncStatus
  } = useEcosystemSync({
    userType,
    enableRealTime: true,
    autoConnect: true
  });

  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [viewMode, setViewMode] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Rangos de tiempo predefinidos
  const TIME_RANGES = {
    '7d': { label: 'Últimos 7 días', days: 7 },
    '30d': { label: 'Últimos 30 días', days: 30 },
    '90d': { label: 'Últimos 90 días', days: 90 },
    '1y': { label: 'Último año', days: 365 }
  };

  // Cargar datos financieros consolidados
  const loadFinancialData = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      // Extraer datos financieros de los estados compartidos
      const financialStates = Array.from(sharedStates.entries())
        .filter(([entityId, state]) => 
          state.entity_type === 'financial_progress' ||
          state.entity_type === 'payment' ||
          state.entity_type === 'debt' ||
          state.state_data?.financial_data
        )
        .map(([entityId, state]) => ({
          id: entityId,
          ...state.state_data,
          entity_type: state.entity_type,
          updated_at: state.updated_at
        }));

      // Procesar y consolidar datos
      const consolidated = processFinancialData(financialStates);
      setFinancialData(consolidated);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos financieros
  const processFinancialData = (states) => {
    const totals = {
      totalDebt: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalPayments: 0,
      averagePayment: 0,
      paymentRate: 0,
      debtReduction: 0,
      projectedSavings: 0,
      riskLevel: 'low'
    };

    const timeline = [];
    const byCompany = {};
    const byDebtor = {};

    states.forEach(state => {
      const amount = state.amount || 0;
      const paid = state.paid_amount || 0;
      const remaining = amount - paid;

      // Acumular totales
      totals.totalDebt += amount;
      totals.totalPaid += paid;
      totals.totalRemaining += remaining;

      if (state.payment_date) {
        totals.totalPayments++;
        totals.averagePayment = totals.totalPaid / totals.totalPayments;
      }

      // Agrupar por empresa
      if (state.company_id) {
        if (!byCompany[state.company_id]) {
          byCompany[state.company_id] = {
            name: state.company_name || 'Empresa',
            totalDebt: 0,
            totalPaid: 0,
            totalRemaining: 0,
            payments: 0
          };
        }
        byCompany[state.company_id].totalDebt += amount;
        byCompany[state.company_id].totalPaid += paid;
        byCompany[state.company_id].totalRemaining += remaining;
        if (state.payment_date) {
          byCompany[state.company_id].payments++;
        }
      }

      // Agrupar por deudor
      if (state.debtor_id) {
        if (!byDebtor[state.debtor_id]) {
          byDebtor[state.debtor_id] = {
            name: state.debtor_name || 'Deudor',
            totalDebt: 0,
            totalPaid: 0,
            totalRemaining: 0,
            payments: 0
          };
        }
        byDebtor[state.debtor_id].totalDebt += amount;
        byDebtor[state.debtor_id].totalPaid += paid;
        byDebtor[state.debtor_id].totalRemaining += remaining;
        if (state.payment_date) {
          byDebtor[state.debtor_id].payments++;
        }
      }

      // Timeline de pagos
      if (state.payment_date) {
        timeline.push({
          date: new Date(state.payment_date),
          amount: paid,
          type: 'payment',
          entity: state.entity_type,
          company: state.company_name,
          debtor: state.debtor_name
        });
      }
    });

    // Calcular métricas derivadas
    totals.paymentRate = totals.totalDebt > 0 ? (totals.totalPaid / totals.totalDebt) * 100 : 0;
    totals.debtReduction = totals.totalDebt > 0 ? (totals.totalPaid / totals.totalDebt) * 100 : 0;
    
    // Calcular nivel de riesgo
    if (totals.paymentRate < 20) {
      totals.riskLevel = 'high';
    } else if (totals.paymentRate < 50) {
      totals.riskLevel = 'medium';
    } else {
      totals.riskLevel = 'low';
    }

    // Ordenar timeline
    timeline.sort((a, b) => b.date - a.date);

    return {
      totals,
      timeline: timeline.slice(0, 50), // Últimos 50 movimientos
      byCompany: Object.values(byCompany),
      byDebtor: Object.values(byDebtor),
      trends: calculateTrends(timeline),
      predictions: calculatePredictions(totals)
    };
  };

  // Calcular tendencias
  const calculateTrends = (timeline) => {
    if (timeline.length < 2) return { payment: 'stable', volume: 'stable' };

    const recent = timeline.slice(0, 7);
    const previous = timeline.slice(7, 14);

    const recentTotal = recent.reduce((sum, item) => sum + item.amount, 0);
    const previousTotal = previous.reduce((sum, item) => sum + item.amount, 0);

    const paymentTrend = recentTotal > previousTotal * 1.1 ? 'up' : 
                        recentTotal < previousTotal * 0.9 ? 'down' : 'stable';

    return {
      payment: paymentTrend,
      volume: paymentTrend, // Simplificado
      change: previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0
    };
  };

  // Calcular predicciones
  const calculatePredictions = (totals) => {
    const monthlyPaymentRate = totals.totalPayments / 30; // Simplificado
    const projectedMonthlyPayment = monthlyPaymentRate * totals.averagePayment;
    const monthsToComplete = totals.totalRemaining / Math.max(projectedMonthlyPayment, 1);

    return {
      monthlyPayment: projectedMonthlyPayment,
      monthsToComplete: Math.round(monthsToComplete),
      completionDate: new Date(Date.now() + (monthsToComplete * 30 * 24 * 60 * 60 * 1000)),
      confidence: totals.totalPayments > 10 ? 'high' : totals.totalPayments > 5 ? 'medium' : 'low'
    };
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Formatear porcentaje
  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  // Obtener color según tendencia
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono según tendencia
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4" />;
      case 'down': return <ArrowDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  // Obtener color según riesgo
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [isConnected, sharedStates, selectedTimeRange]);

  if (!isConnected) {
    return (
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin Conexión al Ecosistema
            </h3>
            <p className="text-gray-600">
              No hay conexión para sincronizar datos financieros
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loading || !financialData) {
    return (
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Cargando datos financieros..." />
        </div>
      </Card>
    );
  }

  const { totals, trends, predictions } = financialData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className={`font-bold ${compact ? 'text-lg' : 'text-xl'} text-gray-900`}>
                Progreso Financiero Consolidado
              </h2>
              <p className="text-sm text-gray-600">
                Vista unificada del progreso financiero entre portales
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Object.entries(TIME_RANGES).map(([key, range]) => (
                <option key={key} value={key}>{range.label}</option>
              ))}
            </select>
            
            <button
              onClick={loadFinancialData}
              className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Debt className="w-5 h-5 text-blue-600" />
              <Badge variant="secondary" size="sm">
                Total
              </Badge>
            </div>
            <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-blue-900`}>
              {formatCurrency(totals.totalDebt)}
            </div>
            <p className="text-sm text-blue-700">Deuda Total</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge variant="success" size="sm">
                Pagado
              </Badge>
            </div>
            <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-green-900`}>
              {formatCurrency(totals.totalPaid)}
            </div>
            <p className="text-sm text-green-700">Total Pagado</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <Badge variant="warning" size="sm">
                Restante
              </Badge>
            </div>
            <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-orange-900`}>
              {formatCurrency(totals.totalRemaining)}
            </div>
            <p className="text-sm text-orange-700">Por Pagar</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-5 h-5 text-purple-600" />
              <Badge variant="primary" size="sm">
                Progreso
              </Badge>
            </div>
            <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-purple-900`}>
              {formatPercentage(totals.paymentRate)}
            </div>
            <p className="text-sm text-purple-700">Tasa de Pago</p>
          </div>
        </div>
      </Card>

      {/* Tendencias y Predicciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias */}
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
              Tendencias
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getTrendColor(trends.payment)}`}>
                  {getTrendIcon(trends.payment)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pagos</p>
                  <p className="text-sm text-gray-600">Últimos 7 días</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${trends.payment === 'up' ? 'text-green-600' : trends.payment === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {trends.change > 0 ? '+' : ''}{trends.change.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">vs período anterior</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getRiskColor(totals.riskLevel)}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nivel de Riesgo</p>
                  <p className="text-sm text-gray-600">Basado en tasa de pago</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={totals.riskLevel === 'high' ? 'danger' : totals.riskLevel === 'medium' ? 'warning' : 'success'} size="sm">
                  {totals.riskLevel === 'high' ? 'Alto' : totals.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Predicciones */}
        {showPredictions && (
          <Card className={`${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
                Proyecciones
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-green-900">Pago mensual proyectado</p>
                  <Badge variant="success" size="sm">
                    {predictions.confidence === 'high' ? 'Alta confianza' : predictions.confidence === 'medium' ? 'Media confianza' : 'Baja confianza'}
                  </Badge>
                </div>
                <p className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-green-900`}>
                  {formatCurrency(predictions.monthlyPayment)}
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Tiempo estimado para completar</p>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <p className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-blue-900`}>
                    {predictions.monthsToComplete} meses
                  </p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Completado aprox: {predictions.completionDate.toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Resumen por entidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen por empresa */}
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
              Resumen por Empresa
            </h3>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {financialData.byCompany.slice(0, 5).map((company, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{company.name}</p>
                  <Badge variant="secondary" size="sm">
                    {company.payments} pagos
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Deuda</p>
                    <p className="font-medium">{formatCurrency(company.totalDebt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pagado</p>
                    <p className="font-medium text-green-600">{formatCurrency(company.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Restante</p>
                    <p className="font-medium text-orange-600">{formatCurrency(company.totalRemaining)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumen por deudor */}
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
              Resumen por Deudor
            </h3>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {financialData.byDebtor.slice(0, 5).map((debtor, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{debtor.name}</p>
                  <Badge variant="secondary" size="sm">
                    {debtor.payments} pagos
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Deuda</p>
                    <p className="font-medium">{formatCurrency(debtor.totalDebt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pagado</p>
                    <p className="font-medium text-green-600">{formatCurrency(debtor.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Restante</p>
                    <p className="font-medium text-orange-600">{formatCurrency(debtor.totalRemaining)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Timeline de actividad reciente */}
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
              Actividad Reciente
            </h3>
          </div>
          <Badge variant="secondary" size="sm">
            Últimos movimientos
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {financialData.timeline.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    Pago de {formatCurrency(activity.amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.date.toLocaleDateString('es-CL')}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  {activity.company && `${activity.company} • `}
                  {activity.debtor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ConsolidatedFinancialProgress;