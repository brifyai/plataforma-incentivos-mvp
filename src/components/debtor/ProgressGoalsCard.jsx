/**
 * Progress Goals Card Component
 * 
 * Componente para mostrar indicadores de progreso y metas financieras
 * con visualizaciones interactivas y seguimiento de logros
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Star,
  Flag,
  Zap
} from 'lucide-react';

const ProgressGoalsCard = ({ 
  progressMetrics, 
  loading = false,
  onRefresh,
  onMilestoneComplete 
}) => {
  const [animatedProgress, setAnimatedProgress] = useState({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState(null);

  // Animar valores de progreso
  useEffect(() => {
    if (!progressMetrics) return;

    const targets = {
      debtReduction: progressMetrics.debtReductionGoal?.progress || 0,
      savings: progressMetrics.savingsGoal?.progress || 0,
      creditScore: progressMetrics.creditScoreImprovement?.progress || 0
    };

    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const startValues = { ...animatedProgress };

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedProgress({
        debtReduction: startValues.debtReduction || 0 + (targets.debtReduction - (startValues.debtReduction || 0)) * easeProgress,
        savings: startValues.savings || 0 + (targets.savings - (startValues.savings || 0)) * easeProgress,
        creditScore: startValues.creditScore || 0 + (targets.creditScore - (startValues.creditScore || 0)) * easeProgress
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [progressMetrics]);

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

  if (!progressMetrics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay datos de progreso disponibles</p>
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'green';
    if (progress >= 50) return 'blue';
    if (progress >= 25) return 'yellow';
    return 'red';
  };

  const celebrateMilestone = (milestone) => {
    setCelebratingMilestone(milestone);
    setTimeout(() => {
      setCelebratingMilestone(null);
      if (onMilestoneComplete) {
        onMilestoneComplete(milestone);
      }
    }, 3000);
  };

  const goals = [
    {
      id: 'debtReduction',
      title: 'Reducción de Deuda',
      icon: TrendingUp,
      color: 'green',
      target: progressMetrics.debtReductionGoal?.target || 0,
      current: progressMetrics.debtReductionGoal?.current || 0,
      progress: animatedProgress.debtReduction || 0,
      deadline: progressMetrics.debtReductionGoal?.estimatedCompletion,
      unit: 'currency'
    },
    {
      id: 'savings',
      title: 'Meta de Ahorro',
      icon: Trophy,
      color: 'blue',
      target: progressMetrics.savingsGoal?.target || 0,
      current: progressMetrics.savingsGoal?.current || 0,
      progress: animatedProgress.savings || 0,
      monthlyContribution: progressMetrics.savingsGoal?.monthlyContribution,
      unit: 'currency'
    },
    {
      id: 'creditScore',
      title: 'Mejora de Score',
      icon: Star,
      color: 'purple',
      target: progressMetrics.creditScoreImprovement?.target || 0,
      current: progressMetrics.creditScoreImprovement?.current || 0,
      progress: animatedProgress.creditScore || 0,
      factors: progressMetrics.creditScoreImprovement?.factors || [],
      unit: 'score'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Target className="h-6 w-6" />
              Metas y Progreso
            </h3>
            <p className="text-green-100 text-sm">
              Seguimiento de tus objetivos financieros
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
        {/* Goals Grid */}
        <div className="space-y-6 mb-6">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const progressColor = getProgressColor(goal.progress);
            const isCompleted = goal.progress >= 100;

            return (
              <div
                key={goal.id}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedGoal === goal.id 
                    ? 'border-green-500 bg-green-50 shadow-lg' 
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${goal.color}-100 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${goal.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        {goal.unit === 'currency' 
                          ? `${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}`
                          : `${goal.current} de ${goal.target} puntos`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-${progressColor}-600`}>
                      {Math.round(goal.progress)}%
                    </div>
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-${progressColor}-400 to-${progressColor}-600 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    >
                      <div className="h-full bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {selectedGoal === goal.id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    {goal.deadline && (
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Fecha estimada: {formatDate(goal.deadline)}
                        </span>
                      </div>
                    )}
                    {goal.monthlyContribution && (
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Contribución mensual: {formatCurrency(goal.monthlyContribution)}
                        </span>
                      </div>
                    )}
                    {goal.factors && goal.factors.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Factores clave:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {goal.factors.map((factor, index) => (
                            <span key={index} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        {progressMetrics.milestones && progressMetrics.milestones.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-orange-500" />
              <h4 className="text-lg font-semibold text-gray-800">Hitos Alcanzados</h4>
            </div>
            
            <div className="space-y-2">
              {progressMetrics.milestones.map((milestone, index) => {
                const isAchieved = milestone.achieved;
                const isCelebrating = celebratingMilestone === index;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      isAchieved 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    } ${isCelebrating ? 'animate-pulse ring-2 ring-green-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          isAchieved ? 'bg-green-100' : 'bg-gray-200'
                        }`}>
                          {isAchieved ? (
                            <Trophy className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">{milestone.title}</h5>
                          <p className="text-sm text-gray-600">
                            {isAchieved 
                              ? `Completado: ${formatDate(milestone.date)}`
                              : `Estimado: ${formatDate(milestone.estimatedDate)}`
                            }
                          </p>
                        </div>
                      </div>
                      {isAchieved && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-green-600">¡Logrado!</span>
                        </div>
                      )}
                    </div>
                    
                    {isCelebrating && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-bold text-yellow-800">
                            ¡Felicidades por alcanzar este hito! 🎉
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              // Simular celebración de hito no logrado
              const nextMilestone = progressMetrics.milestones?.find(m => !m.achieved);
              if (nextMilestone) {
                celebrateMilestone(progressMetrics.milestones.indexOf(nextMilestone));
              }
            }}
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105"
          >
            <Award className="h-4 w-4 inline mr-2" />
            Ver Logros
          </button>
          <button
            onClick={onRefresh}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Actualizar Progreso
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressGoalsCard;