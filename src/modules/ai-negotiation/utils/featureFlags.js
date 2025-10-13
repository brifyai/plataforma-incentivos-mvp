/**
 * AI Feature Flags System
 *
 * Sistema de banderas para controlar el módulo de IA
 * Permite activar/desactivar funcionalidades sin afectar el core
 */

import React from 'react';

export const AIFeatureFlags = {
  // Flags principales
  AI_MODULE_ENABLED: 'ai_module_enabled',
  AI_NEGOTIATION_ENABLED: 'ai_negotiation_enabled',
  AI_DASHBOARD_ENABLED: 'ai_dashboard_enabled',
  AI_CONFIG_ENABLED: 'ai_config_enabled',
  
  // Flags específicos
  AI_GROQ_ENABLED: 'ai_groq_enabled',
  AI_CHUTES_ENABLED: 'ai_chutes_enabled',
  AI_REAL_TIME_ENABLED: 'ai_real_time_enabled',
  AI_ANALYTICS_ENABLED: 'ai_analytics_enabled',
  AI_ESCALATION_ENABLED: 'ai_escalation_enabled',
  
  // Flags de seguridad
  AI_SAFE_MODE: 'ai_safe_mode',
  AI_FALLBACK_ENABLED: 'ai_fallback_enabled',
  AI_ERROR_RECOVERY_ENABLED: 'ai_error_recovery_enabled'
};

class FeatureFlagManager {
  constructor() {
    this.flags = new Map();
    this.listeners = new Map();
    this.loadDefaultFlags();
  }

  /**
   * Carga las banderas por defecto
   */
  loadDefaultFlags() {
    // Valores por defecto (conservadores para evitar problemas)
    const defaultFlags = {
      [AIFeatureFlags.AI_MODULE_ENABLED]: false, // Desactivado por seguridad
      [AIFeatureFlags.AI_NEGOTIATION_ENABLED]: false,
      [AIFeatureFlags.AI_DASHBOARD_ENABLED]: false,
      [AIFeatureFlags.AI_CONFIG_ENABLED]: true, // Configuración siempre disponible
      [AIFeatureFlags.AI_GROQ_ENABLED]: true,
      [AIFeatureFlags.AI_CHUTES_ENABLED]: true,
      [AIFeatureFlags.AI_REAL_TIME_ENABLED]: false,
      [AIFeatureFlags.AI_ANALYTICS_ENABLED]: false,
      [AIFeatureFlags.AI_ESCALATION_ENABLED]: true,
      [AIFeatureFlags.AI_SAFE_MODE]: true, // Modo seguro por defecto
      [AIFeatureFlags.AI_FALLBACK_ENABLED]: true,
      [AIFeatureFlags.AI_ERROR_RECOVERY_ENABLED]: true
    };

    // Cargar desde localStorage si existe
    try {
      const savedFlags = localStorage.getItem('ai_feature_flags');
      if (savedFlags) {
        const parsed = JSON.parse(savedFlags);
        Object.keys(defaultFlags).forEach(key => {
          this.flags.set(key, parsed[key] !== undefined ? parsed[key] : defaultFlags[key]);
        });
      } else {
        Object.entries(defaultFlags).forEach(([key, value]) => {
          this.flags.set(key, value);
        });
      }
    } catch (error) {
      console.warn('Error loading feature flags:', error);
      Object.entries(defaultFlags).forEach(([key, value]) => {
        this.flags.set(key, value);
      });
    }

    // Sobreescribir con variables de entorno
    this.loadEnvironmentFlags();
  }

  /**
   * Carga banderas desde variables de entorno
   */
  loadEnvironmentFlags() {
    // Verificar si estamos en el cliente antes de acceder a import.meta.env
    if (typeof window !== 'undefined') {
      const envFlags = {
        [AIFeatureFlags.AI_MODULE_ENABLED]: import.meta.env?.VITE_AI_MODULE_ENABLED === 'true',
        [AIFeatureFlags.AI_NEGOTIATION_ENABLED]: import.meta.env?.VITE_AI_NEGOTIATION_ENABLED === 'true',
        [AIFeatureFlags.AI_DASHBOARD_ENABLED]: import.meta.env?.VITE_AI_DASHBOARD_ENABLED === 'true',
        [AIFeatureFlags.AI_REAL_TIME_ENABLED]: import.meta.env?.VITE_AI_REAL_TIME_ENABLED === 'true',
        [AIFeatureFlags.AI_ANALYTICS_ENABLED]: import.meta.env?.VITE_AI_ANALYTICS_ENABLED === 'true'
      };

      Object.entries(envFlags).forEach(([key, value]) => {
        if (value !== undefined) {
          this.flags.set(key, value);
        }
      });
    }
  }

  /**
   * Verifica si una bandera está activada
   */
  isEnabled(flag) {
    return this.flags.get(flag) || false;
  }

  /**
   * Activa una bandera
   */
  enable(flag) {
    this.setFlag(flag, true);
  }

