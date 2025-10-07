/**
 * Script para copiar la migración al portapapeles
 * Ejecuta: node copy-migration-to-clipboard.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyMigrationToClipboard() {
  try {
    console.log('📋 Copiando migración al portapapeles...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase-migrations', '005_fix_database_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('✅ Migración copiada al portapapeles');
    console.log('📊 Longitud:', migrationSQL.length, 'caracteres');
    console.log('');

    // Mostrar las instrucciones finales
    console.log('🚀 INSTRUCCIONES FINALES:');
    console.log('========================');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a SQL Editor');
    console.log('4. Pega el contenido copiado');
    console.log('5. Haz clic en "Run"');
    console.log('');
    console.log('✅ Después de aplicar la migración:');
    console.log('   - La tabla payments existirá');
    console.log('   - Las políticas RLS estarán corregidas');
    console.log('   - El dashboard funcionará completamente');
    console.log('');
    console.log('🎯 URL del dashboard: http://localhost:3005/admin/pagos');

    // Intentar copiar al portapapeles del sistema
    try {
      // Para macOS
      const { execSync } = await import('child_process');
      execSync(`echo "${migrationSQL.replace(/"/g, '\\"')}" | pbcopy`);
      console.log('📋 ¡Copiado al portapapeles del sistema!');
    } catch (error) {
      console.log('⚠️ No se pudo copiar automáticamente al portapapeles');
      console.log('📝 Copia manualmente el contenido del archivo:');
      console.log('   supabase-migrations/005_fix_database_issues.sql');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  copyMigrationToClipboard();
}

export { copyMigrationToClipboard };