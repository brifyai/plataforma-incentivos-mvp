#!/usr/bin/env node

/**
 * Script de Refactorización Segura - Panel de Empresas
 * 
 * Este script aplica cambios seguros identificados en el análisis.
 * Prioriza cambios de bajo riesgo que no afectan la funcionalidad.
 * 
 * Orden de aplicación:
 * 1. Organización de imports (BAJO RIESGO)
 * 2. Mejora de nomenclatura de variables (BAJO RIESGO)
 * 3. Adición de comentarios documentación (BAJO RIESGO)
 * 4. Extracción de constantes (BAJO RIESGO)
 * 
 * Generado: 2025-10-23T01:25:17.693Z
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  backupDir: 'backup/before-safe-refactor',
  logFile: 'logs/refactoring-log.json'
};

// Asegurar que existen los directorios necesarios
function ensureDirectories() {
  const dirs = [CONFIG.backupDir, 'logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Crear backup antes de modificar
function createBackup() {
  console.log('📦 Creando backup de seguridad...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${CONFIG.backupDir}/company-panel-${timestamp}`;
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDirectory(CONFIG.sourceDir, backupPath);
  console.log(`✅ Backup creado en: ${backupPath}`);
  return backupPath;
}

// Función para organizar imports
function organizeImports(content) {
  const lines = content.split('\n');
  const imports = [];
  const nonImports = [];
  let inImports = true;
  
  // Separar imports del resto del código
  for (const line of lines) {
    if (inImports && (line.trim().startsWith('import ') || line.trim().startsWith('from ') || line.trim() === '')) {
      imports.push(line);
    } else {
      inImports = false;
      nonImports.push(line);
    }
  }
  
  // Filtrar imports vacíos y organizar
  const filteredImports = imports.filter(line => line.trim().startsWith('import ') || line.trim().startsWith('from '));
  
  if (filteredImports.length === 0) return content;
  
  // Categorizar imports
  const reactImports = [];
  const componentImports = [];
  const serviceImports = [];
  const utilImports = [];
  const otherImports = [];
  
  filteredImports.forEach(imp => {
    const line = imp.trim();
    if (line.includes('from \'react\'') || line.includes('from "react"')) {
      reactImports.push(line);
    } else if (line.includes('from \'../components/') || line.includes('from "../components/')) {
      componentImports.push(line);
    } else if (line.includes('from \'../../services/') || line.includes('from "../../services/')) {
      serviceImports.push(line);
    } else if (line.includes('from \'../../utils/') || line.includes('from "../../utils/')) {
      utilImports.push(line);
    } else {
      otherImports.push(line);
    }
  });
  
  // Construir imports organizados
  const organizedImports = [];
  
  if (reactImports.length > 0) {
    organizedImports.push(...reactImports);
    organizedImports.push('');
  }
  
  if (componentImports.length > 0) {
    organizedImports.push('// Componentes');
    organizedImports.push(...componentImports);
    organizedImports.push('');
  }
  
  if (serviceImports.length > 0) {
    organizedImports.push('// Servicios');
    organizedImports.push(...serviceImports);
    organizedImports.push('');
  }
  
  if (utilImports.length > 0) {
    organizedImports.push('// Utilidades');
    organizedImports.push(...utilImports);
    organizedImports.push('');
  }
  
  if (otherImports.length > 0) {
    organizedImports.push('// Otros');
    organizedImports.push(...otherImports);
    organizedImports.push('');
  }
  
  // Eliminar última línea vacía
  organizedImports.pop();
  
  // Combinar imports organizados con el resto del código
  const result = [...organizedImports, '', ...nonImports].join('\n');
  
  return result;
}

// Función para mejorar nomenclatura de variables
function improveVariableNaming(content) {
  // Reemplazar variables genéricas por nombres más descriptivos
  let modified = content;
  
  // Reemplazar 'result' por 'companyResult' en contextos apropiados
  modified = modified.replace(
    /const\s+result\s*=\s*await\s+(supabase|databaseService|companyService)/g,
    'const companyResult = await $1'
  );
  
  modified = modified.replace(
    /let\s+result\s*=\s*await\s+(supabase|databaseService|companyService)/g,
    'let companyResult = await $1'
  );
  
  // Reemplazar usos de 'result' por 'companyResult' cuando corresponde
  modified = modified.replace(
    /if\s*\(\s*result\.error\s*\)/g,
    'if (companyResult.error)'
  );
  
  modified = modified.replace(
    /return\s+result/g,
    'return companyResult'
  );
  
  // Reemplazar 'item' por 'companyItem' en contextos de empresa
  modified = modified.replace(
    /const\s+item\s*=/g,
    'const companyItem ='
  );
  
  modified = modified.replace(
    /item\./g,
    'companyItem.'
  );
  
  return modified;
}

// Función para añadir comentarios JSDoc
function addJSDocComments(content) {
  const lines = content.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    
    // Detectar funciones sin comentario
    if (line.trim().startsWith('const ') && line.includes(' = ') && line.includes('=>')) {
      // Es una función arrow, verificar si tiene comentario arriba
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (!prevLine.startsWith('/**') && !prevLine.startsWith('//')) {
        // Insertar comentario JSDoc básico
        const funcName = line.match(/const\s+(\w+)\s*=/);
        if (funcName) {
          result.splice(i, 0, `/**`);
          result.splice(i + 1, 0, ` * ${funcName[1]} - Función del componente`);
          result.splice(i + 2, 0, ` */`);
          i += 2; // Saltar las líneas insertadas
        }
      }
    }
    
    // Detectar funciones declaradas con function
    if (line.trim().startsWith('function ') && !line.includes('=>')) {
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (!prevLine.startsWith('/**') && !prevLine.startsWith('//')) {
        const funcName = line.match(/function\s+(\w+)/);
        if (funcName) {
          result.splice(i, 0, `/**`);
          result.splice(i + 1, 0, ` * ${funcName[1]} - Función del componente`);
          result.splice(i + 2, 0, ` */`);
          i += 2;
        }
      }
    }
  }
  
  return result.join('\n');
}

// Función para extraer constantes simples
function extractConstants(content) {
  let modified = content;
  
  // Extraer colores CSS comunes como constantes
  const commonColors = {
    'text-green-700': 'COLOR_SUCCESS_TEXT',
    'bg-green-500': 'COLOR_SUCCESS_BG',
    'bg-gray-300': 'COLOR_GRAY_BG',
    'text-gray-500': 'COLOR_GRAY_TEXT',
    'text-white': 'COLOR_WHITE',
    'flex items-center gap-2': 'LAYOUT_FLEX_CENTERED'
  };
  
  // Añadir constantes al inicio del archivo si no existen
  let hasConstants = false;
  const lines = modified.split('\n');
  
  for (const line of lines) {
    if (line.includes('const COLOR_') || line.includes('const LAYOUT_')) {
      hasConstants = true;
      break;
    }
  }
  
  if (!hasConstants) {
    const constants = [];
    for (const [value, name] of Object.entries(commonColors)) {
      if (modified.includes(value)) {
        constants.push(`const ${name} = '${value}';`);
      }
    }
    
    if (constants.length > 0) {
      // Insertar constantes después de los imports
      const importEndIndex = lines.findIndex((line, index) => {
        return index > 0 && !line.trim().startsWith('import') && !line.trim().startsWith('from') && line.trim() !== '';
      });
      
      if (importEndIndex > -1) {
        lines.splice(importEndIndex, 0, '');
        lines.splice(importEndIndex + 1, 0, '// Constantes de UI');
        lines.splice(importEndIndex + 2, 0, ...constants);
        lines.splice(importEndIndex + constants.length + 3, 0, '');
        
        modified = lines.join('\n');
      }
    }
  }
  
  return modified;
}

// Función principal de refactorización
async function applySafeRefactoring() {
  console.log('🔧 Iniciando refactorización segura del panel de empresas...');
  
  ensureDirectories();
  const backupPath = createBackup();
  
  const log = {
    timestamp: new Date().toISOString(),
    backupPath,
    changes: [],
    errors: []
  };
  
  try {
    // Obtener todos los archivos JSX
    function getAllJsxFiles(dir) {
      const files = [];
      
      function traverse(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
            files.push(fullPath);
          }
        }
      }
      
      traverse(dir);
      return files;
    }
    
    const jsxFiles = getAllJsxFiles(CONFIG.sourceDir);
    console.log(`📄 Se encontraron ${jsxFiles.length} archivos para refactorizar`);
    
    for (const filePath of jsxFiles) {
      try {
        console.log(`🔄 Procesando: ${filePath}`);
        
        const originalContent = fs.readFileSync(filePath, 'utf8');
        let modifiedContent = originalContent;
        
        // Aplicar refactorizaciones en orden de seguridad
        modifiedContent = organizeImports(modifiedContent);
        modifiedContent = improveVariableNaming(modifiedContent);
        modifiedContent = addJSDocComments(modifiedContent);
        modifiedContent = extractConstants(modifiedContent);
        
        // Solo escribir si hubo cambios
        if (modifiedContent !== originalContent) {
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
          
          log.changes.push({
            file: filePath,
            changes: ['imports', 'variables', 'comments', 'constants'],
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Actualizado: ${filePath}`);
        } else {
          console.log(`⏭️  Sin cambios necesarios: ${filePath}`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        log.errors.push({
          file: filePath,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Guardar log
    fs.writeFileSync(CONFIG.logFile, JSON.stringify(log, null, 2));
    
    console.log('\n🎉 Refactorización segura completada');
    console.log(`📊 Resumen:`);
    console.log(`   - Archivos procesados: ${jsxFiles.length}`);
    console.log(`   - Archivos modificados: ${log.changes.length}`);
    console.log(`   - Errores: ${log.errors.length}`);
    console.log(`   - Backup: ${backupPath}`);
    console.log(`   - Log: ${CONFIG.logFile}`);
    
    if (log.errors.length > 0) {
      console.log('\n⚠️  Se encontraron errores. Revisa el log para detalles.');
    }
    
  } catch (error) {
    console.error('❌ Error en la refactorización:', error);
    log.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(CONFIG.logFile, JSON.stringify(log, null, 2));
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applySafeRefactoring().catch(console.error);
}

module.exports = { applySafeRefactoring };