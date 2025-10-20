/**
 * Script para aplicar la migración automáticamente
 * Ejecuta: node apply_migration_auto.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para cargar variables de entorno desde .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    return envVars;
  }
  return {};
}

// Cargar variables de entorno
const envVars = loadEnv();
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno no encontradas');
  console.log('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
  console.log('Ubicación del .env:', path.join(__dirname, '.env'));
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración final automáticamente...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'final_migration_complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada exitosamente');
    console.log('📊 Longitud del SQL:', migrationSQL.length, 'caracteres');

    // Intentar ejecutar la migración usando rpc (esto probablemente fallará por permisos)
    console.log('⚠️  Intentando ejecutar migración automáticamente...');

    try {
      // Dividir el SQL en statements individuales
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`📝 Ejecutando ${statements.length} statements SQL...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`🔄 Ejecutando statement ${i + 1}/${statements.length}...`);

        try {
          // Intentar ejecutar usando rpc (esto probablemente no funcione)
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            console.log(`⚠️  Statement ${i + 1} falló:`, error.message);
            // Continuar con el siguiente
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
          }
        } catch (stmtError) {
          console.log(`⚠️  Error en statement ${i + 1}:`, stmtError.message);
          // Continuar con el siguiente
        }
      }

      console.log('🎯 Verificando si la migración funcionó...');

      // Verificar si la tabla payments existe ahora
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);

      if (error) {
        console.log('❌ La migración no funcionó completamente:', error.message);
        console.log('📋 Necesitas aplicar manualmente la migración en Supabase Dashboard');
      } else {
        console.log('✅ ¡Migración aplicada exitosamente!');
        console.log('🎉 Las tablas ahora existen y las páginas administrativas deberían funcionar');
      }

    } catch (execError) {
      console.log('❌ Error ejecutando migración automáticamente:', execError.message);
      console.log('📋 Esto es esperado - necesitas aplicar manualmente en Supabase Dashboard');
    }

    // Mostrar instrucciones manuales
    console.log('\n📋 INSTRUCCIONES PARA APLICACIÓN MANUAL:');
    console.log('==========================================');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a SQL Editor');
    console.log('4. Pega el contenido del archivo final_migration_complete.sql');
    console.log('5. Haz clic en "Run"');
    console.log('');
    console.log('✅ Después de aplicar la migración:');
    console.log('   - Todas las tablas existirán');
    console.log('   - Las políticas RLS funcionarán');
    console.log('   - El dashboard cargará datos reales');

  } catch (error) {
    console.error('❌ Error en applyMigration:', error.message);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigration();
}

export { applyMigration };