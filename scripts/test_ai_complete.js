/**
 * Test AI Complete - Prueba completa del sistema de IA para importación
 * 
 * Este script verifica:
 * 1. Configuración de API keys
 * 2. Conectividad con proveedores de IA
 * 3. Funcionamiento del servicio de IA autónomo
 * 4. Integración completa con bulkImportService
 */

import { aiImportService } from '../src/services/aiImportService.js';
import { bulkImportDebts } from '../src/services/bulkImportService.js';

// Configuración de colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🔍 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

// Datos de prueba con errores típicos
const testData = [
  {
    rut: '12345678',
    full_name: 'juan perez',
    email: 'JUAN.PEREZ@EMAIL.COM',
    phone: '912345678',
    debt_amount: '1.500.000',
    due_date: '31/12/2024',
    creditor_name: 'Banco Chile'
  },
  {
    rut: '987654321',
    full_name: 'MARIA GONZALEZ',
    email: 'maria.gonzalez@email.com',
    phone: '+56987654321',
    debt_amount: '$2.500.000',
    due_date: '2024-11-15',
    creditor_name: 'Falabella'
  },
  {
    rut: '111111111',
    full_name: 'pedro lopez',
    email: '',
    phone: '98765432',
    debt_amount: '500000',
    due_date: '15-01-2025',
    creditor_name: 'Ripley'
  }
];

async function testAPIKeys() {
  section('Verificación de API Keys');
  
  const providers = ['openai', 'groq', 'chutes'];
  const results = {};
  
  for (const provider of providers) {
    // Simular configuración del proveedor
    localStorage.setItem('ai_provider', provider);
    
    const apiKeyMap = {
      'openai': import.meta.env?.VITE_OPENAI_API_KEY,
      'groq': import.meta.env?.VITE_GROQ_API_KEY,
      'chutes': import.meta.env?.VITE_CHUTES_API_KEY
    };
    
    const apiKey = apiKeyMap[provider];
    
    results[provider] = {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
    };
    
    log(`📋 ${provider.toUpperCase()}:`, results[provider].hasKey ? '✅' : '❌');
    log(`   - API Key: ${results[provider].keyPrefix}`);
    log(`   - Longitud: ${results[provider].keyLength}`);
  }
  
  return results;
}

async function testAIConnectivity() {
  section('Prueba de Conectividad con IA');
  
  const providers = ['openai', 'groq', 'chutes'];
  const results = {};
  
  for (const provider of providers) {
    log(`\n🤖 Probando ${provider.toUpperCase()}...`, 'yellow');
    
    try {
      // Configurar proveedor
      localStorage.setItem('ai_provider', provider);
      
      // Probar llamada simple a la IA
      const testPrompt = 'Responde solo con "OK" si puedes leer esto.';
      const systemPrompt = 'Eres un asistente de prueba.';
      
      const response = await aiImportService.callAI(testPrompt, systemPrompt);
      
      results[provider] = {
        success: true,
        response: response.substring(0, 100),
        error: null
      };
      
      log(`   ✅ Conectividad exitosa`, 'green');
      log(`   📝 Respuesta: ${response.substring(0, 50)}...`);
      
    } catch (error) {
      results[provider] = {
        success: false,
        response: null,
        error: error.message
      };
      
      log(`   ❌ Error de conectividad: ${error.message}`, 'red');
    }
  }
  
  return results;
}

async function testAIDataCorrection() {
  section('Prueba de Corrección de Datos con IA');
  
  try {
    log('📊 Enviando datos de prueba a IA...', 'yellow');
    
    // Probar corrección con el primer registro
    const sampleData = [testData[0]];
    
    const result = await aiImportService.processImportAutonomously(
      sampleData,
      'test-company-id',
      null
    );
    
    log('✅ Procesamiento completado', 'green');
    log(`📋 Éxito: ${result.success}`);
    log(`📝 Mensaje: ${result.message}`);
    log(`🔄 Usó fallback: ${result.fallback || false}`);
    
    if (result.data && result.data.length > 0) {
      const corrected = result.data[0];
      const original = testData[0];
      
      log('\n📊 Comparación de datos:', 'blue');
      log('Campo        | Original      | Corregido     | Estado');
      log('-'.repeat(50));
      
      const fields = ['rut', 'full_name', 'email', 'phone', 'debt_amount', 'due_date'];
      for (const field of fields) {
        const originalValue = original[field] || '(vacío)';
        const correctedValue = corrected[field] || '(vacío)';
        const changed = originalValue !== correctedValue;
        const status = changed ? '✅' : '⚪';
        
        log(`${field.padEnd(12)} | ${originalValue.padEnd(12)} | ${correctedValue.padEnd(12)} | ${status}`);
      }
    }
    
    return result;
    
  } catch (error) {
    log(`❌ Error en corrección de datos: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testBulkImportIntegration() {
  section('Prueba de Integración Completa con BulkImport');
  
  try {
    log('🚀 Iniciando importación masiva de prueba...', 'yellow');
    
    const result = await bulkImportDebts(testData, {
      companyId: 'test-company-id',
      clientId: null,
      useAI: true,
      onProgress: (progress) => {
        log(`📈 Progreso: ${progress.processed}/${testData.length} (✅${progress.successful} ❌${progress.failed})`);
      }
    });
    
    log('\n📊 Resultados de la importación:', 'blue');
    log(`✅ Éxito: ${result.success}`);
    log(`📊 Total de filas: ${result.totalRows}`);
    log(`🔄 Procesadas: ${result.processed}`);
    log(`✅ Exitosas: ${result.successful}`);
    log(`❌ Fallidas: ${result.failed}`);
    log(`📈 Tasa de éxito: ${result.successRate?.toFixed(2)}%`);
    
    if (result.aiProcessing) {
      log('\n🤖 Resultados del procesamiento IA:', 'magenta');
      log(`✅ Éxito IA: ${result.aiProcessing.success}`);
      log(`📝 Mensaje IA: ${result.aiProcessing.message}`);
      log(`🔄 Usó fallback: ${result.aiProcessing.fallback || false}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      log('\n❌ Errores encontrados:', 'red');
      result.errors.slice(0, 3).forEach((error, index) => {
        log(`${index + 1}. Fila ${error.row}: ${error.errors.join(', ')}`);
      });
      
      if (result.errors.length > 3) {
        log(`... y ${result.errors.length - 3} errores más`);
      }
    }
    
    return result;
    
  } catch (error) {
    log(`❌ Error en importación masiva: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testManualFallback() {
  section('Prueba de Fallback Manual (sin IA)');
  
  try {
    log('🔧 Probando corrección manual sin IA...', 'yellow');
    
    // Forzar que no use IA
    const result = await bulkImportDebts(testData, {
      companyId: 'test-company-id',
      clientId: null,
      useAI: false,
      onProgress: (progress) => {
        log(`📈 Progreso: ${progress.processed}/${testData.length} (✅${progress.successful} ❌${progress.failed})`);
      }
    });
    
    log('\n📊 Resultados del fallback manual:', 'blue');
    log(`✅ Éxito: ${result.success}`);
    log(`📊 Total de filas: ${result.totalRows}`);
    log(`🔄 Procesadas: ${result.processed}`);
    log(`✅ Exitosas: ${result.successful}`);
    log(`❌ Fallidas: ${result.failed}`);
    log(`📈 Tasa de éxito: ${result.successRate?.toFixed(2)}%`);
    
    return result;
    
  } catch (error) {
    log(`❌ Error en fallback manual: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function generateReport(apiKeys, connectivity, dataCorrection, bulkImport, manualFallback) {
  section('Reporte Final y Recomendaciones');
  
  log('\n📋 Resumen de resultados:', 'bright');
  
  // API Keys
  const hasAnyKey = Object.values(apiKeys).some(result => result.hasKey);
  log(`🔑 API Keys configuradas: ${hasAnyKey ? '✅' : '❌'}`);
  
  // Conectividad
  const hasConnectivity = Object.values(connectivity).some(result => result.success);
  log(`🌐 Conectividad IA: ${hasConnectivity ? '✅' : '❌'}`);
  
  // Corrección de datos
  log(`🔧 Corrección de datos: ${dataCorrection.success ? '✅' : '❌'}`);
  
  // Importación masiva
  log(`📦 Importación masiva: ${bulkImport.success ? '✅' : '❌'}`);
  
  // Fallback manual
  log(`🛡️ Fallback manual: ${manualFallback.success ? '✅' : '❌'}`);
  
  log('\n🎯 Diagnóstico:', 'bright');
  
  if (!hasAnyKey) {
    log('❌ PROBLEMA CRÍTICO: No hay API keys configuradas', 'red');
    log('💡 Solución: Configurar al menos una API key en el archivo .env', 'yellow');
    log('   - VITE_OPENAI_API_KEY para OpenAI');
    log('   - VITE_GROQ_API_KEY para Groq');
    log('   - VITE_CHUTES_API_KEY para Chutes');
  } else if (!hasConnectivity) {
    log('❌ PROBLEMA CRÍTICO: Hay API keys pero no hay conectividad', 'red');
    log('💡 Solución: Verificar que las API keys sean válidas y estén activas', 'yellow');
  } else if (!dataCorrection.success) {
    log('⚠️ PROBLEMA: La IA tiene conectividad pero no corrige datos', 'yellow');
    log('💡 Solución: Revisar los prompts y el procesamiento de respuestas', 'yellow');
  } else if (!bulkImport.success) {
    log('⚠️ PROBLEMA: La IA funciona pero la importación falla', 'yellow');
    log('💡 Solución: Revisar la validación de datos y el guardado en BD', 'yellow');
  } else {
    log('✅ SISTEMA FUNCIONANDO CORRECTAMENTE', 'green');
    log('🎉 Todos los componentes están operativos', 'green');
  }
  
  log('\n📊 Estado de proveedores:', 'bright');
  for (const [provider, result] of Object.entries(connectivity)) {
    const hasKey = apiKeys[provider]?.hasKey;
    const status = result.success ? '✅' : '❌';
    const keyStatus = hasKey ? '🔑' : '❌';
    log(`   ${provider.toUpperCase()}: ${status} ${keyStatus}`);
  }
  
  log('\n🔍 Próximos pasos recomendados:', 'bright');
  if (manualFallback.success) {
    log('1. ✅ El fallback manual funciona - sistema seguro', 'green');
    log('2. Si la IA no funciona, los datos se corregirán manualmente', 'green');
  }
  
  if (hasConnectivity && !dataCorrection.success) {
    log('1. 🔧 Revisar la función correctDataAutomatically en aiImportService.js', 'yellow');
    log('2. 🔍 Verificar los prompts enviados a la IA', 'yellow');
    log('3. 📝 Revisar el parseo de respuestas JSON', 'yellow');
  }
  
  if (!hasConnectivity && hasAnyKey) {
    log('1. 🔑 Verificar que las API keys sean correctas', 'yellow');
    log('2. 🌐 Revisar la conectividad de red', 'yellow');
    log('3. 📋 Consultar la documentación del proveedor de IA', 'yellow');
  }
}

// Función principal
async function main() {
  log('🚀 Iniciando prueba completa del sistema de IA para importación', 'bright');
  log('📅 Fecha: ' + new Date().toLocaleString('es-CL'));
  
  try {
    // 1. Verificar API keys
    const apiKeys = await testAPIKeys();
    
    // 2. Probar conectividad
    const connectivity = await testAIConnectivity();
    
    // 3. Probar corrección de datos
    const dataCorrection = await testAIDataCorrection();
    
    // 4. Probar importación masiva completa
    const bulkImport = await testBulkImportIntegration();
    
    // 5. Probar fallback manual
    const manualFallback = await testManualFallback();
    
    // 6. Generar reporte
    await generateReport(apiKeys, connectivity, dataCorrection, bulkImport, manualFallback);
    
  } catch (error) {
    log(`❌ Error general en las pruebas: ${error.message}`, 'red');
    log('📍 Stack:', error.stack);
  }
  
  log('\n🏁 Pruebas completadas', 'bright');
}

// Ejecutar pruebas
main().catch(console.error);