/**
 * Analytics Dashboard - Dashboard de Analytics Avanzado
 *
 * Panel completo de métricas, ROI de IA, eficiencia de filtros,
 * y insights automáticos para optimización de campañas
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../../components/common';
import { analyticsService } from '../../../services/analyticsService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Filter,
  DollarSign,
  Users,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Calendar,
  RefreshCw,
  Lightbulb,
  PieChart,
  Activity,
  Cpu,
  Brain
} from 'lucide-react';

const AnalyticsDashboard = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    end: new Date().toISOString().split('T')[0]
  });

  // Métricas principales
  const [conversionMetrics, setConversionMetrics] = useState(null);
  const [aiRoi, setAiRoi] = useState(null);
  const [filterEfficiency, setFilterEfficiency] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);

  // Insights automáticos
  const [campaignRecommendations, setCampaignRecommendations] = useState([]);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState({});
  const [marketTrends, setMarketTrends] = useState({});

  // Estados de carga
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadAllAnalytics();
  }, [companyId, dateRange]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConversionMetrics(),
        loadAiRoi(),
        loadFilterEfficiency(),
        loadAiUsage(),
        loadInsights()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversionMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const metrics = await analyticsService.getConversionBySegmentAndCampaign(companyId, dateRange);
      setConversionMetrics(metrics);
    } catch (error) {
      console.error('Error loading conversion metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadAiRoi = async () => {
    try {
      const roi = await analyticsService.calculateAIRoi(companyId, dateRange);
      setAiRoi(roi);
    } catch (error) {
      console.error('Error loading AI ROI:', error);
    }
  };

  const loadFilterEfficiency = async () => {
    try {
      const efficiency = await analyticsService.getHierarchicalFilterEfficiency(companyId, dateRange);
      setFilterEfficiency(efficiency);
    } catch (error) {
      console.error('Error loading filter efficiency:', error);
    }
  };

  const loadAiUsage = async () => {
    try {
      const usage = await analyticsService.getAIUsageAndCosts(companyId, dateRange);
      setAiUsage(usage);
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const [recommendations, predictive, trends] = await Promise.all([
        analyticsService.generateCampaignOptimizationRecommendations(companyId),
        analyticsService.generatePredictiveBehaviorAnalysis(companyId),
        analyticsService.generateMarketTrendsAndBestPractices()
      ]);

      setCampaignRecommendations(recommendations);
      setPredictiveAnalysis(predictive);
      setMarketTrends(trends);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      dateRange,
      conversionMetrics,
      aiRoi,
      filterEfficiency,
      aiUsage,
      insights: {
        recommendations: campaignRecommendations,
        predictiveAnalysis,
        marketTrends
      },
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mr-3" />
          <span className="text-lg text-secondary-600">Cargando analytics avanzados...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-info-600 to-info-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics Avanzado</h1>
              <p className="text-info-100">
                Métricas clave, ROI de IA y insights automáticos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              </span>
            </div>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={exportReport}
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              Exportar Reporte
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-secondary-700">Rango de fechas:</span>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-auto"
          />
          <span className="text-secondary-500">a</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-auto"
          />
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={loadAllAnalytics}
            loading={loadingMetrics}
          >
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Métricas Clave */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-600" />
          Métricas Clave
        </h2>

        {/* Conversión por Segmento y Campaña */}
        <Card className="border-2 border-primary-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-900">Conversión por Segmento y Campaña</h3>
              <p className="text-sm text-primary-700">Análisis detallado de rendimiento</p>
            </div>
          </div>

          {conversionMetrics && (
            <div className="space-y-6">
              {/* Campañas */}
              <div>
                <h4 className="font-semibold text-secondary-900 mb-3">Por Campaña</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conversionMetrics.campaignMetrics.map((campaign, index) => (
                    <div key={index} className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200">
                      <h5 className="font-bold text-primary-900 mb-2 truncate">{campaign.campaign.name}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-primary-700">Enviados:</span>
                          <span className="font-semibold">{campaign.totalSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-700">Abiertos:</span>
                          <span className="font-semibold">{campaign.totalOpened}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-700">Convertidos:</span>
                          <span className="font-semibold">{campaign.totalConverted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-700">Tasa Conversión:</span>
                          <Badge variant={campaign.conversionRate > 15 ? 'success' : 'warning'}>
                            {campaign.conversionRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segmentos */}
              <div>
                <h4 className="font-semibold text-secondary-900 mb-3">Por Segmento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conversionMetrics.segmentMetrics.map((segment, index) => (
                    <div key={index} className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg border border-success-200">
                      <h5 className="font-bold text-success-900 mb-2">{segment.segment}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-success-700">Enviados:</span>
                          <span className="font-semibold">{segment.totalSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-success-700">Convertidos:</span>
                          <span className="font-semibold">{segment.totalConverted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-success-700">Tasa Conversión:</span>
                          <Badge variant={segment.conversionRate > 20 ? 'success' : 'warning'}>
                            {segment.conversionRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ROI de IA */}
        <Card className="border-2 border-warning-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Zap className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-warning-900">ROI de Inteligencia Artificial</h3>
              <p className="text-sm text-warning-700">Ahorro vs mejora de conversión</p>
            </div>
          </div>

          {aiRoi && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg border border-warning-200">
                <div className="text-2xl font-bold text-warning-600 mb-1">
                  {formatCurrency(aiRoi.aiCosts)}
                </div>
                <div className="text-sm text-warning-700">Costo Total IA</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
                <div className="text-2xl font-bold text-success-600 mb-1">
                  {formatCurrency(aiRoi.additionalRevenue)}
                </div>
                <div className="text-sm text-success-700">Ingresos Adicionales</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-info-50 to-info-100 rounded-lg border border-info-200">
                <div className="text-2xl font-bold text-info-600 mb-1">
                  {aiRoi.roi > 0 ? '+' : ''}{aiRoi.roi.toFixed(1)}%
                </div>
                <div className="text-sm text-info-700">ROI de IA</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {aiRoi.totalAICalls}
                </div>
                <div className="text-sm text-purple-700">Llamadas a IA</div>
              </div>
            </div>
          )}
        </Card>

        {/* Eficiencia de Filtros Jerárquicos */}
        <Card className="border-2 border-info-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-info-100 rounded-lg">
              <Filter className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-info-900">Eficiencia de Filtros Jerárquicos</h3>
              <p className="text-sm text-info-700">Precisión del targeting por nivel</p>
            </div>
          </div>

          {filterEfficiency && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-info-50 to-info-100 rounded-lg border border-info-200">
                <div className="text-3xl font-bold text-info-600 mb-1">
                  {filterEfficiency.averageEfficiency.toFixed(1)}%
                </div>
                <div className="text-lg text-info-700">Eficiencia Promedio</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterEfficiency.efficiencyMetrics.map((metric, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-info-200">
                    <h5 className="font-bold text-info-900 mb-2">{metric.campaignName}</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-info-700">Filtros Corporativos:</span>
                        <span className="font-semibold">{metric.corporateFilterEfficiency.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-info-700">Filtros de Riesgo:</span>
                        <span className="font-semibold">{metric.riskFilterEfficiency.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-info-700">Filtros de Monto:</span>
                        <span className="font-semibold">{metric.debtFilterEfficiency.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between border-t border-info-200 pt-2">
                        <span className="text-info-700 font-semibold">Eficiencia General:</span>
                        <Badge variant={metric.overallEfficiency > 80 ? 'success' : 'warning'}>
                          {metric.overallEfficiency.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Uso y Costos de APIs de IA */}
        <Card className="border-2 border-danger-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-danger-100 rounded-lg">
              <Cpu className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-danger-900">Uso y Costos de APIs de IA</h3>
              <p className="text-sm text-danger-700">Consumo por proveedor y tarea</p>
            </div>
          </div>

          {aiUsage && (
            <div className="space-y-6">
              {/* Resumen General */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-danger-50 to-danger-100 rounded-lg border border-danger-200">
                  <div className="text-2xl font-bold text-danger-600 mb-1">{aiUsage.totalRequests}</div>
                  <div className="text-sm text-danger-700">Total Solicitudes</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{aiUsage.totalTokens.toLocaleString()}</div>
                  <div className="text-sm text-purple-700">Tokens Consumidos</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg border border-warning-200">
                  <div className="text-2xl font-bold text-warning-600 mb-1">{formatCurrency(aiUsage.totalCost)}</div>
                  <div className="text-sm text-warning-700">Costo Total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
                  <div className="text-2xl font-bold text-success-600 mb-1">{formatCurrency(aiUsage.avgCostPerRequest)}</div>
                  <div className="text-sm text-success-700">Costo por Solicitud</div>
                </div>
              </div>

              {/* Costos por Proveedor */}
              <div>
                <h4 className="font-semibold text-danger-900 mb-3">Costos por Proveedor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-xl font-bold text-blue-600 mb-1">
                      {formatCurrency(aiUsage.costBreakdown.groq)}
                    </div>
                    <div className="text-sm text-blue-700">Groq</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="text-xl font-bold text-orange-600 mb-1">
                      {formatCurrency(aiUsage.costBreakdown.chutes)}
                    </div>
                    <div className="text-sm text-orange-700">Chutes</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Insights Automáticos */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-info-600" />
          Insights Automáticos
        </h2>

        {/* Recomendaciones de IA */}
        <Card className="border-2 border-success-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-success-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-success-900">Recomendaciones de IA para Optimización</h3>
              <p className="text-sm text-success-700">Sugerencias automáticas basadas en datos</p>
            </div>
          </div>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-success-600 mr-3" />
              <span className="text-success-700">Generando recomendaciones...</span>
            </div>
          ) : campaignRecommendations.length > 0 ? (
            <div className="space-y-4">
              {campaignRecommendations.slice(0, 5).map((recommendation, index) => (
                <div key={index} className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg border border-success-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-success-500 rounded-lg mt-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-success-900 mb-1">{recommendation.title || `Recomendación ${index + 1}`}</h5>
                      <p className="text-success-800 mb-2">{recommendation.description || recommendation}</p>
                      {recommendation.impact && (
                        <Badge variant="success" className="text-xs">
                          Impacto esperado: {recommendation.impact}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-success-400 mx-auto mb-4" />
              <p className="text-success-700">No hay recomendaciones disponibles en este momento.</p>
            </div>
          )}
        </Card>

        {/* Análisis Predictivo de Comportamiento */}
        <Card className="border-2 border-warning-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Activity className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-warning-900">Análisis Predictivo de Comportamiento</h3>
              <p className="text-sm text-warning-700">Tendencias y predicciones basadas en datos históricos</p>
            </div>
          </div>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-warning-600 mr-3" />
              <span className="text-warning-700">Analizando comportamiento...</span>
            </div>
          ) : predictiveAnalysis && Object.keys(predictiveAnalysis).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-warning-900">Predicciones de Conversión</h4>
                {predictiveAnalysis.conversionPredictions ? (
                  <div className="space-y-3">
                    {Object.entries(predictiveAnalysis.conversionPredictions).map(([segment, prediction]) => (
                      <div key={segment} className="flex justify-between items-center p-3 bg-warning-50 rounded-lg border border-warning-200">
                        <span className="text-warning-800 capitalize">{segment.replace('_', ' ')}</span>
                        <Badge variant={prediction > 20 ? 'success' : 'warning'}>
                          {prediction.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-warning-700">Datos insuficientes para predicciones.</p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-warning-900">Tendencias Identificadas</h4>
                {predictiveAnalysis.trends ? (
                  <div className="space-y-3">
                    {predictiveAnalysis.trends.map((trend, index) => (
                      <div key={index} className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                        <p className="text-warning-800 text-sm">{trend}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-warning-700">No se identificaron tendencias específicas.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-warning-400 mx-auto mb-4" />
              <p className="text-warning-700">Análisis predictivo no disponible.</p>
            </div>
          )}
        </Card>

        {/* Tendencias de Mercado */}
        <Card className="border-2 border-info-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-info-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-info-900">Tendencias de Mercado y Mejores Prácticas</h3>
              <p className="text-sm text-info-700">Insights del mercado de cobranza digital</p>
            </div>
          </div>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-info-600 mr-3" />
              <span className="text-info-700">Analizando tendencias de mercado...</span>
            </div>
          ) : marketTrends && Object.keys(marketTrends).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-info-900">Tendencias Actuales</h4>
                <div className="space-y-3">
                  {marketTrends.currentTrends?.map((trend, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-info-50 rounded-lg border border-info-200">
                      <TrendingUp className="w-4 h-4 text-info-600 mt-1" />
                      <p className="text-info-800 text-sm">{trend}</p>
                    </div>
                  )) || <p className="text-info-700">No hay tendencias disponibles.</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-info-900">Mejores Prácticas</h4>
                <div className="space-y-3">
                  {marketTrends.bestPractices?.map((practice, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-info-50 rounded-lg border border-info-200">
                      <CheckCircle className="w-4 h-4 text-info-600 mt-1" />
                      <p className="text-info-800 text-sm">{practice}</p>
                    </div>
                  )) || <p className="text-info-700">No hay mejores prácticas disponibles.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-info-400 mx-auto mb-4" />
              <p className="text-info-700">Análisis de tendencias no disponible.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;