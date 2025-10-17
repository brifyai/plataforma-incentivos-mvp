/**
 * Payment Predictions Card Component
 * 
 * Componente para mostrar predicciones de pagos y análisis predictivo
 * con visualizaciones interactivas y recomendaciones personalizadas
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  DollarSign,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react';

const PaymentPredictionsCard = ({ 
  paymentPredictions, 
  loading = false,
  onRefresh,
  behavioralAnalysis 
}) => {
  const [animatedProbability, setAnimatedProbability] = useState(0);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Animar probabilidad de pago
  useEffect(() => {
    if (!paymentPredictions) return;

    const targetProbability = paymentPredictions.nextPaymentProbability * 100;
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const startValue = animatedProbability;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedProbability(startValue + (targetProbability - startValue) * easeProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [paymentPredictions]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!paymentPredictions) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay datos de predicción disponibles</p>
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

  const getRiskLevel = (risk) => {
    if (risk < 0.2) return { level: 'Bajo', color: 'green', icon: CheckCircle };
    if (risk < 0.5) return { level: 'Medio', color: 'yellow', icon: AlertTriangle };
    return { level: 'Alto', color: 'red', icon: AlertTriangle };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const riskInfo = getRiskLevel(paymentPredictions.riskOfDefault);
  const RiskIcon = riskInfo.icon;

  // Combinar recomendaciones de predicciones y análisis de comportamiento
  const allRecommendations = [
    ...(paymentPredictions.recommendedPaymentAmount > paymentPredictions.nextPaymentAmount ? [
      {
        type: 'payment_increase',
        title: 'Aumentar Pago Recomendado',
        description: `Considera pagar ${formatCurrency(paymentPredictions.recommendedPaymentAmount)} para acelerar la reducción de deuda`,
        priority: 'high',
        impact: 'reduce_debt_time'
      }
    ] : []),
    ...(behavioralAnalysis?.recommendations || []).map(rec => ({
      type: 'behavioral',
      title: 'Mejora de Comportamiento',
      description: rec,
      priority: 'medium',
      impact: 'financial_health'
    }))
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Predicciones Inteligentes
            </h3>
            <p className="text-purple-100 text-sm">
              Análisis predictivo basado en tu comportamiento financiero
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
        {/* Main Prediction */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Probabilidad de Próximo Pago
            </h4>
            <div className="relative inline-flex items-center justify-center">
              <div className="text-4xl font-bold text-purple-600">
                {Math.round(animatedProbability)}%
              </div>
              <div className="absolute -top-2 -right-2">
                {animatedProbability >= 80 ? 
                  <CheckCircle className="h-8 w-8 text-green-500" /> :
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                }
              </div>
            </div>
          </div>
          
          {/* Probability Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1500 ease-out ${
                animatedProbability >= 80 ? 'bg-green-500' :
                animatedProbability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${animatedProbability}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Prediction Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Next Payment Prediction */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Próximo Pago Estimado</span>
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-purple-900">
              {formatCurrency(paymentPredictions.nextPaymentAmount)}
            </div>
            <div className="text-sm text-purple-600">
              {new Date(paymentPredictions.nextPaymentDate).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`${riskInfo.color}-50 rounded-lg p-4 border border-${riskInfo.color}-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Nivel de Riesgo</span>
              <RiskIcon className={`h-4 w-4 text-${riskInfo.color}-500`} />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {riskInfo.level}
            </div>
            <div className="text-sm text-gray-600">
              {(paymentPredictions.riskOfDefault * 100).toFixed(1)}% probabilidad
            </div>
          </div>

          {/* Payment Trend */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Tendencia de Pagos</span>
              {getTrendIcon(paymentPredictions.monthlyPaymentTrend)}
            </div>
            <div className="text-xl font-bold text-blue-900 capitalize">
              {paymentPredictions.monthlyPaymentTrend === 'increasing' ? 'En aumento' :
               paymentPredictions.monthlyPaymentTrend === 'decreasing' ? 'En disminución' : 'Estable'}
            </div>
            <div className="text-sm text-blue-600">
              Score: {paymentPredictions.paymentBehaviorScore}/100
            </div>
          </div>

          {/* Recommended Payment */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Pago Recomendado</span>
              <Target className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(paymentPredictions.recommendedPaymentAmount)}
            </div>
            <div className="text-sm text-green-600">
              Para acelerar reducción
            </div>
          </div>
        </div>

        {/* Seasonal Factors */}
        {paymentPredictions.seasonalFactors && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Factores Estacionales</span>
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-orange-900">
              Multiplicador: {paymentPredictions.seasonalFactors.seasonalMultiplier}x
            </div>
            <div className="text-sm text-orange-600">
              {paymentPredictions.seasonalFactors.reason}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {allRecommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h4 className="text-lg font-semibold text-gray-800">Recomendaciones Personalizadas</h4>
            </div>
            
            {allRecommendations.map((recommendation, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRecommendation === index 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRecommendation(selectedRecommendation === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {recommendation.priority === 'high' ? 'Alta' :
                         recommendation.priority === 'medium' ? 'Media' : 'Baja'} prioridad
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-800 mb-1">
                      {recommendation.title}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {recommendation.description}
                    </p>
                  </div>
                  <DollarSign className="h-5 w-5 text-purple-500 flex-shrink-0 ml-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPredictionsCard;