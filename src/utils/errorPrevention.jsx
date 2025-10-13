/**
 * Sistema de Prevención de Errores
 * 
 * Utilidades para prevenir problemas como páginas en blanco
 * y asegurar la estabilidad de la aplicación
 */

import React from 'react';

/**
 * Verificador de importaciones seguras
 */
export const safeImport = async (importFunc, fallback = null) => {
  try {
    const module = await importFunc();
    return module.default || module;
  } catch (error) {
    console.error(`Error importing module:`, error);
    return fallback;
  }
};

/**
 * Componente de carga segura con timeout
 */
export const SafeLazyComponent = ({ importFunc, fallback = null, timeout = 5000 }) => {
  const [Component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let timeoutId;
    
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Timeout para evitar cargas infinitas
        timeoutId = setTimeout(() => {
          setError('Component loading timeout');
          setLoading(false);
        }, timeout);

        const module = await importFunc();
        clearTimeout(timeoutId);
        
        setComponent(module.default || module);
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error loading component:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadComponent();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [importFunc, timeout]);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">Error loading component: {error}</p>
      </div>
    );
  }

  if (!Component) {
    return fallback || (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">Component not available</p>
      </div>
    );
  }

  return <Component />;
};

/**
 * Verificador de rutas seguras
 */
export const safeRoute = (path, component, fallback = null) => {
  // Verificar que la ruta no esté vacía
  if (!path || typeof path !== 'string') {
    console.warn('Invalid route path:', path);
    return fallback;
  }

  // Verificar que el componente sea válido
  if (!component) {
    console.warn('Invalid component for route:', path);
    return fallback;
  }

  return { path, component };
};

/**
 * Envoltorio seguro para React.lazy
 */
export const safeLazy = (importFunc, fallback = null) => {
  return React.lazy(() => {
    return Promise.resolve()
      .then(() => importFunc())
      .catch(error => {
        console.error('Lazy loading error:', error);
        
        // Retornar componente fallback
        if (fallback) {
          return { default: fallback };
        }
        
        // Componente de error por defecto
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Error loading component. Please refresh the page.
              </p>
            </div>
          )
        };
      });
  });
};

/**
 * Verificador de componentes de navegación
 */
export const safeNavigationItem = (item) => {
  const errors = [];

  // Verificar estructura básica
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Missing or invalid name');
  }

  if (!item.path || typeof item.path !== 'string') {
    errors.push('Missing or invalid path');
  }

  if (!item.icon) {
    errors.push('Missing icon');
  }

  // Verificar que la ruta comience con /
  if (item.path && !item.path.startsWith('/')) {
    errors.push('Path must start with /');
  }

  // Verificar caracteres inválidos en la ruta
  if (item.path && /[^a-zA-Z0-9\-_\/]/.test(item.path)) {
    errors.push('Path contains invalid characters');
  }

  if (errors.length > 0) {
    console.warn(`Invalid navigation item "${item.name}":`, errors);
    return null;
  }

  return item;
};

/**
 * Monitor de salud de la aplicación
 */
export class AppHealthMonitor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.maxErrors = 50;
    this.maxWarnings = 100;
  }

  logError(error, context = '') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorInfo);
    
    // Mantener solo los errores más recientes
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    console.error('App Health Monitor - Error:', errorInfo);
  }

  logWarning(warning, context = '') {
    const warningInfo = {
      timestamp: new Date().toISOString(),
      message: warning,
      context,
      url: window.location.href
    };

    this.warnings.push(warningInfo);
    
    if (this.warnings.length > this.maxWarnings) {
      this.warnings = this.warnings.slice(-this.maxWarnings);
    }

    console.warn('App Health Monitor - Warning:', warningInfo);
  }

  getHealthStatus() {
    return {
      errors: this.errors.slice(-10), // Últimos 10 errores
      warnings: this.warnings.slice(-10), // Últimas 10 advertencias
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      status: this.errors.length > 5 ? 'critical' : this.errors.length > 0 ? 'warning' : 'healthy'
    };
  }

  clear() {
    this.errors = [];
    this.warnings = [];
  }
}

// Instancia global del monitor
export const appHealthMonitor = new AppHealthMonitor();

/**
 * Hook personalizado para manejo seguro de componentes
 */
export const useSafeComponent = (importFunc, dependencies = []) => {
  const [component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const module = await importFunc();
        
        if (mounted) {
          setComponent(module.default || module);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading component:', err);
          setError(err.message);
          setLoading(false);
          appHealthMonitor.logError(err, `useSafeComponent: ${importFunc.toString()}`);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { component, loading, error };
};

/**
 * Verificador de dependencias de la aplicación
 */
export const checkAppDependencies = () => {
  const dependencies = {
    react: typeof React !== 'undefined',
    'react-dom': typeof ReactDOM !== 'undefined',
    'react-router-dom': typeof window.ReactRouterDOM !== 'undefined',
    'lucide-react': typeof window.lucide !== 'undefined'
  };

  const missing = Object.entries(dependencies)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    appHealthMonitor.logError(
      new Error(`Missing dependencies: ${missing.join(', ')}`),
      'checkAppDependencies'
    );
    return false;
  }

  return true;
};

/**
 * Inicialización del sistema de prevención
 */
export const initializeErrorPrevention = () => {
  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    appHealthMonitor.logError(event.error, 'Global Error Handler');
  });

  // Capturar promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    appHealthMonitor.logError(event.reason, 'Unhandled Promise Rejection');
  });

  // Verificar dependencias críticas
  if (!checkAppDependencies()) {
    console.warn('Some dependencies are missing. App may not work correctly.');
  }

  console.log('Error prevention system initialized');
};

// Auto-inicialización en desarrollo
if (process.env.NODE_ENV === 'development') {
  initializeErrorPrevention();
}