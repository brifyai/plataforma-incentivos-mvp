/**
 * Validador de Rutas y Componentes
 * 
 * Sistema para validar rutas y componentes antes de su uso
 * para prevenir errores como páginas en blanco
 */

import React from 'react';
import { appHealthMonitor } from './errorPrevention';

/**
 * Validador de componentes
 */
export class ComponentValidator {
  constructor() {
    this.validatedComponents = new Map();
    this.validationCache = new Map();
  }

  /**
   * Valida un componente antes de usarlo
   */
  async validateComponent(componentPath, componentName = 'Unknown') {
    // Verificar caché primero
    const cacheKey = `${componentPath}:${componentName}`;
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    try {
      // Intentar importar el componente
      const module = await import(componentPath);
      const component = module.default || module;

      // Validaciones básicas
      const validation = {
        isValid: true,
        component,
        errors: [],
        warnings: []
      };

      // Verificar que sea un componente React válido
      if (!this.isReactComponent(component)) {
        validation.isValid = false;
        validation.errors.push('Component is not a valid React component');
      }

      // Verificar nombre del componente
      if (component.displayName && typeof component.displayName !== 'string') {
        validation.warnings.push('Component displayName is not a string');
      }

      // Guardar en caché
      this.validationCache.set(cacheKey, validation);
      
      return validation;
    } catch (error) {
      const validation = {
        isValid: false,
        component: null,
        errors: [`Failed to import: ${error.message}`],
        warnings: []
      };

      this.validationCache.set(cacheKey, validation);
      
      appHealthMonitor.logError(error, `ComponentValidator: ${componentName}`);
      
      return validation;
    }
  }

  /**
   * Verifica si algo es un componente React válido
   */
  isReactComponent(component) {
    return (
      typeof component === 'function' ||
      (typeof component === 'object' && component !== null && typeof component.render === 'function') ||
      React.isValidElement(component)
    );
  }

  /**
   * Limpia la caché de validación
   */
  clearCache() {
    this.validationCache.clear();
  }
}

/**
 * Validador de rutas
 */
export class RouteValidator {
  constructor() {
    this.validatedRoutePaths = new Set();
    this.invalidRoutes = new Map();
  }

  /**
   * Valida una ruta
   */
  validateRoute(route) {
    const errors = [];
    const warnings = [];

    // Validar estructura básica
    if (!route || typeof route !== 'object') {
      errors.push('Route must be an object');
      return { isValid: false, errors, warnings };
    }

    // Validar path
    if (!route.path) {
      errors.push('Route must have a path');
    } else if (typeof route.path !== 'string') {
      errors.push('Route path must be a string');
    } else {
      // Validar formato del path
      if (!route.path.startsWith('/')) {
        errors.push('Route path must start with /');
      }

      // Validar caracteres inválidos
      if (/[^a-zA-Z0-9\-_\/\:\.]/.test(route.path)) {
        errors.push('Route path contains invalid characters');
      }

      // Verificar duplicados
      if (this.validatedRoutePaths.has(route.path)) {
        warnings.push(`Duplicate route path: ${route.path}`);
      } else {
        this.validatedRoutePaths.add(route.path);
      }
    }

    // Validar componente
    if (!route.component && !route.element) {
      errors.push('Route must have a component or element');
    }

    // Validar nombre si existe
    if (route.name && typeof route.name !== 'string') {
      warnings.push('Route name should be a string');
    }

    const isValid = errors.length === 0;
    
    if (!isValid) {
      this.invalidRoutes.set(route.path, errors);
    }

    return { isValid, errors, warnings };
  }

  /**
   * Valida un array de rutas
   */
  validateRoutes(routes) {
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };

    if (!Array.isArray(routes)) {
      results.invalid.push({
        route: routes,
        errors: ['Routes must be an array']
      });
      return results;
    }

    routes.forEach((route, index) => {
      const validation = this.validateRoute(route);
      
      if (validation.isValid) {
        results.valid.push(route);
        
        if (validation.warnings.length > 0) {
          results.warnings.push({
            route,
            warnings: validation.warnings
          });
        }
      } else {
        results.invalid.push({
          route,
          errors: validation.errors
        });
      }
    });

    return results;
  }

  /**
   * Limpia las rutas validadas
   */
  clearValidatedRoutes() {
    this.validatedRoutePaths.clear();
    this.invalidRoutes.clear();
  }
}

/**
 * Constructor seguro de rutas lazy
 */
export const createSafeLazyRoute = (path, importFunc, fallbackComponent = null) => {
  const LazyComponent = React.lazy(() => {
    return importFunc()
      .then(module => {
        // Validar el componente importado
        const component = module.default || module;
        
        if (!component || typeof component !== 'function') {
          throw new Error('Imported component is not valid');
        }
        
        return module;
      })
      .catch(error => {
        appHealthMonitor.logError(error, `SafeLazyRoute: ${path}`);
        
        // Retornar componente fallback
        if (fallbackComponent) {
          return { default: fallbackComponent };
        }
        
        // Componente de error por defecto
        return {
          default: () => (
            <div className="flex items-center justify-center min-h-64 bg-gray-50 border border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Component Not Available
                </h3>
                <p className="text-gray-600 text-sm">
                  The requested component could not be loaded.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )
        };
      });
  });

  return {
    path,
    element: (
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LazyComponent />
      </React.Suspense>
    )
  };
};

/**
 * Validador de menú de navegación
 */
export const validateNavigationMenu = (menuItems) => {
  const validator = new RouteValidator();
  const results = {
    valid: [],
    invalid: [],
    warnings: []
  };

  if (!Array.isArray(menuItems)) {
    results.invalid.push({
      item: menuItems,
      errors: ['Menu items must be an array']
    });
    return results;
  }

  menuItems.forEach((item, index) => {
    const errors = [];
    const warnings = [];

    // Validar estructura básica
    if (!item || typeof item !== 'object') {
      errors.push('Menu item must be an object');
      results.invalid.push({ item, errors });
      return;
    }

    // Validar nombre
    if (!item.name || typeof item.name !== 'string') {
      errors.push('Menu item must have a valid name');
    }

    // Validar path
    if (!item.path || typeof item.path !== 'string') {
      errors.push('Menu item must have a valid path');
    } else {
      const routeValidation = validator.validateRoute({ path: item.path });
      if (!routeValidation.isValid) {
        errors.push(...routeValidation.errors);
      }
      warnings.push(...routeValidation.warnings);
    }

    // Validar icono
    if (!item.icon) {
      warnings.push('Menu item should have an icon');
    }

    // Validar descripción
    if (item.description && typeof item.description !== 'string') {
      warnings.push('Menu item description should be a string');
    }

    const isValid = errors.length === 0;
    
    if (isValid) {
      results.valid.push(item);
      
      if (warnings.length > 0) {
        results.warnings.push({
          item,
          warnings
        });
      }
    } else {
      results.invalid.push({
        item,
        errors
      });
    }
  });

  return results;
};

/**
 * Componente de ruta segura con validación
 */
export const SafeRoute = ({ path, component: Component, fallback = null, ...props }) => {
  const [isValid, setIsValid] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState([]);

  React.useEffect(() => {
    const validateRoute = async () => {
      try {
        // Validar que el componente sea importable
        if (typeof Component === 'function') {
          setIsValid(true);
          return;
        }

        // Si es una string de importación, validarla
        if (typeof Component === 'string') {
          const module = await import(Component);
          const component = module.default || module;
          
          if (component && typeof component === 'function') {
            setIsValid(true);
          } else {
            setIsValid(false);
            setValidationErrors(['Component is not a valid React component']);
          }
        } else {
          setIsValid(false);
          setValidationErrors(['Invalid component type']);
        }
      } catch (error) {
        setIsValid(false);
        setValidationErrors([error.message]);
        appHealthMonitor.logError(error, `SafeRoute: ${path}`);
      }
    };

    validateRoute();
  }, [Component, path]);

  if (isValid === null) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isValid) {
    return fallback || (
      <div className="flex items-center justify-center min-h-64 bg-red-50 border border-red-200 rounded-lg p-8">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Route Error
          </h3>
          <p className="text-red-700 text-sm mb-4">
            The route "{path}" could not be loaded.
          </p>
          {validationErrors.length > 0 && (
            <div className="text-left bg-red-100 p-3 rounded mb-4">
              <p className="text-xs font-semibold text-red-800 mb-1">Errors:</p>
              {validationErrors.map((error, index) => (
                <p key={index} className="text-xs text-red-700">• {error}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <Component {...props} />;
};

// Instancias globales
export const componentValidator = new ComponentValidator();
export const routeValidator = new RouteValidator();