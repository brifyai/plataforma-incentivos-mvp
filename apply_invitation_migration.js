/**
 * Script para aplicar la migración de campos de invitación
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Función para cargar variables de entorno desde .env
function loadEnv() {
  try {
    const envPath = resolve('.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });

    return envVars;
  } catch (error) {
    console.warn('No se pudo cargar .env, usando valores por defecto');
    return {};
  }
}

// Cargar variables de entorno
const envVars = loadEnv();

// Configuración de Supabase
const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyInvitationMigration() {
  try {
    console.log('🚀 Aplicando migración de campos de invitación...\n');

    // Leer el archivo de migración
    const migrationPath = resolve('supabase-migrations/add_invitation_fields_to_users.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Contenido de la migración:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(50) + '\n');

    // Ejecutar la migración usando Supabase RPC (si existe) o directamente
    // Como no tenemos acceso directo a SQL, intentaremos ejecutar las operaciones una por una

    console.log('🔧 Agregando columnas de invitación...');

    // 1. Agregar invitation_token
    try {
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token TEXT;'
      });
      if (error1) throw error1;
      console.log('✅ Columna invitation_token agregada');
    } catch (error) {
      console.log('⚠️ Error agregando invitation_token (puede que ya exista):', error.message);
    }

    // 2. Agregar invitation_status
    try {
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT \'pending\';'
      });
      if (error2) throw error2;
      console.log('✅ Columna invitation_status agregada');
    } catch (error) {
      console.log('⚠️ Error agregando invitation_status (puede que ya exista):', error.message);
    }

    // 3. Agregar invitation_expires_at
    try {
      const { error: error3 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;'
      });
      if (error3) throw error3;
      console.log('✅ Columna invitation_expires_at agregada');
    } catch (error) {
      console.log('⚠️ Error agregando invitation_expires_at (puede que ya exista):', error.message);
    }

    // 4. Agregar validation_status
    try {
      const { error: error4 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT \'pending\';'
      });
      if (error4) throw error4;
      console.log('✅ Columna validation_status agregada');
    } catch (error) {
      console.log('⚠️ Error agregando validation_status (puede que ya exista):', error.message);
    }

    console.log('\n🔍 Verificando que las columnas se agregaron correctamente...');

    // Verificar que las columnas existen
    const { data, error: verifyError } = await supabase
      .from('users')
      .select('id, invitation_token, invitation_status, invitation_expires_at, validation_status')
      .limit(1);

    if (verifyError) {
      console.error('❌ Error al verificar columnas:', verifyError.message);
      console.log('\n🔧 INSTRUCCIONES MANUALES:');
      console.log('Ve a Supabase Dashboard > SQL Editor y ejecuta:');
      console.log(migrationSQL);
      return;
    }

    console.log('✅ Migración aplicada exitosamente!');
    console.log('📊 Columnas verificadas:', Object.keys(data?.[0] || {}));

    // Mostrar instrucciones para el usuario
    console.log('\n🎉 ¡Listo! Ahora puedes crear usuarios con invitaciones.');
    console.log('Los usuarios podrán completar su registro usando el enlace de invitación.');

  } catch (error) {
    console.error('💥 Error aplicando migración:', error);
    console.log('\n🔧 INSTRUCCIONES MANUALES:');
    console.log('Ve a Supabase Dashboard > SQL Editor y ejecuta el contenido de:');
    console.log('supabase-migrations/add_invitation_fields_to_users.sql');
  }
}

// Ejecutar la migración
applyInvitationMigration();