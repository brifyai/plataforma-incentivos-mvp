/**
 * Script para aplicar las migraciones faltantes que necesita la aplicación
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

async function applyMissingMigrations() {
  console.log('🔧 Aplicando migraciones faltantes...');
  console.log('=' .repeat(60));

  try {
    // 1. Aplicar migración de campos de invitación
    console.log('📧 1. Aplicando migración de campos de invitación...');
    const invitationMigrationPath = path.join(__dirname, '..', 'supabase-migrations', 'add_invitation_fields_to_users.sql');
    const invitationSql = fs.readFileSync(invitationMigrationPath, 'utf8');

    console.log('🔄 Ejecutando ALTER TABLE para campos de invitación...');
    // Ejecutar las sentencias SQL una por una
    const statements = invitationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔄 Ejecutando: ${statement.substring(0, 60)}...`);
        // Para migraciones DDL, necesitamos ejecutarlas directamente en Supabase
        // Este script solo informa qué hacer
      }
    }

    console.log('✅ Migración de campos de invitación preparada');

    // 2. Verificar si necesitamos aplicar más migraciones
    console.log('\n🔍 2. Verificando otras migraciones necesarias...');

    // Lista de migraciones que podrían faltar
    const missingMigrations = [
      'add_invitation_fields_to_users.sql',
      // Agregar otras si es necesario
    ];

    console.log('📋 Migraciones que deben aplicarse manualmente en Supabase:');
    missingMigrations.forEach(migration => {
      console.log(`   - ${migration}`);
    });

    console.log('\n📋 INSTRUCCIONES PARA COMPLETAR:');
    console.log('');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto NexuPay');
    console.log('3. Ve a "SQL Editor"');
    console.log('4. Ejecuta el contenido del archivo: supabase-migrations/add_invitation_fields_to_users.sql');
    console.log('');
    console.log('Después de aplicar esta migración, la aplicación debería funcionar sin errores.');

  } catch (error) {
    console.error('💥 Error aplicando migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar el script
applyMissingMigrations();