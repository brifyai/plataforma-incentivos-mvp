require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCorporateClientsStructure() {
  console.log('🔍 Verificando estructura de la tabla corporate_clients');
  console.log('=====================================================');

  try {
    // Obtener todos los clientes corporativos para ver la estructura
    const { data: corporateClients, error } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error obteniendo clientes corporativos:', error);
      return;
    }

    if (corporateClients.length === 0) {
      console.log('ℹ️ No hay clientes corporativos en la tabla');
      return;
    }

    console.log('📊 Estructura de la tabla corporate_clients:');
    console.log('===========================================');
    
    // Mostrar las columnas disponibles
    const firstCorporate = corporateClients[0];
    console.log('Columnas disponibles:');
    Object.keys(firstCorporate).forEach(key => {
      console.log(`   - ${key}: ${firstCorporate[key]}`);
    });

    console.log('\n📋 Clientes corporativos existentes:');
    corporateClients.forEach(corporate => {
      console.log(`   ID: ${corporate.id}`);
      if (corporate.name) console.log(`   Nombre: ${corporate.name}`);
      if (corporate.business_name) console.log(`   Business Name: ${corporate.business_name}`);
      if (corporate.contact_email) console.log(`   Email: ${corporate.contact_email}`);
      if (corporate.rut) console.log(`   RUT: ${corporate.rut}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

checkCorporateClientsStructure();