/**
 * AI Negotiation Module Entry Point
 * 
 * Este es el entry point del módulo de IA que se carga bajo demanda
 * Está completamente aislado del sistema principal
 */

import React, { Suspense, lazy } from 'react';
import { AIErrorBoundary as ErrorBoundary } from './components/AIErrorBoundary';
import { AILoader } from './components/AILoader';

// Importar utilidades de activación y prueba
import './utils/activateAI.js';
import './utils/testAI.js';

// Lazy loading de componentes pesados de IA
const NegotiationAIDashboard = lazy(() => import('./pages/NegotiationAIDashboard'));
const NegotiationAIConfig = lazy(() => import('./pages/NegotiationAIConfig'));
const NegotiationChat = lazy(() => import('./pages/NegotiationChat'));

// Lazy loading de servicios (solo se cargan si se usan)
const loadAIServices = () => import('./services').then(module => module.aiServices);

export const AIModule = {
  // Componentes lazy-loaded
  Dashboard: (props) => (
    <ErrorBoundary>
      <Suspense fallback={<AILoader />}>
        <NegotiationAIDashboard {...props} />
      </Suspense>
    </ErrorBoundary>
  ),
  
  Config: (props) => (
    <ErrorBoundary>
      <Suspense fallback={<AILoader />}>
        <NegotiationAIConfig {...props} />
      </Suspense>
    </ErrorBoundary>
  ),
  
  Chat: (props) => (
    <ErrorBoundary>
      <Suspense fallback={<AILoader />}>
        <NegotiationChat {...props} />
      </Suspense>
    </ErrorBoundary>
  ),
  
  // Servicios lazy-loaded
  services: {
    getProposalAction: async () => {
      const services = await loadAIServices();
      return services.proposalActionService;
    },
    
    getNegotiationAI: async () => {
      const services = await loadAIServices();
      return services.negotiationAIService;
    },
    
    getAnalytics: async () => {
      const services = await loadAIServices();
      return services.negotiationAnalyticsService;
    }
  },
  
  // Utilidades del módulo
  utils: {
    isAIEnabled: () => {
      try {
        return localStorage.getItem('ai_module_enabled') === 'true' &&
               import.meta.env?.VITE_AI_MODULE_ENABLED !== 'false';
      } catch {
        return false;
      }
    },
    
    enableAI: () => {
      try {
        localStorage.setItem('ai_module_enabled', 'true');
        return true;
      } catch {
        return false;
      }
    },
    
    disableAI: () => {
      try {
        localStorage.setItem('ai_module_enabled', 'false');
        return true;
      } catch {
        return false;
      }
    }
  }
};

// Export por defecto para compatibilidad
export default AIModule;