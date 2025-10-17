/**
 * Streaming Analytics Service
 * 
 * Servicio de analytics en tiempo real mejorado con streaming
 * Implementa procesamiento de datos en vivo y dashboards interactivos
 */

class StreamingAnalyticsService {
  constructor() {
    this.streams = new Map();
    this.realtimeData = new Map();
    this.subscribers = new Map();
    this.dataBuffer = new Map();
    this.aggregationWindows = new Map();
    this.streamProcessors = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.metrics = {
      messagesProcessed: 0,
      bytesReceived: 0,
      activeStreams: 0,
      subscribersCount: 0,
      lastUpdate: null
    };
  }

  /**
   * Inicializar el servicio de streaming
   */
  async initialize() {
    console.log('🌊 Inicializando Streaming Analytics Service...');

    try {
      // Inicializar procesadores de stream
      this.initializeStreamProcessors();
      
      // Configurar ventanas de agregación
      this.setupAggregationWindows();
      
      // Conectar a fuentes de datos en tiempo real
      await this.connectToDataSources();
      
      // Iniciar heartbeat
      this.startHeartbeat();
      
      this.isConnected = true;
      console.log('✅ Streaming Analytics Service inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Streaming Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Inicializar procesadores de stream
   */
  initializeStreamProcessors() {
    // Procesador de eventos de usuario
    this.streamProcessors.set('user_events', new UserEventStreamProcessor({
      bufferSize: 1000,
      aggregationInterval: 5000, // 5 segundos
    }));

    // Procesador de transacciones
    this.streamProcessors.set('transactions', new TransactionStreamProcessor({
      bufferSize: 2000,
      aggregationInterval: 1000, // 1 segundo
    }));

    // Procesador de métricas del sistema
    this.streamProcessors.set('system_metrics', new SystemMetricsStreamProcessor({
      bufferSize: 500,
      aggregationInterval: 2000 // 2 segundos
    }));

    // Procesador de eventos de negocio
    this.streamProcessors.set('business_events', new BusinessEventStreamProcessor({
      bufferSize: 1500,
      aggregationInterval: 3000 // 3 segundos
    }));

    console.log('📊 Procesadores de stream inicializados');
  }

  /**
   * Configurar ventanas de agregación
   */
  setupAggregationWindows() {
    // Ventanas de tiempo para diferentes métricas
    this.aggregationWindows.set('realtime', {
      duration: 60000, // 1 minuto
      granularity: 1000, // 1 segundo
      retention: 300000 // 5 minutos
    });

    this.aggregationWindows.set('short_term', {
      duration: 300000, // 5 minutos
      granularity: 5000, // 5 segundos
      retention: 900000 // 15 minutos
    });

    this.aggregationWindows.set('medium_term', {
      duration: 1800000, // 30 minutos
      granularity: 30000, // 30 segundos
      retention: 3600000 // 1 hora
    });

    this.aggregationWindows.set('long_term', {
      duration: 7200000, // 2 horas
      granularity: 300000, // 5 minutos
      retention: 14400000 // 4 horas
    });

    console.log('⏰ Ventanas de agregación configuradas');
  }

  /**
   * Conectar a fuentes de datos en tiempo real
   */
  async connectToDataSources() {
    // Simular conexión a múltiples fuentes de datos
    // En producción, se conectaría a:
    // - WebSocket de Supabase
    // - Apache Kafka
    // - Redis Streams
    // - WebHooks externos

    this.simulateDataStream('user_events', 1000); // Cada segundo
    this.simulateDataStream('transactions', 500); // Cada 500ms
    this.simulateDataStream('system_metrics', 2000); // Cada 2 segundos
    this.simulateDataStream('business_events', 1500); // Cada 1.5 segundos

    console.log('🔌 Conectado a fuentes de datos en tiempo real');
  }

  /**
   * Simular stream de datos (para demostración)
   */
  simulateDataStream(streamType, interval) {
    const stream = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(stream);
        return;
      }

      const data = this.generateStreamData(streamType);
      this.processStreamData(streamType, data);
    }, interval);

    this.streams.set(streamType, stream);
    this.metrics.activeStreams++;
  }

