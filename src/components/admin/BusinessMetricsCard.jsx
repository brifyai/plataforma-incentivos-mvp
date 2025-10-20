/**
 * Business Metrics Card Component
 * 
 * Componente para mostrar métricas de negocio avanzadas
 * Se integra sin romper el código existente
 */

import React, { useState } from 'react';
import { Card, Badge } from '../common';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const BusinessMetricsCard = ({ metrics, loading }) => {
  const [expanded, setExpanded] = useState(false);

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMetricIcon = (metric) => {
    const icons = {
      customerLifetimeValue: DollarSign,
      churnRate: Users,
      acquisitionCost: Target,
      revenuePerUser: Activity,
      monthlyGrowthRate: TrendingUp,
      averageTransactionValue: DollarSign,
      conversionRate: Target,
      retentionRate: CheckCircle
    };
    return icons[metric] || Info;
  };

  const getMetricColor = (value, inverse = false) => {
    if (inverse) {
      return value > 0 ? 'text-red-600' : 'text-green-600';
    }
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getMetricLabel = (metric) => {
    const labels = {
      customerLifetimeValue: 'CLV',
      churnRate: 'Churn Rate',
      acquisitionCost: 'CAC',
      revenuePerUser: 'ARPU',
      monthlyGrowthRate: 'Crecimiento',
      averageTransactionValue: 'Ticket Promedio',
      conversionRate: 'Conversión',
      retentionRate: 'Retención'
    };
    return labels[metric] || metric;
  };

  const getMetricDescription = (metric) => {
    const descriptions = {
      customerLifetimeValue: 'Valor del cliente a lo largo del tiempo',
      churnRate: 'Tasa de abandono de clientes',
      acquisitionCost: 'Costo de adquisición por cliente',
      revenuePerUser: 'Ingreso promedio por usuario',
      monthlyGrowthRate: 'Tasa de crecimiento mensual',
      averageTransactionValue: 'Valor promedio por transacción',
      conversionRate: 'Tasa de conversión de usuarios',
      retentionRate: 'Tasa de retención de clientes'
    };
    return descriptions[metric] || 'Métrica de negocio';
  };

  const getMetricStatus = (value, type) => {
    if (type === 'positive') {
      return value > 0 ? 'success' : 'danger';
    } else {
      return value < 0 ? 'success' : 'danger';
    }
  };

  const mainMetrics = [
    {
      key: 'customerLifetimeValue',
      label: 'Valor del Cliente (CLV)',
      value: metrics?.customerLifetimeValue || 0,
      formatter: formatCurrency,
      type: 'positive',
      description: 'Valor total que un cliente genera durante su vida útil'
    },
    {
      key: 'revenuePerUser',
      label: 'Ingreso por Usuario (ARPU)',
      value: metrics?.revenuePerUser || 0,
      formatter: formatCurrency,
      type: 'positive',
      description: 'Ingreso promedio generado por cada usuario'
    },
    {
      key: 'churnRate',
      label: 'Tasa de Abandono',
      value: metrics?.churnRate || 0,
      formatter: (v) => `${v.toFixed(1)}%`,
      type: 'negative',
      description: 'Porcentaje de clientes que abandonan el servicio'
    },
    {
      key: 'retentionRate',
      label: 'Tasa de Retención',
      value: metrics?.retentionRate || 0,
      formatter: (v) => `${v.toFixed(1)}%`,
      type: 'positive',
      description: 'Porcentaje de clientes que permanecen activos'
    }
  ];

  const secondaryMetrics = [
    {
      key: 'acquisitionCost',
      label: 'Costo de Adquisición (CAC)',
      value: metrics?.acquisitionCost || 0,
      formatter: formatCurrency,
      type: 'negative',
      description: 'Costo promedio para adquirir un nuevo cliente'
    },
    {
      key: 'monthlyGrowthRate',
      label: 'Crecimiento Mensual',
      value: metrics?.monthlyGrowthRate || 0,
      formatter: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
      type: 'positive',
      description: 'Tasa de crecimiento mensual de la base de usuarios'
    },
    {
      key: 'averageTransactionValue',
      label: 'Ticket Promedio',
      value: metrics?.averageTransactionValue || 0,
      formatter: formatCurrency,
      type: 'positive',
      description: 'Valor promedio de cada transacción'
    },
    {
      key: 'conversionRate',
      label: 'Tasa de Conversión',
      value: metrics?.conversionRate || 0,
      formatter: (v) => `${v.toFixed(1)}%`,
      type: 'positive',
      description: 'Porcentaje de usuarios que realizan una compra'
    }
  ];

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">📊 Métricas de Negocio</h3>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">📊 Métricas de Negocio</h3>
              <p className="text-sm text-secondary-600">Indicadores clave de rendimiento</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {mainMetrics.map((metric) => {
            const Icon = getMetricIcon(metric.key);
            const status = getMetricStatus(metric.value, metric.type);
            
            return (
              <div
                key={metric.key}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-${status === 'success' ? 'green' : 'red'}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${status === 'success' ? 'green' : 'red'}-600`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-secondary-600 font-medium">
                        {metric.label}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={status}
                    size="sm"
                    className="text-xs"
                  >
                    {metric.type === 'positive' && metric.value > 0 && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {metric.type === 'negative' && metric.value < 0 && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {metric.type === 'positive' && metric.value <= 0 && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {metric.type === 'negative' && metric.value >= 0 && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-secondary-900">
                  {metric.formatter(metric.value)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Metrics (Expandable) */}
        {expanded && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryMetrics.map((metric) => {
                const Icon = getMetricIcon(metric.key);
                const status = getMetricStatus(metric.value, metric.type);
                
                return (
                  <div
                    key={metric.key}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-secondary-600" />
                        <span className="text-sm font-medium text-secondary-900">
                          {metric.label}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${getMetricColor(metric.value, metric.type === 'negative')}`}>
                        {metric.formatter(metric.value)}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-500">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Insights */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    💡 Insights de Negocio
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {metrics?.customerLifetimeValue > 100000 && (
                      <li>• Excelente CLV: Los clientes generan alto valor a largo plazo</li>
                    )}
                    {metrics?.churnRate > 10 && (
                      <li>⚠️ Alta tasa de churn: Considera estrategias de retención</li>
                    )}
                    {metrics?.retentionRate > 80 && (
                      <li>✅ Buena retención: La mayoría de clientes permanecen activos</li>
                    )}
                    {metrics?.conversionRate > 5 && (
                      <li>🎯 Buena conversión: Optimiza el funnel de ventas</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BusinessMetricsCard;