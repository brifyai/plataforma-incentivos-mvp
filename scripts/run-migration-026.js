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

    // Ejecutar la migración usando rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);

      // Si rpc no existe, intentar ejecutar directamente
      if (error.message?.includes('function exec_sql') || error.code === '42883') {
        console.log('🔄 Intentando ejecutar SQL directamente...');

        // Dividir el SQL en statements individuales
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`📝 Ejecutando: ${statement.substring(0, 50)}...`);

            try {
              // Para statements DDL, podemos intentar ejecutar directamente
              if (statement.toUpperCase().includes('DROP POLICY') ||
                  statement.toUpperCase().includes('CREATE POLICY') ||
                  statement.toUpperCase().includes('ALTER TABLE')) {

                // Usar una consulta directa para DDL
                const { error: ddlError } = await supabase.from('_supabase_migration_temp').select('*').limit(0);
                if (ddlError) {
                  console.log('⚠️ No se puede ejecutar DDL directamente desde cliente JS');
                  console.log('📋 Copia y pega el siguiente SQL en Supabase SQL Editor:');
                  console.log('');
                  console.log(migrationSQL);
                  console.log('');
                  return;
                }
              }
            } catch (stmtError) {
              console.error(`❌ Error en statement: ${stmtError.message}`);
            }
          }
        }
      }

      console.log('');
      console.log('📋 INSTRUCCIONES MANUALES:');
      console.log('1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/sql');
      console.log('2. Copia y pega el contenido del archivo supabase-migrations/026_enable_clients_insert.sql');
      console.log('3. Ejecuta la consulta');
      console.log('4. Verifica que aparezca "Success. No rows returned"');
      console.log('');

      return false;
    }

    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Resultado:', data);

    // Verificar que la política se creó
    console.log('\n🔍 Verificando políticas RLS de tabla clients...');

    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'clients');

    if (policiesError) {
      console.warn('⚠️ No se pudo verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas encontradas:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });

      const insertPolicy = policies.find(p => p.policyname === 'companies_insert_own_clients');
      if (insertPolicy) {
        console.log('✅ Política de inserción encontrada y activa');
      } else {
        console.warn('⚠️ Política de inserción no encontrada');
      }
    }

    return true;

  } catch (error) {
    console.error('💥 Error general:', error);
    return false;
  }
}

// Ejecutar la migración
runMigration().then(success => {
  if (success) {
    console.log('\n🎉 Migración completada exitosamente');
    console.log('✅ Las empresas ahora pueden crear clientes');
  } else {
    console.log('\n⚠️ Migración no se pudo ejecutar automáticamente');
    console.log('📋 Sigue las instrucciones manuales mostradas arriba');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});