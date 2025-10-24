const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClientsStructure() {
  console.log('🔍 Verificando estructura real de la tabla clients...');
  
  try {
    // Intentar diferentes columnas para ver cuáles existen
    const columns = ['business_name', 'name', 'contact_email', 'rut', 'company_id'];
    
    for (const column of columns) {
      console.log(`\nProbando columna: ${column}`);
      const { data, error } = await supabase
        .from('clients')
        .select(column)
        .limit(1);
      
      if (error) {
        console.log(`❌ ${column}: ${error.message}`);
      } else {
        console.log(`✅ ${column}: existe`);
        if (data && data.length > 0) {
          console.log(`   Valor de ejemplo: ${data[0][column]}`);
        }
      }
    }
    
    // Ver todos los datos de clients para entender la estructura
    console.log('\n📋 Todos los datos en clients:');
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error al obtener todos los datos:', allError);
    } else {
      console.log('✅ Estructura completa:');
      if (allClients && allClients.length > 0) {
        console.log('Columnas encontradas:', Object.keys(allClients[0]));
        allClients.forEach((client, index) => {
          console.log(`\nCliente ${index + 1}:`);
          Object.entries(client).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        });
      } else {
        console.log('No hay datos en la tabla clients');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkClientsStructure();