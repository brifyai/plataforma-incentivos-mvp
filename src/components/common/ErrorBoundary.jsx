import React from 'react';
import { Button } from './index';

/**
 * Error Boundary Component
 * 
 * Captura errores en componentes hijos y muestra una interfaz amigable
 * en lugar de una página en blanco.
 */
class ErrorBoundary extends React.Component {
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
    // Registrar el error para debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Opcional: Enviar error a servicio de reporte
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    // Incrementar contador de reintentos
    const newRetryCount = this.state.retryCount + 1;
    
    // Si hay demasiados reintentos, no seguir intentando
    if (newRetryCount > 3) {
      this.setState({
        hasError: true,
        error: new Error('Demasiados reintentos. Por favor, recargue la página.'),
        retryCount: newRetryCount
      });
      return;
    }

    // Resetear estado y reintentar
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Renderizar UI personalizada de error
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Icono de error */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Título y mensaje */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
            </p>

            {/* Botones de acción */}
            <div className="space-y-3">
              {this.state.retryCount < 3 && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="gradient"
                >
                  Reintentar {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
                </Button>
              )}
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Recargar Página
              </Button>
              
              <Button
                onClick={() => window.history.back()}
                variant="secondary"
                className="w-full"
              >
                Volver Atrás
              </Button>
            </div>

            {/* Información de desarrollo */}
            {isDevelopment && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Información de depuración
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  <div className="font-mono">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 font-mono">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Información de contacto */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Si el problema persiste, contacta a soporte@nexpay.cl
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Si no hay error, renderizar normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;