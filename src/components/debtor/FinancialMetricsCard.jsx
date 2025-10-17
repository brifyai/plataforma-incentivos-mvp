/**
 * Financial Metrics Card Component
 * 
 * Componente avanzado para mostrar métricas financieras del deudor
 * con visualizaciones interactivas y animaciones
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Target,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const FinancialMetricsCard = ({ 
  financialMetrics, 
  loading = false,
  onRefresh,
  lastUpdated 
}) => {
  const [animatedValues, setAnimatedValues] = useState({
    totalDebt: 0,
    paidAmount: 0,
    remainingDebt: 0,
    paymentProgress: 0
  });

  // Animar valores cuando cambian
  useEffect(() => {
    if (!financialMetrics) return;

    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;

    const startValues = { ...animatedValues };
    const targetValues = {
      totalDebt: financialMetrics.totalDebt,
      paidAmount: financialMetrics.paidAmount,
      remainingDebt: financialMetrics.remainingDebt,
      paymentProgress: financialMetrics.paymentProgress
    };

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setAnimatedValues({
        totalDebt: startValues.totalDebt + (targetValues.totalDebt - startValues.totalDebt) * easeProgress,
        paidAmount: startValues.paidAmount + (targetValues.paidAmount - startValues.paidAmount) * easeProgress,
        remainingDebt: startValues.remainingDebt + (targetValues.remainingDebt - startValues.remainingDebt) * easeProgress,
        paymentProgress: startValues.paymentProgress + (targetValues.paymentProgress - startValues.paymentProgress) * easeProgress
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [financialMetrics]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!financialMetrics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay datos financieros disponibles</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Métricas Financieras</h3>
            <p className="text-blue-100 text-sm">
              {lastUpdated ? `Actualizado: ${lastUpdated.toLocaleTimeString()}` : 'Cargando...'}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            disabled={loading}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Debt */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Deuda Total</span>
              <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-xl font-bold text-gray-900 truncate" title={formatCurrency(animatedValues.totalDebt)}>
              {formatCurrency(animatedValues.totalDebt)}
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-green-50 rounded-lg p-4 min-h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-600 text-sm font-medium">Pagado</span>
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
            <div className="text-xl font-bold text-green-700 truncate" title={formatCurrency(animatedValues.paidAmount)}>
              {formatCurrency(animatedValues.paidAmount)}
            </div>
          </div>

          {/* Remaining Debt */}
          <div className="bg-orange-50 rounded-lg p-4 min-h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-600 text-sm font-medium">Restante</span>
              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
            </div>
            <div className="text-xl font-bold text-orange-700 truncate" title={formatCurrency(animatedValues.remainingDebt)}>
              {formatCurrency(animatedValues.remainingDebt)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de Pago</span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(animatedValues.paymentProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedValues.paymentProgress}%` }}
            >
              <div className="h-full bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Financial Health Score */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Salud Financiera</span>
              <div className="flex-shrink-0">
                {getHealthIcon(financialMetrics.financialHealthScore)}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${getHealthColor(financialMetrics.financialHealthScore)} truncate`}>
                {financialMetrics.financialHealthScore}
              </span>
              <span className="text-gray-500 ml-1">/100</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    financialMetrics.financialHealthScore >= 80 ? 'bg-green-500' :
                    financialMetrics.financialHealthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${financialMetrics.financialHealthScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Next Payment */}
          <div className="bg-blue-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Próximo Pago</span>
              <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
            </div>
            <div className="text-lg font-bold text-blue-900 truncate" title={formatCurrency(financialMetrics.averageMonthlyPayment)}>
              {formatCurrency(financialMetrics.averageMonthlyPayment)}
            </div>
            <div className="text-sm text-blue-600 truncate">
              {new Date(financialMetrics.nextPaymentDue).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short'
              })}
            </div>
          </div>

          {/* Payment Consistency */}
          <div className="bg-purple-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Consistencia</span>
              <Target className="h-4 w-4 text-purple-500 flex-shrink-0" />
            </div>
            <div className="text-lg font-bold text-purple-900 truncate">
              {financialMetrics.paymentConsistency}%
            </div>
            <div className="text-sm text-purple-600 truncate">
              {financialMetrics.onTimePayments} pagos a tiempo
            </div>
          </div>

          {/* Debt Reduction Rate */}
          <div className="bg-green-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Reducción Mensual</span>
              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
            <div className="text-lg font-bold text-green-900 truncate">
              {financialMetrics.debtReductionRate}%
            </div>
            <div className="text-sm text-green-600 truncate" title={formatCurrency(financialMetrics.savedInInterest)}>
              {formatCurrency(financialMetrics.savedInInterest)} ahorrados
            </div>
          </div>
        </div>

        {/* Projected Payoff */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <span className="text-sm font-medium text-indigo-700">Proyección Liquidación</span>
              <div className="text-lg font-bold text-indigo-900 truncate" title={new Date(financialMetrics.projectedPayoffDate).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}>
                {new Date(financialMetrics.projectedPayoffDate).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <Award className="h-8 w-8 text-indigo-500 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialMetricsCard;