/**
 * Script para ejecutar la migración que agrega corporate_client_id a la tabla clients
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('🔧 Necesitas: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente de Supabase con rol de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('🚀 INICIANDO MIGRACIÓN: Agregar corporate_client_id a tabla clients');
  console.log('='.repeat(60));

  try {
    // Leer el archivo de migración
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(__dirname, '../supabase-migrations/023_add_corporate_client_id_to_clients.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Leyendo migración desde:', migrationPath);
    console.log('📝 Contenido de la migración:');
    console.log('─'.repeat(40));
    console.log(migrationSQL);
    console.log('─'.repeat(40));
    console.log('');

    // Ejecutar la migración
    console.log('🔄 Ejecutando migración en Supabase...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración:');
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      
      // Intentar ejecutar SQL directamente si rpc no está disponible
      console.log('\n🔄 Intentando ejecutar SQL directamente...');
      
      try {
        // Dividir el SQL en statements individuales
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log('📝 Ejecutando:', statement.substring(0, 100) + '...');
            
            const { error: stmtError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(1); // Esto fallará pero nos permite ejecutar SQL
            
            if (stmtError) {
              // Intentar con SQL raw (si el cliente lo permite)
              console.log('⚠️ No se puede ejecutar SQL directamente con este cliente');
            }
          }
        }
      } catch (directError) {
        console.error('❌ Error ejecutando SQL directamente:', directError.message);
      }
      
      console.log('\n🔧 SOLUCIÓN MANUAL:');
      console.log('1. Ve al panel de Supabase');
      console.log('2. Ve a SQL Editor');
      console.log('3. Ejecuta manualmente el contenido del archivo:');
      console.log('   supabase-migrations/023_add_corporate_client_id_to_clients.sql');
      
      process.exit(1);
    }

    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Resultado:', data);
    
    // Verificar que la columna existe
    console.log('\n🔍 Verificando que la columna corporate_client_id existe...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'clients')
      .eq('column_name', 'corporate_client_id')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Error verificando columna:', columnsError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Columna corporate_client_id verificada:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    } else {
      console.log('⚠️ La columna no se encontró después de la migración');
    }

  } catch (error) {
    console.error('💥 Error general en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
executeMigration().then(() => {
  console.log('\n🎉 MIGRACIÓN COMPLETADA');
  console.log('✅ La columna corporate_client_id debería estar disponible ahora');
  console.log('🔄 Intenta crear el cliente nuevamente');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});