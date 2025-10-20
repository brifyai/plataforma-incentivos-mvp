/**
 * Script para activar el módulo de IA
 * Ejecutar en la consola del navegador: activateAIModule()
 */

export const activateAIModule = async () => {
  try {
    console.log('🚀 Activando módulo de IA...');

    // Importar el gestor de banderas
    const { aiFeatureFlags, AIFeatureFlags } = await import('./featureFlags.js');

    // Forzar activación de todas las banderas principales
    console.log('🔧 Activando banderas principales...');
    aiFeatureFlags.enable(AIFeatureFlags.AI_MODULE_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_NEGOTIATION_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_DASHBOARD_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_CONFIG_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_ANALYTICS_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_REAL_TIME_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_ESCALATION_ENABLED);

    // Mantener modo seguro pero activar funcionalidades
    aiFeatureFlags.disable(AIFeatureFlags.AI_SAFE_MODE); // Desactivar modo seguro
    aiFeatureFlags.enable(AIFeatureFlags.AI_FALLBACK_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_ERROR_RECOVERY_ENABLED);

    console.log('✅ Módulo de IA activado completamente');
    console.log('📊 Estado actual:', aiFeatureFlags.getAllFlags());

    // Verificar que las banderas se guardaron correctamente
    const savedFlags = aiFeatureFlags.getAllFlags();
    const isModuleEnabled = aiFeatureFlags.isEnabled(AIFeatureFlags.AI_MODULE_ENABLED);

    if (!isModuleEnabled) {
      console.warn('⚠️ Advertencia: El módulo no se activó correctamente');
      // Intentar forzar nuevamente
      aiFeatureFlags.setFlag(AIFeatureFlags.AI_MODULE_ENABLED, true);
      console.log('🔄 Reintentando activación forzada...');
    }

    // Recargar la página para aplicar cambios
    setTimeout(() => {
      console.log('🔄 Recargando página para aplicar cambios...');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1000);

    return {
      success: true,
      flags: aiFeatureFlags.getAllFlags(),
      moduleEnabled: aiFeatureFlags.isEnabled(AIFeatureFlags.AI_MODULE_ENABLED)
    };
  } catch (error) {
    console.error('❌ Error activando módulo de IA:', error);

    // Intentar activación de respaldo
    try {
      console.log('🔄 Intentando activación de respaldo...');
      const { aiFeatureFlags, AIFeatureFlags } = await import('./featureFlags.js');

      // Forzar directamente en localStorage si está disponible
      if (typeof window !== 'undefined' && window.localStorage) {
        const flags = {
          [AIFeatureFlags.AI_MODULE_ENABLED]: true,
          [AIFeatureFlags.AI_NEGOTIATION_ENABLED]: true,
          [AIFeatureFlags.AI_DASHBOARD_ENABLED]: true,
          [AIFeatureFlags.AI_CONFIG_ENABLED]: true,
          [AIFeatureFlags.AI_ANALYTICS_ENABLED]: true,
          [AIFeatureFlags.AI_REAL_TIME_ENABLED]: true,
          [AIFeatureFlags.AI_ESCALATION_ENABLED]: true,
          [AIFeatureFlags.AI_SAFE_MODE]: false,
          [AIFeatureFlags.AI_FALLBACK_ENABLED]: true,
          [AIFeatureFlags.AI_ERROR_RECOVERY_ENABLED]: true
        };

        localStorage.setItem('ai_feature_flags', JSON.stringify(flags));
        console.log('✅ Activación de respaldo aplicada directamente en localStorage');
      }
    } catch (fallbackError) {
      console.error('❌ Error en activación de respaldo:', fallbackError);
    }

    return { success: false, error: error.message };
  }
};

// Función para desactivar el módulo de IA
export const deactivateAIModule = async () => {
  try {
    console.log('🛑 Desactivando módulo de IA...');

    // Importar el gestor de banderas
    const { aiFeatureFlags, AIFeatureFlags } = await import('./featureFlags.js');

    // Forzar desactivación completa
    console.log('🔧 Desactivando todas las banderas...');
    aiFeatureFlags.disable(AIFeatureFlags.AI_MODULE_ENABLED);
    aiFeatureFlags.disable(AIFeatureFlags.AI_NEGOTIATION_ENABLED);
    aiFeatureFlags.disable(AIFeatureFlags.AI_DASHBOARD_ENABLED);
    aiFeatureFlags.disable(AIFeatureFlags.AI_REAL_TIME_ENABLED);
    aiFeatureFlags.disable(AIFeatureFlags.AI_ANALYTICS_ENABLED);
    aiFeatureFlags.disable(AIFeatureFlags.AI_ESCALATION_ENABLED);

    // Activar modo seguro
    aiFeatureFlags.enableSafeMode();

    console.log('✅ Módulo de IA desactivado completamente (modo seguro activado)');
    console.log('📊 Estado actual:', aiFeatureFlags.getAllFlags());

    // Recargar la página para aplicar cambios
    setTimeout(() => {
      console.log('🔄 Recargando página para aplicar cambios...');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1000);

    return { success: true, flags: aiFeatureFlags.getAllFlags() };
  } catch (error) {
    console.error('❌ Error desactivando módulo de IA:', error);

    // Intentar desactivación de respaldo
    try {
      console.log('🔄 Intentando desactivación de respaldo...');
      if (typeof window !== 'undefined' && window.localStorage) {
        const flags = {
          ai_module_enabled: false,
          ai_negotiation_enabled: false,
          ai_dashboard_enabled: false,
          ai_config_enabled: true, // Mantener configuración disponible
          ai_groq_enabled: true,
          ai_chutes_enabled: true,
          ai_real_time_enabled: false,
          ai_analytics_enabled: false,
          ai_escalation_enabled: false,
          ai_safe_mode: true,
          ai_fallback_enabled: true,
          ai_error_recovery_enabled: true
        };

        localStorage.setItem('ai_feature_flags', JSON.stringify(flags));
        console.log('✅ Desactivación de respaldo aplicada directamente en localStorage');
      }
    } catch (fallbackError) {
      console.error('❌ Error en desactivación de respaldo:', fallbackError);
    }

    return { success: false, error: error.message };
  }
};

// Función de activación forzada (máximo poder)
export const forceActivateAIModule = async () => {
  try {
    console.log('💪 ACTIVACIÓN FORZADA DEL MÓDULO DE IA...');

    // Forzar directamente en localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const forcedFlags = {
        ai_module_enabled: true,
        ai_negotiation_enabled: true,
        ai_dashboard_enabled: true,
        ai_config_enabled: true,
        ai_analytics_enabled: true,
        ai_real_time_enabled: true,
        ai_escalation_enabled: true,
        ai_groq_enabled: true,
        ai_chutes_enabled: true,
        ai_safe_mode: false,
        ai_fallback_enabled: true,
        ai_error_recovery_enabled: true
      };

      localStorage.setItem('ai_feature_flags', JSON.stringify(forcedFlags));
      console.log('✅ ACTIVACIÓN FORZADA COMPLETADA');
      console.log('📊 Banderas forzadas:', forcedFlags);

      // Recargar la página inmediatamente
      setTimeout(() => {
        console.log('🔄 Recargando página con activación forzada...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 500);

      return { success: true, flags: forcedFlags, forced: true };
    } else {
      throw new Error('localStorage no disponible');
    }
  } catch (error) {
    console.error('❌ Error en activación forzada:', error);
    return { success: false, error: error.message };
  }
};

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.activateAIModule = activateAIModule;
  window.deactivateAIModule = deactivateAIModule;
  window.forceActivateAIModule = forceActivateAIModule;

  console.log('🎯 Funciones de IA disponibles:');
  console.log('  - activateAIModule() para activar el módulo');
  console.log('  - deactivateAIModule() para desactivar el módulo');
  console.log('  - forceActivateAIModule() para activación FORZADA');
}