// Script para verificar clientes corporativos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCorporateClients() {
  try {
    console.log('🔍 Verificando tabla corporate_clients...\n');
    
    // Verificar si la tabla existe y tiene datos
    const { data: clients, error: clientsError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(10);
    
    if (clientsError) {
      console.error('❌ Error al consultar corporate_clients:', clientsError);
      return;
    }
    
    console.log(`✅ Se encontraron ${clients.length} clientes corporativos:`);
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} - ${client.display_category} (${client.trust_level})`);
    });
    
    // Verificar segmentos
    console.log('\n🔍 Verificando tabla corporate_segments...\n');
    
    const { data: segments, error: segmentsError } = await supabase
      .from('corporate_segments')
      .select(`
        id,
        name,
        description,
        corporate_client:corporate_clients(name)
      `)
      .limit(10);
    
    if (segmentsError) {
      console.error('❌ Error al consultar corporate_segments:', segmentsError);
      return;
    }
    
    console.log(`✅ Se encontraron ${segments.length} segmentos:`);
    segments.forEach((segment, index) => {
      console.log(`${index + 1}. ${segment.name} - ${segment.corporate_client?.name || 'Sin cliente'}`);
    });
    
    // Verificar tablas de knowledge base
    console.log('\n🔍 Verificando tablas de knowledge base...\n');
    
    const tables = [
      'company_knowledge_base',
      'corporate_client_policies', 
      'corporate_client_responses',
      'negotiation_ai_config'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: OK (${data.length} registros)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCorporateClients();