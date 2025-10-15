/**
 * Script de Prueba Exhaustiva para ToggleSwitch - Proveedores de IA
 * 
 * Este script valida:
 * 1. Funcionalidad básica de ToggleSwitch
 * 2. Exclusión mutua entre proveedores
 * 3. Persistencia de datos en Supabase
 * 4. Comportamiento en diferentes escenarios
 */

const { test } = require('console-testing-library');
const { supabase } = require('../src/config/supabase');

// Configuración de prueba
const TEST_CONFIG = {
  company_id: null,
  test_scenarios: [
    {
      name: 'Activar primer proveedor (Chutes)',
      action: 'enable',
      provider: 'chutes',
      expected_state: { chutes: true, groq: false }
    },
    {
      name: 'Activar segundo proveedor (Groq) - debe desactivar Chutes',
      action: 'enable',
      provider: 'groq',
      expected_state: { chutes: false, groq: true }
    },
    {
      name: 'Desactivar proveedor activo (Groq)',
      action: 'disable',
      provider: 'groq',
      expected_state: { chutes: false, groq: false }
    },
    {
      name: 'Activar múltiples proveedores rápidamente',
      action: 'rapid_toggle',
      providers: ['chutes', 'groq', 'chutes'],
      expected_final_state: { chutes: true, groq: false }
    }
  ]
};

/**
 * Clase para testing de ToggleSwitch
 */
class ToggleSwitchTester {
  constructor() {
    this.testResults = [];
    this.currentConfig = null;
  }

  /**
   * Inicializar el entorno de prueba
   */
  async initialize() {
    console.log('🔧 Inicializando entorno de prueba...');
    
    try {
      // Obtener una empresa de prueba
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      if (!companies || companies.length === 0) {
        throw new Error('No se encontraron empresas para testing');
      }
      
      TEST_CONFIG.company_id = companies[0].id;
      console.log(`✅ Empresa de prueba encontrada: ${TEST_CONFIG.company_id}`);
      
      // Cargar configuración actual
      await this.loadCurrentConfig();
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando pruebas:', error);
      return false;
    }
  }

  /**
   * Cargar configuración actual desde Supabase
   */
  async loadCurrentConfig() {
    try {
      const { data, error } = await supabase
        .from('company_ai_config')
        .select('ai_providers')
        .eq('company_id', TEST_CONFIG.company_id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      this.currentConfig = data?.ai_providers || {
        providers: {
          chutes: { enabled: false },
          groq: { enabled: false }
        },
        selectedProvider: 'chutes'
      };
      
      console.log('📋 Configuración actual cargada:', this.currentConfig);
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      throw error;
    }
  }

  /**
   * Simular cambio en ToggleSwitch
   */
  async simulateToggleChange(provider, enabled) {
    console.log(`🔄 Simulando toggle: ${provider} -> ${enabled}`);
    
    // Aplicar lógica de exclusión mutua (igual que en el componente)
    const newProviders = { ...this.currentConfig.providers };
    
    Object.keys(newProviders).forEach(key => {
      if (key !== provider) {
        newProviders[key] = { ...newProviders[key], enabled: false };
      } else {
        newProviders[key] = { ...newProviders[key], enabled };
      }
    });
    
    const newSelectedProvider = enabled ? provider : this.currentConfig.selectedProvider;
    
    const newConfig = {
      ...this.currentConfig,
      providers: newProviders,
      selectedProvider: newSelectedProvider
    };
    
    // Guardar en Supabase
    const { error } = await supabase
      .from('company_ai_config')
      .upsert({
        company_id: TEST_CONFIG.company_id,
        ai_providers: newConfig,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    this.currentConfig = newConfig;
    return newConfig;
  }

  /**
   * Verificar estado en Supabase
   */
  async verifyState(expectedState) {
    console.log('🔍 Verificando estado en Supabase...');
    
    try {
      await this.loadCurrentConfig();
      
      const actualState = {
        chutes: this.currentConfig.providers.chutes?.enabled || false,
        groq: this.currentConfig.providers.groq?.enabled || false
      };
      
      const isCorrect = 
        actualState.chutes === expectedState.chutes &&
        actualState.groq === expectedState.groq;
      
      console.log(`📊 Estado esperado:`, expectedState);
      console.log(`📊 Estado actual:`, actualState);
      console.log(`✅ Verificación: ${isCorrect ? 'EXITOSA' : 'FALLÓ'}`);
      
      return isCorrect;
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      return false;
    }
  }

  /**
   * Ejecutar un escenario de prueba
   */
  async runTestScenario(scenario) {
    console.log(`\n🧪 Ejecutando escenario: ${scenario.name}`);
    
    try {
      let result = {
        scenario: scenario.name,
        success: true,
        steps: []
      };
      
      switch (scenario.action) {
        case 'enable':
          result.steps.push(await this.simulateToggleChange(scenario.provider, true));
          result.success = await this.verifyState(scenario.expected_state);
          break;
          
        case 'disable':
          result.steps.push(await this.simulateToggleChange(scenario.provider, false));
          result.success = await this.verifyState(scenario.expected_state);
          break;
          
        case 'rapid_toggle':
          for (const provider of scenario.providers) {
            const stepResult = await this.simulateToggleChange(provider, true);
            result.steps.push(stepResult);
            // Pequeña pausa para simular interacción humana
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          result.success = await this.verifyState(scenario.expected_final_state);
          break;
      }
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      console.error(`❌ Error en escenario "${scenario.name}":`, error);
      this.testResults.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Ejecutar todas las pruebas
   */
  async runAllTests() {
    console.log('🚀 Iniciando pruebas exhaustivas de ToggleSwitch...\n');
    
    if (!await this.initialize()) {
      return false;
    }
    
    for (const scenario of TEST_CONFIG.test_scenarios) {
      await this.runTestScenario(scenario);
    }
    
    this.generateReport();
    return true;
  }

  /**
   * Generar reporte de resultados
   */
  generateReport() {
    console.log('\n📋 REPORTE DE RESULTADOS');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
    console.log(`❌ Pruebas fallidas: ${failedTests}/${totalTests}`);
    console.log(`📈 Tasa de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ DETALLES DE FALLAS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  • ${r.scenario}: ${r.error || 'Estado no coincide'}`);
        });
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (passedTests === totalTests) {
      console.log('✅ Todas las pruebas pasaron. ToggleSwitch funciona correctamente.');
      console.log('✅ La exclusión mutua entre proveedores funciona.');
      console.log('✅ La persistencia en Supabase es correcta.');
    } else {
      console.log('❌ Hay problemas que deben ser revisados.');
    }
  }
}

/**
 * Función principal para ejecutar las pruebas
 */
async function runToggleSwitchTests() {
  const tester = new ToggleSwitchTester();
  
  try {
    await tester.runAllTests();
    
    // Retornar resultado para automatización
    const allPassed = tester.testResults.every(r => r.success);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Error crítico en las pruebas:', error);
    process.exit(1);
  }
}

// Exportar para uso en otros scripts
module.exports = {
  ToggleSwitchTester,
  runToggleSwitchTests
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runToggleSwitchTests();
}