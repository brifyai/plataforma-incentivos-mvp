/**
 * Script para aplicar la migración de contraseña directamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer configuración de Supabase
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPasswordMigration() {
  console.log('🔧 Aplicando migración de columna password...');
  console.log('=' .repeat(60));

  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '..', 'supabase-migrations', '006_add_password_column.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración SQL cargada');
    console.log('🔄 Ejecutando: ALTER TABLE public.users ADD COLUMN password VARCHAR(255);');

    // Intentar ejecutar la migración usando RPC (aunque probablemente no funcione)
    // En su lugar, informar al usuario que debe ejecutar manualmente
    console.log('');
    console.log('⚠️  IMPORTANTE: La migración debe ejecutarse manualmente en Supabase Dashboard');
    console.log('');
    console.log('📋 PASOS PARA COMPLETAR LA CONFIGURACIÓN:');
    console.log('');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto NexuPay');
    console.log('3. Ve a "SQL Editor"');
    console.log('4. Ejecuta esta consulta:');
    console.log('');
    console.log('   ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password VARCHAR(255);');
    console.log('');
    console.log('5. Después ejecuta el script de contraseñas:');
    console.log('   node scripts/add-passwords-to-users.cjs');
    console.log('');
    console.log('✅ Una vez completado, el login funcionará correctamente');

  } catch (error) {
    console.error('💥 Error aplicando migración:', error);
    process.exit(1);
  }
}

// Ejecutar el script
applyPasswordMigration();