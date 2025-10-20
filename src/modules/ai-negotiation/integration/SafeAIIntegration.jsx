/**
 * Safe AI Integration
 * 
 * Componente de integración segura que conecta el módulo de IA
 * con el sistema principal sin afectar su estabilidad
 */

import React, { Suspense } from 'react';
import { aiFeatureFlags } from '../utils/featureFlags';
import { AIErrorBoundary } from '../components/AIErrorBoundary';
import { AIControlPanel } from '../components/AIControlPanel';
import { AILoader } from '../components/AILoader';

// Lazy loading de componentes del módulo
const NegotiationAIDashboard = React.lazy(() => 
  import('../pages/NegotiationAIDashboard').catch(() => ({
    default: () => <div>Dashboard no disponible</div>
  }))
);

const NegotiationAIConfig = React.lazy(() => 
  import('../pages/NegotiationAIConfig').catch(() => ({
    default: () => <div>Configuración no disponible</div>
  }))
);

/**
 * Componente wrapper seguro para el Dashboard de IA
 */
export const SafeNegotiationAIDashboard = (props) => {
  // Si el módulo no está habilitado, mostrar placeholder
  if (!aiFeatureFlags.isEnabled(aiFeatureFlags.AI_DASHBOARD_ENABLED)) {
    return <AIDashboardDisabled {...props} />;
  }

  return (
    <AIErrorBoundary>
      <Suspense fallback={<AILoader message="Cargando Dashboard de IA..." />}>
        <NegotiationAIDashboard {...props} />
      </Suspense>
    </AIErrorBoundary>
  );
};

/**
 * Componente wrapper seguro para la Configuración de IA
 */
export const SafeNegotiationAIConfig = (props) => {
  // La configuración siempre está disponible, pero con fallback
  return (
    <AIErrorBoundary>
      <Suspense fallback={<AILoader message="Cargando Configuración de IA..." />}>
        <NegotiationAIConfig {...props} />
      </Suspense>
    </AIErrorBoundary>
  );
};

/**
 * Componente que se muestra cuando el Dashboard está desactivado
 */
const AIDashboardDisabled = ({ profile }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de IA de Negociación</h1>
          <p className="text-gray-600">Módulo de inteligencia artificial</p>
        </div>
      </div>

      {/* Mensaje de desactivado */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Módulo de IA Desactivado</h3>
            <p className="text-yellow-700 mt-1">
              El sistema de inteligencia artificial está temporalmente desactivado para garantizar la estabilidad de la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Panel de Control */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Control del Módulo</h3>
        <AIControlPanel />
      </div>

      {/* Información de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">🛡️ Modo Seguro Activado</h4>
        <p className="text-blue-800 text-sm">
          NexuPay está funcionando normalmente con todas las características principales activas. 
          El módulo de IA está aislado para no afectar la operación del sistema.
        </p>
      </div>
    </div>
  );
};

/**
 * Hook seguro para usar servicios de IA
 */
export const useSafeAIServices = () => {
  const [services, setServices] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadServices = async () => {
    if (!aiFeatureFlags.isEnabled(aiFeatureFlags.AI_MODULE_ENABLED)) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { load } = await import('../services');
      const aiServices = await load();
      
      setServices(aiServices);
      return aiServices;
    } catch (error) {
      console.error('Error loading AI services:', error);
      setError(error.message);
      
      // Activar modo seguro automáticamente
      aiFeatureFlags.enableSafeMode();
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadServices();
  }, []);

  return {
    services,
    isLoading,
    error,
    reload: loadServices,
    isAvailable: services !== null && !error
  };
};

/**
 * Componente de navegación segura para rutas de IA
 */
export const SafeAIRoute = ({ children, fallback = null, ...props }) => {
  // Verificar si el módulo está habilitado
  if (!aiFeatureFlags.isEnabled(aiFeatureFlags.AI_MODULE_ENABLED)) {
    return fallback || <AIDashboardDisabled />;
  }

  return (
    <AIErrorBoundary>
      <Suspense fallback={<AILoader />}>
        {children}
      </Suspense>
    </AIErrorBoundary>
  );
};

/**
 * Componente que muestra el estado del módulo en el header
 */
export const AIModuleStatus = ({ compact = false }) => {
  const [showPanel, setShowPanel] = React.useState(false);

  if (!aiFeatureFlags.isEnabled(aiFeatureFlags.AI_CONFIG_ENABLED)) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Estado del Módulo IA"
        >
          <AIControlPanel compact />
        </button>

        {showPanel && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Módulo de IA</h4>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <AIControlPanel />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default {
  SafeNegotiationAIDashboard,
  SafeNegotiationAIConfig,
  SafeAIRoute,
  useSafeAIServices,
  AIModuleStatus,
  AIControlPanel
};