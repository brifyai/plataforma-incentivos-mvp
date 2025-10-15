/**
 * Script de prueba rápida para el sistema de IA autónomo de importación
 * 
 * Ejecutar con: node scripts/test_ai_import_quick.js
 */

import { aiImportService } from '../src/services/aiImportService.js';

// Datos de prueba con errores comunes
const testData = [
  {
    rut: '12345678', // Formato incorrecto (falta puntos y guion)
    full_name: 'juan perez', // Nombres en minúsculas
    email: 'JUAN.PEREZ@EMAIL.COM', // Email en mayúsculas
    phone: '912345678', // Teléfono sin formato internacional
    debt_amount: '1.500.000', // Monto con formato chileno
    due_date: '31/12/2024', // Fecha formato DD/MM/YYYY
    creditor_name: 'banco estado', // Nombre en minúsculas
    debt_reference: 'PREST001',
    debt_type: 'credit_card',
    interest_rate: '2,5%', // Tasa con coma y porcentaje
    description: 'deuda tarjeta de credito'
  },
  {
    rut: '987654321', // Formato incorrecto
    full_name: 'MARIA GONZALEZ',
    email: 'maria.gonzalez@email.com',
    phone: '+56987654321', // Ya está bien formateado
    debt_amount: '$2.500.000', // Monto con símbolo y puntos
    due_date: '2024-11-15', // Ya está bien formateado
    creditor_name: 'CMR FALABELLA',
    debt_reference: 'CUOTA045',
    debt_type: 'loan',
    interest_rate: '1.8%',
    description: 'CREDITO CONSUMO'
  },
  {
    rut: '111111111', // Formato incorrecto
    full_name: 'pedro lopez',
    email: '', // Email faltante
    phone: '98765432', // Teléfono corto
    debt_amount: '500000', // Monto sin formato
    due_date: '15-01-2025', // Fecha con guiones
    creditor_name: 'ripley',
    debt_reference: '',
    debt_type: '',
    interest_rate: '',
    description: ''
  }
];

async function testAIImport() {
  console.log('🚀 Iniciando prueba rápida del sistema de IA autónomo...');
  console.log('📊 Datos de prueba:', testData.length, 'registros');
  
  try {
    // Simular companyId y clientId
    const companyId = 'test-company-id';
    const clientId = 'test-client-id';
    
    console.log('\n🤖 Ejecutando procesamiento autónomo con IA...');
    const result = await aiImportService.processImportAutonomously(testData, companyId, clientId);
    
    console.log('\n📋 Resultado del procesamiento:');
    console.log('✅ Éxito:', result.success);
    console.log('📝 Mensaje:', result.message);
    console.log('📊 Datos procesados:', result.data?.length || 0);
    console.log('🔧 Campos creados:', result.fieldsCreated || []);
    console.log('🔄 Fallback:', result.fallback || false);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📄 Datos corregidos (primer registro):');
      console.log(JSON.stringify(result.data[0], null, 2));
      
      console.log('\n🔍 Comparación antes/después:');
      console.log('Original RUT:', testData[0].rut, '→', 'Corregido:', result.data[0].rut);
      console.log('Original Teléfono:', testData[0].phone, '→', 'Corregido:', result.data[0].phone);
      console.log('Original Monto:', testData[0].debt_amount, '→', 'Corregido:', result.data[0].debt_amount);
      console.log('Original Nombre:', testData[0].full_name, '→', 'Corregido:', result.data[0].full_name);
    }
    
    // Validar que los datos corregidos sean válidos
    console.log('\n✅ Validación final:');
    let validCount = 0;
    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];
      const isValid = row.rut && row.full_name && row.debt_amount && row.due_date && row.creditor_name;
      console.log(`Fila ${i + 1}: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
      if (isValid) validCount++;
    }
    
    console.log(`\n🎯 Resumen: ${validCount}/${result.data.length} registros válidos`);
    
    if (result.success && validCount === result.data.length) {
      console.log('\n🎉 ¡Prueba exitosa! El sistema de IA está funcionando correctamente.');
    } else {
      console.log('\n⚠️ Prueba con advertencias. El sistema funciona pero podría mejorarse.');
    }
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar prueba
testAIImport();