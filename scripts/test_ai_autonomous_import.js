/**
 * Script de Prueba para Sistema Autónomo de Importación con IA
 * 
 * Este script prueba el funcionamiento completo del sistema de IA que:
 * 1. Detecta errores automáticamente en los datos de importación
 * 2. Corrige los datos usando IA
 * 3. Modifica la base de datos dinámicamente si es necesario
 * 4. Realiza la importación masiva con los datos corregidos
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import { aiImportService } from '../src/services/aiImportService.js';
import { bulkImportService } from '../src/services/bulkImportService.js';
import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Datos de prueba
const TEST_COMPANY_ID = 'test-company-id';
const TEST_CLIENT_ID = 'test-client-id';

// Datos de prueba con errores intencionales
const testDataWithErrors = [
  {
    // RUT inválido (sin formato)
    rut: '12345678',
    full_name: 'Juan Pérez González',
    email: 'juan.perez.email', // Email inválido
    phone: '912345678', // Teléfono sin formato internacional
    debt_amount: '1.500.000', // Monto con formato chileno
    due_date: '31/12/2024', // Fecha con formato DD/MM/YYYY
    creditor_name: 'Banco Estado',
    debt_reference: 'PREST-001',
    debt_type: 'credit_card',
    interest_rate: '2,5%', // Tasa con formato chileno
    description: 'Deuda tarjeta de crédito',
    // Campo adicional que no existe en la BD
    campo_inexistente: 'valor extra'
  },
  {
    // RUT con formato correcto pero datos faltantes
    rut: '12.345.678-9',
    full_name: 'María González López',
    email: '', // Email faltante
    phone: '+56987654321',
    debt_amount: '-2500000', // Monto negativo
    due_date: '2024-11-15',
    creditor_name: '', // Acreedor faltante
    debt_reference: 'CUOTA-045',
    debt_type: 'loan',
    interest_rate: '1.8',
    description: 'Crédito consumo'
  },
  {
    // Datos completamente válidos
    rut: '9.876.543-2',
    full_name: 'Carlos Rodríguez Silva',
    email: 'carlos.rodriguez@email.com',
    phone: '+56912345678',
    debt_amount: 3000000,
    due_date: '2025-01-30',
    creditor_name: 'Retail Falabella',
    debt_reference: 'COMP-123',
    debt_type: 'consumer_loan',
    interest_rate: 3.2,
    description: 'Compra en retail'
  }
];

// Datos de prueba con campos completamente nuevos
const testDataWithNewFields = [
  {
    rut: '11.222.333-4',
    full_name: 'Ana Martínez Torres',
    email: 'ana.martinez@email.com',
    phone: '+56998765432',
    debt_amount: 500000,
    due_date: '2024-12-20',
    creditor_name: 'Tienda Departamental',
    debt_reference: 'TDA-001',
    debt_type: 'retail',
    interest_rate: 2.0,
    description: 'Compra en tienda',
    // Campos nuevos que deberían ser creados por la IA
    segmento_cliente: 'Premium',
    riesgo_crediticio: 'Bajo',
    antiguedad_cliente: '5 años',
    canal_origen: 'Online',
    promocion_aplicada: '20% descuento',
    score_comportamiento: 850
  }
];

console.log('🚀 Iniciando prueba del Sistema Autónomo de Importación con IA');
console.log('='.repeat(80));

/**
 * Prueba 1: Detección y corrección de errores con IA
 */
