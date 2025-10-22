const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCompaniesColumns() {
  try {
    console.log('🔍 Verificando estructura de la tabla companies...');

    // Verificar si hay datos directamente
    const { data: companies, error: dataError } = await supabase
      .from('companies')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Error obteniendo datos:', dataError);
      return;
    }

    if (companies.length > 0) {
      console.log('✅ Estructura de la tabla companies (basado en registros existentes):');
      console.log('   Campos disponibles:', Object.keys(companies[0]));
      
      companies.forEach((company, index) => {
        console.log(`\n📋 Registro ${index + 1}:`);
        Object.entries(company).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    } else {
      console.log('📋 No hay registros en la tabla companies');
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

checkCompaniesColumns();