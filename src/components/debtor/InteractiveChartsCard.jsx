/**
 * Interactive Charts Card Component
 * 
 * Componente para mostrar visualizaciones interactivas avanzadas
 * con gráficos personalizables y análisis de datos financieros
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Calendar,
  Download,
  Settings,
  RefreshCw,
  Filter,
  Maximize2,
  ArrowRight
} from 'lucide-react';

const InteractiveChartsCard = ({ 
  visualizationData, 
  loading = false,
  onRefresh,
  onExport,
  userId 
}) => {
  const navigate = useNavigate();
  const [selectedChart, setSelectedChart] = useState('payment_history');
  const [timeRange, setTimeRange] = useState('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartData, setChartData] = useState(null);
  const canvasRef = useRef(null);

  const chartTypes = [
    {
      id: 'payment_history',
      title: 'Historial de Pagos',
      icon: BarChart3,
      description: 'Visualización de tus pagos a lo largo del tiempo',
      color: 'blue'
    },
    {
      id: 'debt_trend',
      title: 'Tendencia de Deuda',
      icon: TrendingUp,
      description: 'Evolución de tu deuda total',
      color: 'green'
    },
    {
      id: 'payment_distribution',
      title: 'Distribución de Pagos',
      icon: PieChart,
      description: 'Análisis de métodos y categorías',
      color: 'purple'
    },
    {
      id: 'financial_health',
      title: 'Salud Financiera',
      icon: Activity,
      description: 'Indicadores clave de tu salud financiera',
      color: 'orange'
    }
  ];

  const timeRanges = [
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: '90d', label: '90 días' }
  ];

  // Actualizar datos cuando cambia el tipo de gráfico o rango de tiempo
  useEffect(() => {
    if (visualizationData && visualizationData[selectedChart]) {
      setChartData(visualizationData[selectedChart]);
    }
  }, [visualizationData, selectedChart]);

  // Dibujar gráfico simple en canvas
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar según tipo de gráfico
    switch (selectedChart) {
      case 'payment_history':
        drawPaymentHistoryChart(ctx, chartData, canvas);
        break;
      case 'debt_trend':
        drawDebtTrendChart(ctx, chartData, canvas);
        break;
      case 'payment_distribution':
        drawPaymentDistributionChart(ctx, chartData, canvas);
        break;
      case 'financial_health':
        drawFinancialHealthChart(ctx, chartData, canvas);
        break;
      default:
        drawPlaceholderChart(ctx, canvas);
    }
  }, [chartData, selectedChart]);

  const drawPaymentHistoryChart = (ctx, data, canvas) => {
    if (!data || data.length === 0) return;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Encontrar valores máximos
    const maxAmount = Math.max(...data.map(d => d.amount));
    
    // Dibujar ejes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Dibujar barras
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    data.forEach((item, index) => {
      const barHeight = (item.amount / maxAmount) * chartHeight;
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = canvas.height - padding - barHeight;

      // Gradiente para barras
      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Valor en la barra
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `$${Math.round(item.amount / 1000)}k`,
        x + barWidth / 2,
        y - 5
      );
    });
  };

  const drawDebtTrendChart = (ctx, data, canvas) => {
    if (!data || data.length === 0) return;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    const maxDebt = Math.max(...data.map(d => d.totalDebt));
    
    // Dibujar ejes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Dibujar línea de tendencia
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = canvas.height - padding - (item.totalDebt / maxDebt) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Dibujar puntos
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = canvas.height - padding - (item.totalDebt / maxDebt) * chartHeight;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawPaymentDistributionChart = (ctx, data, canvas) => {
    if (!data || !data.byMethod) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    let currentAngle = -Math.PI / 2;

    data.byMethod.forEach((item, index) => {
      const sliceAngle = (item.percentage / 100) * Math.PI * 2;
      
      // Dibujar porción
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Etiqueta
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  };

  const drawFinancialHealthChart = (ctx, data, canvas) => {
    if (!data || !data.categories) return;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barHeight = chartHeight / data.categories.length * 0.8;
    const barSpacing = chartHeight / data.categories.length * 0.2;

    data.categories.forEach((category, index) => {
      const y = padding + index * (barHeight + barSpacing) + barSpacing / 2;
      const barWidth = (category.score / 100) * chartWidth;

      // Gradiente para barras
      const gradient = ctx.createLinearGradient(padding, 0, padding + barWidth, 0);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#d97706');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(padding, y, barWidth, barHeight);

      // Etiqueta
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(category.category, padding, y - 5);
      
      ctx.textAlign = 'right';
      ctx.fillText(`${category.score}`, padding + barWidth - 5, y + barHeight / 2 + 4);
    });
  };

  const drawPlaceholderChart = (ctx, canvas) => {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gráfico no disponible', canvas.width / 2, canvas.height / 2);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const handleExport = () => {
    if (onExport) {
      onExport(selectedChart, chartData, timeRange);
    }
  };

  const currentChart = chartTypes.find(chart => chart.id === selectedChart);
  const CurrentIcon = currentChart?.icon || BarChart3;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <CurrentIcon className="h-6 w-6" />
              Visualizaciones Interactivas
            </h3>
            <p className="text-indigo-100 text-sm">
              Análisis visual avanzado de tus datos financieros
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onRefresh}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart Type Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gráfico
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {chartTypes.map((chart) => {
                const Icon = chart.icon;
                return (
                  <button
                    key={chart.id}
                    onClick={() => setSelectedChart(chart.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedChart === chart.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">{chart.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Tiempo
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {timeRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Description */}
        {currentChart && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">{currentChart.description}</p>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-auto max-w-full"
            style={{ maxHeight: isFullscreen ? '60vh' : '400px' }}
          />
        </div>

        {/* Chart Data Summary */}
        {chartData && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedChart === 'payment_history' && chartData.length > 0 && (
              <>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium">Total Pagado</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(chartData.reduce((sum, item) => sum + item.amount, 0))}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium">Promedio</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 font-medium">Transacciones</div>
                  <div className="text-xl font-bold text-purple-900">
                    {chartData.length}
                  </div>
                </div>
              </>
            )}

            {selectedChart === 'debt_trend' && chartData.length > 0 && (
              <>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium">Deuda Inicial</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(chartData[0]?.totalDebt || 0)}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm text-orange-600 font-medium">Deuda Actual</div>
                  <div className="text-xl font-bold text-orange-900">
                    {formatCurrency(chartData[chartData.length - 1]?.totalDebt || 0)}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium">Reducción</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency((chartData[0]?.totalDebt || 0) - (chartData[chartData.length - 1]?.totalDebt || 0))}
                  </div>
                </div>
              </>
            )}

            {selectedChart === 'payment_distribution' && chartData.byMethod && (
              <>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 font-medium">Método Principal</div>
                  <div className="text-xl font-bold text-purple-900 capitalize">
                    {chartData.byMethod[0]?.method?.replace('_', ' ') || 'N/A'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium">Monto Total</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(chartData.byMethod.reduce((sum, item) => sum + item.amount, 0))}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium">Métodos Usados</div>
                  <div className="text-xl font-bold text-blue-900">
                    {chartData.byMethod.length}
                  </div>
                </div>
              </>
            )}

            {selectedChart === 'financial_health' && chartData.overall !== undefined && (
              <>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm text-orange-600 font-medium">Salud General</div>
                  <div className="text-xl font-bold text-orange-900">
                    {chartData.overall}/100
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium">Categorías</div>
                  <div className="text-xl font-bold text-green-900">
                    {chartData.categories?.length || 0}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium">Mejor Categoría</div>
                  <div className="text-xl font-bold text-blue-900">
                    {chartData.categories?.reduce((best, cat) => cat.score > best.score ? cat : best, chartData.categories[0])?.category || 'N/A'}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {selectedChart === 'payment_history' && (
            <button
              onClick={() => navigate('/personas/pagos')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Historial Completo
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Datos
          </button>
          <button
            onClick={onRefresh}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChartsCard;