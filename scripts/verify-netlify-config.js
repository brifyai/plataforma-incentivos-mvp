#!/usr/bin/env node

/**
 * Verificación de Configuración de Netlify - NexuPay
 * 
 * Este script verifica que toda la configuración necesaria
 * para el despliegue en Netlify esté correcta.
 * 
 * Uso: npm run verify-config
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Funciones de utilidad
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`)
};

// Verificaciones principales
const checks = {
  // 1. Verificar archivos de configuración
  configFiles: [
    { file: 'netlify.toml', required: true, description: 'Configuración principal de Netlify' },
    { file: '.env.production', required: true, description: 'Variables de entorno de producción' },
    { file: 'package.json', required: true, description: 'Dependencias y scripts del proyecto' },
    { file: 'vite.config.js', required: true, description: 'Configuración de Vite' },
    { file: 'tailwind.config.js', required: true, description: 'Configuración de Tailwind' }
  ],

  // 2. Verificar scripts en package.json
  requiredScripts: [
    'build',
    'preview',
    'dev',
    'lint',
    'test'
  ],

  // 3. Verificar dependencias críticas
  requiredDependencies: [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    'axios',
    'lucide-react'
  ],

  // 4. Verificar dependencias de desarrollo
  requiredDevDependencies: [
    'vite',
    '@vitejs/plugin-react',
    'tailwindcss',
    'autoprefixer',
    'postcss',
    'eslint',
    'prettier'
  ],

  // 5. Variables de entorno requeridas
  requiredEnvVars: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_APP_URL',
    'VITE_API_URL',
    'VITE_NETLIFY_FUNCTIONS_URL'
  ],

  // 6. Verificar estructura de directorios
  requiredDirectories: [
    'src',
    'src/components',
    'src/pages',
    'src/services',
    'src/utils',
    'public',
    'netlify/functions'
  ]
};

// Función para verificar existencia de archivos
function checkConfigFiles() {
  log.header('📁 Verificando Archivos de Configuración');
  
  let allExist = true;
  
  checks.configFiles.forEach(({ file, required, description }) => {
    if (fs.existsSync(file)) {
      log.success(`${file} - ${description}`);
      
      // Verificar contenido específico para archivos críticos
      if (file === 'netlify.toml') {
        verifyNetlifyToml(file);
      } else if (file === 'package.json') {
        verifyPackageJson(file);
      } else if (file === '.env.production') {
        verifyEnvProduction(file);
      }
    } else {
      if (required) {
        log.error(`${file} - ${description} (REQUERIDO)`);
        allExist = false;
      } else {
        log.warning(`${file} - ${description} (opcional)`);
      }
    }
  });
  
  return allExist;
}

// Verificar contenido de netlify.toml
function verifyNetlifyToml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar secciones requeridas
    const requiredSections = ['build', 'functions', 'redirects', 'headers'];
    requiredSections.forEach(section => {
      if (content.includes(`[${section}]`) || content.includes(`[[${section}]]`)) {
        log.success(`  ✓ Sección [${section}] encontrada`);
      } else {
        log.warning(`  ⚠ Sección [${section}] no encontrada`);
      }
    });
    
    // Verificar configuración específica
    if (content.includes('publish = "dist"')) {
      log.success('  ✓ Directorio de publicación configurado');
    }
    
    if (content.includes('functions = "netlify/functions"')) {
      log.success('  ✓ Directorio de funciones configurado');
    }
    
  } catch (error) {
    log.error(`Error leyendo ${filePath}: ${error.message}`);
  }
}

// Verificar contenido de package.json
function verifyPackageJson(filePath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Verificar scripts requeridos
    log.info('Verificando scripts en package.json:');
    checks.requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log.success(`  ✓ ${script}: ${packageJson.scripts[script]}`);
      } else {
        log.warning(`  ⚠ Script "${script}" no encontrado`);
      }
    });
    
    // Verificar dependencias
    log.info('Verificando dependencias principales:');
    checks.requiredDependencies.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log.success(`  ✓ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        log.warning(`  ⚠ Dependencia "${dep}" no encontrada`);
      }
    });
    
    // Verificar dependencias de desarrollo
    log.info('Verificando dependencias de desarrollo:');
    checks.requiredDevDependencies.forEach(dep => {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        log.success(`  ✓ ${dep}: ${packageJson.devDependencies[dep]}`);
      } else {
        log.warning(`  ⚠ Dependencia de desarrollo "${dep}" no encontrada`);
      }
    });
    
  } catch (error) {
    log.error(`Error parseando package.json: ${error.message}`);
  }
}

// Verificar contenido de .env.production
function verifyEnvProduction(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    log.info('Verificando variables de entorno en .env.production:');
    checks.requiredEnvVars.forEach(envVar => {
      const found = lines.some(line => line.startsWith(`${envVar}=`));
      if (found) {
        log.success(`  ✓ ${envVar}`);
      } else {
        log.warning(`  ⚠ Variable ${envVar} no encontrada`);
      }
    });
    
    // Verificar que no haya valores placeholder
    const placeholders = ['your-', 'here', 'example', 'test-', 'placeholder'];
    lines.forEach(line => {
      placeholders.forEach(placeholder => {
        if (line.toLowerCase().includes(placeholder)) {
          log.warning(`  ⚠ Posible placeholder en: ${line.split('=')[0]}`);
        }
      });
    });
    
  } catch (error) {
    log.error(`Error leyendo .env.production: ${error.message}`);
  }
}

// Verificar estructura de directorios
function checkDirectoryStructure() {
  log.header('📂 Verificando Estructura de Directorios');
  
  let allExist = true;
  
  checks.requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const stats = fs.statSync(dir);
      if (stats.isDirectory()) {
        log.success(`${dir}/`);
      } else {
        log.error(`${dir} existe pero no es un directorio`);
        allExist = false;
      }
    } else {
      log.error(`${dir}/ - Directorio requerido no encontrado`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Verificar funciones de Netlify
function checkNetlifyFunctions() {
  log.header('⚡ Verificando Funciones de Netlify');
  
  const functionsDir = 'netlify/functions';
  if (!fs.existsSync(functionsDir)) {
    log.error('Directorio netlify/functions no encontrado');
    return false;
  }
  
  try {
    const functions = fs.readdirSync(functionsDir);
    if (functions.length === 0) {
      log.warning('No hay funciones en el directorio netlify/functions');
      return true;
    }
    
    functions.forEach(func => {
      const funcPath = path.join(functionsDir, func);
      if (fs.statSync(funcPath).isDirectory()) {
        const indexFile = path.join(funcPath, 'index.js');
        if (fs.existsSync(indexFile)) {
          log.success(`Función: ${func}/`);
        } else {
          log.warning(`Función ${func}/ no tiene index.js`);
        }
      } else {
        log.success(`Función: ${func}`);
      }
    });
    
  } catch (error) {
    log.error(`Error leyendo funciones: ${error.message}`);
    return false;
  }
  
  return true;
}

// Verificar configuración de build
function checkBuildConfiguration() {
  log.header('🏗️ Verificando Configuración de Build');
  
  try {
    // Verificar que podemos ejecutar npm run build
    log.info('Ejecutando build de prueba...');
    execSync('npm run build', { stdio: 'pipe', timeout: 300000 });
    log.success('Build completado exitosamente');
    
    // Verificar que se genere el directorio dist
    if (fs.existsSync('dist')) {
      log.success('Directorio dist/ generado correctamente');
      
      // Verificar archivos críticos en dist
      const criticalFiles = ['index.html'];
      criticalFiles.forEach(file => {
        if (fs.existsSync(`dist/${file}`)) {
          log.success(`  ✓ ${file}`);
        } else {
          log.warning(`  ⚠ ${file} no encontrado en dist/`);
        }
      });
      
    } else {
      log.error('Directorio dist/ no generado');
      return false;
    }
    
  } catch (error) {
    log.error(`Error en build: ${error.message}`);
    return false;
  }
  
  return true;
}

// Verificar configuración de Git
function checkGitConfiguration() {
  log.header('🔧 Verificando Configuración de Git');
  
  try {
    // Verificar que es un repositorio Git
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    log.success('Repositorio Git inicializado');
    
    // Verificar remote
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      log.success(`Remote origin: ${remote}`);
    } catch (error) {
      log.warning('No hay remote origin configurado');
    }
    
    // Verificar branch actual
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log.success(`Branch actual: ${branch}`);
    
    // Verificar si hay cambios pendientes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log.warning('Hay cambios pendientes en Git');
    } else {
      log.success('No hay cambios pendientes');
    }
    
  } catch (error) {
    log.error(`Error verificando Git: ${error.message}`);
    return false;
  }
  
  return true;
}

// Generar reporte
function generateReport(results) {
  log.header('📊 Reporte de Verificación');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const failed = total - passed;
  
  console.log(`\n${colors.bold}Resumen:${colors.reset}`);
  console.log(`Total de verificaciones: ${total}`);
  console.log(`${colors.green}Exitosas: ${passed}${colors.reset}`);
  console.log(`${colors.red}Fallidas: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ¡Todo está listo para despliegue en Netlify!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️ Hay ${failed} verificaciones que necesitan atención antes del despliegue.${colors.reset}`);
  }
  
  // Recomendaciones
  if (failed > 0) {
    log.header('💡 Recomendaciones');
    console.log('1. Corregir las verificaciones fallidas');
    console.log('2. Ejecutar `npm run build` localmente para probar');
    console.log('3. Verificar variables de entorno en Netlify');
    console.log('4. Hacer un deploy de prueba antes de producción');
  }
  
  return failed === 0;
}

// Función principal
async function main() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                Verificación de Configuración                ║
║                     NexuPay → Netlify                       ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const results = {
    configFiles: checkConfigFiles(),
    directoryStructure: checkDirectoryStructure(),
    netlifyFunctions: checkNetlifyFunctions(),
    buildConfiguration: checkBuildConfiguration(),
    gitConfiguration: checkGitConfiguration()
  };
  
  const success = generateReport(results);
  
  // Exit code basado en el resultado
  process.exit(success ? 0 : 1);
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export { main, checks };