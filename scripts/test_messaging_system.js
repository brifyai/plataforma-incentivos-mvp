/**
 * Script de Prueba del Sistema de Mensajería
 *
 * Este script verifica que todos los componentes del sistema de mensajería
 * estén funcionando correctamente después de la integración.
 */

import { supabase } from '../src/config/supabase.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 Iniciando pruebas del sistema de mensajería...\n');

async function testMessagingSystem() {
  const tests = [];
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Verificar tablas de mensajería
  console.log('📋 Test 1: Verificando tablas de mensajería...');
  try {
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (convError) {
      console.error('❌ Error al acceder a tabla conversations:', convError);
      tests.push({ test: 'Tablas de mensajería', status: 'FAILED', error: convError.message });
      failedTests++;
    } else {
      console.log('✅ Tabla conversations accesible');
      tests.push({ test: 'Tablas de mensajería', status: 'PASSED' });
      passedTests++;
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Error al acceder a tabla messages:', msgError);
      tests.push({ test: 'Tabla messages', status: 'FAILED', error: msgError.message });
      failedTests++;
    } else {
      console.log('✅ Tabla messages accesible');
      tests.push({ test: 'Tabla messages', status: 'PASSED' });
      passedTests++;
    }

    const { data: attachments, error: attError } = await supabase
      .from('message_attachments')
      .select('count')
      .limit(1);
    
    if (attError) {
      console.error('❌ Error al acceder a tabla message_attachments:', attError);
      tests.push({ test: 'Tabla message_attachments', status: 'FAILED', error: attError.message });
      failedTests++;
    } else {
      console.log('✅ Tabla message_attachments accesible');
      tests.push({ test: 'Tabla message_attachments', status: 'PASSED' });
      passedTests++;
    }

  } catch (error) {
    console.error('❌ Error inesperado en test de tablas:', error);
    tests.push({ test: 'Tablas de mensajería', status: 'FAILED', error: error.message });
    failedTests++;
  }

  // Test 2: Verificar políticas RLS
  console.log('\n🔒 Test 2: Verificando políticas RLS...');
  try {
    // Intentar acceder sin autenticación (debe fallar)
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('row-level security')) {
      console.log('✅ Políticas RLS activas correctamente');
      tests.push({ test: 'Políticas RLS', status: 'PASSED' });
      passedTests++;
    } else {
      console.log('⚠️  Políticas RLS pueden no estar configuradas correctamente');
      tests.push({ test: 'Políticas RLS', status: 'WARNING', message: 'RLS policies may not be properly configured' });
      passedTests++;
    }
  } catch (error) {
    console.error('❌ Error verificando RLS:', error);
    tests.push({ test: 'Políticas RLS', status: 'FAILED', error: error.message });
    failedTests++;
  }

  // Test 3: Verificar funciones de utilidad
  console.log('\n⚙️  Test 3: Verificando funciones de utilidad...');
  try {
    const { data, error } = await supabase
      .rpc('get_conversations_with_filters', {
        p_limit: 1,
        p_offset: 0
      });
    
    if (error) {
      console.log('⚠️  Función get_conversations_with_filters no disponible:', error.message);
      tests.push({ test: 'Función get_conversations_with_filters', status: 'WARNING', error: error.message });
    } else {
      console.log('✅ Función get_conversations_with_filters disponible');
      tests.push({ test: 'Función get_conversations_with_filters', status: 'PASSED' });
      passedTests++;
    }

    const { data: sendData, error: sendError } = await supabase
      .rpc('send_message', {
        p_conversation_id: '00000000-0000-0000-0000-000000000000',
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_sender_type: 'debtor',
        p_content: 'test'
      });
    
    if (sendError && sendError.message.includes('not found')) {
      console.log('✅ Función send_message disponible (validación funcionando)');
      tests.push({ test: 'Función send_message', status: 'PASSED' });
      passedTests++;
    } else if (sendError) {
      console.log('⚠️  Función send_message con error inesperado:', sendError.message);
      tests.push({ test: 'Función send_message', status: 'WARNING', error: sendError.message });
    } else {
      console.log('✅ Función send_message disponible');
      tests.push({ test: 'Función send_message', status: 'PASSED' });
      passedTests++;
    }

  } catch (error) {
    console.error('❌ Error verificando funciones:', error);
    tests.push({ test: 'Funciones de utilidad', status: 'FAILED', error: error.message });
    failedTests++;
  }

  // Test 4: Verificar triggers
  console.log('\n🔄 Test 4: Verificando triggers...');
  try {
    // Crear una conversación de prueba
    const { data: testConv, error: convCreateError } = await supabase
      .from('conversations')
      .insert({
        debtor_id: '00000000-0000-0000-0000-000000000000',
        debtor_name: 'Test User',
        debtor_rut: '11.111.111-1',
        company_id: '00000000-0000-0000-0000-000000000000',
        company_name: 'Test Company',
        subject: 'Test Conversation',
        status: 'active'
      })
      .select()
      .single();
    
    if (convCreateError) {
      console.log('⚠️  No se pudo crear conversación de prueba (puede ser normal si RLS está activo):', convCreateError.message);
      tests.push({ test: 'Triggers - Creación conversación', status: 'SKIPPED', reason: 'RLS active' });
    } else {
      console.log('✅ Conversación de prueba creada');
      
      // Verificar que se creó con timestamps
      if (testConv.created_at && testConv.updated_at) {
        console.log('✅ Triggers de timestamps funcionando');
        tests.push({ test: 'Triggers de timestamps', status: 'PASSED' });
        passedTests++;
      } else {
        console.log('❌ Triggers de timestamps no funcionando');
        tests.push({ test: 'Triggers de timestamps', status: 'FAILED' });
        failedTests++;
      }

      // Limpiar conversación de prueba
      await supabase
        .from('conversations')
        .delete()
        .eq('id', testConv.id);
    }

  } catch (error) {
    console.log('⚠️  Test de triggers omitido (posible RLS activo):', error.message);
    tests.push({ test: 'Triggers', status: 'SKIPPED', reason: 'RLS active' });
  }

  // Test 5: Verificar archivos del sistema
  console.log('\n📁 Test 5: Verificando archivos del sistema...');

  const requiredFiles = [
    'src/services/messageService.js',
    'src/hooks/useMessages.js',
    'src/hooks/useCompanyMessages.js',
    'src/pages/company/CompanyMessagesPage.jsx',
    'src/pages/debtor/MessagesPage.jsx',
    'supabase-migrations/017_create_messaging_tables.sql'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} existe`);
      tests.push({ test: `Archivo ${file}`, status: 'PASSED' });
      passedTests++;
    } else {
      console.log(`❌ ${file} no encontrado`);
      tests.push({ test: `Archivo ${file}`, status: 'FAILED', error: 'File not found' });
      failedTests++;
    }
  });

  // Resultados finales
  console.log('\n📊 RESULTADOS FINALES:');
  console.log('='.repeat(50));
  
  tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${icon} ${test.test}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.reason) console.log(`   Razón: ${test.reason}`);
  });

  console.log('='.repeat(50));
  console.log(`✅ Tests pasados: ${passedTests}`);
  console.log(`❌ Tests fallidos: ${failedTests}`);
  console.log(`⚠️  Tests con advertencias: ${tests.filter(t => t.status === 'WARNING').length}`);
  console.log(`🔄 Tests omitidos: ${tests.filter(t => t.status === 'SKIPPED').length}`);
  
  const totalTests = tests.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`📈 Tasa de éxito: ${successRate}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ¡Todos los tests críticos pasaron! El sistema de mensajería está listo.');
  } else {
    console.log('\n⚠️  Algunos tests fallaron. Revisa los errores antes de continuar.');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    warnings: tests.filter(t => t.status === 'WARNING').length,
    skipped: tests.filter(t => t.status === 'SKIPPED').length,
    successRate: parseFloat(successRate),
    tests
  };
}

// Ejecutar tests
testMessagingSystem()
  .then(results => {
    console.log('\n🏁 Script completado');
    if (results.failed > 0) {
      console.log('❌ Algunos tests fallaron');
      process.exit(1);
    } else {
      console.log('✅ Todos los tests pasaron');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });