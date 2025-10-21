const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addValidationStatusToCompanies() {
  try {
    console.log('🔄 Verificando si la columna validation_status existe en companies...');
    
    // Primero verificar si la columna ya existe
    const { data: testCompany, error: testError } = await supabase
      .from('companies')
      .select('validation_status')
      .limit(1);
    
    if (!testError) {
      console.log('✅ La columna validation_status ya existe en la tabla companies');
      return;
    }
    
    if (testError.code !== 'PGRST204') {
      console.error('❌ Error verificando columna:', testError);
      process.exit(1);
    }
    
    console.log('🔄 La columna validation_status no existe. Intentando agregarla...');
    
    // Como no podemos ejecutar SQL directamente, mostramos instrucciones manuales
    console.log('📝 Necesitas ejecutar manualmente el siguiente SQL en tu base de datos Supabase:');
    console.log(`
-- Conéctate a tu base de datos Supabase y ejecuta:
ALTER TABLE companies ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_companies_validation_status ON companies(validation_status);
COMMENT ON COLUMN companies.validation_status IS 'Validation status of the company: pending, validated, or rejected';
    `);
    
    console.log('');
    console.log('🔗 Para ejecutar esto:');
    console.log('1. Ve al panel de Supabase');
    console.log('2. Click en "SQL Editor"');
    console.log('3. Pega y ejecuta el SQL anterior');
    console.log('4. Luego prueba el botón "Guardar Cambios" nuevamente');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }
}

addValidationStatusToCompanies();