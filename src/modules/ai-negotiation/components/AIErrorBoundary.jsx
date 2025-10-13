/**
 * AI Error Boundary
 * 
 * Protege la aplicación principal de errores del módulo de IA
 * Si algo falla en IA, la aplicación principal sigue funcionando
 */

import React from 'react';

export class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Capturar información del error para debugging
    console.error('🚨 AI Module Error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Enviar error a servicio de monitoreo (opcional)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    try {
      // Enviar a servicio de logging sin afectar la app
      fetch('/api/log-ai-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Silenciar errores de logging para no causar más problemas
      });
    } catch {
      // Ignorar errores de logging
    }
  };

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleDisableAI = () => {
    try {
      localStorage.setItem('ai_module_temporarily_disabled', 'true');
      window.location.reload();
    } catch {
      // Si no puede desactivar, redirigir a página segura
      window.location.href = '/empresa/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {/* Icono de error */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Módulo de IA no disponible
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                El sistema de IA encontró un problema temporal. 
                Esto no afecta el funcionamiento normal de NexuPay.
              </p>

              {/* Botones de acción */}
              <div className="space-y-3">
                {this.state.retryCount < 3 && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reintentar ({3 - this.state.retryCount} intentos restantes)
                  </button>
                )}

                <button
                  onClick={this.handleDisableAI}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Desactivar IA temporalmente
                </button>

                <button
                  onClick={() => window.location.href = '/empresa/dashboard'}
                  className="w-full text-blue-600 py-2 px-4 hover:text-blue-700 transition-colors"
                >
                  Volver al dashboard principal
                </button>
              </div>

              {/* Información de error (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Ver detalles del error (desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook personalizado para usar el Error Boundary
export const useAIErrorBoundary = () => {
  const checkAIStatus = () => {
    try {
      return localStorage.getItem('ai_module_temporarily_disabled') !== 'true';
    } catch {
      return true;
    }
  };

  const temporarilyDisableAI = () => {
    try {
      localStorage.setItem('ai_module_temporarily_disabled', 'true');
      return true;
    } catch {
      return false;
    }
  };

  const reEnableAI = () => {
    try {
      localStorage.removeItem('ai_module_temporarily_disabled');
      return true;
    } catch {
      return false;
    }
  };

  return {
    isAIEnabled: checkAIStatus(),
    disableAI: temporarilyDisableAI,
    enableAI: reEnableAI
  };
};

export default AIErrorBoundary;