  /**
   * Generar datos de stream simulados
   */
  generateStreamData(streamType) {
    const timestamp = new Date().toISOString();
    
    switch (streamType) {
      case 'user_events':
        return {
          type: 'user_event',
          timestamp,
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          eventType: this.getRandomEventType(),
          properties: {
            page: this.getRandomPage(),
            action: this.getRandomAction(),
            duration: Math.floor(Math.random() * 300000), // 0-5 minutos
            userAgent: navigator.userAgent
          }
        };

      case 'transactions':
        return {
          type: 'transaction',
          timestamp,
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.floor(Math.random() * 100000) + 1000, // $1,000 - $100,000
          currency: 'CLP',
          status: this.getRandomTransactionStatus(),
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          metadata: {
            paymentMethod: this.getRandomPaymentMethod(),
            category: this.getRandomCategory()
          }
        };

      case 'system_metrics':
        return {
          type: 'system_metric',
          timestamp,
          metric: this.getRandomSystemMetric(),
          value: Math.random() * 100,
          unit: this.getRandomMetricUnit(),
          tags: {
            service: this.getRandomService(),
            environment: 'production',
            region: 'us-east-1'
          }
        };

      case 'business_events':
        return {
          type: 'business_event',
          timestamp,
          eventType: this.getRandomBusinessEventType(),
          entityId: this.getRandomEntityId(),
          properties: {
            impact: this.getRandomImpact(),
            priority: this.getRandomPriority(),
            department: this.getRandomDepartment()
          }
        };

      default:
        return { type: 'unknown', timestamp };
    }
  }

  /**
   * Procesar datos de stream
   */
  async processStreamData(streamType, data) {
    try {
      // Actualizar métricas
      this.metrics.messagesProcessed++;
      this.metrics.bytesReceived += JSON.stringify(data).length;
      this.metrics.lastUpdate = new Date().toISOString();

      // Obtener procesador correspondiente
      const processor = this.streamProcessors.get(streamType);
      if (!processor) {
        console.warn(`No hay procesador para el stream: ${streamType}`);
        return;
      }

      // Procesar datos
      const processedData = await processor.process(data);

      // Almacenar en buffer
      this.storeInBuffer(streamType, processedData);

      // Agregar a datos en tiempo real
      this.addToRealtimeData(streamType, processedData);

      // Notificar a suscriptores
      this.notifySubscribers(streamType, processedData);

      // Agregar a ventanas de agregación
      this.addToAggregationWindows(streamType, processedData);

    } catch (error) {
      console.error(`Error procesando datos del stream ${streamType}:`, error);
    }
  }

  /**
   * Almacenar en buffer
   */
  storeInBuffer(streamType, data) {
    if (!this.dataBuffer.has(streamType)) {
      this.dataBuffer.set(streamType, []);
    }

    const buffer = this.dataBuffer.get(streamType);
    buffer.push(data);

    // Mantener tamaño máximo del buffer
    const maxSize = this.streamProcessors.get(streamType)?.config.bufferSize || 1000;
    if (buffer.length > maxSize) {
      buffer.shift();
    }
  }

  /**
   * Agregar a datos en tiempo real
   */
  addToRealtimeData(streamType, data) {
    if (!this.realtimeData.has(streamType)) {
      this.realtimeData.set(streamType, {
        latest: null,
        count: 0,
        lastUpdate: null
      });
    }

    const realtimeData = this.realtimeData.get(streamType);
    realtimeData.latest = data;
    realtimeData.count++;
    realtimeData.lastUpdate = new Date().toISOString();
  }

