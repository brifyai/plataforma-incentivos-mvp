#!/usr/bin/env node

/**
 * Backup Automatizado del Panel de Empresas
 * 
 * Este script crea un backup completo y seguro del panel de empresas
 * antes de cualquier refactorización, con timestamp y validación.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  backupDir: 'backup/panel-empresas',
  maxBackups: 10 // Mantener solo los últimos 10 backups
};

/**
 * Formatea fecha y hora para timestamp
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
}

/**
 * Crea directorio si no existe
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

/**
 * Valida que el directorio fuente exista
 */
function validateSourceDirectory() {
  if (!fs.existsSync(CONFIG.sourceDir)) {
    throw new Error(`❌ Directorio fuente no encontrado: ${CONFIG.sourceDir}`);
  }
  
  const stats = fs.statSync(CONFIG.sourceDir);
  if (!stats.isDirectory()) {
    throw new Error(`❌ La ruta fuente no es un directorio: ${CONFIG.sourceDir}`);
  }
  
  console.log(`✅ Directorio fuente validado: ${CONFIG.sourceDir}`);
}

/**
 * Obtiene lista de archivos a respaldar
 */
function getFilesToBackup(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      getFilesToBackup(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Crea backup de un archivo
 */
function backupFile(sourcePath, targetPath) {
  const targetDir = path.dirname(targetPath);
  ensureDirectoryExists(targetDir);
  
  fs.copyFileSync(sourcePath, targetPath);
  
  const stats = fs.statSync(sourcePath);
  return {
    source: sourcePath,
    target: targetPath,
    size: stats.size,
    modified: stats.mtime
  };
}

/**
 * Genera manifiesto del backup
 */
function generateManifest(backupPath, files, timestamp) {
  const manifest = {
    timestamp,
    backupPath,
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    files: files.map(file => ({
      relativePath: path.relative(CONFIG.sourceDir, file.source),
      size: file.size,
      modified: file.modified
    })),
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      gitBranch: getCurrentGitBranch(),
      gitCommit: getCurrentGitCommit()
    }
  };
  
  const manifestPath = path.join(backupPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  return manifest;
}

/**
 * Obtiene rama actual de Git
 */
function getCurrentGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Obtiene commit actual de Git
 */
function getCurrentGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 8);
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Limpia backups antiguos
 */
function cleanupOldBackups() {
  try {
    const backupDirs = fs.readdirSync(CONFIG.backupDir)
      .filter(name => name.startsWith('backup-'))
      .map(name => ({
        name,
        path: path.join(CONFIG.backupDir, name),
        time: fs.statSync(path.join(CONFIG.backupDir, name)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Mantener solo los más recientes
    const toDelete = backupDirs.slice(CONFIG.maxBackups);
    
    toDelete.forEach(backup => {
      console.log(`🗑️ Eliminando backup antiguo: ${backup.name}`);
      execSync(`rm -rf "${backup.path}"`, { stdio: 'inherit' });
    });
    
    if (toDelete.length > 0) {
      console.log(`✅ ${toDelete.length} backups antiguos eliminados`);
    }
  } catch (error) {
    console.warn(`⚠️ No se pudieron limpiar backups antiguos: ${error.message}`);
  }
}

/**
 * Valida integridad del backup
 */
function validateBackup(backupPath, manifest) {
  console.log('🔍 Validando integridad del backup...');
  
  let validFiles = 0;
  let invalidFiles = [];
  
  manifest.files.forEach(fileInfo => {
    const backedUpFile = path.join(backupPath, fileInfo.relativePath);
    
    if (fs.existsSync(backedUpFile)) {
      const stats = fs.statSync(backedUpFile);
      if (stats.size === fileInfo.size) {
        validFiles++;
      } else {
        invalidFiles.push({
          file: fileInfo.relativePath,
          expected: fileInfo.size,
          actual: stats.size
        });
      }
    } else {
      invalidFiles.push({
        file: fileInfo.relativePath,
        error: 'File not found'
      });
    }
  });
  
  if (invalidFiles.length > 0) {
    console.error('❌ Backup inválido. Archivos con problemas:');
    invalidFiles.forEach(file => {
      console.error(`   - ${file.file}: ${file.error || `Size mismatch ${file.expected} vs ${file.actual}`}`);
    });
    return false;
  }
  
  console.log(`✅ Backup validado: ${validFiles}/${manifest.totalFiles} archivos intactos`);
  return true;
}

/**
 * Función principal de backup
 */
async function createBackup() {
  console.log('🚀 Iniciando backup del panel de empresas...\n');
  
  try {
    // 1. Validar directorio fuente
    validateSourceDirectory();
    
    // 2. Crear directorio de backup
    const timestamp = getTimestamp();
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(CONFIG.backupDir, backupName);
    
    ensureDirectoryExists(backupPath);
    console.log(`📁 Backup creado en: ${backupPath}`);
    
    // 3. Obtener archivos a respaldar
    console.log('📋 Analizando archivos a respaldar...');
    const filesToBackup = getFilesToBackup(CONFIG.sourceDir);
    console.log(`📄 Se encontraron ${filesToBackup.length} archivos para respaldar`);
    
    // 4. Realizar backup
    console.log('💾 Creando backup de archivos...');
    const backedUpFiles = [];
    
    filesToBackup.forEach((filePath, index) => {
      const relativePath = path.relative(CONFIG.sourceDir, filePath);
      const targetPath = path.join(backupPath, relativePath);
      
      const backupInfo = backupFile(filePath, targetPath);
      backedUpFiles.push(backupInfo);
      
      // Progreso
      const progress = Math.round((index + 1) / filesToBackup.length * 100);
      process.stdout.write(`\r⏳ Progreso: ${progress}% (${index + 1}/${filesToBackup.length})`);
    });
    
    console.log('\n✅ Todos los archivos respaldados exitosamente');
    
    // 5. Generar manifiesto
    console.log('📋 Generando manifiesto...');
    const manifest = generateManifest(backupPath, backedUpFiles, timestamp);
    
    // 6. Validar backup
    const isValid = validateBackup(backupPath, manifest);
    if (!isValid) {
      throw new Error('El backup no pasó la validación de integridad');
    }
    
    // 7. Limpiar backups antiguos
    console.log('🧹 Limpiando backups antiguos...');
    cleanupOldBackups();
    
    // 8. Resumen final
    console.log('\n🎉 BACKUP COMPLETADO EXITOSAMENTE');
    console.log('📊 Resumen:');
    console.log(`   📁 Directorio: ${backupPath}`);
    console.log(`   📄 Archivos: ${manifest.totalFiles}`);
    console.log(`   💾 Tamaño: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🕐 Timestamp: ${timestamp}`);
    console.log(`   🌿 Rama Git: ${manifest.metadata.gitBranch}`);
    console.log(`   🔗 Commit: ${manifest.metadata.gitCommit}`);
    
    // 9. Crear script de rollback
    const rollbackScript = `#!/bin/bash
# Rollback automático para backup ${timestamp}

echo "🔄 Iniciando rollback al backup ${timestamp}..."

if [ ! -d "${backupPath}" ]; then
    echo "❌ Directorio de backup no encontrado: ${backupPath}"
    exit 1
fi

echo "💾 Haciendo backup del estado actual..."
cp -r src/pages/company backup/pre-rollback-$(date +%Y%m%d-%H%M%S)

echo "🔄 Restaurando archivos desde backup..."
cp -r "${backupPath}/"* src/pages/company/

echo "✅ Rollback completado exitosamente"
echo "📁 Backup actual guardado en: backup/pre-rollback-$(date +%Y%m%d-%H%M%S)"
`;
    
    const rollbackScriptPath = path.join(backupPath, 'rollback.sh');
    fs.writeFileSync(rollbackScriptPath, rollbackScript);
    fs.chmodSync(rollbackScriptPath, '755');
    
    console.log(`🔄 Script de rollback creado: ${rollbackScriptPath}`);
    
    return {
      success: true,
      backupPath,
      manifest,
      rollbackScript: rollbackScriptPath
    };
    
  } catch (error) {
    console.error(`\n❌ ERROR EN BACKUP: ${error.message}`);
    console.error('🔍 Stack trace:', error.stack);
    
    // Limpiar backup fallido
    if (backupPath && fs.existsSync(backupPath)) {
      try {
        fs.rmSync(backupPath, { recursive: true, force: true });
        console.log('🧹 Backup fallido eliminado');
      } catch (cleanupError) {
        console.warn('⚠️ No se pudo limpiar el backup fallido:', cleanupError.message);
      }
    }
    
    throw error;
  }
}

/**
 * Función para restaurar desde backup
 */
async function restoreFromBackup(backupName) {
  const backupPath = path.join(CONFIG.backupDir, backupName);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`❌ Backup no encontrado: ${backupPath}`);
  }
  
  const manifestPath = path.join(backupPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`❌ Manifiesto no encontrado en el backup: ${manifestPath}`);
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log(`🔄 Restaurando desde backup: ${backupName}`);
  console.log(`📅 Timestamp: ${manifest.timestamp}`);
  console.log(`📄 Archivos: ${manifest.totalFiles}`);
  
  // Backup del estado actual
  const currentBackup = `pre-restore-${getTimestamp()}`;
  const currentBackupPath = path.join(CONFIG.backupDir, currentBackup);
  
  if (fs.existsSync(CONFIG.sourceDir)) {
    fs.cpSync(CONFIG.sourceDir, currentBackupPath, { recursive: true });
    console.log(`💾 Estado actual guardado en: ${currentBackupPath}`);
  }
  
  // Restaurar archivos
  manifest.files.forEach(fileInfo => {
    const sourceFile = path.join(backupPath, fileInfo.relativePath);
    const targetFile = path.join(CONFIG.sourceDir, fileInfo.relativePath);
    const targetDir = path.dirname(targetFile);
    
    ensureDirectoryExists(targetDir);
    fs.copyFileSync(sourceFile, targetFile);
  });
  
  console.log('✅ Restauración completada exitosamente');
  
  return {
    success: true,
    restoredFiles: manifest.totalFiles,
    currentBackup: currentBackupPath
  };
}

// Ejecución principal
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'restore' && process.argv[3]) {
    // Modo restauración
    restoreFromBackup(process.argv[3])
      .then(result => {
        console.log('\n🎉 RESTAURACIÓN COMPLETADA');
        console.log(`📄 Archivos restaurados: ${result.restoredFiles}`);
        console.log(`💾 Backup actual guardado en: ${result.currentBackup}`);
      })
      .catch(error => {
        console.error('\n❌ ERROR EN RESTAURACIÓN:', error.message);
        process.exit(1);
      });
  } else {
    // Modo backup (default)
    createBackup()
      .then(result => {
        console.log('\n🎉 BACKUP COMPLETADO');
        console.log(`📁 Ubicación: ${result.backupPath}`);
        console.log(`🔄 Rollback: ${result.rollbackScript}`);
      })
      .catch(error => {
        console.error('\n❌ ERROR EN BACKUP:', error.message);
        process.exit(1);
      });
  }
}

module.exports = {
  createBackup,
  restoreFromBackup,
  validateBackup,
  cleanupOldBackups
};