async function testErrorDetectionAndCorrection() {
  console.log('\n📋 PRUEBA 1: Detección y Corrección de Errores con IA');
  console.log('-'.repeat(60));
  
  try {
    console.log('🔍 Analizando datos con errores...');
    console.log('Datos originales:', JSON.stringify(testDataWithErrors, null, 2));
    
    // Procesar datos con IA
    const result = await aiImportService.processImportAutonomously(
      testDataWithErrors,
      TEST_COMPANY_ID,
      TEST_CLIENT_ID
    );
    
    console.log('\n✅ Resultado del procesamiento con IA:');
    console.log('- Éxito:', result.success);
    console.log('- Mensaje:', result.message);
    console.log('- Campos creados:', result.fieldsCreated || []);
    console.log('- Datos corregidos:', result.data?.length || 0);
    
    if (result.success) {
      console.log('\n📊 Datos corregidos:');
      result.data.forEach((item, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log('- RUT:', item.rut);
        console.log('- Email:', item.email);
        console.log('- Teléfono:', item.phone);
        console.log('- Monto:', item.debt_amount);
        console.log('- Fecha:', item.due_date);
        console.log('- Acreedor:', item.creditor_name);
        console.log('- Tasa:', item.interest_rate);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en prueba 1:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Prueba 2: Creación dinámica de campos en la base de datos
 */
async function testDynamicFieldCreation() {
  console.log('\n📋 PRUEBA 2: Creación Dinámica de Campos en Base de Datos');
  console.log('-'.repeat(60));
  
  try {
    console.log('🔍 Analizando datos con campos nuevos...');
    console.log('Datos con campos nuevos:', JSON.stringify(testDataWithNewFields, null, 2));
    
    // Procesar datos con IA para crear campos nuevos
    const result = await aiImportService.processImportAutonomously(
      testDataWithNewFields,
      TEST_COMPANY_ID,
      TEST_CLIENT_ID
    );
    
    console.log('\n✅ Resultado de creación de campos:');
    console.log('- Éxito:', result.success);
    console.log('- Mensaje:', result.message);
    console.log('- Campos creados:', result.fieldsCreated || []);
    
    if (result.success && result.fieldsCreated) {
      console.log('\n🏗️ Campos creados en la base de datos:');
      result.fieldsCreated.forEach(field => {
        console.log(`- ${field.name} (${field.type})`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en prueba 2:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Prueba 3: Importación masiva completa con IA
 */
async function testCompleteAIImport() {
  console.log('\n📋 PRUEBA 3: Importación Masiva Completa con IA');
  console.log('-'.repeat(60));
  
  try {
    // Combinar datos con errores y datos nuevos
    const combinedData = [...testDataWithErrors, ...testDataWithNewFields];
    
    console.log('🔍 Iniciando importación masiva con IA...');
    console.log('Total de registros:', combinedData.length);
    
    // Realizar importación masiva con IA habilitada
    const result = await bulkImportService.bulkImportDebts(combinedData, {
      companyId: TEST_COMPANY_ID,
      clientId: TEST_CLIENT_ID,
      useAI: true, // Habilitar IA
      onProgress: (progress) => {
        console.log(`📈 Progreso: ${progress.processed}/${progress.total} (${progress.successful} exitosos, ${progress.failed} fallidos)`);
      },
      onBatchComplete: (batchResult) => {
        console.log(`📦 Lote ${batchResult.batchNumber}/${batchResult.totalBatches} completado`);
      }
    });
    
    console.log('\n✅ Resultado de importación masiva:');
    console.log('- Éxito:', result.success);
    console.log('- Total procesados:', result.totalRows);
    console.log('- Exitosos:', result.successful);
    console.log('- Fallidos:', result.failed);
    console.log('- Usuarios creados:', result.createdUsers);
    console.log('- Deudas creadas:', result.createdDebts);
    console.log('- Duración:', result.duration?.toFixed(2), 'segundos');
    console.log('- Tasa de éxito:', result.successRate?.toFixed(1), '%');
    
    if (result.aiProcessing) {
      console.log('\n🤖 Resultados del procesamiento con IA:');
      console.log('- Éxito IA:', result.aiProcessing.success);
      console.log('- Mensaje IA:', result.aiProcessing.message);
      console.log('- Campos creados por IA:', result.aiProcessing.fieldsCreated || []);
    }
    
    if (result.retryWithAIData) {
      console.log('\n🔄 La importación fue exitosa después de corrección con IA');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en prueba 3:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Prueba 4: Validación de estado de la base de datos
 */
async function testDatabaseState() {
  console.log('\n📋 PRUEBA 4: Validación de Estado de la Base de Datos');
  console.log('-'.repeat(60));
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Verificar usuarios creados
    console.log('🔍 Verificando usuarios creados...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'debtor')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error consultando usuarios:', usersError);
    } else {
      console.log(`✅ Se encontraron ${users.length} usuarios deudores`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.full_name} (${user.rut}) - ${user.email}`);
      });
    }
    
    // Verificar deudas creadas
    console.log('\n🔍 Verificando deudas creadas...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', TEST_COMPANY_ID)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (debtsError) {
      console.error('❌ Error consultando deudas:', debtsError);
    } else {
      console.log(`✅ Se encontraron ${debts.length} deudas`);
      debts.forEach((debt, index) => {
        console.log(`  ${index + 1}. $${debt.original_amount?.toLocaleString('es-CL')} - ${debt.creditor_name} - ${debt.status}`);
      });
    }
    
    // Verificar si se crearon campos nuevos (si existen)
    console.log('\n🔍 Verificando estructura de tablas...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error consultando estructura:', tableError);
    } else if (tableInfo.length > 0) {
      const fields = Object.keys(tableInfo[0]);
      console.log(`✅ Tabla 'debts' tiene ${fields.length} campos:`, fields);
      
      // Verificar campos nuevos que podrían haber sido creados
      const newFields = fields.filter(field => 
        field.includes('segmento') || 
        field.includes('riesgo') || 
        field.includes('antiguedad') || 
        field.includes('canal') || 
        field.includes('promocion') || 
        field.includes('score')
      );
      
      if (newFields.length > 0) {
        console.log('🏗️ Campos nuevos detectados:', newFields);
      }
    }
    
    return { success: true, users, debts };
  } catch (error) {
    console.error('❌ Error en prueba 4:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función principal de ejecución de pruebas
 */
async function runAllTests() {
  console.log('🎯 Ejecutando todas las pruebas del Sistema Autónomo de Importación con IA');
  console.log('='.repeat(80));
  
  const results = {
    test1: await testErrorDetectionAndCorrection(),
    test2: await testDynamicFieldCreation(),
    test3: await testCompleteAIImport(),
    test4: await testDatabaseState()
  };
  
  console.log('\n📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(80));
  
  Object.entries(results).forEach(([testName, result], index) => {
    const status = result.success ? '✅ ÉXITO' : '❌ FALLO';
    console.log(`${index + 1}. ${testName}: ${status}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Resultado general: ${successCount}/${totalCount} pruebas exitosas`);
  
  if (successCount === totalCount) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ El Sistema Autónomo de Importación con IA funciona correctamente');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Revisa los errores detallados arriba.');
  }
  
  return results;
}

// Ejecutar pruebas si este script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      console.log('\n🏁 Pruebas completadas');
      process.exit(results.every(r => r.success) ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error fatal ejecutando pruebas:', error);
      process.exit(1);
    });
}

export {
  testErrorDetectionAndCorrection,
  testDynamicFieldCreation,
  testCompleteAIImport,
  testDatabaseState,
  runAllTests,
  testDataWithErrors,
  testDataWithNewFields
};