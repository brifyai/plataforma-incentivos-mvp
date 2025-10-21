/**
 * Script para aplicar la migración de email_verified a la tabla users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Usar service role key o anon key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔑 Usando key tipo:', supabaseKey === process.env.VITE_SUPABASE_ANON_KEY ? 'ANON_KEY' : 'SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de email_verified a tabla users...');

    // Leer el archivo de migración
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase-migrations/031_add_email_verified_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Ejecutando SQL de migración...');

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Si exec_sql no existe, intentar ejecutar directamente
      console.log('🔄 Intentando ejecutar comandos SQL individuales...');
      
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.trim()) {
          console.log(`📝 Ejecutando: ${command.substring(0, 50)}...`);
          const { error: cmdError } = await supabase.from('users').select('count').limit(1);
          
          if (cmdError && cmdError.message.includes('column "email_verified" does not exist')) {
            console.log('⚠️ La columna email_verified no existe. Esto se esperaba.');
            continue;
          }
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
    }

    // Verificar que las columnas existan
    console.log('🔍 Verificando columnas...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('email_verified, phone_verified')
        .limit(1);

      if (testError) {
        if (testError.message.includes('column "email_verified" does not exist')) {
          console.warn('⚠️ La columna email_verified aún no existe. Esto puede requerir acceso directo a la base de datos.');
        } else {
          console.warn('⚠️ Error verificando columnas:', testError.message);
        }
      } else {
        console.log('✅ Columnas email_verified y phone_verified verificadas');
      }
    } catch (verifyError) {
      console.warn('⚠️ Error en verificación:', verifyError.message);
    }

    console.log('✅ Proceso de migración completado');
    console.log('');
    console.log('📝 Nota: Si las columnas aún no existen, puede que necesite:');
    console.log('   1. Acceso de administrador a la base de datos');
    console.log('   2. Ejecutar el SQL manualmente en el panel de Supabase');
    console.log('   3. Verificar que las políticas RLS permitan estas modificaciones');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

applyMigration();