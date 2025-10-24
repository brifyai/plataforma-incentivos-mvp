#!/usr/bin/env node

/**
 * Script de Refactorización Segura v2 - Panel de Empresas
 * 
 * Este script aplica cambios MUY seguros identificados en el análisis.
 * Prioriza cambios de riesgo CERO que no afectan la funcionalidad.
 * 
 * Cambios a aplicar:
 * 1. SOLO organización de imports (RIESGO CERO)
 * 2. NO modifica variables, funciones o estructura
 * 
 * Generado: 2025-10-23T01:30:25.340Z
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  backupDir: 'backup/before-safe-refactor-v2'
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

// Función MUY segura para organizar SOLO imports
function organizeImportsSafely(content) {
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
  
  // Categorizar imports de forma muy conservadora
  const reactImports = [];
  const otherImports = [];
  
  filteredImports.forEach(imp => {
    const line = imp.trim();
    if (line.includes('from \'react\'') || line.includes('from "react"')) {
      reactImports.push(line);
    } else {
      otherImports.push(line);
    }
  });
  
  // Construir imports organizados de forma mínima
  const organizedImports = [];
  
  if (reactImports.length > 0) {
    organizedImports.push(...reactImports);
    organizedImports.push('');
  }
  
  if (otherImports.length > 0) {
    organizedImports.push(...otherImports);
  }
  
  // Eliminar última línea vacía si existe
  if (organizedImports[organizedImports.length - 1] === '') {
    organizedImports.pop();
  }
  
  // Combinar imports organizados con el resto del código
  const result = [...organizedImports, '', ...nonImports].join('\n');
  
  return result;
}

// Función principal de refactorización segura
async function applySafeRefactoring() {
  console.log('🔧 Iniciando refactorización segura v2 del panel de empresas...');
  
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
        
        // Aplicar SOLO organización de imports (cambio de riesgo cero)
        modifiedContent = organizeImportsSafely(modifiedContent);
        
        // Solo escribir si hubo cambios
        if (modifiedContent !== originalContent) {
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
          
          log.changes.push({
            file: filePath,
            changes: ['imports'],
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
    fs.writeFileSync('logs/refactoring-log-v2.json', JSON.stringify(log, null, 2));
    
    console.log('\n🎉 Refactorización segura v2 completada');
    console.log(`📊 Resumen:`);
    console.log(`   - Archivos procesados: ${jsxFiles.length}`);
    console.log(`   - Archivos modificados: ${log.changes.length}`);
    console.log(`   - Errores: ${log.errors.length}`);
    console.log(`   - Backup: ${backupPath}`);
    console.log(`   - Log: logs/refactoring-log-v2.json`);
    
    if (log.errors.length > 0) {
      console.log('\n⚠️  Se encontraron errores. Revisa el log para detalles.');
    }
    
  } catch (error) {
    console.error('❌ Error en la refactorización:', error);
    log.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync('logs/refactoring-log-v2.json', JSON.stringify(log, null, 2));
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applySafeRefactoring().catch(console.error);
}

module.exports = { applySafeRefactoring };