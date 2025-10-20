/**
 * Logger Service
 *
 * Servicio de logging para monitoreo de errores y eventos
 * Compatible con Sentry, LogRocket, o servicios similares
 */

class LoggerService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.serviceUrl = import.meta.env.VITE_LOGGING_SERVICE_URL;
    this.apiKey = import.meta.env.VITE_LOGGING_API_KEY;
  }

  /**
   * Log de error
   */
  error(message, error = null, context = {}) {
    const logData = {
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.isDevelopment ? 'development' : 'production'
      }
    };

    // Log en consola
    console.error('[ERROR]', logData);

    // Enviar a servicio externo si está configurado
    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService(logData);
    }
  }

  /**
   * Log de warning
   */
  warning(message, context = {}) {
    const logData = {
      level: 'warning',
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    console.warn('[WARNING]', logData);

    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService(logData);
    }
  }

  /**
   * Log informativo
   */
  info(message, context = {}) {
    const logData = {
      level: 'info',
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    console.info('[INFO]', logData);

    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService(logData);
    }
  }

  /**
   * Log de evento de usuario
   */
  event(eventName, properties = {}) {
    const eventData = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      }
    };

    console.log('[EVENT]', eventData);

    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService(eventData);
    }
  }

  /**
   * Log de performance
   */
  performance(metricName, value, context = {}) {
    const perfData = {
      type: 'performance',
      metric: metricName,
      value,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    console.log('[PERFORMANCE]', perfData);

    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService(perfData);
    }
  }

  /**
   * Enviar datos al servicio externo
   */
  async sendToService(data) {
    try {
      await fetch(this.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      // Fallback: no fallar si el servicio de logging falla
      console.error('[LOGGER ERROR]', error);
    }
  }

  /**
   * Obtener ID de sesión
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Configurar usuario para tracking
   */
  setUser(userId, userProperties = {}) {
    this.userId = userId;
    this.userProperties = userProperties;

    if (this.serviceUrl && !this.isDevelopment) {
      this.sendToService({
        type: 'user',
        userId,
        properties: userProperties
      });
    }
  }

  /**
   * Limpiar usuario
   */
  clearUser() {
    this.userId = null;
    this.userProperties = null;
  }
}

// Instancia singleton
const logger = new LoggerService();

export default logger;

// Funciones de conveniencia
export const logError = (message, error, context) => logger.error(message, error, context);
export const logWarning = (message, context) => logger.warning(message, context);
export const logInfo = (message, context) => logger.info(message, context);
export const logEvent = (eventName, properties) => logger.event(eventName, properties);
export const logPerformance = (metricName, value, context) => logger.performance(metricName, value, context);