  /**
   * Desactiva una bandera
   */
  disable(flag) {
    this.setFlag(flag, false);
  }

  /**
   * Establece el valor de una bandera
   */
  setFlag(flag, value) {
    const oldValue = this.flags.get(flag);
    this.flags.set(flag, value);

    // Guardar en localStorage
    this.saveFlags();

    // Notificar a los listeners
    this.notifyListeners(flag, value, oldValue);
  }

  /**
   * Activa todas las banderas de IA
   */
  enableAll() {
    Object.values(AIFeatureFlags).forEach(flag => {
      if (!flag.includes('SAFE_MODE')) { // Nunca desactivar modo seguro
        this.enable(flag);
      }
    });
  }

  /**
   * Desactiva todas las banderas de IA (excepto las críticas)
   */
  disableAll() {
    Object.values(AIFeatureFlags).forEach(flag => {
      if (!flag.includes('CONFIG') && !flag.includes('SAFE_MODE') && !flag.includes('FALLBACK')) {
        this.disable(flag);
      }
    });
  }

  /**
   * Activa modo seguro
   */
  enableSafeMode() {
    this.disable(AIFeatureFlags.AI_MODULE_ENABLED);
    this.disable(AIFeatureFlags.AI_NEGOTIATION_ENABLED);
    this.disable(AIFeatureFlags.AI_REAL_TIME_ENABLED);
    this.enable(AIFeatureFlags.AI_SAFE_MODE);
    this.enable(AIFeatureFlags.AI_FALLBACK_ENABLED);
  }

  /**
   * Verifica si el módulo de IA está completamente operativo
   */
  isAIModuleOperational() {
    return this.isEnabled(AIFeatureFlags.AI_MODULE_ENABLED) &&
           !this.isEnabled(AIFeatureFlags.AI_SAFE_MODE);
  }

  /**
   * Obtiene el estado actual de todas las banderas
   */
  getAllFlags() {
    const result = {};
    this.flags.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Agrega un listener para cambios en una bandera
   */
  addListener(flag, callback) {
    if (!this.listeners.has(flag)) {
      this.listeners.set(flag, []);
    }
    this.listeners.get(flag).push(callback);
  }

  /**
   * Remueve un listener
   */
  removeListener(flag, callback) {
    const flagListeners = this.listeners.get(flag);
    if (flagListeners) {
      const index = flagListeners.indexOf(callback);
      if (index > -1) {
        flagListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifica a los listeners de una bandera
   */
  notifyListeners(flag, newValue, oldValue) {
    const flagListeners = this.listeners.get(flag);
    if (flagListeners) {
      flagListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, flag);
        } catch (error) {
          console.error('Error in feature flag listener:', error);
        }
      });
    }
  }

  /**
   * Guarda las banderas en localStorage
   */
  saveFlags() {
    try {
      const flagsObject = {};
      this.flags.forEach((value, key) => {
        flagsObject[key] = value;
      });
      localStorage.setItem('ai_feature_flags', JSON.stringify(flagsObject));
    } catch (error) {
      console.warn('Error saving feature flags:', error);
    }
  }

  /**
   * Resetea todas las banderas a los valores por defecto
   */
  reset() {
    try {
      localStorage.removeItem('ai_feature_flags');
      this.loadDefaultFlags();
    } catch (error) {
      console.warn('Error resetting feature flags:', error);
    }
  }
}

// Instancia global
export const aiFeatureFlags = new FeatureFlagManager();

// Hook personalizado para React
export const useAIFeatureFlags = () => {
  const [flags, setFlags] = React.useState(aiFeatureFlags.getAllFlags());

  React.useEffect(() => {
    const updateFlags = () => {
      setFlags(aiFeatureFlags.getAllFlags());
    };

    // Listener para cualquier cambio
    const handleFlagChange = () => updateFlags();
    
    // Agregar listeners para todas las banderas
    Object.values(AIFeatureFlags).forEach(flag => {
      aiFeatureFlags.addListener(flag, handleFlagChange);
    });

    return () => {
      Object.values(AIFeatureFlags).forEach(flag => {
        aiFeatureFlags.removeListener(flag, handleFlagChange);
      });
    };
  }, []);

  return {
    flags,
    isEnabled: aiFeatureFlags.isEnabled.bind(aiFeatureFlags),
    enable: aiFeatureFlags.enable.bind(aiFeatureFlags),
    disable: aiFeatureFlags.disable.bind(aiFeatureFlags),
    enableAll: aiFeatureFlags.enableAll.bind(aiFeatureFlags),
    disableAll: aiFeatureFlags.disableAll.bind(aiFeatureFlags),
    enableSafeMode: aiFeatureFlags.enableSafeMode.bind(aiFeatureFlags),
    isAIModuleOperational: aiFeatureFlags.isAIModuleOperational.bind(aiFeatureFlags),
    reset: aiFeatureFlags.reset.bind(aiFeatureFlags)
  };
};

export default aiFeatureFlags;