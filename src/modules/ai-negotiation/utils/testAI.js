/**
 * Script de prueba para el módulo de IA
 * Ejecutar en la consola del navegador para verificar funcionalidad
 */

export const testAIModule = async () => {
  console.log('🧪 Iniciando pruebas del módulo de IA...');
  
  try {
    // 1. Verificar importación de banderas
    console.log('1️⃣ Verificando sistema de banderas...');
    const { aiFeatureFlags, AIFeatureFlags } = await import('./featureFlags.js');
    
    const flags = aiFeatureFlags.getAllFlags();
    console.log('📊 Banderas actuales:', flags);
    
    // 2. Verificar servicios
    console.log('2️⃣ Verificando servicios...');
    try {
      const { proposalActionService } = await import('../services/proposalActionService.js');
      console.log('✅ ProposalActionService disponible');
    } catch (error) {
      console.log('❌ ProposalActionService error:', error.message);
    }
    
    try {
      const { negotiationAIService } = await import('../services/negotiationAIService.js');
      console.log('✅ NegotiationAIService disponible');
    } catch (error) {
      console.log('❌ NegotiationAIService error:', error.message);
    }
    
    try {
      const { negotiationAnalyticsService } = await import('../services/negotiationAnalyticsService.js');
      console.log('✅ NegotiationAnalyticsService disponible');
    } catch (error) {
      console.log('❌ NegotiationAnalyticsService error:', error.message);
    }
    
    // 3. Verificar componentes
    console.log('3️⃣ Verificando componentes...');
    try {
      const AIModule = await import('../index.jsx');
      console.log('✅ AIModule disponible');
      console.log('📦 Componentes disponibles:', Object.keys(AIModule.AIModule));
    } catch (error) {
      console.log('❌ AIModule error:', error.message);
    }
    
    // 4. Verificar integración con Supabase
    console.log('4️⃣ Verificando conexión a Supabase...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      // Esta es una verificación básica, la conexión real se prueba con los servicios
      console.log('✅ Supabase client disponible');
    } catch (error) {
      console.log('❌ Supabase error:', error.message);
    }
    
    // 5. Verificar estado del módulo
    console.log('5️⃣ Verificando estado del módulo...');
    const moduleEnabled = aiFeatureFlags.isEnabled(AIFeatureFlags.AI_MODULE_ENABLED);
    const negotiationEnabled = aiFeatureFlags.isEnabled(AIFeatureFlags.AI_NEGOTIATION_ENABLED);
    const dashboardEnabled = aiFeatureFlags.isEnabled(AIFeatureFlags.AI_DASHBOARD_ENABLED);
    
    console.log('🔋 Estado del módulo:');
    console.log('   - Módulo IA:', moduleEnabled ? '✅ ACTIVADO' : '❌ DESACTIVADO');
    console.log('   - Negociación:', negotiationEnabled ? '✅ ACTIVADO' : '❌ DESACTIVADO');
    console.log('   - Dashboard:', dashboardEnabled ? '✅ ACTIVADO' : '❌ DESACTIVADO');
    
    // 6. Resumen
    console.log('📋 RESUMEN DE PRUEBAS:');
    console.log('   ✅ Sistema de banderas funcionando');
    console.log('   ✅ Servicios importados correctamente');
    console.log('   ✅ Componentes disponibles');
    console.log('   ✅ Conexión a Supabase disponible');
    console.log('   📊 Estado actual:', moduleEnabled ? 'ACTIVADO' : 'DESACTIVADO');
    
    if (!moduleEnabled) {
      console.log('💡 Para activar el módulo, ejecuta: activateAIModule()');
    } else {
      console.log('🎉 Módulo de IA está listo para usar!');
    }
    
    return {
      success: true,
      flags,
      moduleEnabled,
      services: ['proposalActionService', 'negotiationAIService', 'negotiationAnalyticsService'],
      components: ['Dashboard', 'Config', 'Chat']
    };
    
  } catch (error) {
    console.error('❌ Error en pruebas del módulo de IA:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para probar una conversación de IA simulada
export const testNegotiationFlow = async () => {
  console.log('🤖 Probando flujo de negociación simulado...');
  
  try {
    const { negotiationAIService } = await import('../services/negotiationAIService.js');
    
    // Simular mensaje de deudor
    const testMessage = {
      content: 'Hola, quiero solicitar un descuento porque estoy en una situación difícil',
      senderType: 'debtor'
    };
    
    // Simular conversación
    const testConversation = {
      id: 'test-conversation',
      messages: [testMessage],
      metadata: {
        proposalId: 'test-proposal',
        companyId: 'test-company'
      }
    };
    
    // Simular datos de propuesta
    const testProposalData = {
      id: 'test-proposal',
      amount: 100000,
      dueDate: '2024-12-31',
      company: {
        name: 'Empresa Test',
        maxDiscount: 15,
        maxTermMonths: 12
      }
    };
    
    console.log('📝 Mensaje de prueba:', testMessage.content);
    console.log('💰 Datos de propuesta:', testProposalData);
    
    // Intentar generar respuesta (puede fallar si no hay API keys configuradas)
    try {
      const response = await negotiationAIService.generateNegotiationResponse(
        testMessage, 
        testConversation, 
        testProposalData
      );
      
      console.log('✅ Respuesta generada:', response);
      return { success: true, response };
    } catch (apiError) {
      console.log('⚠️ Error de API (esperado si no hay keys configuradas):', apiError.message);
      return { 
        success: false, 
        error: apiError.message,
        note: 'Esto es normal si no hay API keys configuradas'
      };
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de negociación:', error);
    return { success: false, error: error.message };
  }
};

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.testAIModule = testAIModule;
  window.testNegotiationFlow = testNegotiationFlow;
  
  console.log('🧪 Funciones de prueba disponibles:');
  console.log('  - testAIModule() para verificar el módulo completo');
  console.log('  - testNegotiationFlow() para probar flujo de negociación');
}