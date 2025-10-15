import React from 'react';
import { Card, Button } from '../common';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  title = 'Error de conexión',
  showRetry = true,
  showDismiss = true 
}) => {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'Error desconocido';
  };

  const getErrorType = (error) => {
    if (typeof error === 'string') {
      if (error.includes('network') || error.includes('conexión')) return 'network';
      if (error.includes('timeout')) return 'timeout';
      if (error.includes('permission')) return 'permission';
      return 'general';
    }
    
    if (error?.type) return error.type;
    if (error?.code === 'NETWORK_ERROR') return 'network';
    if (error?.code === 'TIMEOUT') return 'timeout';
    return 'general';
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return '🌐';
      case 'timeout':
        return '⏰';
      case 'permission':
        return '🔒';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'network':
        return 'border-orange-200 bg-orange-50';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50';
      case 'permission':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={`${getErrorColor()} border`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg">
              {getErrorIcon()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {title}
              </h3>
              {showDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mb-3">
              {errorMessage}
            </p>
            
            <div className="flex items-center gap-2">
              {showRetry && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                >
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ErrorDisplay;