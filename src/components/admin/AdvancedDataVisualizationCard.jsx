/**
 * Advanced Data Visualization Card Component
 * 
 * Componente para visualizaciones de datos avanzadas con gráficos interactivos,
 * análisis multidimensional y representaciones visuales complejas
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, Badge, Button } from '../common';
import { streamingAnalyticsService } from '../../services/streamingAnalyticsService';
import { advancedAIService } from '../../services/advancedAIService';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  EyeOff,
  Download,
  Settings,
  Maximize2,
  RefreshCw,
  Filter,
  Calendar,
  Layers,
  Database,
  Brain,
  Target,
  AlertTriangle,
  Info,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  List
} from 'lucide-react';

const AdvancedDataVisualizationCard = ({ userId, userProfile }) => {
  const [visualizationData, setVisualizationData] = useState({});
  const [selectedVizType, setSelectedVizType] = useState('multi-dimensional');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'users', 'engagement', 'performance']);
  const [timeRange, setTimeRange] = useState('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('realtime');
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Tipos de visualización disponibles
  const visualizationTypes = [
    { id: 'multi-dimensional', name: 'Multidimensional', icon: Grid3X3, description: 'Análisis de múltiples dimensiones' },
    { id: 'temporal-evolution', name: 'Evolución Temporal', icon: LineChart, description: 'Tendencias a lo largo del tiempo' },
    { id: 'correlation-matrix', name: 'Matriz de Correlación', icon: ScatterChart, description: 'Relaciones entre variables' },
    { id: 'performance-radar', name: 'Rendimiento Radar', icon: Target, description: 'Métricas de rendimiento' },
    { id: 'predictive-forecast', name: 'Pronóstico Predictivo', icon: TrendingUp, description: 'Predicciones con IA' },
    { id: 'anomaly-detection', name: 'Detección de Anomalías', icon: AlertTriangle, description: 'Identificación de patrones anómalos' }
  ];

  // Métricas disponibles
  const availableMetrics = [
    { id: 'revenue', name: 'Ingresos', unit: '$', color: '#10b981' },
    { id: 'users', name: 'Usuarios', unit: '', color: '#3b82f6' },
    { id: 'engagement', name: 'Engagement', unit: '%', color: '#8b5cf6' },
    { id: 'performance', name: 'Rendimiento', unit: 'ms', color: '#f59e0b' },
    { id: 'conversion', name: 'Conversión', unit: '%', color: '#ef4444' },
    { id: 'retention', name: 'Retención', unit: '%', color: '#06b6d4' }
  ];

  // Inicializar datos de visualización
  useEffect(() => {
    const initializeVisualization = async () => {
      setIsLoading(true);
      try {
        // Obtener datos del streaming service
        const streamingData = {};
        for (const metric of selectedMetrics) {
          streamingData[metric] = streamingAnalyticsService.getAggregatedData(metric, timeRange);
        }

        // Obtener insights de IA
        const aiInsights = await advancedAIService.generateInsights(streamingData, {
          analysisType: selectedVizType,
          timeRange,
          userProfile
        });

        setVisualizationData(streamingData);
        setInsights(aiInsights);
      } catch (error) {
        console.error('Error inicializando visualización:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVisualization();
  }, [selectedMetrics, timeRange, selectedVizType, userProfile]);

  // Generar datos para visualización
  const generateVisualizationData = useCallback(() => {
    const baseData = Object.values(visualizationData);
    
    switch (selectedVizType) {
      case 'multi-dimensional':
        return generateMultiDimensionalData(baseData);
      case 'temporal-evolution':
        return generateTemporalEvolutionData(baseData);
      case 'correlation-matrix':
        return generateCorrelationMatrixData(baseData);
      case 'performance-radar':
        return generatePerformanceRadarData(baseData);
      case 'predictive-forecast':
        return generatePredictiveForecastData(baseData);
      case 'anomaly-detection':
        return generateAnomalyDetectionData(baseData);
      default:
        return baseData;
    }
  }, [visualizationData, selectedVizType]);

  // Generar datos multidimensionales
  const generateMultiDimensionalData = (data) => {
    return {
      type: 'multi-dimensional',
      dimensions: selectedMetrics.map(metric => ({
        name: metric,
        values: generateTimeSeriesData(metric, 30),
        metadata: availableMetrics.find(m => m.id === metric)
      })),
      correlations: calculateCorrelations(data)
    };
  };

  // Generar datos de evolución temporal
  const generateTemporalEvolutionData = (data) => {
    return {
      type: 'temporal-evolution',
      series: selectedMetrics.map(metric => ({
        name: metric,
        data: generateTimeSeriesData(metric, 90),
        color: availableMetrics.find(m => m.id === metric)?.color || '#3b82f6'
      })),
      trends: calculateTrends(data)
    };
  };

  // Generar matriz de correlación
  const generateCorrelationMatrixData = (data) => {
    const matrix = [];
    for (let i = 0; i < selectedMetrics.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < selectedMetrics.length; j++) {
        matrix[i][j] = calculateCorrelation(
          visualizationData[selectedMetrics[i]],
          visualizationData[selectedMetrics[j]]
        );
      }
    }
    
    return {
      type: 'correlation-matrix',
      matrix,
      labels: selectedMetrics,
      colors: generateHeatmapColors(matrix)
    };
  };

  // Generar datos de radar
  const generatePerformanceRadarData = (data) => {
    return {
      type: 'performance-radar',
      axes: selectedMetrics.map(metric => ({
        metric,
        value: normalizeValue(visualizationData[metric]),
        maxValue: 100,
        color: availableMetrics.find(m => m.id === metric)?.color || '#3b82f6'
      })),
      benchmarks: generateBenchmarks(selectedMetrics)
    };
  };

  // Generar datos predictivos
  const generatePredictiveForecastData = (data) => {
    return {
      type: 'predictive-forecast',
      historical: selectedMetrics.map(metric => ({
        metric,
        data: generateTimeSeriesData(metric, 60)
      })),
      predictions: selectedMetrics.map(metric => ({
        metric,
        forecast: generateForecastData(metric, 30),
        confidence: calculateConfidence(visualizationData[metric])
      }))
    };
  };

  // Generar datos de detección de anomalías
  const generateAnomalyDetectionData = (data) => {
    return {
      type: 'anomaly-detection',
      data: selectedMetrics.map(metric => ({
        metric,
        points: generateTimeSeriesData(metric, 100),
        anomalies: detectAnomalies(visualizationData[metric])
      })),
      patterns: identifyPatterns(data)
    };
  };

  // Generar datos de serie temporal simulados
  const generateTimeSeriesData = (metric, days) => {
    const data = [];
    const now = new Date();
    const baseValue = Math.random() * 1000 + 500;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simular variación con tendencia
      const trend = (days - i) * 2;
      const noise = (Math.random() - 0.5) * 100;
      const seasonal = Math.sin(i / 7 * Math.PI) * 50;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + trend + noise + seasonal),
        timestamp: date.getTime()
      });
    }
    
    return data;
  };

  // Calcular correlaciones
  const calculateCorrelations = (data) => {
    const correlations = {};
    for (let i = 0; i < selectedMetrics.length; i++) {
      for (let j = i + 1; j < selectedMetrics.length; j++) {
        const metric1 = selectedMetrics[i];
        const metric2 = selectedMetrics[j];
        const correlation = calculateCorrelation(data[metric1], data[metric2]);
        correlations[`${metric1}-${metric2}`] = correlation;
      }
    }
    return correlations;
  };

  // Calcular correlación entre dos conjuntos de datos
  const calculateCorrelation = (data1, data2) => {
    if (!data1 || !data2) return 0;
    
    const n = Math.min(data1.length, data2.length);
    if (n === 0) return 0;
    
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    for (let i = 0; i < n; i++) {
      const val1 = typeof data1[i] === 'object' ? data1[i].value || 0 : data1[i] || 0;
      const val2 = typeof data2[i] === 'object' ? data2[i].value || 0 : data2[i] || 0;
      
      sum1 += val1;
      sum2 += val2;
      sum1Sq += val1 * val1;
      sum2Sq += val2 * val2;
      pSum += val1 * val2;
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
  };

  // Calcular tendencias
  const calculateTrends = (data) => {
    const trends = {};
    selectedMetrics.forEach(metric => {
      const values = data[metric];
      if (values && values.length > 1) {
        const firstValue = values[0].value || 0;
        const lastValue = values[values.length - 1].value || 0;
        const change = ((lastValue - firstValue) / firstValue) * 100;
        trends[metric] = {
          change,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      }
    });
    return trends;
  };

  // Generar colores para heatmap
  const generateHeatmapColors = (matrix) => {
    const colors = [];
    for (let i = 0; i < matrix.length; i++) {
      colors[i] = [];
      for (let j = 0; j < matrix[i].length; j++) {
        const value = matrix[i][j];
        const intensity = Math.abs(value);
        if (value > 0) {
          colors[i][j] = `rgba(34, 197, 94, ${intensity})`; // verde
        } else if (value < 0) {
          colors[i][j] = `rgba(239, 68, 68, ${intensity})`; // rojo
        } else {
          colors[i][j] = 'rgba(156, 163, 175, 0.3)'; // gris
        }
      }
    }
    return colors;
  };

  // Normalizar valor
  const normalizeValue = (value) => {
    if (!value) return 0;
    const num = typeof value === 'object' ? value.value || 0 : value;
    return Math.min(100, Math.max(0, (num / 1000) * 100));
  };

  // Generar benchmarks
  const generateBenchmarks = (metrics) => {
    return metrics.map(metric => ({
      metric,
      industry: Math.random() * 80 + 20,
      top: Math.random() * 20 + 80,
      average: Math.random() * 40 + 40
    }));
  };

  // Generar datos de pronóstico
  const generateForecastData = (metric, days) => {
    const data = [];
    const now = new Date();
    const baseValue = Math.random() * 1000 + 500;
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Simular crecimiento con incertidumbre
      const growth = i * 5;
      const uncertainty = (Math.random() - 0.5) * i * 10;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + growth + uncertainty),
        upperBound: baseValue + growth + Math.abs(uncertainty) * 2,
        lowerBound: Math.max(0, baseValue + growth - Math.abs(uncertainty) * 2)
      });
    }
    
    return data;
  };

  // Calcular confianza
  const calculateConfidence = (data) => {
    if (!data || data.length < 10) return 0.5;
    
    // Simular cálculo de confianza basado en la volatilidad
    const values = data.map(d => typeof d === 'object' ? d.value || 0 : d || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Menor volatilidad = mayor confianza
    return Math.max(0.3, Math.min(0.95, 1 - (stdDev / mean)));
  };

  // Detectar anomalías
  const detectAnomalies = (data) => {
    if (!data || data.length < 10) return [];
    
    const values = data.map(d => typeof d === 'object' ? d.value || 0 : d || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    const anomalies = [];
    const threshold = 2 * stdDev; // 2 desviaciones estándar
    
    data.forEach((point, index) => {
      const value = typeof point === 'object' ? point.value || 0 : point || 0;
      if (Math.abs(value - mean) > threshold) {
        anomalies.push({
          index,
          value,
          date: point.date || new Date().toISOString(),
          severity: Math.abs(value - mean) / stdDev
        });
      }
    });
    
    return anomalies;
  };

  // Identificar patrones
  const identifyPatterns = (data) => {
    const patterns = [];
    
    // Simular detección de patrones
    if (Math.random() > 0.7) {
      patterns.push({
        type: 'seasonal',
        description: 'Patrón estacional detectado',
        confidence: Math.random() * 0.3 + 0.7
      });
    }
    
    if (Math.random() > 0.8) {
      patterns.push({
        type: 'trend',
        description: 'Tendencia alcista sostenida',
        confidence: Math.random() * 0.3 + 0.7
      });
    }
    
    return patterns;
  };

  // Renderizar visualización
  const renderVisualization = () => {
    const vizData = generateVisualizationData();
    
    switch (selectedVizType) {
      case 'multi-dimensional':
        return renderMultiDimensional(vizData);
      case 'temporal-evolution':
        return renderTemporalEvolution(vizData);
      case 'correlation-matrix':
        return renderCorrelationMatrix(vizData);
      case 'performance-radar':
        return renderPerformanceRadar(vizData);
      case 'predictive-forecast':
        return renderPredictiveForecast(vizData);
      case 'anomaly-detection':
        return renderAnomalyDetection(vizData);
      default:
        return <div>Visualización no disponible</div>;
    }
  };

  // Renderizar visualización multidimensional
  const renderMultiDimensional = (data) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {data.dimensions?.map((dim, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{dim.name}</h4>
              <div className="h-32 flex items-end justify-between">
                {dim.values?.slice(-20).map((point, i) => (
                  <div
                    key={i}
                    className="flex-1 mx-px bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.max(10, (point.value / Math.max(...dim.values.map(v => v.value))) * 100)}%`,
                      backgroundColor: dim.metadata?.color || '#3b82f6'
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Correlaciones</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(data.correlations || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className={`font-medium ${value > 0.5 ? 'text-green-600' : value < -0.5 ? 'text-red-600' : 'text-gray-600'}`}>
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar evolución temporal
  const renderTemporalEvolution = (data) => {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Evolución Temporal</h4>
          <div className="h-48 relative">
            {data.series?.map((series, index) => (
              <div key={index} className="absolute inset-0">
                <svg className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2"
                    points={series.data?.map((point, i) => {
                      const x = (i / (series.data.length - 1)) * 100;
                      const y = 100 - ((point.value / Math.max(...series.data.map(d => d.value))) * 100);
                      return `${x}%,${y}%`;
                    }).join(' ')}
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data.trends || {}).map(([metric, trend]) => (
            <div key={metric} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{metric}</span>
                <div className="flex items-center gap-1">
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : trend.direction === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-400 rounded-full" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend.direction === 'up' ? 'text-green-600' : 
                    trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar matriz de correlación
  const renderCorrelationMatrix = (data) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Matriz de Correlación</h4>
          <div className="grid grid-cols-4 gap-1">
            {data.labels?.map((label, i) => (
              <div key={i} className="text-xs font-medium text-gray-700 p-2 text-center">
                {label}
              </div>
            ))}
            {data.matrix?.map((row, i) => (
              <React.Fragment key={i}>
                <div className="text-xs font-medium text-gray-700 p-2 text-center">
                  {data.labels[i]}
                </div>
                {row.map((value, j) => (
                  <div
                    key={j}
                    className="p-2 text-center text-xs font-medium rounded"
                    style={{ backgroundColor: data.colors[i][j] }}
                  >
                    {value.toFixed(2)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar radar de rendimiento
  const renderPerformanceRadar = (data) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Rendimiento Radar</h4>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Simulación de gráfico radar */}
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Círculos concéntricos */}
                {[20, 40, 60, 80, 100].map((radius, i) => (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r={radius * 0.8}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Ejes */}
                {data.axes?.map((axis, i) => {
                  const angle = (i * 2 * Math.PI) / data.axes.length - Math.PI / 2;
                  const x = 100 + Math.cos(angle) * 80;
                  const y = 100 + Math.sin(angle) * 80;
                  
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  );
                })}
                
                {/* Polígono de datos */}
                {data.axes && (
                  <polygon
                    points={data.axes.map((axis, i) => {
                      const angle = (i * 2 * Math.PI) / data.axes.length - Math.PI / 2;
                      const distance = (axis.value / 100) * 80;
                      const x = 100 + Math.cos(angle) * distance;
                      const y = 100 + Math.sin(angle) * distance;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.axes?.map((axis, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{axis.metric}:</span>
                <span className="font-medium" style={{ color: axis.color }}>
                  {axis.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar pronóstico predictivo
  const renderPredictiveForecast = (data) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Pronóstico Predictivo</h4>
          <div className="space-y-3">
            {data.predictions?.map((pred, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{pred.metric}</span>
                  <Badge variant={pred.confidence > 0.8 ? 'success' : pred.confidence > 0.6 ? 'warning' : 'danger'}>
                    {Math.round(pred.confidence * 100)}% confianza
                  </Badge>
                </div>
                <div className="h-16 relative">
                  <div className="absolute inset-0 flex items-end justify-between">
                    {pred.forecast?.slice(-10).map((point, i) => (
                      <div key={i} className="flex-1 mx-px">
                        <div
                          className="bg-blue-500 rounded-t"
                          style={{ height: `${(point.value / 2000) * 100}%` }}
                        />
                        <div
                          className="bg-blue-200 rounded-t mt-px"
                          style={{ 
                            height: `${((point.upperBound - point.value) / 2000) * 100}%` 
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar detección de anomalías
  const renderAnomalyDetection = (data) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Detección de Anomalías</h4>
          <div className="space-y-3">
            {data.data?.map((item, index) => (
              <div key={index} className="border-l-4 border-gray-300 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.metric}</span>
                  {item.anomalies.length > 0 && (
                    <Badge variant="danger">
                      {item.anomalies.length} anomalías
                    </Badge>
                  )}
                </div>
                <div className="h-16 relative">
                  <div className="absolute inset-0 flex items-end justify-between">
                    {item.points?.slice(-30).map((point, i) => {
                      const isAnomaly = item.anomalies.some(a => a.index === i);
                      return (
                        <div
                          key={i}
                          className={`flex-1 mx-px rounded-t ${
                            isAnomaly ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ height: `${(point.value / 2000) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
                {item.anomalies.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    Anomalías detectadas en los últimos 30 días
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {data.patterns?.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Patrones Identificados</h4>
            <div className="space-y-2">
              {data.patterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">{pattern.description}</span>
                  <Badge variant="info">
                    {Math.round(pattern.confidence * 100)}% confianza
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Exportar visualización
  const exportVisualization = useCallback(() => {
    const data = {
      type: selectedVizType,
      timeRange,
      metrics: selectedMetrics,
      data: generateVisualizationData(),
      insights,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `visualization_${selectedVizType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [selectedVizType, timeRange, selectedMetrics, insights]);

  // Alternar pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando Visualización Avanzada
          </h3>
          <p className="text-sm text-gray-600">
            Procesando datos y generando insights...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 m-0' : ''}`}>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">🧠 Visualización Avanzada</h3>
              <p className="text-sm text-secondary-600">Análisis multidimensional con IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Configuración */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Vista */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
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
              onClick={exportVisualization}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Panel de configuración */}
        {showConfig && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Tipo de visualización */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Visualización
              </label>
              <div className="grid grid-cols-3 gap-2">
                {visualizationTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant={selectedVizType === type.id ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedVizType(type.id)}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{type.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Métricas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métricas Seleccionadas
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMetrics.map(metric => (
                  <Button
                    key={metric.id}
                    variant={selectedMetrics.includes(metric.id) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedMetrics(prev => 
                        prev.includes(metric.id) 
                          ? prev.filter(m => m !== metric.id)
                          : [...prev, metric.id]
                      );
                    }}
                    className="text-xs"
                  >
                    {metric.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rango de tiempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Tiempo
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
            </div>
          </div>
        )}

        {/* Insights de IA */}
        {insights.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights de IA
            </h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-purple-800">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visualización principal */}
        <div className="mb-6">
          {renderVisualization()}
        </div>

        {/* Controles adicionales */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              {selectedMetrics.length} métricas
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {timeRange}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            <span>Actualizado en tiempo real</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdvancedDataVisualizationCard;
