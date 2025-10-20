/**
 * Predictive Analytics Service
 * 
 * Servicio para analytics predictivos con algoritmos de Machine Learning
 * Implementa forecasting, detección de anomalías y predicciones de tendencias
 */

class PredictiveAnalyticsService {
  constructor() {
    this.models = new Map();
    this.historicalData = new Map();
    this.predictions = new Map();
    this.anomalies = new Map();
    this.isTraining = false;
    this.trainingQueue = [];
  }

  /**
   * Inicializar el servicio predictivo
   */
  async initialize() {
    console.log('🤖 Inicializando Predictive Analytics Service...');
    
    // Cargar modelos pre-entrenados o inicializar nuevos
    await this.loadModels();
    
    // Configurar entrenamiento periódico
    this.setupPeriodicTraining();
    
    console.log('✅ Predictive Analytics Service inicializado');
  }

  /**
   * Cargar modelos de Machine Learning
   */
  async loadModels() {
    try {
      // Modelo de predicción de series temporales (ARIMA-like)
      this.models.set('revenue', new TimeSeriesPredictor({
        windowSize: 30, // 30 días de historia
        forecastHorizon: 7, // Predecir 7 días adelante
        seasonality: 7 // Patrones semanales
      }));

      // Modelo de predicción de churn
      this.models.set('churn', new ChurnPredictor({
        features: ['activity', 'payments', 'engagement', 'support_tickets'],
        threshold: 0.7 // Umbral de riesgo
      }));

      // Modelo de detección de anomalías
      this.models.set('anomaly', new AnomalyDetector({
        sensitivity: 0.95,
        windowSize: 14,
        minSamples: 50
      }));

      // Modelo de predicción de crecimiento
      this.models.set('growth', new GrowthPredictor({
        lookbackPeriod: 90, // 3 meses
        confidenceInterval: 0.95
      }));

      console.log('📊 Modelos de ML cargados exitosamente');
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      throw error;
    }
  }

  /**
   * Entrenar modelos con datos históricos
   */
  async trainModels(data) {
    if (this.isTraining) {
      this.trainingQueue.push(data);
      return;
    }

    this.isTraining = true;
    console.log('🎯 Iniciando entrenamiento de modelos...');

    try {
      // Preparar datos históricos
      const historicalData = this.prepareHistoricalData(data);
      
      // Entrenar cada modelo
      const trainingPromises = Array.from(this.models.entries()).map(async ([name, model]) => {
        try {
          const modelData = historicalData[name] || data;
          await model.train(modelData);
          console.log(`✅ Modelo ${name} entrenado exitosamente`);
        } catch (error) {
          console.error(`❌ Error entrenando modelo ${name}:`, error);
        }
      });

      await Promise.all(trainingPromises);
      
      // Guardar datos históricos para futuros entrenamientos
      this.updateHistoricalData(data);
      
      console.log('🎉 Entrenamiento completado');
    } catch (error) {
      console.error('❌ Error en entrenamiento:', error);
    } finally {
      this.isTraining = false;
      
      // Procesar cola de entrenamiento
      if (this.trainingQueue.length > 0) {
        const nextData = this.trainingQueue.shift();
        setTimeout(() => this.trainModels(nextData), 1000);
      }
    }
  }

  /**
   * Generar predicciones para métricas clave
   */
  async generatePredictions(timeHorizon = 7) {
    console.log(`🔮 Generando predicciones para ${timeHorizon} días...`);
    
    const predictions = {};

    try {
      // Predicción de ingresos
      if (this.models.has('revenue')) {
        const revenueModel = this.models.get('revenue');
        const revenueData = this.historicalData.get('revenue') || [];
        
        if (revenueData.length >= revenueModel.windowSize) {
          predictions.revenue = await revenueModel.predict(revenueData, timeHorizon);
        }
      }

      // Predicción de churn
      if (this.models.has('churn')) {
        const churnModel = this.models.get('churn');
        const churnData = this.historicalData.get('user_activity') || [];
        
        if (churnData.length > 0) {
          predictions.churn = await churnModel.predict(churnData);
        }
      }

      // Predicción de crecimiento
      if (this.models.has('growth')) {
        const growthModel = this.models.get('growth');
        const growthData = this.historicalData.get('growth_metrics') || [];
        
        if (growthData.length >= growthModel.lookbackPeriod) {
          predictions.growth = await growthModel.predict(growthData, timeHorizon);
        }
      }

      // Cache de predicciones
      this.predictions.set('latest', {
        data: predictions,
        timestamp: new Date(),
        horizon: timeHorizon
      });

      console.log('✅ Predicciones generadas exitosamente');
      return predictions;
    } catch (error) {
      console.error('❌ Error generando predicciones:', error);
      return {};
    }
  }

  /**
   * Detectar anomalías en los datos
   */
  async detectAnomalies(data) {
    console.log('🔍 Detectando anomalías...');
    
    const anomalies = [];

    try {
      if (this.models.has('anomaly')) {
        const anomalyModel = this.models.get('anomaly');
        
        // Detectar anomalías en diferentes métricas
        const metrics = ['revenue', 'users', 'payments', 'conversion_rate'];
        
        for (const metric of metrics) {
          const metricData = data[metric] || [];
          if (metricData.length > 0) {
            const anomaliesInMetric = await anomalyModel.detect(metricData);
            
            anomaliesInMetric.forEach(anomaly => {
              anomalies.push({
                metric,
                ...anomaly,
                detected_at: new Date(),
                severity: this.calculateAnomalySeverity(anomaly)
              });
            });
          }
        }
      }

      // Cache de anomalías
      this.anomalies.set('latest', {
        data: anomalies,
        timestamp: new Date()
      });

      console.log(`🚨 Detectadas ${anomalies.length} anomalías`);
      return anomalies;
    } catch (error) {
      console.error('❌ Error detectando anomalías:', error);
      return [];
    }
  }

  /**
   * Generar alertas inteligentes basadas en predicciones y anomalías
   */
  async generateIntelligentAlerts(predictions, anomalies, currentMetrics) {
    console.log('🚨 Generando alertas inteligentes...');
    
    const alerts = [];

    try {
      // Alertas de predicciones negativas
      if (predictions.revenue) {
        const revenueForecast = predictions.revenue;
        const lastValue = revenueForecast[revenueForecast.length - 1];
        const currentValue = currentMetrics.revenue || 0;
        
        if (lastValue.predicted < currentValue * 0.8) {
          alerts.push({
            type: 'revenue_decline',
            severity: 'high',
            title: '⚠️ Predicción de declive en ingresos',
            message: `Se espera una caída del ${((1 - lastValue.predicted/currentValue) * 100).toFixed(1)}% en los próximos ${predictions.revenue.length} días`,
            action: 'review_revenue_strategy',
            confidence: lastValue.confidence,
            predicted_date: lastValue.date
          });
        }
      }

      // Alertas de churn
      if (predictions.churn) {
        const highRiskUsers = predictions.churn.filter(user => user.risk > 0.8);
        
        if (highRiskUsers.length > 0) {
          alerts.push({
            type: 'high_churn_risk',
            severity: 'medium',
            title: '👥 Alto riesgo de abandono',
            message: `${highRiskUsers.length} usuarios con alto riesgo de churn detectados`,
            action: 'retention_campaign',
            confidence: 0.85,
            affected_users: highRiskUsers.length
          });
        }
      }

      // Alertas de anomalías
      anomalies.forEach(anomaly => {
        if (anomaly.severity === 'critical') {
          alerts.push({
            type: 'critical_anomaly',
            severity: 'critical',
            title: '🚨 Anomalía crítica detectada',
            message: `Anomalía detectada en ${anomaly.metric}: ${anomaly.description}`,
            action: 'investigate_anomaly',
            confidence: anomaly.confidence,
            metric: anomaly.metric,
            value: anomaly.value
          });
        }
      });

      // Alertas de oportunidades
      if (predictions.growth) {
        const growthOpportunity = predictions.growth.find(g => g.growth_rate > 0.2);
        
        if (growthOpportunity) {
          alerts.push({
            type: 'growth_opportunity',
            severity: 'info',
            title: '📈 Oportunidad de crecimiento',
            message: `Potencial crecimiento del ${(growthOpportunity.growth_rate * 100).toFixed(1)}% identificado`,
            action: 'scale_resources',
            confidence: growthOpportunity.confidence,
            potential_growth: growthOpportunity.growth_rate
          });
        }
      }

      console.log(`📨 Generadas ${alerts.length} alertas inteligentes`);
      return alerts;
    } catch (error) {
      console.error('❌ Error generando alertas:', error);
      return [];
    }
  }

  /**
   * Preparar datos históricos para entrenamiento
   */
  prepareHistoricalData(rawData) {
    const prepared = {};

    // Datos de ingresos
    if (rawData.payments) {
      prepared.revenue = rawData.payments.map(payment => ({
        date: new Date(payment.created_at),
        value: payment.amount,
        metadata: payment.metadata || {}
      }));
    }

    // Datos de actividad de usuarios
    if (rawData.user_activity) {
      prepared.user_activity = rawData.user_activity.map(activity => ({
        user_id: activity.user_id,
        timestamp: new Date(activity.timestamp),
        activity_type: activity.type,
        engagement_score: this.calculateEngagementScore(activity)
      }));
    }

    // Métricas de crecimiento
    if (rawData.daily_metrics) {
      prepared.growth_metrics = rawData.daily_metrics.map(metric => ({
        date: new Date(metric.date),
        users: metric.total_users,
        revenue: metric.total_revenue,
        conversion_rate: metric.conversion_rate
      }));
    }

    return prepared;
  }

  /**
   * Calcular score de engagement de usuario
   */
  calculateEngagementScore(activity) {
    let score = 0;
    
    // Ponderación por tipo de actividad
    const activityWeights = {
      'login': 1,
      'payment': 5,
      'profile_update': 2,
      'support_interaction': 3,
      'feature_usage': 4
    };
    
    score += activityWeights[activity.type] || 1;
    
    // Factor de recencia
    const daysSinceActivity = (Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0, 1 - daysSinceActivity / 30);
    
    return score * recencyFactor;
  }

  /**
   * Calcular severidad de anomalía
   */
  calculateAnomalySeverity(anomaly) {
    const deviation = Math.abs(anomaly.z_score || 0);
    
    if (deviation > 3) return 'critical';
    if (deviation > 2) return 'high';
    if (deviation > 1.5) return 'medium';
    return 'low';
  }

  /**
   * Actualizar datos históricos
   */
  updateHistoricalData(newData) {
    const prepared = this.prepareHistoricalData(newData);
    
    Object.keys(prepared).forEach(key => {
      if (!this.historicalData.has(key)) {
        this.historicalData.set(key, []);
      }
      
      const existing = this.historicalData.get(key);
      this.historicalData.set(key, [...existing, ...prepared[key]]);
    });
  }

  /**
   * Configurar entrenamiento periódico
   */
  setupPeriodicTraining() {
    // Reentrenar modelos cada 24 horas
    setInterval(async () => {
      console.log('🔄 Iniciando reentrenamiento automático...');
      
      try {
        // Aquí se obtendrían datos frescos de la base de datos
        // Por ahora, usamos los datos históricos acumulados
        const historicalData = Object.fromEntries(this.historicalData);
        await this.trainModels(historicalData);
      } catch (error) {
        console.error('❌ Error en reentrenamiento automático:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas
  }

  /**
   * Obtener predicciones cacheadas
   */
  getCachedPredictions() {
    return this.predictions.get('latest') || null;
  }

  /**
   * Obtener anomalías cacheadas
   */
  getCachedAnomalies() {
    return this.anomalies.get('latest') || null;
  }

  /**
   * Obtener estadísticas de los modelos
   */
  getModelStats() {
    return {
      models_loaded: this.models.size,
      is_training: this.isTraining,
      training_queue_size: this.trainingQueue.length,
      historical_data_points: Array.from(this.historicalData.values())
        .reduce((total, data) => total + data.length, 0),
      last_prediction: this.predictions.get('latest')?.timestamp || null,
      last_anomaly_detection: this.anomalies.get('latest')?.timestamp || null
    };
  }
}

/**
 * Clase base para predictores de series temporales
 */
class TimeSeriesPredictor {
  constructor(config) {
    this.windowSize = config.windowSize || 30;
    this.forecastHorizon = config.forecastHorizon || 7;
    this.seasonality = config.seasonality || 7;
    this.model = null;
    this.isTrained = false;
  }

  async train(data) {
    // Implementación simplificada de ARIMA-like
    // En producción, se usaría una librería como TensorFlow.js o ml5.js
    
    console.log(`🎯 Entrenando modelo TimeSeries con ${data.length} puntos de datos`);
    
    // Extraer valores numéricos
    const values = data.map(d => d.value);
    
    // Calcular componentes estacionales
    this.seasonalComponent = this.calculateSeasonalComponent(values);
    this.trendComponent = this.calculateTrendComponent(values);
    
    // Calcular parámetros del modelo
    this.model = {
      seasonal: this.seasonalComponent,
      trend: this.trendComponent,
      lastValues: values.slice(-this.windowSize)
    };
    
    this.isTrained = true;
    console.log('✅ Modelo TimeSeries entrenado');
  }

  async predict(data, horizon) {
    if (!this.isTrained) {
      throw new Error('Modelo no entrenado');
    }

    const predictions = [];
    const lastValues = data.slice(-this.windowSize).map(d => d.value);
    
    for (let i = 1; i <= horizon; i++) {
      const prediction = this.forecastNext(lastValues, i);
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predicted: prediction,
        confidence: this.calculateConfidence(i, horizon)
      });
    }
    
    return predictions;
  }

  forecastNext(values, stepAhead) {
    // Implementación simplificada de forecasting
    const lastTrend = this.trendComponent;
    const seasonalIndex = (values.length + stepAhead) % this.seasonality;
    const seasonalFactor = this.seasonalComponent[seasonalIndex] || 1;
    
    const lastValue = values[values.length - 1];
    const prediction = lastValue * (1 + lastTrend) * seasonalFactor;
    
    return Math.max(0, prediction);
  }

  calculateSeasonalComponent(values) {
    const seasonal = [];
    const cycles = Math.floor(values.length / this.seasonality);
    
    for (let i = 0; i < this.seasonality; i++) {
      let sum = 0;
      let count = 0;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        const index = cycle * this.seasonality + i;
        if (index < values.length) {
          sum += values[index];
          count++;
        }
      }
      
      seasonal.push(count > 0 ? sum / count : 1);
    }
    
    // Normalizar para que el promedio sea 1
    const avg = seasonal.reduce((a, b) => a + b, 0) / seasonal.length;
    return seasonal.map(s => s / avg);
  }

  calculateTrendComponent(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope / values[values.length - 1]; // Tasa relativa
  }

  calculateConfidence(step, totalHorizon) {
    // La confianza disminuye con la distancia
    return Math.max(0.5, 1 - (step / totalHorizon) * 0.5);
  }
}

/**
 * Predictor de Churn
 */
class ChurnPredictor {
  constructor(config) {
    this.features = config.features || [];
    this.threshold = config.threshold || 0.7;
    this.model = null;
    this.isTrained = false;
  }

  async train(data) {
    console.log(`🎯 Entrenando modelo de Churn con ${data.length} usuarios`);
    
    // Implementación simplificada de regresión logística
    // En producción, se usaría un algoritmo más sofisticado
    
    this.model = {
      weights: this.calculateWeights(data),
      featureImportance: this.calculateFeatureImportance(data)
    };
    
    this.isTrained = true;
    console.log('✅ Modelo de Churn entrenado');
  }

  async predict(data) {
    if (!this.isTrained) {
      throw new Error('Modelo no entrenado');
    }

    const predictions = data.map(user => {
      const risk = this.calculateChurnRisk(user);
      return {
        user_id: user.user_id,
        risk: risk,
        risk_level: this.getRiskLevel(risk),
        contributing_factors: this.getContributingFactors(user)
      };
    });

    return predictions;
  }

  calculateChurnRisk(user) {
    // Implementación simplificada
    let risk = 0;
    
    // Factor de actividad reciente
    const daysSinceLastActivity = (Date.now() - new Date(user.timestamp)) / (1000 * 60 * 60 * 24);
    risk += Math.min(daysSinceLastActivity / 30, 1) * 0.4;
    
    // Factor de engagement score
    risk += (1 - Math.min(user.engagement_score / 10, 1)) * 0.3;
    
    // Factor de historial de pagos
    risk += (user.payment_issues || 0) * 0.2;
    
    // Factor aleatorio para simulación
    risk += Math.random() * 0.1;
    
    return Math.min(risk, 1);
  }

  getRiskLevel(risk) {
    if (risk > 0.8) return 'critical';
    if (risk > 0.6) return 'high';
    if (risk > 0.4) return 'medium';
    return 'low';
  }

  getContributingFactors(user) {
    const factors = [];
    
    const daysSinceLastActivity = (Date.now() - new Date(user.timestamp)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 14) {
      factors.push('inactividad_prolongada');
    }
    
    if (user.engagement_score < 3) {
      factors.push('bajo_engagement');
    }
    
    if (user.payment_issues > 0) {
      factors.push('problemas_pago');
    }
    
    return factors;
  }

  calculateWeights(data) {
    // Implementación simplificada
    return {
      activity: 0.4,
      engagement: 0.3,
      payments: 0.2,
      support: 0.1
    };
  }

  calculateFeatureImportance(data) {
    return {
      activity: 0.35,
      engagement: 0.30,
      payments: 0.25,
      support: 0.10
    };
  }
}

/**
 * Detector de Anomalías
 */
class AnomalyDetector {
  constructor(config) {
    this.sensitivity = config.sensitivity || 0.95;
    this.windowSize = config.windowSize || 14;
    this.minSamples = config.minSamples || 50;
    this.model = null;
    this.isTrained = false;
  }

  async train(data) {
    console.log(`🎯 Entrenando detector de anomalías con ${data.length} muestras`);
    
    this.model = {
      mean: this.calculateMean(data),
      stdDev: this.calculateStdDev(data),
      threshold: this.calculateThreshold(data)
    };
    
    this.isTrained = true;
    console.log('✅ Detector de anomalías entrenado');
  }

  async detect(data) {
    if (!this.isTrained) {
      throw new Error('Modelo no entrenado');
    }

    const anomalies = [];
    
    data.forEach((point, index) => {
      const zScore = this.calculateZScore(point);
      
      if (Math.abs(zScore) > this.model.threshold) {
        anomalies.push({
          index,
          value: point,
          z_score: zScore,
          confidence: this.calculateAnomalyConfidence(zScore),
          description: this.describeAnomaly(zScore)
        });
      }
    });
    
    return anomalies;
  }

