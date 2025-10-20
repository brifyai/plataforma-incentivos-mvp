/**
 * Script para ejecutar manualmente la migración que agrega la columna client_id a la tabla debts
 * Este script soluciona el error: "column debts.client_id does not exist"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('- SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('🔄 Iniciando migración para agregar client_id a tabla debts...');
    
    // Paso 1: Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna client_id ya existe...');
    
    const { data: columnCheck, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public')
      .single();

    if (!columnError && columnCheck) {
      console.log('✅ La columna client_id ya existe en la tabla debts');
      return;
    }

    console.log('📝 La columna client_id no existe, procediendo con la migración...');

    // Paso 2: Ejecutar la migración SQL
    const migrationSQL = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'debts' 
              AND column_name = 'client_id'
              AND table_schema = 'public'
          ) THEN
              -- Add the client_id column as a foreign key to clients table
              ALTER TABLE public.debts 
              ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
              
              -- Add index for better query performance
              CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
              
              -- Add comment for documentation
              COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
              
              RAISE NOTICE 'client_id column added to debts table successfully';
          ELSE
              RAISE NOTICE 'client_id column already exists in debts table';
          END IF;
      END $$;

      -- Optional: Create a composite index for company_id + client_id queries
      CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;
    `;

    console.log('⚡ Ejecutando SQL de migración...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración con RPC:', error);
      
      // Alternativa: Ejecutar directamente con SQL si RPC no está disponible
      console.log('🔄 Intentando ejecutar SQL directamente...');
      
      try {
        // Verificar nuevamente si la columna existe
        const { data: verifyColumn, error: verifyError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'debts')
          .eq('column_name', 'client_id')
          .eq('table_schema', 'public')
          .single();

        if (!verifyError && verifyColumn) {
          console.log('✅ La columna client_id ya existe (verificación post-migración)');
          return;
        }

        // Si aún no existe, intentar con el método directo
        console.log('⚠️ Si la columna aún no existe, ejecuta manualmente en Supabase:');
        console.log('```sql');
        console.log(migrationSQL);
        console.log('```');
        
      } catch (directError) {
        console.error('❌ Error en verificación directa:', directError);
      }
      
    } else {
      console.log('✅ Migración ejecutada exitosamente:', data);
    }

    // Paso 3: Verificar que la columna fue creada
    console.log('🔍 Verificando que la columna fue creada...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public')
      .single();

    if (finalError) {
      console.error('❌ Error verificando la columna creada:', finalError);
      console.log('\n📋 Instrucciones manuales:');
      console.log('1. Ve al panel de Supabase');
      console.log('2. Navega a SQL Editor');
      console.log('3. Ejecuta el siguiente SQL:');
      console.log('```sql');
      console.log(migrationSQL);
      console.log('```');
    } else {
      console.log('✅ Columna client_id creada exitosamente:');
      console.log('- Nombre:', finalCheck.column_name);
      console.log('- Tipo:', finalCheck.data_type);
      console.log('- Nullable:', finalCheck.is_nullable);
    }

  } catch (error) {
    console.error('💥 Error ejecutando la migración:', error);
    process.exit(1);
  }
}

async function checkTableStructure() {
  try {
    console.log('\n📊 Verificando estructura actual de la tabla debts...');
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'debts')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Error obteniendo estructura de tabla:', error);
      return;
    }

    console.log('\n📋 Columnas actuales en la tabla debts:');
    console.table(data);

    const hasClientId = data.some(col => col.column_name === 'client_id');
    console.log(`\n🔍 ¿Tiene la columna client_id?: ${hasClientId ? '✅ Sí' : '❌ No'}`);

  } catch (error) {
    console.error('💥 Error verificando estructura:', error);
  }
}

// Ejecutar el script
async function main() {
  console.log('🚀 Script para agregar client_id a tabla debts');
  console.log('==========================================\n');
  
  await executeMigration();
  await checkTableStructure();
  
  console.log('\n✅ Script completado');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Verifica que la columna client_id exista en la tabla debts');
  console.log('2. Prueba la creación de clientes en la aplicación');
  console.log('3. Verifica que no aparezca el error "column debts.client_id does not exist"');
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});