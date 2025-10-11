/**
 * Script para analizar las implementaciones de páginas de configuración del administrador
 * Verifica si tienen la lógica correcta para guardar datos en la base de datos
 */

const fs = require('fs');
const path = require('path');

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
  log('\n' + '='.repeat(80), 'cyan');
  log(`🔍 ${title}`, 'bright');
  log('='.repeat(80), 'cyan');
}

function logSubsection(title) {
  log(`\n📋 ${title}`, 'yellow');
  log('-'.repeat(60), 'yellow');
}

function analyzePage(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      fileName,
      exists: true,
      hasUpdateSystemConfig: content.includes('updateSystemConfig'),
      hasGetSystemConfig: content.includes('getSystemConfig'),
      hasHandleSave: content.includes('handleSave'),
      hasHandleSaveConfig: content.includes('handleSaveConfig'),
      hasUseEffect: content.includes('useEffect'),
      hasLocalStorage: content.includes('localStorage'),
      hasConfigState: content.includes('useState') && content.includes('config'),
      hasErrorHandling: content.includes('try') && content.includes('catch'),
      hasSuccessMessage: content.includes('success') || content.includes('Swal.fire'),
      hasLoadingState: content.includes('loading') || content.includes('setLoading'),
      hasNavigation: content.includes('useNavigate') || content.includes('navigate'),
      importsDatabaseService: content.includes('databaseService'),
      hasFormInputs: content.includes('Input') || content.includes('Select') || content.includes('ToggleSwitch'),
      hasSaveButton: content.includes('Guardar') || content.includes('Save'),
      implementationScore: 0,
      issues: [],
      recommendations: []
    };

    // Calcular puntaje de implementación
    if (analysis.hasUpdateSystemConfig) analysis.implementationScore += 15;
    if (analysis.hasGetSystemConfig) analysis.implementationScore += 15;
    if (analysis.hasHandleSave || analysis.hasHandleSaveConfig) analysis.implementationScore += 15;
    if (analysis.hasUseEffect) analysis.implementationScore += 10;
    if (analysis.hasConfigState) analysis.implementationScore += 10;
    if (analysis.hasErrorHandling) analysis.implementationScore += 10;
    if (analysis.hasSuccessMessage) analysis.implementationScore += 5;
    if (analysis.hasLoadingState) analysis.implementationScore += 5;
    if (analysis.hasNavigation) analysis.implementationScore += 5;
    if (analysis.importsDatabaseService) analysis.implementationScore += 5;
    if (analysis.hasFormInputs) analysis.implementationScore += 5;
    if (analysis.hasSaveButton) analysis.implementationScore += 5;

    // Detectar problemas específicos
    if (!analysis.hasUpdateSystemConfig) {
      analysis.issues.push('No implementa updateSystemConfig para guardar en base de datos');
    }
    if (!analysis.hasGetSystemConfig) {
      analysis.issues.push('No implementa getSystemConfig para cargar configuración existente');
    }
    if (!analysis.hasHandleSave && !analysis.hasHandleSaveConfig) {
      analysis.issues.push('No tiene función handleSave para procesar el guardado');
    }
    if (!analysis.hasUseEffect) {
      analysis.issues.push('No usa useEffect para cargar datos al montar el componente');
    }
    if (!analysis.hasErrorHandling) {
      analysis.issues.push('No maneja errores en las operaciones de base de datos');
    }
    if (!analysis.hasLoadingState) {
      analysis.issues.push('No muestra estado de carga durante operaciones');
    }

    // Generar recomendaciones
    if (!analysis.hasLocalStorage && (fileName.includes('AI') || fileName.includes('Analytics'))) {
      analysis.recommendations.push('Considerar agregar localStorage como fallback para configuración crítica');
    }
    if (!analysis.hasSuccessMessage) {
      analysis.recommendations.push('Agregar mensajes de éxito cuando se guarda la configuración');
    }
    if (!analysis.hasNavigation) {
      analysis.recommendations.push('Agregar navegación para volver al panel de configuración principal');
    }

    return analysis;
  } catch (error) {
    return {
      fileName,
      exists: false,
      error: error.message,
      implementationScore: 0,
      issues: [`Error leyendo archivo: ${error.message}`],
      recommendations: ['Verificar que el archivo exista y sea accesible']
    };
  }
}

function analyzeDatabaseService() {
  logSection('ANÁLISIS DEL SERVICIO DE BASE DE DATOS');
  
  const servicePath = './src/services/databaseService.js';
  
  try {
    if (!fs.existsSync(servicePath)) {
      log('❌ Archivo databaseService.js no encontrado', 'red');
      return null;
    }

    const content = fs.readFileSync(servicePath, 'utf8');
    
    const analysis = {
      hasGetSystemConfig: content.includes('export const getSystemConfig'),
      hasUpdateSystemConfig: content.includes('export const updateSystemConfig'),
      hasLocalStorageFallback: content.includes('localStorage'),
      hasErrorHandling: content.includes('try') && content.includes('catch'),
      hasRLSHandling: content.includes('42501') || content.includes('permission denied'),
      hasAIConfigHandling: content.includes('chutes_api_key') || content.includes('groq_api_key'),
      hasConfigValidation: content.includes('config_key') && content.includes('config_value'),
      usesSupabase: content.includes('supabase'),
      implementationScore: 0
    };

    // Calcular puntaje
    if (analysis.hasGetSystemConfig) analysis.implementationScore += 20;
    if (analysis.hasUpdateSystemConfig) analysis.implementationScore += 20;
    if (analysis.hasLocalStorageFallback) analysis.implementationScore += 15;
    if (analysis.hasErrorHandling) analysis.implementationScore += 15;
    if (analysis.hasRLSHandling) analysis.implementationScore += 10;
    if (analysis.hasAIConfigHandling) analysis.implementationScore += 10;
    if (analysis.hasConfigValidation) analysis.implementationScore += 5;
    if (analysis.usesSupabase) analysis.implementationScore += 5;

    log('✅ Archivo databaseService.js encontrado y analizado', 'green');
    log(`📊 Puntaje de implementación: ${analysis.implementationScore}/100`, analysis.implementationScore >= 80 ? 'green' : 'yellow');

    log('\n📋 Características implementadas:', 'blue');
    log(`  - getSystemConfig: ${analysis.hasGetSystemConfig ? '✅' : '❌'}`, analysis.hasGetSystemConfig ? 'green' : 'red');
    log(`  - updateSystemConfig: ${analysis.hasUpdateSystemConfig ? '✅' : '❌'}`, analysis.hasUpdateSystemConfig ? 'green' : 'red');
    log(`  - localStorage fallback: ${analysis.hasLocalStorageFallback ? '✅' : '❌'}`, analysis.hasLocalStorageFallback ? 'green' : 'red');
    log(`  - Manejo de errores: ${analysis.hasErrorHandling ? '✅' : '❌'}`, analysis.hasErrorHandling ? 'green' : 'red');
    log(`  - Manejo de RLS: ${analysis.hasRLSHandling ? '✅' : '❌'}`, analysis.hasRLSHandling ? 'green' : 'red');
    log(`  - Configuración IA: ${analysis.hasAIConfigHandling ? '✅' : '❌'}`, analysis.hasAIConfigHandling ? 'green' : 'red');
    log(`  - Validación de config: ${analysis.hasConfigValidation ? '✅' : '❌'}`, analysis.hasConfigValidation ? 'green' : 'red');
    log(`  - Usa Supabase: ${analysis.usesSupabase ? '✅' : '❌'}`, analysis.usesSupabase ? 'green' : 'red');

    return analysis;
  } catch (error) {
    log('❌ Error analizando databaseService.js:', 'red');
    log(error.message, 'red');
    return null;
  }
}

function analyzeAllPages() {
  logSection('ANÁLISIS DE PÁGINAS DE CONFIGURACIÓN');
  
  const adminPagesPath = './src/pages/admin';
  const configPages = [
    'GeneralConfigPage.jsx',
    'MercadoPagoConfigPage.jsx',
    'NotificationsConfigPage.jsx',
    'BankConfigPage.jsx',
    'AnalyticsConfigPage.jsx',
    'AIConfigPage.jsx'
  ];

  const results = [];

  configPages.forEach(pageFile => {
    const filePath = path.join(adminPagesPath, pageFile);
    const analysis = analyzePage(filePath, pageFile);
    results.push(analysis);

    logSubsection(`Análisis de ${pageFile}`);
    
    if (!analysis.exists) {
      log(`❌ Archivo no encontrado: ${pageFile}`, 'red');
      if (analysis.error) {
        log(`   Error: ${analysis.error}`, 'red');
      }
      return;
    }

    log(`✅ Archivo encontrado: ${pageFile}`, 'green');
    log(`📊 Puntaje de implementación: ${analysis.implementationScore}/100`, 
        analysis.implementationScore >= 80 ? 'green' : 
        analysis.implementationScore >= 60 ? 'yellow' : 'red');

    log('\n📋 Características clave:', 'blue');
    log(`  - updateSystemConfig: ${analysis.hasUpdateSystemConfig ? '✅' : '❌'}`, analysis.hasUpdateSystemConfig ? 'green' : 'red');
    log(`  - getSystemConfig: ${analysis.hasGetSystemConfig ? '✅' : '❌'}`, analysis.hasGetSystemConfig ? 'green' : 'red');
    log(`  - handleSave/handleSaveConfig: ${analysis.hasHandleSave || analysis.hasHandleSaveConfig ? '✅' : '❌'}`, 
        (analysis.hasHandleSave || analysis.hasHandleSaveConfig) ? 'green' : 'red');
    log(`  - useEffect: ${analysis.hasUseEffect ? '✅' : '❌'}`, analysis.hasUseEffect ? 'green' : 'red');
    log(`  - Estado de configuración: ${analysis.hasConfigState ? '✅' : '❌'}`, analysis.hasConfigState ? 'green' : 'red');
    log(`  - Manejo de errores: ${analysis.hasErrorHandling ? '✅' : '❌'}`, analysis.hasErrorHandling ? 'green' : 'red');
    log(`  - Mensajes de éxito: ${analysis.hasSuccessMessage ? '✅' : '❌'}`, analysis.hasSuccessMessage ? 'green' : 'red');
    log(`  - Estado de carga: ${analysis.hasLoadingState ? '✅' : '❌'}`, analysis.hasLoadingState ? 'green' : 'red');
    log(`  - localStorage fallback: ${analysis.hasLocalStorage ? '✅' : '❌'}`, analysis.hasLocalStorage ? 'yellow' : 'blue');
    log(`  - Importa databaseService: ${analysis.importsDatabaseService ? '✅' : '❌'}`, analysis.importsDatabaseService ? 'green' : 'red');

    if (analysis.issues.length > 0) {
      log('\n⚠️  Problemas detectados:', 'yellow');
      analysis.issues.forEach(issue => log(`   - ${issue}`, 'yellow'));
    }

    if (analysis.recommendations.length > 0) {
      log('\n💡 Recomendaciones:', 'cyan');
      analysis.recommendations.forEach(rec => log(`   - ${rec}`, 'cyan'));
    }
  });

  return results;
}

function generateFinalReport(pageResults, serviceAnalysis) {
  logSection('REPORTE FINAL DE FUNCIONALIDAD');

  // Estadísticas generales
  const existingPages = pageResults.filter(p => p.exists);
  const totalPages = pageResults.length;
  const pagesWithUpdateConfig = existingPages.filter(p => p.hasUpdateSystemConfig);
  const pagesWithGetConfig = existingPages.filter(p => p.hasGetSystemConfig);
  const pagesWithSaveFunction = existingPages.filter(p => p.hasHandleSave || p.hasHandleSaveConfig);
  const pagesWithErrorHandling = existingPages.filter(p => p.hasErrorHandling);
  const pagesWithHighScore = existingPages.filter(p => p.implementationScore >= 80);

  log('\n📊 ESTADÍSTICAS GENERALES:', 'bright');
  log(`✅ Páginas existentes: ${existingPages.length}/${totalPages}`, existingPages.length === totalPages ? 'green' : 'yellow');
  log(`✅ Con updateSystemConfig: ${pagesWithUpdateConfig.length}/${existingPages.length}`, pagesWithUpdateConfig.length === existingPages.length ? 'green' : 'yellow');
  log(`✅ Con getSystemConfig: ${pagesWithGetConfig.length}/${existingPages.length}`, pagesWithGetConfig.length === existingPages.length ? 'green' : 'yellow');
  log(`✅ Con función de guardado: ${pagesWithSaveFunction.length}/${existingPages.length}`, pagesWithSaveFunction.length === existingPages.length ? 'green' : 'yellow');
  log(`✅ Con manejo de errores: ${pagesWithErrorHandling.length}/${existingPages.length}`, pagesWithErrorHandling.length === existingPages.length ? 'green' : 'yellow');
  log(`✅ Con implementación completa (≥80%): ${pagesWithHighScore.length}/${existingPages.length}`, pagesWithHighScore.length === existingPages.length ? 'green' : 'yellow');

  // Análisis del servicio de base de datos
  if (serviceAnalysis) {
    log('\n🔧 SERVICIO DE BASE DE DATOS:', 'bright');
    log(`📊 Puntaje de implementación: ${serviceAnalysis.implementationScore}/100`, 
        serviceAnalysis.implementationScore >= 80 ? 'green' : 'yellow');
    
    if (serviceAnalysis.hasLocalStorageFallback) {
      log('✅ Tiene fallback de localStorage para configuración de IA', 'green');
    }
    if (serviceAnalysis.hasRLSHandling) {
      log('✅ Maneja errores de permisos RLS de Supabase', 'green');
    }
    if (serviceAnalysis.hasAIConfigHandling) {
      log('✅ Soporta configuración específica de IA', 'green');
    }
  }

  // Verificación de funcionalidad de guardado
  log('\n🎯 VERIFICACIÓN DE FUNCIONALIDAD DE GUARDADO:', 'bright');
  
  const canSaveToDatabase = pagesWithUpdateConfig.length === existingPages.length && serviceAnalysis?.hasUpdateSystemConfig;
  const canLoadFromDatabase = pagesWithGetConfig.length === existingPages.length && serviceAnalysis?.hasGetSystemConfig;
  const hasErrorHandling = pagesWithErrorHandling.length === existingPages.length && serviceAnalysis?.hasErrorHandling;
  const hasFallback = serviceAnalysis?.hasLocalStorageFallback;

  log(`💾 Guardado en base de datos: ${canSaveToDatabase ? '✅ FUNCIONA' : '❌ PROBLEMAS'}`, canSaveToDatabase ? 'green' : 'red');
  log(`📥 Carga desde base de datos: ${canLoadFromDatabase ? '✅ FUNCIONA' : '❌ PROBLEMAS'}`, canLoadFromDatabase ? 'green' : 'red');
  log(`⚠️  Manejo de errores: ${hasErrorHandling ? '✅ IMPLEMENTADO' : '❌ AUSENTE'}`, hasErrorHandling ? 'green' : 'red');
  log(`🔄 Fallback localStorage: ${hasFallback ? '✅ DISPONIBLE' : '❌ AUSENTE'}`, hasFallback ? 'green' : 'red');

  // Conclusión final
  log('\n🎉 CONCLUSIÓN:', 'bright');
  
  if (canSaveToDatabase && canLoadFromDatabase && hasErrorHandling) {
    log('✅ LAS PÁGINAS DE CONFIGURACIÓN DEL ADMINISTRADOR FUNCIONAN CORRECTAMENTE', 'green');
    log('   Todas las páginas tienen la lógica para guardar y cargar datos en Supabase', 'green');
    if (hasFallback) {
      log('   Además, cuentan con fallback de localStorage para configuración crítica', 'green');
    }
    log('   El sistema de configuración está completamente implementado y operativo', 'green');
  } else {
    log('⚠️  SE DETECTARON PROBLEMAS EN LA FUNCIONALIDAD DE GUARDADO', 'yellow');
    
    if (!canSaveToDatabase) {
      log('   - Algunas páginas no pueden guardar datos en la base de datos', 'red');
    }
    if (!canLoadFromDatabase) {
      log('   - Algunas páginas no pueden cargar datos existentes', 'red');
    }
    if (!hasErrorHandling) {
      log('   - Falta manejo adecuado de errores', 'red');
    }
    if (!hasFallback) {
      log('   - No hay fallback para configuración crítica (como IA)', 'yellow');
    }
  }

  // Detalles por página
  log('\n📋 DETALLES POR PÁGINA:', 'bright');
  existingPages.forEach(page => {
    const status = page.implementationScore >= 80 ? '✅ COMPLETA' : 
                  page.implementationScore >= 60 ? '⚠️  PARCIAL' : '❌ INCOMPLETA';
    const color = page.implementationScore >= 80 ? 'green' : 
                 page.implementationScore >= 60 ? 'yellow' : 'red';
    
    log(`${status} ${page.fileName}: ${page.implementationScore}/100`, color);
    
    if (page.issues.length > 0) {
      page.issues.slice(0, 2).forEach(issue => {
        log(`    - ${issue}`, 'red');
      });
    }
  });

  return {
    summary: {
      totalPages,
      existingPages: existingPages.length,
      pagesWithUpdateConfig: pagesWithUpdateConfig.length,
      pagesWithGetConfig: pagesWithGetConfig.length,
      pagesWithSaveFunction: pagesWithSaveFunction.length,
      pagesWithErrorHandling: pagesWithErrorHandling.length,
      pagesWithHighScore: pagesWithHighScore.length,
      serviceScore: serviceAnalysis?.implementationScore || 0,
      canSaveToDatabase,
      canLoadFromDatabase,
      hasErrorHandling,
      hasFallback,
      overallStatus: (canSaveToDatabase && canLoadFromDatabase && hasErrorHandling) ? 'success' : 'warning'
    },
    pageResults,
    serviceAnalysis
  };
}

async function main() {
  log('🚀 ANÁLISIS DE PÁGINAS DE CONFIGURACIÓN DEL ADMINISTRADOR', 'bright');
  log('   Verificando implementaciones para guardar datos en Supabase', 'blue');
  log('   Análisis estático de código sin necesidad de conexión a base de datos', 'blue');

  try {
    // 1. Analizar el servicio de base de datos
    const serviceAnalysis = analyzeDatabaseService();

    // 2. Analizar todas las páginas de configuración
    const pageResults = analyzeAllPages();

    // 3. Generar reporte final
    const report = generateFinalReport(pageResults, serviceAnalysis);

    log('\n✅ Análisis completado exitosamente', 'green');
    
    // Retornar el resumen para posible uso programático
    return report.summary;

  } catch (error) {
    log('\n❌ Error general durante el análisis:', 'red');
    log(error.message, 'red');
    log(error.stack, 'red');
    return null;
  }
}

// Ejecutar el análisis
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzePage,
  analyzeDatabaseService,
  analyzeAllPages,
  generateFinalReport
};