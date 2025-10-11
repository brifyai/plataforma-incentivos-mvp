/**
 * Script para verificar si existen los campos de invitación en la tabla users
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

async function checkInvitationFields() {
  try {
    console.log('🔍 Verificando campos de invitación en tabla users...\n');

    // Intentar hacer una consulta que use los campos de invitación
    const { data, error } = await supabase
      .from('users')
      .select('id, invitation_token, invitation_status, invitation_expires_at')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar campos de invitación:', error.message);
      console.log('\n🔧 Los campos de invitación NO existen en la tabla users');
      console.log('Necesitas crear una migración para agregar estos campos.');
      console.log('\nCampos requeridos:');
      console.log('- invitation_token: text');
      console.log('- invitation_status: text (default: pending)');
      console.log('- invitation_expires_at: timestamp with time zone');
      console.log('- validation_status: text (default: pending)');

      return false;
    }

    console.log('✅ Los campos de invitación existen en la tabla users');
    console.log('Datos de ejemplo:', data?.[0] || 'Sin datos');

    // Verificar si hay usuarios con tokens de invitación
    const { data: usersWithTokens, error: tokenError } = await supabase
      .from('users')
      .select('id, email, invitation_token, invitation_status, invitation_expires_at')
      .not('invitation_token', 'is', null);

    if (tokenError) {
      console.error('❌ Error al buscar usuarios con tokens:', tokenError.message);
    } else {
      console.log(`\n📊 Usuarios con tokens de invitación: ${usersWithTokens?.length || 0}`);
      if (usersWithTokens && usersWithTokens.length > 0) {
        console.log('Usuarios con tokens:');
        usersWithTokens.forEach(user => {
          console.log(`- ${user.email}: ${user.invitation_token} (${user.invitation_status})`);
        });
      }
    }

    return true;

  } catch (error) {
    console.error('💥 Error en la verificación:', error);
    return false;
  }
}

// Ejecutar la verificación
checkInvitationFields();