  /**
   * Notificar a suscriptores
   */
  notifySubscribers(streamType, data) {
    const subscribers = this.subscribers.get(streamType);
    if (!subscribers) return;

    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en callback de suscriptor:', error);
      }
    });
  }

  /**
   * Agregar a ventanas de agregación
   */
  addToAggregationWindows(streamType, data) {
    this.aggregationWindows.forEach((window, windowName) => {
      const key = `${streamType}_${windowName}`;
      
      if (!this.dataBuffer.has(key)) {
        this.dataBuffer.set(key, []);
      }

      const windowBuffer = this.dataBuffer.get(key);
      windowBuffer.push({
        data,
        timestamp: new Date(),
        windowStart: new Date(Date.now() - window.duration)
      });

      // Liminar datos expirados
      const cutoffTime = new Date(Date.now() - window.retention);
      const filteredBuffer = windowBuffer.filter(item => item.timestamp > cutoffTime);
      this.dataBuffer.set(key, filteredBuffer);
    });
  }

  /**
   * Suscribirse a stream
   */
  subscribe(streamType, callback, options = {}) {
    if (!this.subscribers.has(streamType)) {
      this.subscribers.set(streamType, new Set());
    }

    const subscribers = this.subscribers.get(streamType);
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    subscribers.add(callback);
    this.metrics.subscribersCount++;

    // Enviar datos actuales si se solicita
    if (options.sendCurrentData) {
      const currentData = this.realtimeData.get(streamType);
      if (currentData?.latest) {
        setTimeout(() => callback(currentData.latest), 0);
      }
    }

    return {
      subscriptionId,
      unsubscribe: () => {
        subscribers.delete(callback);
        this.metrics.subscribersCount--;
      }
    };
  }

  /**
   * Obtener datos agregados
   */
  getAggregatedData(streamType, windowName, aggregationType = 'sum') {
    const key = `${streamType}_${windowName}`;
    const buffer = this.dataBuffer.get(key) || [];

    if (buffer.length === 0) {
      return null;
    }

    const now = new Date();
    const window = this.aggregationWindows.get(windowName);
    const windowStart = new Date(now.getTime() - window.duration);

    // Filtrar datos dentro de la ventana
    const windowData = buffer.filter(item => item.timestamp >= windowStart);

    // Aplicar agregación
    return this.applyAggregation(windowData, aggregationType);
  }

  /**
   * Aplicar agregación a datos
   */
  applyAggregation(data, aggregationType) {
    if (data.length === 0) return null;

    switch (aggregationType) {
      case 'sum':
        return data.reduce((sum, item) => {
          const value = this.extractNumericValue(item.data);
          return sum + value;
        }, 0);

      case 'avg':
        const sum = data.reduce((sum, item) => {
          const value = this.extractNumericValue(item.data);
          return sum + value;
        }, 0);
        return sum / data.length;

      case 'count':
        return data.length;

      case 'min':
        return Math.min(...data.map(item => this.extractNumericValue(item.data)));

      case 'max':
        return Math.max(...data.map(item => this.extractNumericValue(item.data)));

      case 'latest':
        return data[data.length - 1]?.data;

      default:
        return data;
    }
  }

  /**
   * Extraer valor numérico de datos
   */
  extractNumericValue(data) {
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data !== null) {
      return data.value || data.amount || 0;
    }
    return 0;
  }

  /**
   * Obtener métricas del stream
   */
  getStreamMetrics(streamType) {
    const realtimeData = this.realtimeData.get(streamType);
    const buffer = this.dataBuffer.get(streamType) || [];

    return {
      streamType,
      isConnected: this.isConnected,
      messageCount: realtimeData?.count || 0,
      bufferSize: buffer.length,
      lastUpdate: realtimeData?.lastUpdate,
      latestData: realtimeData?.latest,
      subscribersCount: this.subscribers.get(streamType)?.size || 0
    };
  }

  /**
   * Obtener todas las métricas
   */
  getAllMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      activeStreams: this.metrics.activeStreams,
      subscribersCount: this.metrics.subscribersCount,
      streamDetails: Array.from(this.realtimeData.keys()).map(streamType => 
        this.getStreamMetrics(streamType)
      )
    };
  }

  /**
   * Iniciar heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Enviar heartbeat a todas las conexiones
        this.sendHeartbeat();
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * Enviar heartbeat
   */
  sendHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      service: 'streaming_analytics',
      metrics: this.metrics
    };

    // Notificar a todos los suscriptores del heartbeat
    this.notifySubscribers('heartbeat', heartbeat);
  }

  /**
   * Detener streaming
   */
  stop() {
    console.log('🛑 Deteniendo Streaming Analytics Service');

    // Limpiar intervalos
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Limpiar streams
    this.streams.forEach(stream => clearInterval(stream));
    this.streams.clear();

    // Limpiar suscriptores
    this.subscribers.clear();

    // Limpiar buffers
    this.dataBuffer.clear();
    this.realtimeData.clear();

    this.isConnected = false;
    console.log('✅ Streaming Analytics Service detenido');
  }

  /**
   * Reconectar servicio
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      await this.initialize();
      this.reconnectAttempts = 0;
      console.log('✅ Reconexión exitosa');
    } catch (error) {
      console.error('❌ Error en reconexión:', error);
      setTimeout(() => this.reconnect(), 5000 * this.reconnectAttempts);
    }
  }

  // Métodos utilitarios para generar datos aleatorios
  getRandomEventType() {
    const types = ['page_view', 'click', 'scroll', 'form_submit', 'download', 'search'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomPage() {
    const pages = ['/dashboard', '/analytics', '/payments', '/users', '/settings', '/reports'];
    return pages[Math.floor(Math.random() * pages.length)];
  }

  getRandomAction() {
    const actions = ['view', 'click', 'submit', 'download', 'search', 'filter'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  getRandomTransactionStatus() {
    const statuses = ['pending', 'completed', 'failed', 'refunded'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  getRandomPaymentMethod() {
    const methods = ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getRandomCategory() {
    const categories = ['services', 'products', 'subscriptions', 'donations'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  getRandomSystemMetric() {
    const metrics = ['cpu_usage', 'memory_usage', 'disk_io', 'network_io', 'response_time'];
    return metrics[Math.floor(Math.random() * metrics.length)];
  }

  getRandomMetricUnit() {
    const units = ['%', 'ms', 'MB/s', 'req/s', 'connections'];
    return units[Math.floor(Math.random() * units.length)];
  }

  getRandomService() {
    const services = ['api', 'database', 'cache', 'queue', 'storage'];
    return services[Math.floor(Math.random() * services.length)];
  }

  getRandomBusinessEventType() {
    const types = ['sale', 'refund', 'cancellation', 'upgrade', 'registration'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomEntityId() {
    return `entity_${Math.floor(Math.random() * 10000)}`;
  }

  getRandomImpact() {
    const impacts = ['low', 'medium', 'high', 'critical'];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  getRandomPriority() {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  getRandomDepartment() {
    const departments = ['sales', 'support', 'engineering', 'marketing', 'finance'];
    return departments[Math.floor(Math.random() * departments.length)];
  }
}

/**
 * Procesador de Stream de Eventos de Usuario
 */
class UserEventStreamProcessor {
  constructor(config) {
    this.config = config;
    this.eventCounts = new Map();
    this.userSessions = new Map();
  }

  async process(data) {
    // Contar eventos por tipo
    const eventType = data.eventType;
    this.eventCounts.set(eventType, (this.eventCounts.get(eventType) || 0) + 1);

    // Actualizar sesión de usuario
    this.updateUserSession(data);

    // Enriquecer datos
    return {
      ...data,
      processed: true,
      eventTypeCount: this.eventCounts.get(eventType),
      sessionInfo: this.userSessions.get(data.userId)
    };
  }

  updateUserSession(data) {
    const sessionId = `${data.userId}_${new Date().toDateString()}`;
    
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, {
        userId: data.userId,
        sessionId,
        startTime: new Date(),
        events: [],
        pages: new Set(),
        duration: 0
      });
    }

    const session = this.userSessions.get(sessionId);
    session.events.push(data);
    session.pages.add(data.properties?.page);
    session.duration = Date.now() - session.startTime.getTime();
  }
}

/**
 * Procesador de Stream de Transacciones
 */
class TransactionStreamProcessor {
  constructor(config) {
    this.config = config;
    this.transactionStats = {
      totalAmount: 0,
      count: 0,
      statusCounts: new Map(),
      averageAmount: 0
    };
  }

