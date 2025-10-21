/**
 * Script para ejecutar la migración 026_enable_clients_insert.sql
 * que habilita la política RLS para inserción en tabla clients
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('🔧 Configura estas variables en tu archivo .env');
  process.exit(1);
}

// Crear cliente de Supabase con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Ejecutando migración 026_enable_clients_insert.sql...\n');

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase-migrations', '026_enable_clients_insert.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Contenido de la migración:');
    console.log('='.repeat(50));
    console.log(migrationSQL);
    console.log('='.repeat(50));
    console.log('');

    // Intentar ejecutar usando una consulta directa (esto no funcionará para DDL)
    console.log('⚠️ Nota: Los scripts de Node.js no pueden ejecutar DDL directamente en Supabase');
    console.log('📋 INSTRUCCIONES PARA EJECUTAR MANUALMENTE:');
    console.log('');
    console.log('1. Ve a https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/sql');
    console.log('2. Copia y pega el siguiente SQL:');
    console.log('');
    console.log(migrationSQL);
    console.log('');
    console.log('3. Haz clic en "Run"');
    console.log('4. Deberías ver "Success. No rows returned"');
    console.log('');
    console.log('5. Una vez ejecutada la migración, prueba crear un cliente nuevamente');
    console.log('');

    return false;

  } catch (error) {
    console.error('💥 Error general:', error);
    return false;
  }
}

// Ejecutar la migración
runMigration().then(success => {
  console.log('\n📋 Las instrucciones para ejecutar la migración se mostraron arriba');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});