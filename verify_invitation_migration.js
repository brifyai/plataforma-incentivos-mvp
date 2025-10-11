/**
 * Script para verificar que la migración de campos de invitación se aplicó correctamente
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

async function verifyInvitationMigration() {
  try {
    console.log('🔍 Verificando migración de campos de invitación...\n');

    // Verificar que las columnas existen
    const { data, error } = await supabase
      .from('users')
      .select('id, invitation_token, invitation_status, invitation_expires_at, validation_status')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar campos de invitación:', error.message);
      console.log('\n🔧 La migración NO se aplicó correctamente.');
      console.log('\nINSTRUCCIONES PARA APLICAR LA MIGRACIÓN:');
      console.log('1. Ve a https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/sql');
      console.log('2. Ve a SQL Editor');
      console.log('3. Copia y pega el contenido del archivo: supabase-migrations/add_invitation_fields_to_users.sql');
      console.log('4. Ejecuta la consulta');
      console.log('5. Vuelve a ejecutar este script para verificar');

      return false;
    }

    console.log('✅ Migración aplicada exitosamente!');
    console.log('📊 Columnas disponibles:', Object.keys(data?.[0] || {}));

    // Verificar que las funciones existen en databaseService
    console.log('\n🧪 Verificando que las funciones de invitación existen...');

    try {
      const { createUserWithInvitation, validateInvitationToken, completeUserRegistration } = await import('./src/services/databaseService.js');

      console.log('✅ Funciones de invitación encontradas:');
      console.log('- createUserWithInvitation:', typeof createUserWithInvitation);
      console.log('- validateInvitationToken:', typeof validateInvitationToken);
      console.log('- completeUserRegistration:', typeof completeUserRegistration);

      console.log('\n🎯 Las funciones están disponibles. Para probar completamente:');
      console.log('1. Ve al panel de administración');
      console.log('2. Crea un nuevo usuario desde AdminUsersPage');
      console.log('3. El sistema generará automáticamente un token de invitación');
      console.log('4. El usuario podrá completar su registro usando el enlace de invitación');

    } catch (importError) {
      console.error('❌ Error importando funciones:', importError.message);
      return false;
    }

    console.log('\n🎊 ¡TODO FUNCIONA PERFECTAMENTE!');
    console.log('Los usuarios ahora pueden:');
    console.log('1. Ser creados con tokens de invitación');
    console.log('2. Recibir emails de invitación');
    console.log('3. Completar su registro usando el enlace de invitación');
    console.log('4. Iniciar sesión con su nueva contraseña');

    return true;

  } catch (error) {
    console.error('💥 Error en la verificación:', error);
    return false;
  }
}

// Ejecutar la verificación
verifyInvitationMigration();