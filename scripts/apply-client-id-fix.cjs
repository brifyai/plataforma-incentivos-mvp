const { createClient } = require('@supabase/supabase-js');

// Usar las mismas credenciales que en create-empresa-user.cjs
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyClientIdFix() {
  try {
    console.log('🔄 Aplicando fix para client_id column...');
    
    // Primero verificar si la columna ya existe
    console.log('🔍 Verificando si client_id ya existe...');
    
    try {
      const { data: columns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'debts')
        .eq('column_name', 'client_id')
        .eq('table_schema', 'public');

      if (!checkError && columns && columns.length > 0) {
        console.log('✅ client_id ya existe en la tabla debts');
        return;
      }
    } catch (schemaError) {
      console.log('⚠️ No se puede verificar information_schema, intentando método alternativo...');
    }

    // Intentar verificar la columna haciendo una consulta directa
    console.log('🔍 Intentando verificar con consulta directa...');
    
    try {
      const { data: testDebt, error: testError } = await supabase
        .from('debts')
        .select('id, client_id')
        .limit(1);
      
      if (!testError) {
        console.log('✅ client_id ya existe (consulta directa exitosa)');
        return;
      }
    } catch (directError) {
      console.log('⚠️ client_id no existe o no es accesible:', directError.message);
    }

    // Como no podemos ejecutar ALTER TABLE directamente con el API de JavaScript,
    // necesitamos usar el SQL Editor de Supabase
    console.log('\n📝 Se necesita aplicar la migración manualmente:');
    console.log('=====================================');
    console.log('Ve a tu Supabase Dashboard y ejecuta este SQL:');
    console.log('=====================================\n');
    
    const sql = `
-- Add the client_id column as a foreign key to clients table
ALTER TABLE public.debts 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add index for better query performance  
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);

-- Optional: Create a composite index for company_id + client_id queries
CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
`;

    console.log(sql);
    
    console.log('\n📋 Pasos:');
    console.log('1. Abre https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a SQL Editor');
    console.log('4. Pega y ejecuta el SQL de arriba');
    console.log('5. Refresca la aplicación');
    
    // También crear un archivo con el SQL para fácil acceso
    const fs = require('fs');
    fs.writeFileSync('client-id-migration.sql', sql);
    console.log('\n💾 SQL guardado en: client-id-migration.sql');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyClientIdFix();