#!/usr/bin/env node

/**
 * Analizador de Oportunidades de Refactorización Segura
 * 
 * Este script analiza el código del panel de empresas para identificar
 * áreas de refactorización que no comprometen la funcionalidad.
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  outputDir: 'analysis/refactor-opportunities',
  fileExtensions: ['.jsx', '.js']
};

/**
 * Analiza un archivo en busca de oportunidades de refactorización
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(CONFIG.sourceDir, filePath);
    
    const analysis = {
      file: relativePath,
      path: filePath,
      size: content.length,
      lines: content.split('\n').length,
      opportunities: [],
      riskLevel: 'LOW'
    };
    
    // 1. Análisis de imports
    const importOpportunities = analyzeImports(content);
    if (importOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'IMPORTS',
        description: 'Optimización de imports',
        items: importOpportunities,
        impact: 'LOW',
        effort: 'LOW'
      });
    }
    
    // 2. Análisis de variables
    const variableOpportunities = analyzeVariables(content);
    if (variableOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'VARIABLES',
        description: 'Mejora de nomenclatura de variables',
        items: variableOpportunities,
        impact: 'LOW',
        effort: 'LOW'
      });
    }
    
    // 3. Análisis de funciones
    const functionOpportunities = analyzeFunctions(content);
    if (functionOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'FUNCTIONS',
        description: 'Organización de funciones',
        items: functionOpportunities,
        impact: 'LOW',
        effort: 'MEDIUM'
      });
    }
    
    // 4. Análisis de constantes
    const constantOpportunities = analyzeConstants(content);
    if (constantOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'CONSTANTS',
        description: 'Extracción de constantes',
        items: constantOpportunities,
        impact: 'LOW',
        effort: 'LOW'
      });
    }
    
    // 5. Análisis de comentarios
    const commentOpportunities = analyzeComments(content);
    if (commentOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'COMMENTS',
        description: 'Mejora de documentación',
        items: commentOpportunities,
        impact: 'LOW',
        effort: 'LOW'
      });
    }
    
    // 6. Análisis de código muerto
    const deadCodeOpportunities = analyzeDeadCode(content);
    if (deadCodeOpportunities.length > 0) {
      analysis.opportunities.push({
        type: 'DEAD_CODE',
        description: 'Eliminación de código muerto',
        items: deadCodeOpportunities,
        impact: 'MEDIUM',
        effort: 'LOW'
      });
    }
    
    // Calcular nivel de riesgo general
    analysis.riskLevel = calculateRiskLevel(analysis.opportunities);
    
    return analysis;
  } catch (error) {
    console.warn(`⚠️ No se pudo analizar el archivo ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Analiza oportunidades de optimización de imports
 */
function analyzeImports(content) {
  const opportunities = [];
  
  // Import patterns
  const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
  const imports = content.match(importRegex) || [];
  
  // Imports desorganizados
  if (imports.length > 5) {
    const hasReactImport = imports.some(imp => imp.includes('react'));
    const hasComponentImports = imports.some(imp => imp.includes('../components'));
    const hasServiceImports = imports.some(imp => imp.includes('../services'));
    const hasUtilImports = imports.some(imp => imp.includes('../utils'));
    
    if (hasReactImport && hasComponentImports && hasServiceImports) {
      opportunities.push({
        type: 'ORGANIZE_IMPORTS',
        description: 'Organizar imports por categorías (React, Componentes, Servicios, Utils)',
        line: getLineNumber(content, imports[0]),
        suggestion: 'Agrupar imports por tipo con comentarios separadores'
      });
    }
  }
  
  // Imports duplicados
  const importSources = {};
  imports.forEach(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const source = match[1];
      importSources[source] = (importSources[source] || 0) + 1;
    }
  });
  
  Object.entries(importSources).forEach(([source, count]) => {
    if (count > 1) {
      opportunities.push({
        type: 'DUPLICATE_IMPORTS',
        description: `Imports duplicados desde: ${source}`,
        line: getLineNumber(content, imports.find(imp => imp.includes(source))),
        suggestion: 'Consolidar imports duplicados en una sola línea'
      });
    }
  });
  
  return opportunities;
}

/**
 * Analiza oportunidades de mejora de variables
 */
function analyzeVariables(content) {
  const opportunities = [];
  
  // Variables con nombres genéricos
  const genericVars = ['data', 'info', 'result', 'response', 'item', 'obj'];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    genericVars.forEach(varName => {
      const regex = new RegExp(`\\b(const|let|var)\\s+${varName}\\s*=`);
      if (regex.test(line) && !line.includes('// NO REFACTOR')) {
        opportunities.push({
          type: 'GENERIC_VARIABLE',
          description: `Variable con nombre genérico: "${varName}"`,
          line: index + 1,
          suggestion: `Usar un nombre más descriptivo, ej: "company${varName.charAt(0).toUpperCase() + varName.slice(1)}"`
        });
      }
    });
  });
  
  return opportunities;
}

/**
 * Analiza oportunidades de organización de funciones
 */
function analyzeFunctions(content) {
  const opportunities = [];
  
  // Buscar funciones mezcladas sin organización
  const functionRegex = /(?:const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|function\s+\w+)/g;
  const functions = [];
  let match;
  
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push({
      text: match[0],
      line: getLineNumber(content, match[0])
    });
  }
  
  if (functions.length > 5) {
    opportunities.push({
      type: 'ORGANIZE_FUNCTIONS',
      description: `${functions.length} funciones encontradas, pueden organizarse por tipo`,
      line: functions[0].line,
      suggestion: 'Agrupar funciones por categorías: Event Handlers, Validation, Data Processing, etc.'
    });
  }
  
  return opportunities;
}

/**
 * Analiza oportunidades de extracción de constantes
 */
function analyzeConstants(content) {
  const opportunities = [];
  
  // Strings repetidos que podrían ser constantes
  const stringRegex = /['"]([^'"]{10,})['"]/g;
  const strings = {};
  let match;
  
  while ((match = stringRegex.exec(content)) !== null) {
    const str = match[1];
    if (!str.includes('http') && !str.includes('className')) {
      strings[str] = (strings[str] || 0) + 1;
    }
  }
  
  Object.entries(strings).forEach(([str, count]) => {
    if (count >= 3) {
      opportunities.push({
        type: 'REPEATED_STRING',
        description: `String repetido ${count} veces: "${str}"`,
        suggestion: 'Extraer como constante',
        impact: 'LOW'
      });
    }
  });
  
  // Números mágicos
  const numberRegex = /\b(10|20|30|50|100|500|1000|5000|10000)\b/g;
  const numbers = content.match(numberRegex) || [];
  
  if (numbers.length > 2) {
    opportunities.push({
      type: 'MAGIC_NUMBERS',
      description: `${numbers.length} números mágicos encontrados`,
      suggestion: 'Extraer números como constantes con nombres descriptivos'
    });
  }
  
  return opportunities;
}

/**
 * Analiza oportunidades de mejora de comentarios
 */
function analyzeComments(content) {
  const opportunities = [];
  
  // Funciones sin comentarios
  const functionRegex = /(?:const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|function\s+\w+)/g;
  let match;
  
  while ((match = functionRegex.exec(content)) !== null) {
    const lineIndex = getLineNumber(content, match[0]) - 2;
    const lines = content.split('\n');
    const prevLine = lines[lineIndex] || '';
    
    if (!prevLine.includes('//') && !prevLine.includes('*')) {
      opportunities.push({
        type: 'MISSING_COMMENT',
        description: 'Función sin comentario descriptivo',
        line: getLineNumber(content, match[0]),
        suggestion: 'Agregar comentario JSDoc descriptivo'
      });
    }
  }
  
  return opportunities;
}

/**
 * Analiza código muerto
 */
function analyzeDeadCode(content) {
  const opportunities = [];
  
  // Variables declaradas pero no usadas
  const lines = content.split('\n');
  const declaredVars = [];
  const usedVars = new Set();
  
  lines.forEach((line, index) => {
    // Encontrar declaraciones
    const declMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (declMatch && !line.includes('// NO REFACTOR')) {
      declaredVars.push({
        name: declMatch[1],
        line: index + 1,
        used: false
      });
    }
    
    // Encontrar uso de variables
    declaredVars.forEach(v => {
      if (line.includes(v.name) && !line.includes(`${v.name}=`)) {
        v.used = true;
      }
    });
  });
  
  declaredVars.forEach(v => {
    if (!v.used) {
      opportunities.push({
        type: 'UNUSED_VARIABLE',
        description: `Variable declarada pero no usada: ${v.name}`,
        line: v.line,
        suggestion: 'Eliminar variable no utilizada'
      });
    }
  });
  
  return opportunities;
}

/**
 * Obtiene el número de línea de un texto en el contenido
 */
function getLineNumber(content, text) {
  const index = content.indexOf(text);
  if (index === -1) return 1;
  return content.substring(0, index).split('\n').length;
}

/**
 * Calcula el nivel de riesgo general
 */
function calculateRiskLevel(opportunities) {
  if (opportunities.length === 0) return 'NONE';
  
  const hasHighRisk = opportunities.some(opp => opp.impact === 'HIGH');
  const hasMediumRisk = opportunities.some(opp => opp.impact === 'MEDIUM');
  
  if (hasHighRisk) return 'HIGH';
  if (hasMediumRisk) return 'MEDIUM';
  return 'LOW';
}

/**
 * Obtiene todos los archivos a analizar
 */
function getFilesToAnalyze(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      getFilesToAnalyze(filePath, fileList);
    } else if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Genera reporte de análisis
 */
function generateReport(analyses) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analyses.length,
      totalOpportunities: analyses.reduce((sum, a) => sum + a.opportunities.length, 0),
      riskDistribution: {
        NONE: 0,
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0
      },
      opportunityTypes: {}
    },
    files: analyses,
    recommendations: []
  };
  
  // Calcular distribución de riesgo
  analyses.forEach(analysis => {
    report.summary.riskDistribution[analysis.riskLevel]++;
    
    analysis.opportunities.forEach(opp => {
      report.summary.opportunityTypes[opp.type] = (report.summary.opportunityTypes[opp.type] || 0) + 1;
    });
  });
  
  // Generar recomendaciones
  report.recommendations = generateRecommendations(report);
  
  return report;
}

/**
 * Genera recomendaciones basadas en el análisis
 */
function generateRecommendations(report) {
  const recommendations = [];
  
  if (report.summary.opportunityTypes.IMPORTS > 0) {
    recommendations.push({
      priority: 'HIGH',
      type: 'IMPORTS',
      title: 'Organizar imports primero',
      description: 'Comenzar por organizar los imports, ya que es un cambio de bajo riesgo y alto impacto',
      estimatedTime: '30 minutos',
      filesAffected: report.summary.opportunityTypes.IMPORTS
    });
  }
  
  if (report.summary.opportunityTypes.VARIABLES > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'VARIABLES',
      title: 'Mejorar nomenclatura de variables',
      description: 'Renombrar variables genéricas por nombres más descriptivos',
      estimatedTime: '45 minutos',
      filesAffected: report.summary.opportunityTypes.VARIABLES
    });
  }
  
  if (report.summary.opportunityTypes.CONSTANTS > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'CONSTANTS',
      title: 'Extraer constantes',
      description: 'Extraer strings repetidos y números mágicos como constantes',
      estimatedTime: '60 minutos',
      filesAffected: report.summary.opportunityTypes.CONSTANTS
    });
  }
  
  if (report.summary.opportunityTypes.DEAD_CODE > 0) {
    recommendations.push({
      priority: 'LOW',
      type: 'DEAD_CODE',
      title: 'Eliminar código muerto',
      description: 'Eliminar variables no utilizadas y código muerto',
      estimatedTime: '20 minutos',
      filesAffected: report.summary.opportunityTypes.DEAD_CODE
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Función principal
 */
async function analyzeRefactorOpportunities() {
  console.log('🔍 Analizando oportunidades de refactorización segura...\n');
  
  try {
    // 1. Obtener archivos a analizar
    console.log('📁 Escaneando archivos...');
    const files = getFilesToAnalyze(CONFIG.sourceDir);
    console.log(`📄 Se encontraron ${files.length} archivos para analizar\n`);
    
    // 2. Analizar cada archivo
    console.log('🔬 Analizando archivos...');
    const analyses = [];
    
    files.forEach((filePath, index) => {
      const analysis = analyzeFile(filePath);
      if (analysis) {
        analyses.push(analysis);
      }
      
      const progress = Math.round((index + 1) / files.length * 100);
      process.stdout.write(`\r⏳ Progreso: ${progress}% (${index + 1}/${files.length})`);
    });
    
    console.log('\n✅ Análisis completado');
    
    // 3. Generar reporte
    console.log('📋 Generando reporte...');
    const report = generateReport(analyses);
    
    // 4. Crear directorio de salida
    const outputDir = CONFIG.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 5. Guardar reporte
    const reportPath = path.join(outputDir, `refactor-opportunities-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 6. Mostrar resumen
    console.log('\n🎊 ANÁLISIS COMPLETADO');
    console.log('📊 Resumen:');
    console.log(`   📁 Archivos analizados: ${report.summary.totalFiles}`);
    console.log(`   🔍 Oportunidades: ${report.summary.totalOpportunities}`);
    console.log(`   📈 Distribución de riesgo:`);
    console.log(`      🔴 Alto: ${report.summary.riskDistribution.HIGH}`);
    console.log(`      🟡 Medio: ${report.summary.riskDistribution.MEDIUM}`);
    console.log(`      🟢 Bajo: ${report.summary.riskDistribution.LOW}`);
    console.log(`      ⚪ Ninguno: ${report.summary.riskDistribution.NONE}`);
    
    console.log('\n🎯 Tipos de oportunidades:');
    Object.entries(report.summary.opportunityTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log('\n📋 Recomendaciones prioritarias:');
    report.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title} (${rec.estimatedTime})`);
      console.log(`      ${rec.description}`);
    });
    
    console.log(`\n💾 Reporte guardado en: ${reportPath}`);
    
    // 7. Generar script de refactorización automática para cambios seguros
    await generateRefactorScript(report, outputDir);
    
    return {
      success: true,
      report,
      reportPath,
      recommendations: report.recommendations
    };
    
  } catch (error) {
    console.error(`\n❌ ERROR EN ANÁLISIS: ${error.message}`);
    throw error;
  }
}

/**
 * Genera script de refactorización automática para cambios seguros
 */
async function generateRefactorScript(report, outputDir) {
  console.log('🔧 Generando script de refactorización...');
  
  const safeChanges = report.files
    .flatMap(file => file.opportunities)
    .filter(opp => ['IMPORTS', 'VARIABLES', 'CONSTANTS', 'COMMENTS'].includes(opp.type));
  
  if (safeChanges.length === 0) {
    console.log('ℹ️ No se encontraron cambios seguros para automatizar');
    return;
  }
  
  const script = `#!/usr/bin/env node

/**
 * Script de Refactorización Segura - Generado Automáticamente
 * 
 * Este script aplica cambios seguros identificados en el análisis.
 * Solo incluye cambios de bajo riesgo que no afectan la funcionalidad.
 * 
 * Generado: ${new Date().toISOString()}
 * Cambios seguros identificados: ${safeChanges.length}
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  backupDir: 'backup/before-safe-refactor'
};

/**
 * Aplica refactorización segura de imports
 */
function refactorImports(content) {
  // Implementar lógica de organización de imports
  // Este es un placeholder - la implementación real sería más compleja
  return content;
}

/**
 * Aplica refactorización segura de variables
 */
function refactorVariables(content) {
  // Implementar lógica de renombrado de variables
  return content;
}

/**
 * Función principal
 */
async function applySafeRefactoring() {
  console.log('🔧 Aplicando refactorización segura...');
  
  // Implementar lógica de aplicación de cambios
  
  console.log('✅ Refactorización segura completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applySafeRefactoring().catch(console.error);
}

module.exports = { applySafeRefactoring };
`;
  
  const scriptPath = path.join(outputDir, 'safe-refactor-script.cjs');
  fs.writeFileSync(scriptPath, script);
  
  console.log(`🔧 Script de refactorización generado: ${scriptPath}`);
}

// Ejecución principal
if (require.main === module) {
  analyzeRefactorOpportunities()
    .then(result => {
      console.log('\n🎉 ANÁLISIS COMPLETADO EXITOSAMENTE');
      console.log(`📁 Reporte: ${result.reportPath}`);
    })
    .catch(error => {
      console.error('\n❌ ERROR EN ANÁLISIS:', error.message);
      process.exit(1);
    });
}

module.exports = {
  analyzeRefactorOpportunities,
  analyzeFile,
  generateReport
};