const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCorporateClientsStructure() {
  try {
    console.log('🔍 Verificando estructura de corporate_clients...');

    // Verificar si hay datos directamente
    const { data: corporateClients, error: dataError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Error obteniendo datos:', dataError);
      return;
    }

    if (corporateClients.length > 0) {
      console.log('✅ Estructura de la tabla corporate_clients (basado en registros existentes):');
      console.log('   Campos disponibles:', Object.keys(corporateClients[0]));
      
      corporateClients.forEach((corporate, index) => {
        console.log(`\n📋 Registro ${index + 1}:`);
        Object.entries(corporate).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    } else {
      console.log('📋 No hay registros en la tabla corporate_clients');
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

checkCorporateClientsStructure();