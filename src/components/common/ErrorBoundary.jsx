/**
 * Error Boundary Component
 *
 * Captura errores de JavaScript en el árbol de componentes
 * y muestra una UI de fallback amigable
 */

import React from 'react';
import { Card, Button } from './index';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error en consola (logger no disponible)
    console.error('ErrorBoundary capturó un error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                ¡Ups! Algo salió mal
              </h2>
              <p className="text-secondary-600 text-sm">
                Ha ocurrido un error inesperado. Nuestros desarrolladores han sido notificados.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={this.handleRetry} variant="primary" className="w-full">
                Intentar de nuevo
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="secondary"
                className="w-full"
              >
                Ir al inicio
              </Button>
            </div>

            {/* Mostrar detalles técnicos en desarrollo */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-secondary-500 hover:text-secondary-700">
                  Detalles técnicos (desarrollo)
                </summary>
                <pre className="mt-2 text-xs bg-secondary-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;