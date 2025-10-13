import React from 'react';

/**
 * Componente de Carga para Módulos de IA
 * 
 * Componente reutilizable para mostrar estados de carga
 * específicos para el módulo de IA
 */
export const AILoader = ({ 
  size = 'medium', 
  message = 'Cargando sistema de IA...', 
  showSpinner = true 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-6">
      {showSpinner && (
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      )}
      <p className={`${textSizeClasses[size]} text-gray-600 text-center`}>
        {message}
      </p>
    </div>
  );
};

/**
 * Componente de Skeleton para IA Dashboard
 */
export const AIDashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Métricas Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-4 h-24"></div>
        ))}
      </div>
      
      {/* Lista Skeleton */}
      <div className="bg-gray-200 rounded-lg p-6 h-96"></div>
      
      {/* Controles Skeleton */}
      <div className="bg-gray-200 rounded-lg p-6 h-32"></div>
    </div>
  );
};

/**
 * Componente de Skeleton para Configuración de IA
 */
export const AIConfigSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      
      {/* Tabs Skeleton */}
      <div className="flex space-x-8 border-b">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded w-24"></div>
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="bg-gray-200 rounded-lg p-6 h-96"></div>
    </div>
  );
};

/**
 * Componente de Error para IA
 */
export const AIError = ({ 
  error, 
  onRetry, 
  onDismiss,
  title = 'Error en el Sistema de IA' 
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error?.message || 'Ha ocurrido un error inesperado en el sistema de IA.'}</p>
            {error?.details && (
              <p className="mt-1 text-xs text-red-600">{error.details}</p>
            )}
          </div>
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de Estado Vacío para IA
 */
export const AIEmptyState = ({ 
  icon,
  title = 'No hay datos disponibles',
  description = 'No se encontraron negociaciones o actividades de IA en este momento.',
  action,
  actionText
}) => {
  const defaultIcon = (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <div className="text-center py-12">
      <div className="flex justify-center">
        {icon || defaultIcon}
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {actionText || 'Acción'}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Indicador de Estado de IA
 */
export const AIStatusIndicator = ({ 
  status = 'loading', 
  message,
  showDetails = false 
}) => {
  const statusConfig = {
    loading: {
      color: 'blue',
      icon: (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      ),
      text: 'Procesando...'
    },
    active: {
      color: 'green',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" />
        </svg>
      ),
      text: 'IA Activa'
    },
    inactive: {
      color: 'gray',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" />
        </svg>
      ),
      text: 'IA Inactiva'
    },
    error: {
      color: 'red',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      text: 'Error en IA'
    }
  };

  const config = statusConfig[status] || statusConfig.loading;

  return (
    <div className={`flex items-center space-x-2 text-${config.color}-600`}>
      {config.icon}
      <span className="text-sm font-medium">
        {message || config.text}
      </span>
      {showDetails && (
        <span className="text-xs text-gray-500">
          (Última actualización: {new Date().toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default {
  AILoader,
  AIDashboardSkeleton,
  AIConfigSkeleton,
  AIError,
  AIEmptyState,
  AIStatusIndicator
};