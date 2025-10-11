/**
 * Script para probar todas las páginas de configuración del administrador
 * Verifica si guardan datos correctamente en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Colores para consola
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

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🔍 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n📋 ${title}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

async function testSystemConfigTable() {
  logSection('PRUEBA DE TABLA system_config');
  
  try {
    // Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'system_config');

    if (tablesError) {
      log('❌ Error verificando tabla system_config:', 'red');
      log(tablesError.message, 'red');
      return false;
    }

    if (!tables || tables.length === 0) {
      log('❌ La tabla system_config no existe', 'red');
      return false;
    }

    log('✅ Tabla system_config existe', 'green');

    // Verificar estructura de la tabla
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'system_config')
      .order('ordinal_position');

    if (columnsError) {
      log('❌ Error obteniendo estructura de la tabla:', 'red');
      log(columnsError.message, 'red');
      return false;
    }

    log('📋 Estructura de la tabla system_config:', 'blue');
    columns.forEach(col => {
      log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`, 'blue');
    });

    // Verificar RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'system_config');

    if (policiesError) {
      log('⚠️  No se pudieron verificar las políticas RLS (puede ser normal)', 'yellow');
    } else {
      log('🔒 Políticas RLS en system_config:', 'magenta');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          log(`  - ${policy.policyname}: ${policy.cmd} para ${policy.roles}`, 'magenta');
        });
      } else {
        log('  - No hay políticas RLS definidas', 'yellow');
      }
    }

    return true;
  } catch (error) {
    log('❌ Error general verificando system_config:', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function testConfigSaving() {
  logSection('PRUEBA DE GUARDADO DE CONFIGURACIÓN');
  
  const testConfigs = [
    {
      name: 'Configuración General',
      data: {
        oauth_enabled: 'true',
        user_validation_enabled: 'true',
        email_notifications_enabled: 'true',
        push_notifications_enabled: 'false',
        mercado_pago_enabled: 'true',
        query_limit_per_minute: '1000',
        backup_frequency: 'daily',
        log_retention_days: '30',
        system_maintenance_mode: 'false'
      }
    },
    {
      name: 'Configuración de Mercado Pago',
      data: {
        mercado_pago_access_token: 'TEST_ACCESS_TOKEN_123',
        mercado_pago_public_key: 'TEST_PUBLIC_KEY_456',
        mercado_pago_webhook_url: 'https://test.com/webhook',
        mercado_pago_active: 'true'
      }
    },
    {
      name: 'Configuración de Notificaciones',
      data: {
        email_provider: 'sendgrid',
        email_api_key: 'TEST_EMAIL_KEY',
        email_from_address: 'test@example.com',
        email_from_name: 'Test Platform',
        email_service_active: 'true',
        push_provider: 'firebase',
        push_api_key: 'TEST_PUSH_KEY',
        push_service_active: 'false',
        sms_provider: 'twilio',
        sms_account_sid: 'TEST_SMS_SID',
        sms_service_active: 'false'
      }
    },
    {
      name: 'Configuración de Analytics',
      data: {
        analytics_provider: 'google_analytics',
        analytics_tracking_id: 'GA-123456789',
        analytics_domain: 'test.com',
        analytics_active: 'true'
      }
    },
    {
      name: 'Configuración de Bancos',
      data: {
        bank_integration_enabled: 'true',
        default_bank_code: '001',
        bank_webhook_url: 'https://test.com/bank-webhook'
      }
    }
  ];

  const results = [];

  for (const config of testConfigs) {
    logSubsection(`Probando: ${config.name}`);
    
    try {
      // Limpiar configuraciones de prueba anteriores
      for (const key of Object.keys(config.data)) {
        await supabase
          .from('system_config')
          .delete()
          .eq('config_key', key);
      }

      // Insertar configuración de prueba
      const insertPromises = Object.entries(config.data).map(([key, value]) =>
        supabase
          .from('system_config')
          .insert({
            config_key: key,
            config_value: value,
            updated_at: new Date().toISOString()
          })
      );

      const insertResults = await Promise.allSettled(insertPromises);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      insertResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.error) {
            errorCount++;
            errors.push(`${Object.keys(config.data)[index]}: ${result.value.error.message}`);
          } else {
            successCount++;
          }
        } else {
          errorCount++;
          errors.push(`${Object.keys(config.data)[index]}: ${result.reason.message}`);
        }
      });

      if (errorCount === 0) {
        log(`✅ ${config.name}: Todos los valores guardados correctamente`, 'green');
        results.push({ name: config.name, status: 'success', details: `${successCount} valores guardados` });
      } else {
        log(`❌ ${config.name}: ${errorCount} errores`, 'red');
        errors.forEach(error => log(`    - ${error}`, 'red'));
        results.push({ name: config.name, status: 'error', details: `${errorCount} errores`, errors });
      }

      // Verificar que los datos se guardaron correctamente
      const { data: savedData, error: readError } = await supabase
        .from('system_config')
        .select('config_key, config_value')
        .in('config_key', Object.keys(config.data));

      if (!readError && savedData) {
        const savedKeys = savedData.map(item => item.config_key);
        const expectedKeys = Object.keys(config.data);
        const missingKeys = expectedKeys.filter(key => !savedKeys.includes(key));
        
        if (missingKeys.length === 0) {
          log(`✅ Verificación: Todos los valores confirmados en la base de datos`, 'green');
        } else {
          log(`⚠️  Verificación: Faltan valores: ${missingKeys.join(', ')}`, 'yellow');
        }
      }

    } catch (error) {
      log(`❌ ${config.name}: Error general`, 'red');
      log(error.message, 'red');
      results.push({ name: config.name, status: 'error', details: error.message });
    }
  }

  return results;
}

async function testConfigReading() {
  logSection('PRUEBA DE LECTURA DE CONFIGURACIÓN');
  
  try {
    const { data: configData, error: readError } = await supabase
      .from('system_config')
      .select('*')
      .order('updated_at', { ascending: false });

    if (readError) {
      log('❌ Error leyendo configuración:', 'red');
      log(readError.message, 'red');
      return false;
    }

    if (!configData || configData.length === 0) {
      log('⚠️  No hay configuración guardada en la base de datos', 'yellow');
      return true;
    }

    log(`✅ Se encontraron ${configData.length} configuraciones`, 'green');
    
    // Agrupar por tipo de configuración
    const configGroups = {
      'General': ['oauth_enabled', 'user_validation_enabled', 'email_notifications_enabled', 'push_notifications_enabled', 'mercado_pago_enabled'],
      'Mercado Pago': ['mercado_pago_access_token', 'mercado_pago_public_key', 'mercado_pago_webhook_url', 'mercado_pago_active'],
      'Notificaciones': ['email_provider', 'email_api_key', 'push_provider', 'push_api_key', 'sms_provider', 'sms_account_sid'],
      'Analytics': ['analytics_provider', 'analytics_tracking_id', 'analytics_domain', 'analytics_active'],
      'Bancos': ['bank_integration_enabled', 'default_bank_code', 'bank_webhook_url']
    };

    Object.entries(configGroups).forEach(([groupName, keys]) => {
      const groupConfigs = configData.filter(config => keys.includes(config.config_key));
      if (groupConfigs.length > 0) {
        log(`\n📋 ${groupName}:`, 'blue');
        groupConfigs.forEach(config => {
          const value = config.config_value;
          const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
          log(`  - ${config.config_key}: ${displayValue}`, 'blue');
        });
      }
    });

    return true;
  } catch (error) {
    log('❌ Error general leyendo configuración:', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function testAIFunctionality() {
  logSection('PRUEBA ESPECÍFICA DE CONFIGURACIÓN DE IA');
  
  const aiConfigs = {
    chutes_api_key: 'TEST_CHUTES_KEY_123',
    chutes_api_url: 'https://api.chutes.ai/test',
    chutes_api_active: 'true',
    groq_api_key: 'TEST_GROQ_KEY_456',
    groq_api_url: 'https://api.groq.com/test',
    groq_api_active: 'false',
    ai_selected_provider: 'chutes',
    ai_selected_model: 'chutes-gpt-4'
  };

  try {
    logSubsection('Guardando configuración de IA');
    
    // Intentar guardar configuración de IA
    const insertPromises = Object.entries(aiConfigs).map(([key, value]) =>
      supabase
        .from('system_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString()
        })
    );

    const results = await Promise.allSettled(insertPromises);
    
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successCount++;
      } else {
        const key = Object.keys(aiConfigs)[index];
        log(`❌ Error guardando ${key}:`, 'red');
        if (result.status === 'rejected') {
          log(`    ${result.reason.message}`, 'red');
        } else if (result.value.error) {
          log(`    ${result.value.error.message}`, 'red');
        }
      }
    });

    if (successCount === Object.keys(aiConfigs).length) {
      log('✅ Configuración de IA guardada correctamente', 'green');
    } else {
      log(`⚠️  Solo ${successCount}/${Object.keys(aiConfigs).length} valores de IA guardados`, 'yellow');
    }

    // Verificar lectura
    logSubsection('Verificando lectura de configuración de IA');
    
    const { data: savedAIConfig, error: readError } = await supabase
      .from('system_config')
      .select('config_key, config_value')
      .in('config_key', Object.keys(aiConfigs));

    if (readError) {
      log('❌ Error leyendo configuración de IA:', 'red');
      log(readError.message, 'red');
      return false;
    }

    if (savedAIConfig && savedAIConfig.length > 0) {
      log('✅ Configuración de IA leída correctamente:', 'green');
      savedAIConfig.forEach(config => {
        log(`  - ${config.config_key}: ${config.config_value}`, 'green');
      });
    } else {
      log('❌ No se pudo leer la configuración de IA guardada', 'red');
      return false;
    }

    return true;
  } catch (error) {
    log('❌ Error general en prueba de IA:', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function checkPageImplementations() {
  logSection('ANÁLISIS DE IMPLEMENTACIONES DE PÁGINAS');
  
  const fs = require('fs');
  const path = require('path');
  
  const adminPagesPath = './src/pages/admin';
  const configPages = [
    'GeneralConfigPage.jsx',
    'MercadoPagoConfigPage.jsx',
    'NotificationsConfigPage.jsx',
    'BankConfigPage.jsx',
    'AnalyticsConfigPage.jsx',
    'AIConfigPage.jsx'
  ];

  const analysis = [];

  configPages.forEach(pageFile => {
    const filePath = path.join(adminPagesPath, pageFile);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasUpdateSystemConfig = content.includes('updateSystemConfig');
        const hasGetSystemConfig = content.includes('getSystemConfig');
        const hasHandleSave = content.includes('handleSave');
        const hasUseEffect = content.includes('useEffect');
        const hasLocalStorage = content.includes('localStorage');
        
        analysis.push({
          page: pageFile,
          exists: true,
          hasUpdateSystemConfig,
          hasGetSystemConfig,
          hasHandleSave,
          hasUseEffect,
          hasLocalStorage,
          implementation: 'complete'
        });
        
        log(`✅ ${pageFile}:`, 'green');
        log(`    - updateSystemConfig: ${hasUpdateSystemConfig ? '✅' : '❌'}`, hasUpdateSystemConfig ? 'green' : 'red');
        log(`    - getSystemConfig: ${hasGetSystemConfig ? '✅' : '❌'}`, hasGetSystemConfig ? 'green' : 'red');
        log(`    - handleSave: ${hasHandleSave ? '✅' : '❌'}`, hasHandleSave ? 'green' : 'red');
        log(`    - useEffect: ${hasUseEffect ? '✅' : '❌'}`, hasUseEffect ? 'green' : 'red');
        log(`    - localStorage: ${hasLocalStorage ? '✅' : '❌'}`, hasLocalStorage ? 'yellow' : 'blue');
      } else {
        analysis.push({
          page: pageFile,
          exists: false,
          implementation: 'missing'
        });
        log(`❌ ${pageFile}: Archivo no encontrado`, 'red');
      }
    } catch (error) {
      analysis.push({
        page: pageFile,
        exists: false,
        error: error.message,
        implementation: 'error'
      });
      log(`❌ ${pageFile}: Error analizando archivo`, 'red');
      log(`    ${error.message}`, 'red');
    }
  });

  return analysis;
}

async function generateReport(testResults, pageAnalysis) {
  logSection('REPORTE FINAL');
  
  log('\n📊 RESULTADOS DE PRUEBAS DE GUARDADO:', 'bright');
  testResults.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    const color = result.status === 'success' ? 'green' : 'red';
    log(`${status} ${result.name}: ${result.details}`, color);
    if (result.errors) {
      result.errors.forEach(error => log(`    - ${error}`, 'red'));
    }
  });

  log('\n📋 ANÁLISIS DE IMPLEMENTACIONES:', 'bright');
  pageAnalysis.forEach(page => {
    if (page.exists) {
      const status = page.hasUpdateSystemConfig && page.hasGetSystemConfig ? '✅' : '⚠️';
      const color = page.hasUpdateSystemConfig && page.hasGetSystemConfig ? 'green' : 'yellow';
      log(`${status} ${page.page}: Implementación ${page.hasUpdateSystemConfig && page.hasGetSystemConfig ? 'completa' : 'incompleta'}`, color);
    } else {
      log(`❌ ${page.page}: No existe`, 'red');
    }
  });

  // Resumen
  const successfulTests = testResults.filter(r => r.status === 'success').length;
  const totalTests = testResults.length;
  const completePages = pageAnalysis.filter(p => p.exists && p.hasUpdateSystemConfig && p.hasGetSystemConfig).length;
  const totalPages = pageAnalysis.filter(p => p.exists).length;

  log('\n🎯 RESUMEN EJECUTIVO:', 'bright');
  log(`✅ Pruebas de guardado: ${successfulTests}/${totalTests} exitosas`, successfulTests === totalTests ? 'green' : 'yellow');
  log(`✅ Páginas completas: ${completePages}/${totalPages} con implementación completa`, completePages === totalPages ? 'green' : 'yellow');

  if (successfulTests === totalTests && completePages === totalPages) {
    log('\n🎉 TODAS LAS PRUEBAS PASARON CORRECTAMENTE', 'green');
    log('   Las páginas de configuración del administrador funcionan correctamente', 'green');
    log('   y guardan datos en la base de datos de Supabase.', 'green');
  } else {
    log('\n⚠️  SE DETECTARON PROBLEMAS', 'yellow');
    log('   Algunas páginas de configuración pueden no estar funcionando correctamente.', 'yellow');
    log('   Revisa los detalles arriba para identificar los problemas específicos.', 'yellow');
  }

  return {
    testResults,
    pageAnalysis,
    summary: {
      successfulTests,
      totalTests,
      completePages,
      totalPages,
      overallStatus: (successfulTests === totalTests && completePages === totalPages) ? 'success' : 'warning'
    }
  };
}

async function main() {
  log('🚀 INICIANDO ANÁLISIS DE PÁGINAS DE CONFIGURACIÓN DEL ADMINISTRADOR', 'bright');
  log('   Verificando funcionalidad de guardado en base de datos Supabase', 'blue');

  try {
    // 1. Verificar tabla system_config
    const tableExists = await testSystemConfigTable();
    if (!tableExists) {
      log('\n❌ No se puede continuar sin la tabla system_config', 'red');
      return;
    }

    // 2. Probar guardado de configuración
    const testResults = await testConfigSaving();

    // 3. Probar lectura de configuración
    await testConfigReading();

    // 4. Probar funcionalidad específica de IA
    await testAIFunctionality();

    // 5. Analizar implementaciones de páginas
    const pageAnalysis = await checkPageImplementations();

    // 6. Generar reporte final
    const report = await generateReport(testResults, pageAnalysis);

    log('\n✅ Análisis completado', 'green');
    
  } catch (error) {
    log('\n❌ Error general durante el análisis:', 'red');
    log(error.message, 'red');
    log(error.stack, 'red');
  }
}

// Ejecutar el análisis
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testSystemConfigTable,
  testConfigSaving,
  testConfigReading,
  testAIFunctionality,
  checkPageImplementations,
  generateReport
};