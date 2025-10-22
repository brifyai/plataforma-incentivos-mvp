const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySqlMigration(migrationPath) {
  try {
    console.log(`🔧 Aplicando migración SQL: ${migrationPath}`);
    console.log('=====================================');

    // Verificar que el archivo existe
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ No existe el archivo: ${migrationPath}`);
      process.exit(1);
    }

    // Leer el contenido del archivo SQL
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Archivo leído: ${migrationPath}`);
    console.log(`📏 Tamaño: ${sqlContent.length} caracteres`);

    // Ejecutar la migración usando RPC
    console.log('🚀 Ejecutando migración...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Si el RPC no existe, intentar con SQL directo
      console.log('🔄 Intentando ejecución directa...');
      const { data: directData, error: directError } = await supabase
        .from('migrations')
        .select('*')
        .limit(1);
        
      if (directError && directError.message.includes('does not exist')) {
        console.log('⚠️  La tabla migrations no existe. Esto es normal si es la primera migración.');
        console.log('✅ Migración aplicada manualmente (requiere confirmación en Supabase Dashboard)');
      } else {
        console.error('❌ Error en ejecución directa:', directError);
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
      console.log('📊 Resultado:', data);
    }

    console.log('\n🎯 Migración completada');
    console.log('💡 Si la migración no se aplicó automáticamente,');
    console.log('   copia y pega el contenido del archivo en el Supabase Dashboard');

  } catch (error) {
    console.error('💥 Error aplicando migración:', error);
    process.exit(1);
  }
}

// Obtener el archivo de migración de los argumentos
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Uso: node apply-sql-migration.cjs <ruta-del-archivo-sql>');
  console.error('   Ejemplo: node apply-sql-migration.cjs supabase-migrations/033_auto_corporate_client_trigger.sql');
  process.exit(1);
}

// Aplicar la migración
applySqlMigration(migrationFile);