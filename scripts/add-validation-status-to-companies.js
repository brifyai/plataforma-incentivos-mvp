const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addValidationStatusToCompanies() {
  try {
    console.log('🔄 Agregando columna validation_status a la tabla companies...');
    
    // Ejecutar SQL para agregar la columna
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
        CREATE INDEX IF NOT EXISTS idx_companies_validation_status ON companies(validation_status);
        COMMENT ON COLUMN companies.validation_status IS 'Validation status of the company: pending, validated, or rejected';
      `
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Intentar con SQL directo si RPC no funciona
      console.log('🔄 Intentando con SQL directo...');
      
      // Usar el método .rpc() con un enfoque diferente
      const { error: error2 } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      
      if (error2) {
        console.error('❌ Error verificando tabla companies:', error2);
        process.exit(1);
      }
      
      console.log('✅ Tabla companies accesible, pero no se puede ejecutar SQL directamente');
      console.log('📝 Necesitas ejecutar manualmente el siguiente SQL en tu base de datos:');
      console.log(`
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
        CREATE INDEX IF NOT EXISTS idx_companies_validation_status ON companies(validation_status);
        COMMENT ON COLUMN companies.validation_status IS 'Validation status of the company: pending, validated, or rejected';
      `);
    } else {
      console.log('✅ Columna validation_status agregada exitosamente');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }
}

addValidationStatusToCompanies();