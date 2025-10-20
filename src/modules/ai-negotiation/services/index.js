/**
 * AI Services Module Index
 * 
 * Exportación segura de servicios de IA con fallback y manejo de errores
 * Estos servicios solo se cargan cuando se necesitan explícitamente
 */

import { aiFeatureFlags } from '../utils/featureFlags';

// Cache de servicios para no cargar múltiples veces
let servicesCache = null;
let isLoading = false;
let loadPromise = null;

/**
 * Carga segura de servicios de IA con fallback
 */
const loadAIServices = async () => {
  // Si ya están cargados, retornar cache
  if (servicesCache) {
    return servicesCache;
  }

  // Si ya se están cargando, esperar
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Verificar si el módulo está habilitado
  if (!aiFeatureFlags.isEnabled(aiFeatureFlags.AI_MODULE_ENABLED)) {
    console.warn('🚫 AI Module is disabled');
    return getFallbackServices();
  }

  isLoading = true;
  
  loadPromise = (async () => {
    try {
      console.log('🤖 Loading AI Services...');
      
      // Importación dinámica y segura
      const [
        { proposalActionService },
        { negotiationAIService },
        { negotiationAnalyticsService }
      ] = await Promise.all([
        import('./proposalActionService.js'),
        import('./negotiationAIService.js'),
        import('./negotiationAnalyticsService.js')
      ]);

      servicesCache = {
        proposalActionService,
        negotiationAIService,
        negotiationAnalyticsService
      };

      console.log('✅ AI Services loaded successfully');
      return servicesCache;

    } catch (error) {
      console.error('❌ Error loading AI Services:', error);
      
      // Activar modo seguro automáticamente
      aiFeatureFlags.enableSafeMode();
      
      // Retornar servicios de fallback
      return getFallbackServices();
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
};

/**
 * Servicios de fallback cuando IA no está disponible
 */
const getFallbackServices = () => {
  console.log('🔄 Using fallback AI Services');
  
  return {
    proposalActionService: {
      handleProposalResponse: async (proposalId, action, data) => {
        console.warn('⚠️ Using fallback for proposal action');
        return {
          success: false,
          error: 'AI services unavailable',
          fallback: true
        };
      },
      
      getNegotiationStats: async () => {
        return {
          success: true,
          stats: {
            totalNegotiations: 0,
            activeNegotiations: 0,
            escalatedNegotiations: 0,
            completedNegotiations: 0,
            successRate: 0,
            escalationRate: 0
          }
        };
      }
    },
    
    negotiationAIService: {
      generateNegotiationResponse: async () => ({
        response: 'Lo siento, el servicio de IA no está disponible en este momento. Un representante humano te contactará pronto.',
        fallback: true
      }),
      
      updateCompanyConfig: async () => ({
        success: false,
        error: 'AI services unavailable'
      })
    },
    
    negotiationAnalyticsService: {
      getPerformanceMetrics: async () => ({
        success: true,
        metrics: {
          totalConversations: 0,
          successRate: 0,
          escalationRate: 0,
          averageResponseTime: 0
        }
      })
    }
  };
};

/**
 * Verifica si los servicios están disponibles
 */
const areServicesAvailable = () => {
  return servicesCache !== null && 
         aiFeatureFlags.isEnabled(aiFeatureFlags.AI_MODULE_ENABLED) &&
         !aiFeatureFlags.isEnabled(aiFeatureFlags.AI_SAFE_MODE);
};

/**
 * Precarga los servicios de IA (opcional)
 */
const preloadAIServices = async () => {
  if (!areServicesAvailable()) {
    return await loadAIServices();
  }
  return servicesCache;
};

/**
 * Limpia el cache de servicios
 */
const clearServicesCache = () => {
  servicesCache = null;
  isLoading = false;
  loadPromise = null;
};

/**
 * Reinicia los servicios de IA
 */
const resetAIServices = async () => {
  clearServicesCache();
  aiFeatureFlags.reset();
  return await loadAIServices();
};

// Exportación principal
export const aiServices = {
  load: loadAIServices,
  preload: preloadAIServices,
  areAvailable: areServicesAvailable,
  clearCache: clearServicesCache,
  reset: resetAIServices,
  getFallback: getFallbackServices
};

// Exportación lazy para compatibilidad
export const loadProposalActionService = () => 
  loadAIServices().then(services => services.proposalActionService);

export const loadNegotiationAIService = () => 
  loadAIServices().then(services => services.negotiationAIService);

export const loadNegotiationAnalyticsService = () => 
  loadAIServices().then(services => services.negotiationAnalyticsService);

// Exportación por defecto
export default aiServices;