  async process(data) {
    // Actualizar estadísticas
    this.transactionStats.count++;
    this.transactionStats.totalAmount += data.amount;
    this.transactionStats.averageAmount = this.transactionStats.totalAmount / this.transactionStats.count;

    const status = data.status;
    this.transactionStats.statusCounts.set(status, (this.transactionStats.statusCounts.get(status) || 0) + 1);

    return {
      ...data,
      processed: true,
      stats: this.transactionStats,
      riskScore: this.calculateRiskScore(data)
    };
  }

  calculateRiskScore(transaction) {
    // Lógica simple de cálculo de riesgo
    let score = 0;
    
    if (transaction.amount > 50000) score += 2;
    if (transaction.status === 'failed') score += 3;
    if (transaction.metadata?.paymentMethod === 'digital_wallet') score += 1;
    
    return Math.min(score, 10);
  }
}

/**
 * Procesador de Stream de Métricas del Sistema
 */
class SystemMetricsStreamProcessor {
  constructor(config) {
    this.config = config;
    this.metricsHistory = new Map();
  }

  async process(data) {
    const metric = data.metric;
    
    if (!this.metricsHistory.has(metric)) {
      this.metricsHistory.set(metric, []);
    }

    const history = this.metricsHistory.get(metric);
    history.push({
      value: data.value,
      timestamp: new Date(),
      unit: data.unit
    });

    // Mantener solo los últimos 100 valores
    if (history.length > 100) {
      history.shift();
    }

    return {
      ...data,
      processed: true,
      trend: this.calculateTrend(history),
      average: this.calculateAverage(history),
      alert: this.checkAlert(data, history)
    };
  }

  calculateTrend(history) {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  calculateAverage(history) {
    if (history.length === 0) return 0;
    return history.reduce((sum, item) => sum + item.value, 0) / history.length;
  }

  checkAlert(data, history) {
    const threshold = this.getThreshold(data.metric);
    if (data.value > threshold) {
      return {
        level: 'warning',
        message: `${data.metric} exceeds threshold: ${data.value} > ${threshold}`,
        threshold
      };
    }
    return null;
  }

  getThreshold(metric) {
    const thresholds = {
      cpu_usage: 80,
      memory_usage: 85,
      response_time: 1000,
      disk_io: 90
    };
    return thresholds[metric] || 100;
  }
}

/**
 * Procesador de Stream de Eventos de Negocio
 */
class BusinessEventStreamProcessor {
  constructor(config) {
    this.config = config;
    this.businessMetrics = new Map();
  }

  async process(data) {
    // Actualizar métricas de negocio
    this.updateBusinessMetrics(data);

    return {
      ...data,
      processed: true,
      businessImpact: this.calculateBusinessImpact(data),
      recommendations: this.generateRecommendations(data)
    };
  }

  updateBusinessMetrics(data) {
    const eventType = data.eventType;
    this.businessMetrics.set(eventType, (this.businessMetrics.get(eventType) || 0) + 1);
  }

  calculateBusinessImpact(event) {
    const impactScores = {
      'sale': 10,
      'refund': -5,
      'cancellation': -8,
      'upgrade': 7,
      'registration': 5
    };
    
    return impactScores[event.eventType] || 0;
  }

  generateRecommendations(event) {
    const recommendations = [];
    
    if (event.eventType === 'cancellation') {
      recommendations.push('Investigar razones de cancelación');
      recommendations.push('Ofrecer incentivos de retención');
    }
    
    if (event.eventType === 'sale') {
      recommendations.push('Analizar patrón de compra exitoso');
      recommendations.push('Optimizar funnel de conversión');
    }
    
    return recommendations;
  }
}

// Exportar el servicio principal
export const streamingAnalyticsService = new StreamingAnalyticsService();
export default streamingAnalyticsService;