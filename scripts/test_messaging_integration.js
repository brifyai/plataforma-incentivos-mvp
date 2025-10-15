/**
 * Script de Verificación de Integración del Sistema de Mensajería
 * 
 * Este script verifica que todos los archivos y componentes necesarios
 * estén presentes y correctamente estructurados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando integración del sistema de mensajería...\n');

const tests = [];
let passedTests = 0;
let failedTests = 0;

// Test 1: Verificar archivos principales del sistema
console.log('📁 Test 1: Verificando archivos principales del sistema...');

const requiredFiles = [
  {
    path: 'src/services/messageService.js',
    description: 'Servicio central de mensajería'
  },
  {
    path: 'src/hooks/useMessages.js',
    description: 'Hook de mensajería para deudores'
  },
  {
    path: 'src/hooks/useCompanyMessages.js',
    description: 'Hook de mensajería para empresas'
  },
  {
    path: 'src/pages/company/CompanyMessagesPage.jsx',
    description: 'Página de mensajes de empresa'
  },
  {
    path: 'src/pages/debtor/MessagesPage.jsx',
    description: 'Página de mensajes de deudor'
  },
  {
    path: 'supabase-migrations/017_create_messaging_tables.sql',
    description: 'Migración de base de datos de mensajería'
  },
  {
    path: 'src/services/realtimeService.js',
    description: 'Servicio de tiempo real'
  }
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file.description} (${file.path})`);
    tests.push({ test: file.description, status: 'PASSED', file: file.path });
    passedTests++;
  } else {
    console.log(`❌ ${file.description} (${file.path}) - NO ENCONTRADO`);
    tests.push({ test: file.description, status: 'FAILED', file: file.path, error: 'File not found' });
    failedTests++;
  }
});

// Test 2: Verificar contenido de archivos clave
console.log('\n📄 Test 2: Verificando contenido de archivos clave...');

const keyFiles = [
  {
    path: 'src/services/messageService.js',
    checks: [
      'class MessageService',
      'createConversation',
      'sendMessage',
      'getConversations',
      'subscribeToCompanyConversations'
    ]
  },
  {
    path: 'src/hooks/useMessages.js',
    checks: [
      'export.*useMessages',
      'conversations',
      'sendMessage',
      'getConversation'
    ]
  },
  {
    path: 'src/hooks/useCompanyMessages.js',
    checks: [
      'export.*useCompanyMessages',
      'conversations',
      'sendMessage',
      'getConversation'
    ]
  }
];

keyFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let allChecksPassed = true;
    
    file.checks.forEach(check => {
      const regex = new RegExp(check, 'i');
      if (!regex.test(content)) {
        console.log(`❌ ${file.path} - Falta: ${check}`);
        allChecksPassed = false;
      }
    });
    
    if (allChecksPassed) {
      console.log(`✅ ${file.path} - Contenido verificado`);
      tests.push({ test: `Contenido ${file.path}`, status: 'PASSED' });
      passedTests++;
    } else {
      tests.push({ test: `Contenido ${file.path}`, status: 'FAILED', error: 'Missing required functions' });
      failedTests++;
    }
  }
});

// Test 3: Verificar estructura de la migración
console.log('\n🗄️  Test 3: Verificando estructura de la migración...');

const migrationPath = path.join(__dirname, '..', 'supabase-migrations/017_create_messaging_tables.sql');
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const requiredTables = [
    'CREATE TABLE.*conversations',
    'CREATE TABLE.*messages',
    'CREATE TABLE.*message_attachments',
    'ALTER TABLE.*ENABLE ROW LEVEL SECURITY',
    'CREATE POLICY.*conversations',
    'CREATE POLICY.*messages',
    'CREATE POLICY.*message_attachments'
  ];
  
  let allTablesFound = true;
  requiredTables.forEach(table => {
    if (!new RegExp(table, 'i').test(migrationContent)) {
      console.log(`❌ Falta en migración: ${table}`);
      allTablesFound = false;
    }
  });
  
  if (allTablesFound) {
    console.log('✅ Estructura de migración completa');
    tests.push({ test: 'Estructura de migración', status: 'PASSED' });
    passedTests++;
  } else {
    tests.push({ test: 'Estructura de migración', status: 'FAILED', error: 'Missing required tables or policies' });
    failedTests++;
  }
}

// Test 4: Verificar imports en páginas
console.log('\n🔗 Test 4: Verificando imports en páginas...');

const pageFiles = [
  {
    path: 'src/pages/company/CompanyMessagesPage.jsx',
    expectedImports: [
      'useCompanyMessages',
      'messageService'
    ]
  },
  {
    path: 'src/pages/debtor/MessagesPage.jsx',
    expectedImports: [
      'useMessages'
    ]
  }
];

pageFiles.forEach(page => {
  const filePath = path.join(__dirname, '..', page.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let allImportsFound = true;
    
    page.expectedImports.forEach(importName => {
      if (!content.includes(importName)) {
        console.log(`❌ ${page.path} - Falta import: ${importName}`);
        allImportsFound = false;
      }
    });
    
    if (allImportsFound) {
      console.log(`✅ ${page.path} - Imports verificados`);
      tests.push({ test: `Imports ${page.path}`, status: 'PASSED' });
      passedTests++;
    } else {
      tests.push({ test: `Imports ${page.path}`, status: 'FAILED', error: 'Missing required imports' });
      failedTests++;
    }
  }
});

// Test 5: Verificar configuración de hooks
console.log('\n⚙️  Test 5: Verificando configuración de hooks...');

const hooksIndexPath = path.join(__dirname, '..', 'src/hooks/index.js');
if (fs.existsSync(hooksIndexPath)) {
  const hooksContent = fs.readFileSync(hooksIndexPath, 'utf8');
  const requiredExports = [
    'useMessages',
    'useCompanyMessages',
    'useMessagingErrors'
  ];
  
  let allExportsFound = true;
  requiredExports.forEach(exportName => {
    if (!hooksContent.includes(exportName)) {
      console.log(`❌ Falta export en hooks/index.js: ${exportName}`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    console.log('✅ Exports de hooks verificados');
    tests.push({ test: 'Exports de hooks', status: 'PASSED' });
    passedTests++;
  } else {
    tests.push({ test: 'Exports de hooks', status: 'FAILED', error: 'Missing required exports' });
    failedTests++;
  }
} else {
  console.log('❌ Archivo hooks/index.js no encontrado');
  tests.push({ test: 'Exports de hooks', status: 'FAILED', error: 'File not found' });
  failedTests++;
}

// Resultados finales
console.log('\n📊 RESULTADOS DE INTEGRACIÓN:');
console.log('='.repeat(60));

tests.forEach(test => {
  const icon = test.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${test.test}: ${test.status}`);
  if (test.error) console.log(`   Error: ${test.error}`);
});

console.log('='.repeat(60));
console.log(`✅ Tests pasados: ${passedTests}`);
console.log(`❌ Tests fallidos: ${failedTests}`);

const totalTests = tests.length;
const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`📈 Tasa de éxito: ${successRate}%`);

if (failedTests === 0) {
  console.log('\n🎉 ¡Perfecto! La integración del sistema de mensajería está completa.');
  console.log('✅ Todos los componentes están presentes y correctamente configurados.');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Aplicar la migración de base de datos: supabase-migrations/017_create_messaging_tables.sql');
  console.log('2. Configurar las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.log('3. Probar el sistema en el navegador');
  console.log('4. Verificar que las suscripciones en tiempo real funcionen');
} else {
  console.log('\n⚠️  Algunos componentes faltan o están incompletos.');
  console.log('📋 Revisa los errores mostrados arriba y corrige los problemas.');
}

console.log('\n🏁 Verificación completada');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}