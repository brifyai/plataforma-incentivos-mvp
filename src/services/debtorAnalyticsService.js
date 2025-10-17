/**
 * Debtor Analytics Service
 * 
 * Servicio avanzado de analytics para deudores con métricas predictivas
 * y análisis de comportamiento financiero
 */

import { realTimeAnalyticsService } from './realTimeAnalyticsService';

class DebtorAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.listeners = new Set();
  }

  // Obtener métricas financieras avanzadas
  async getFinancialMetrics(userId, timeRange = '30d') {
    const cacheKey = `financial_metrics_${userId}_${timeRange}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Simular métricas financieras avanzadas
      const metrics = {
        totalDebt: 2500000,
        paidAmount: 750000,
        remainingDebt: 1750000,
        paymentProgress: 30,
        averageMonthlyPayment: 125000,
        nextPaymentDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        debtReductionRate: 2.5,
        paymentConsistency: 85,
        financialHealthScore: 72,
        projectedPayoffDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        savedInInterest: 45000,
        missedPayments: 2,
        onTimePayments: 23
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;
    } catch (error) {
      console.error('Error getting financial metrics:', error);
      throw error;
    }
  }

  // Obtener predicciones de pagos
  async getPaymentPredictions(userId) {
    try {
      const predictions = {
        nextPaymentProbability: 0.87,
        nextPaymentAmount: 125000,
        nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        monthlyPaymentTrend: 'increasing',
        riskOfDefault: 0.15,
        recommendedPaymentAmount: 150000,
        paymentBehaviorScore: 78,
        seasonalFactors: {
          month: new Date().getMonth(),
          seasonalMultiplier: 1.1,
          reason: 'Bonus season'
        }
      };

      return predictions;
    } catch (error) {
      console.error('Error getting payment predictions:', error);
      throw error;
    }
  }

  // Análisis de comportamiento financiero
  async getBehavioralAnalysis(userId) {
    try {
      const analysis = {
        paymentPattern: 'consistent',
        preferredPaymentMethod: 'bank_transfer',
        paymentFrequency: 'monthly',
        averageDaysEarly: 3,
        financialDiscipline: 8.5,
        spendingTrends: {
          category: 'necessities',
          trend: 'stable',
          volatility: 0.2
        },
        riskFactors: [
          {
            factor: 'high_debt_to_income',
            level: 'medium',
            impact: 0.3
          },
          {
            factor: 'seasonal_income',
            level: 'low',
            impact: 0.1
          }
        ],
        recommendations: [
          'Consider increasing payment frequency',
          'Set up automatic payments',
          'Build emergency fund'
        ]
      };

      return analysis;
    } catch (error) {
      console.error('Error getting behavioral analysis:', error);
      throw error;
    }
  }

  // Métricas de progreso hacia metas
  async getProgressMetrics(userId) {
    try {
      const metrics = {
        debtReductionGoal: {
          target: 1000000,
          current: 750000,
          progress: 75,
          estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        savingsGoal: {
          target: 500000,
          current: 125000,
          progress: 25,
          monthlyContribution: 25000
        },
        creditScoreImprovement: {
          target: 750,
          current: 680,
          progress: 90.7,
          factors: ['payment_history', 'credit_utilization']
        },
        milestones: [
          {
            title: 'First 25% Paid',
            achieved: true,
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          },
          {
            title: '50% Paid',
            achieved: true,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          {
            title: '75% Paid',
            achieved: false,
            estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ]
      };

      return metrics;
    } catch (error) {
      console.error('Error getting progress metrics:', error);
      throw error;
    }
  }

  // Datos para visualizaciones interactivas
  async getVisualizationData(userId, chartType, timeRange = '30d') {
    try {
      switch (chartType) {
        case 'payment_history':
          return this.getPaymentHistoryData(userId, timeRange);
        case 'debt_trend':
          return this.getDebtTrendData(userId, timeRange);
        case 'payment_distribution':
          return this.getPaymentDistributionData(userId, timeRange);
        case 'financial_health':
          return this.getFinancialHealthData(userId, timeRange);
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
    } catch (error) {
      console.error('Error getting visualization data:', error);
      throw error;
    }
  }

  // Datos para historial de pagos
  async getPaymentHistoryData(userId, timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 50000) + 100000,
        method: Math.random() > 0.5 ? 'bank_transfer' : 'credit_card',
        status: Math.random() > 0.1 ? 'completed' : 'pending',
        debtId: `debt_${Math.floor(Math.random() * 5) + 1}`
      });
    }

    return data;
  }

  // Datos para tendencia de deuda
  async getDebtTrendData(userId, timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    let currentDebt = 2500000;
    const dailyReduction = 8333; // ~250,000 mensual

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalDebt: Math.floor(currentDebt),
        paidAmount: Math.floor(2500000 - currentDebt),
        remainingDebt: Math.floor(currentDebt)
      });

      currentDebt -= dailyReduction;
    }

    return data;
  }

  // Datos para distribución de pagos
  async getPaymentDistributionData(userId, timeRange) {
    return {
      byMethod: [
        { method: 'bank_transfer', amount: 450000, percentage: 60, count: 18 },
        { method: 'credit_card', amount: 200000, percentage: 27, count: 8 },
        { method: 'cash', amount: 75000, percentage: 10, count: 3 },
        { method: 'other', amount: 25000, percentage: 3, count: 1 }
      ],
      byDebt: [
        { debtId: 'debt_1', amount: 300000, percentage: 40 },
        { debtId: 'debt_2', amount: 225000, percentage: 30 },
        { debtId: 'debt_3', amount: 150000, percentage: 20 },
        { debtId: 'debt_4', amount: 75000, percentage: 10 }
      ]
    };
  }

  // Datos para salud financiera
  async getFinancialHealthData(userId, timeRange) {
    return {
      overall: 72,
      categories: [
        {
          category: 'Payment History',
          score: 85,
          weight: 0.35,
          trend: 'improving'
        },
        {
          category: 'Debt Level',
          score: 65,
          weight: 0.30,
          trend: 'stable'
        },
        {
          category: 'Credit Utilization',
          score: 70,
          weight: 0.20,
          trend: 'improving'
        },
        {
          category: 'Payment Consistency',
          score: 80,
          weight: 0.15,
          trend: 'stable'
        }
      ],
      recommendations: [
        'Keep up the good payment consistency',
        'Consider paying down high-interest debt first',
        'Maintain low credit utilization'
      ]
    };
  }

  // Suscribir a actualizaciones en tiempo real
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      this.notifyListeners();
    }, 30000); // Cada 30 segundos

    return () => {
      clearInterval(interval);
      this.listeners.delete(callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners() {
    const data = {
      timestamp: new Date(),
      type: 'analytics_update'
    };
    
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in analytics listener:', error);
      }
    });
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }
}

// Exportar instancia singleton
export const debtorAnalyticsService = new DebtorAnalyticsService();

export default debtorAnalyticsService;