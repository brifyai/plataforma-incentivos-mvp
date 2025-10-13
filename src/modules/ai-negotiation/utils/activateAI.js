/**
 * Script para activar el módulo de IA
 * Ejecutar en la consola del navegador: activateAIModule()
 */

export const activateAIModule = () => {
  // Importar el gestor de banderas
  import('./featureFlags.js').then(({ aiFeatureFlags, AIFeatureFlags }) => {
    console.log('🚀 Activando módulo de IA...');
    
    // Activar banderas principales
    aiFeatureFlags.enable(AIFeatureFlags.AI_MODULE_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_NEGOTIATION_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_DASHBOARD_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_CONFIG_ENABLED);
    aiFeatureFlags.enable(AIFeatureFlags.AI_ANALYTICS_ENABLED);
    
    // Mantener modo seguro por ahora
    aiFeatureFlags.enable(AIFeatureFlags.AI_SAFE_MODE);
    aiFeatureFlags.enable(AIFeatureFlags.AI_FALLBACK_ENABLED);
    
    console.log('✅ Módulo de IA activado');
    console.log('📊 Estado actual:', aiFeatureFlags.getAllFlags());
    
    // Recargar la página para aplicar cambios
    setTimeout(() => {
      console.log('🔄 Recargando página para aplicar cambios...');
      window.location.reload();
    }, 1000);
  }).catch(error => {
    console.error('❌ Error activando módulo de IA:', error);
  });
};

// Función para desactivar el módulo de IA
export const deactivateAIModule = () => {
  import('./featureFlags.js').then(({ aiFeatureFlags, AIFeatureFlags }) => {
    console.log('🛑 Desactivando módulo de IA...');
    
    // Activar modo seguro
    aiFeatureFlags.enableSafeMode();
    
    console.log('✅ Módulo de IA desactivado (modo seguro activado)');
    console.log('📊 Estado actual:', aiFeatureFlags.getAllFlags());
    
    // Recargar la página para aplicar cambios
    setTimeout(() => {
      console.log('🔄 Recargando página para aplicar cambios...');
      window.location.reload();
    }, 1000);
  }).catch(error => {
    console.error('❌ Error desactivando módulo de IA:', error);
  });
};

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.activateAIModule = activateAIModule;
  window.deactivateAIModule = deactivateAIModule;
  
  console.log('🎯 Funciones de IA disponibles:');
  console.log('  - activateAIModule() para activar el módulo');
  console.log('  - deactivateAIModule() para desactivar el módulo');
}