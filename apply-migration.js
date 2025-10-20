/**
 * Script para aplicar la migración de base de datos
 * Ejecuta: node apply-migration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración 005_fix_database_issues.sql...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase-migrations', '005_fix_database_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada exitosamente');
    console.log('📊 Longitud del SQL:', migrationSQL.length, 'caracteres');

    // Aquí iría la lógica para ejecutar en Supabase
    // Por ahora solo mostramos las instrucciones

    console.log('\n📋 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN:');
    console.log('==========================================');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "SQL Editor"');
    console.log('4. Copia y pega el contenido del archivo:');
    console.log('   supabase-migrations/005_fix_database_issues.sql');
    console.log('5. Haz clic en "Run"');
    console.log('');
    console.log('✅ La migración creará todas las tablas necesarias y corregirá las políticas RLS');

    // Mostrar resumen de lo que hace la migración
    console.log('\n📋 LO QUE HACE LA MIGRACIÓN:');
    console.log('============================');
    console.log('✅ Crea tabla payments');
    console.log('✅ Crea tabla wallets');
    console.log('✅ Crea tabla payment_preferences');
    console.log('✅ Crea tabla transactions');
    console.log('✅ Crea tabla payment_history');
    console.log('✅ Corrige políticas RLS problemáticas');
    console.log('✅ Inserta datos de prueba');
    console.log('✅ Configura triggers');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigration();
}

export { applyMigration };