  calculateMean(data) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  calculateStdDev(data) {
    const mean = this.calculateMean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  calculateThreshold(data) {
    // Threshold basado en percentiles para mayor robustez
    const sorted = [...data].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    
    return Math.max(
      Math.abs(p95 - this.calculateMean(data)) / this.calculateStdDev(data),
      Math.abs(p5 - this.calculateMean(data)) / this.calculateStdDev(data),
      2 // Mínimo 2 desviaciones estándar
    );
  }

  calculateZScore(value) {
    return (value - this.model.mean) / this.model.stdDev;
  }

  calculateAnomalyConfidence(zScore) {
    return Math.min(0.99, Math.abs(zScore) / 4);
  }

  describeAnomaly(zScore) {
    if (zScore > 3) return 'Valor extremadamente alto';
    if (zScore > 2) return 'Valor inusualmente alto';
    if (zScore < -3) return 'Valor extremadamente bajo';
    if (zScore < -2) return 'Valor inusualmente bajo';
    return 'Valor atípico';
  }
}

/**
 * Predictor de Crecimiento
 */
class GrowthPredictor {
  constructor(config) {
    this.lookbackPeriod = config.lookbackPeriod || 90;
    this.confidenceInterval = config.confidenceInterval || 0.95;
    this.model = null;
    this.isTrained = false;
  }

  async train(data) {
    console.log(`🎯 Entrenando predictor de crecimiento con ${data.length} días`);
    
    this.model = {
      growthRates: this.calculateGrowthRates(data),
      seasonality: this.calculateSeasonality(data),
      trend: this.calculateTrend(data)
    };
    
    this.isTrained = true;
    console.log('✅ Predictor de crecimiento entrenado');
  }

  async predict(data, horizon) {
    if (!this.isTrained) {
      throw new Error('Modelo no entrenado');
    }

    const predictions = [];
    const recentData = data.slice(-this.lookbackPeriod);
    
    for (let i = 1; i <= horizon; i++) {
      const growthRate = this.predictGrowthRate(recentData, i);
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        growth_rate: growthRate,
        confidence: this.calculateConfidence(i, horizon),
        predicted_users: this.predictUsers(recentData, i),
        predicted_revenue: this.predictRevenue(recentData, i)
      });
    }
    
    return predictions;
  }

  calculateGrowthRates(data) {
    const rates = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      if (previous.users > 0) {
        const userGrowth = (current.users - previous.users) / previous.users;
        rates.push(userGrowth);
      }
    }
    
    return rates;
  }

  calculateSeasonality(data) {
    // Implementación simplificada de análisis estacional
    const weeklyPattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    
    data.forEach((point, index) => {
      const dayOfWeek = new Date(point.date).getDay();
      weeklyPattern[dayOfWeek] += point.users || 0;
      counts[dayOfWeek]++;
    });
    
    return weeklyPattern.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
  }

  calculateTrend(data) {
    const userCounts = data.map(d => d.users || 0);
    const n = userCounts.length;
    
    if (n < 2) return 0;
    
    // Regresión lineal simple
    const sumX = (n * (n - 1)) / 2;
    const sumY = userCounts.reduce((a, b) => a + b, 0);
    const sumXY = userCounts.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope;
  }

  predictGrowthRate(data, stepAhead) {
    const avgGrowthRate = this.model.growthRates.reduce((a, b) => a + b, 0) / this.model.growthRates.length;
    const seasonalAdjustment = this.getSeasonalAdjustment(stepAhead);
    
    return avgGrowthRate * seasonalAdjustment;
  }

  getSeasonalAdjustment(stepAhead) {
    const dayOfWeek = (new Date().getDay() + stepAhead) % 7;
    const avgWeekly = this.model.seasonality.reduce((a, b) => a + b, 0) / 7;
    
    return avgWeekly > 0 ? this.model.seasonality[dayOfWeek] / avgWeekly : 1;
  }

  predictUsers(data, stepAhead) {
    const lastUsers = data[data.length - 1]?.users || 0;
    const growthRate = this.predictGrowthRate(data, stepAhead);
    
    return Math.floor(lastUsers * (1 + growthRate));
  }

  predictRevenue(data, stepAhead) {
    const lastRevenue = data[data.length - 1]?.revenue || 0;
    const growthRate = this.predictGrowthRate(data, stepAhead);
    
    return lastRevenue * (1 + growthRate);
  }

  calculateConfidence(step, totalHorizon) {
    return Math.max(0.6, 1 - (step / totalHorizon) * 0.4);
  }
}

// Exportar el servicio principal
export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export default predictiveAnalyticsService;