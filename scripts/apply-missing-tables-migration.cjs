/**
 * Script para aplicar la migración de tablas faltantes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔑 Usando key tipo:', supabaseKey === process.env.VITE_SUPABASE_ANON_KEY ? 'ANON_KEY' : 'SERVICE_ROLE_KEY');

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de tablas faltantes...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase-migrations/032_create_missing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Ejecutando SQL de migración de tablas faltantes...');

    // Como no podemos ejecutar SQL directamente con ANON key, mostramos instrucciones
    console.log('⚠️ No se puede ejecutar SQL directamente con ANON_KEY');
    console.log('📝 Se necesita aplicar la migración manualmente en el panel de Supabase');
    
    console.log('\n🔧 Instrucciones para aplicar la migración:');
    console.log('1. Ve al panel de Supabase: https://app.supabase.com');
    console.log('2. Selecciona tu proyecto: wvluqdldygmgncqqjkow');
    console.log('3. Ve a SQL Editor');
    console.log('4. Copia y pega el siguiente SQL:');
    console.log('============================================');
    console.log(migrationSQL);
    console.log('============================================');
    console.log('5. Haz clic en "Run" para ejecutar el SQL');
    console.log('6. Espera a que se completen todas las tablas');

    // Verificar si las tablas existen después de un tiempo
    console.log('\n🔍 Verificando estado actual de las tablas...');
    
    const tablesToCheck = ['offers', 'consents', 'wallet_transactions', 'proposals', 'conversations', 'messages'];
    let allExist = true;

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          console.log(`❌ Tabla ${tableName} aún no existe`);
          allExist = false;
        } else if (error) {
          console.log(`⚠️ Error verificando tabla ${tableName}: ${error.message}`);
          allExist = false;
        } else {
          console.log(`✅ Tabla ${tableName} existe`);
        }
      } catch (err) {
        console.log(`⚠️ Error verificando tabla ${tableName}: ${err.message}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log('\n🎉 Todas las tablas faltantes han sido creadas exitosamente');
    } else {
      console.log('\n📝 Aún faltan tablas por crear. Por favor:');
      console.log('1. Aplica el SQL manualmente como se indicó arriba');
      console.log('2. Espera unos minutos a que se procese la migración');
      console.log('3. Vuelve a ejecutar este script para verificar');
    }

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

applyMigration();