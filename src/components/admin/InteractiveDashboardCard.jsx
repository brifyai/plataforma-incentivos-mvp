/**
 * Interactive Dashboard Card Component
 * 
 * Componente para dashboard interactivo avanzado con streaming
 * Visualizaciones de datos en tiempo real y controles interactivos
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Badge, Button } from '../common';
import { streamingAnalyticsService } from '../../services/streamingAnalyticsService';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Download,
  Maximize2,
  Grid,
  List,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';

const InteractiveDashboardCard = ({ userId, userProfile }) => {
  const [realtimeData, setRealtimeData] = useState({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('realtime');
  const [selectedView, setSelectedView] = useState('grid');
  const [selectedMetrics, setSelectedMetrics] = useState(['user_events', 'transactions', 'system_metrics']);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  
  const containerRef = useRef(null);

  // Inicializar servicio de streaming
  useEffect(() => {
    const initializeStreaming = async () => {
      try {
        await streamingAnalyticsService.initialize();
        
        // Suscribirse a streams seleccionados
        const newSubscriptions = selectedMetrics.map(metric => {
          return streamingAnalyticsService.subscribe(metric, (data) => {
            setRealtimeData(prev => ({
              ...prev,
              [metric]: data
            }));
          }, { sendCurrentData: true });
        });
        
        setSubscriptions(newSubscriptions);
        
        // Suscribirse a heartbeat
        const heartbeatSub = streamingAnalyticsService.subscribe('heartbeat', (data) => {
          console.log('Heartbeat recibido:', data);
        });
        
        setSubscriptions(prev => [...prev, heartbeatSub]);
        
      } catch (error) {
        console.error('Error inicializando streaming:', error);
      }
    };

    initializeStreaming();

    // Cleanup
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [selectedMetrics]);

  // Actualizar suscripciones cuando cambian las métricas seleccionadas
  useEffect(() => {
    // Limpiar suscripciones anteriores
    subscriptions.forEach(sub => sub.unsubscribe());
    
    // Crear nuevas suscripciones
    const newSubscriptions = selectedMetrics.map(metric => {
      return streamingAnalyticsService.subscribe(metric, (data) => {
        setRealtimeData(prev => ({
          ...prev,
          [metric]: data
        }));
      }, { sendCurrentData: true });
    });
    
    setSubscriptions(newSubscriptions);
  }, [selectedMetrics]);

  // Control de reproducción
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      streamingAnalyticsService.stop();
    } else {
      streamingAnalyticsService.reconnect();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Actualizar datos
  const refreshData = useCallback(() => {
    streamingAnalyticsService.reconnect();
  }, []);

  // Obtener datos agregados
  const getAggregatedData = useCallback((metric, timeRange) => {
    return streamingAnalyticsService.getAggregatedData(metric, timeRange);
  }, []);

  // Formatear valor numérico
  const formatValue = useCallback((value, metric) => {
    if (typeof value !== 'number') return '0';
    
    switch (metric) {
      case 'transactions':
        return `$${(value / 1000).toFixed(1)}K`;
      case 'system_metrics':
        return `${value.toFixed(1)}%`;
      case 'user_events':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }, []);

  // Obtener icono de métrica
  const getMetricIcon = useCallback((metric) => {
    const icons = {
      user_events: Activity,
      transactions: BarChart3,
      system_metrics: Zap,
      business_events: TrendingUp
    };
    return icons[metric] || Activity;
  }, []);

  // Obtener color de tendencia
  const getTrendColor = useCallback((trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }, []);

  // Obtener datos del gráfico
  const getChartData = useCallback((metric) => {
    const data = realtimeData[metric];
    if (!data) return [];

    // Generar datos para el gráfico basados en el buffer
    const buffer = streamingAnalyticsService.dataBuffer.get(metric) || [];
    
    return buffer.slice(-50).map((item, index) => ({
      name: new Date(item.timestamp).toLocaleTimeString(),
      value: streamingAnalyticsService.extractNumericValue(item.data),
      timestamp: item.timestamp
    }));
  }, [realtimeData]);

  // Obtener métricas del stream
  const getStreamMetrics = useCallback((metric) => {
    return streamingAnalyticsService.getStreamMetrics(metric);
  }, []);

  // Alternar vista
  const toggleView = useCallback(() => {
    setSelectedView(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  // Alternar pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Exportar datos
  const exportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      metrics: selectedMetrics,
      data: realtimeData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [realtimeData, selectedTimeRange, selectedMetrics]);

  // Configurar métricas
  const toggleMetric = useCallback((metric) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(m => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  }, []);

  if (!streamingAnalyticsService.isConnected) {
    return (
      <Card className="animate-pulse">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inicializando Dashboard Interactivo
          </h3>
          <p className="text-sm text-gray-600">
            Conectando a fuentes de datos en tiempo real...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 m-0' : ''}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">📊 Dashboard Interactivo</h3>
              <p className="text-sm text-secondary-600">Streaming en tiempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Control de reproducción */}
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              className={isPlaying ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            {/* Actualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            {/* Vista */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
            >
              {selectedView === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>

            {/* Pantalla completa */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            {/* Exportar */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Controles */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Selector de rango de tiempo */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="realtime">Tiempo Real</option>
              <option value="short_term">Últimos 5 min</option>
              <option value="medium_term">Últimos 30 min</option>
              <option value="long_term">Últimas 2 horas</option>
            </select>
          </div>

          {/* Selector de métricas */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <div className="flex gap-2">
              {['user_events', 'transactions', 'system_metrics', 'business_events'].map(metric => (
                <Button
                  key={metric}
                  variant={selectedMetrics.includes(metric) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => toggleMetric(metric)}
                  className="text-xs"
                >
                  {metric.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Estado de conexión */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${streamingAnalyticsService.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {streamingAnalyticsService.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Métricas en tiempo real */}
        <div className={`mb-6 ${selectedView === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-4'}`}>
          {selectedMetrics.map(metric => {
            const Icon = getMetricIcon(metric);
            const data = realtimeData[metric];
            const streamMetrics = getStreamMetrics(metric);
            const chartData = getChartData(metric);
            const aggregatedData = getAggregatedData(metric, selectedTimeRange);

            return (
              <div
                key={metric}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-300"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {metric.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data?.processed && (
                      <Badge variant="success" size="sm">
                        Activo
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {streamMetrics?.subscribersCount || 0} suscriptores
                    </span>
                  </div>
                </div>

                {/* Valor actual */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {data?.value ? formatValue(data.value, metric) : '0'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {streamMetrics?.lastUpdate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(streamMetrics.lastUpdate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mini gráfico */}
                <div className="mb-3 h-24">
                  <div className="h-full flex items-end justify-between">
                    {chartData.slice(-20).map((point, index) => (
                      <div
                        key={index}
                        className="flex-1 mx-px bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max(10, (point.value / Math.max(...chartData.map(p => p.value))) * 100)}%`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium text-gray-900">
                      {streamMetrics?.messageCount || 0}
                    </span>
                  </div>
                  {data?.trend && (
                    <div className="flex items-center gap-1">
                      {data.trend === 'increasing' ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : data.trend === 'decreasing' ? (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                      <span className={getTrendColor(data.trend)}>
                        {data.trend}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alertas */}
                {data?.alert && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-800">
                        {data.alert.message}
                      </span>
                    </div>
                  </div>
                )}

                {/* Detalles expandibles */}
                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buffer:</span>
                        <span className="font-medium text-gray-900">
                          {streamMetrics?.bufferSize || 0} items
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agregado ({selectedTimeRange}):</span>
                        <span className="font-medium text-gray-900">
                          {formatValue(aggregatedData, metric)}
                        </span>
                      </div>
                      {data?.stats && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Riesgo:</span>
                          <span className="font-medium text-gray-900">
                            {data.riskScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controles adicionales */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showDetails ? 'Ocultar' : 'Mostrar'} detalles
          </Button>

          <div className="text-xs text-gray-500">
            {streamingAnalyticsService.isConnected && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Streaming activo
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InteractiveDashboardCard;