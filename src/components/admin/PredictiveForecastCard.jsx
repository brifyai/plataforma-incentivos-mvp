/**
 * Predictive Forecast Card Component
 * 
 * Componente para visualizar predicciones y forecasting de métricas
 * Integración con el servicio de analytics predictivos
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { predictiveAnalyticsService } from '../../services/predictiveAnalyticsService';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  AlertTriangle,
  Target,
  Activity,
  Calendar,
  BarChart3,
  LineChart,
  RefreshCw,
  Info
} from 'lucide-react';

const PredictiveForecastCard = ({ currentMetrics, onAlertGenerated }) => {
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState(7);
  const [showDetails, setShowDetails] = useState(false);

  // Cargar predicciones al montar el componente
  useEffect(() => {
    loadPredictions();
  }, [selectedTimeHorizon]);

  // Configurar actualización periódica de predicciones
  useEffect(() => {
    const interval = setInterval(() => {
      loadPredictions();
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval);
  }, [selectedTimeHorizon]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar predicciones
      const newPredictions = await predictiveAnalyticsService.generatePredictions(selectedTimeHorizon);
      
      // Detectar anomalías
      const currentData = prepareDataForAnomalyDetection(currentMetrics);
      const newAnomalies = await predictiveAnalyticsService.detectAnomalies(currentData);
      
      // Generar alertas inteligentes
      const newAlerts = await predictiveAnalyticsService.generateIntelligentAlerts(
        newPredictions,
        newAnomalies,
        currentMetrics
      );

      setPredictions(newPredictions);
      setAnomalies(newAnomalies);
      setAlerts(newAlerts);

      // Notificar al componente padre sobre nuevas alertas
      if (onAlertGenerated && newAlerts.length > 0) {
        onAlertGenerated(newAlerts);
      }

    } catch (err) {
      console.error('Error cargando predicciones:', err);
      setError('Error al cargar predicciones');
    } finally {
      setLoading(false);
    }
  };

  const prepareDataForAnomalyDetection = (metrics) => {
    return {
      revenue: metrics?.revenueHistory || [],
      users: metrics?.userHistory || [],
      payments: metrics?.paymentHistory || [],
      conversion_rate: metrics?.conversionHistory || []
    };
  };

  const getForecastIcon = (type) => {
    const icons = {
      revenue: DollarSign,
      users: Users,
      growth: TrendingUp,
      churn: AlertTriangle
    };
    return icons[type] || LineChart;
  };

  const getForecastColor = (prediction) => {
    if (!prediction || prediction.length === 0) return 'gray';
    
    const lastPrediction = prediction[prediction.length - 1];
    const currentValue = currentMetrics?.[prediction.type] || 0;
    const change = (lastPrediction.predicted - currentValue) / currentValue;
    
    if (change > 0.1) return 'green';
    if (change < -0.1) return 'red';
    return 'yellow';
  };

  const formatPredictionValue = (value, type) => {
    switch (type) {
      case 'revenue':
        return formatCurrency(value);
      case 'users':
        return Math.floor(value).toLocaleString();
      case 'growth':
        return `${(value * 100).toFixed(1)}%`;
      case 'churn':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value.toFixed(2);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !predictions) {
    return (
      <Card className="animate-pulse">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">🤖 Predicciones Inteligentes</h3>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error en Predicciones</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadPredictions} variant="outline" size="sm">
            Reintentar
          </Button>
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
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">🤖 Predicciones Inteligentes</h3>
              <p className="text-sm text-secondary-600">Analytics predictivos con Machine Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeHorizon}
              onChange={(e) => setSelectedTimeHorizon(Number(e.target.value))}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPredictions}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Alertas Críticas */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-xs mt-1">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium">
                        Confianza: {Math.round((alert.confidence || 0) * 100)}%
                      </span>
                      {alert.predicted_date && (
                        <span className="text-xs">
                          Fecha: {formatDate(alert.predicted_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Predicciones Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Predicción de Ingresos */}
          {predictions?.revenue && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Ingresos Proyectados</span>
                </div>
                <Badge variant="primary" size="sm">
                  {selectedTimeHorizon}d
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-900">
                  {formatPredictionValue(
                    predictions.revenue[predictions.revenue.length - 1]?.predicted || 0,
                    'revenue'
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700">
                    Cambio: {predictions.revenue[predictions.revenue.length - 1]?.predicted > (currentMetrics?.revenue || 0) ? '+' : ''}
                    {formatPredictionValue(
                      (predictions.revenue[predictions.revenue.length - 1]?.predicted || 0) - (currentMetrics?.revenue || 0),
                      'revenue'
                    )}
                  </span>
                  <span className={getConfidenceColor(
                    predictions.revenue[predictions.revenue.length - 1]?.confidence || 0
                  )}>
                    {Math.round((predictions.revenue[predictions.revenue.length - 1]?.confidence || 0) * 100)}% confianza
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Predicción de Crecimiento */}
          {predictions?.growth && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Tasa de Crecimiento</span>
                </div>
                <Badge variant="success" size="sm">
                  {selectedTimeHorizon}d
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-900">
                  {formatPredictionValue(
                    predictions.growth[predictions.growth.length - 1]?.growth_rate || 0,
                    'growth'
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">
                    Usuarios: {predictions.growth[predictions.growth.length - 1]?.predicted_users?.toLocaleString() || 0}
                  </span>
                  <span className={getConfidenceColor(
                    predictions.growth[predictions.growth.length - 1]?.confidence || 0
                  )}>
                    {Math.round((predictions.growth[predictions.growth.length - 1]?.confidence || 0) * 100)}% confianza
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anomalías Detectadas */}
        {anomalies.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-secondary-900">🔍 Anomalías Detectadas</h4>
              <Badge variant="warning" size="sm">
                {anomalies.length} activas
              </Badge>
            </div>
            <div className="space-y-2">
              {anomalies.slice(0, 3).map((anomaly, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-900 truncate">
                      {anomaly.metric}: {anomaly.description}
                    </p>
                    <p className="text-xs text-orange-700">
                      Confianza: {Math.round((anomaly.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalles Expandibles */}
        <div className="border-t border-gray-200 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            <Info className="w-4 h-4 mr-2" />
            {showDetails ? 'Ocultar' : 'Ver'} detalles del modelo
          </Button>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Estadísticas del Modelo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Modelos cargados:</span>
                  <span className="ml-2 font-medium">{predictiveAnalyticsService.getModelStats().models_loaded}</span>
                </div>
                <div>
                  <span className="text-gray-600">Entrenando:</span>
                  <span className="ml-2 font-medium">
                    {predictiveAnalyticsService.getModelStats().is_training ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Datos históricos:</span>
                  <span className="ml-2 font-medium">
                    {predictiveAnalyticsService.getModelStats().historical_data_points}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Última predicción:</span>
                  <span className="ml-2 font-medium">
                    {predictiveAnalyticsService.getCachedPredictions()?.timestamp 
                      ? formatDate(predictiveAnalyticsService.getCachedPredictions().timestamp)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PredictiveForecastCard;