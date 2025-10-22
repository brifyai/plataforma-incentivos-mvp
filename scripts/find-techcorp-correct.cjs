/**
 * Script corregido para buscar TechCorp usando las columnas correctas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTechCorp() {
  try {
    console.log('🔍 Buscando TechCorp con las columnas correctas...');

    // 1. Buscar en corporate_clients (usando contact_email)
    const { data: corporateData, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .or('contact_email.ilike.%techcorp%,contact_phone.ilike.%TechCorp%');

    if (corporateError) {
      console.error('❌ Error en corporate_clients:', corporateError);
    } else {
      console.log(`📊 Encontrados ${corporateData.length} registros en corporate_clients:`);
      if (corporateData.length > 0) {
        console.table(corporateData);
      }
    }

    // 2. Buscar en clients (usando business_name)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .or('business_name.ilike.%TechCorp%,contact_email.ilike.%techcorp%');

    if (clientError) {
      console.error('❌ Error en clients:', clientError);
    } else {
      console.log(`📊 Encontrados ${clientData.length} registros en clients:`);
      if (clientData.length > 0) {
        console.table(clientData);
      }
    }

    // 3. Buscar en companies
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .or('company_name.ilike.%TechCorp%,contact_email.ilike.%techcorp%');

    if (companyError) {
      console.error('❌ Error en companies:', companyError);
    } else {
      console.log(`📊 Encontrados ${companyData.length} registros en companies:`);
      if (companyData.length > 0) {
        console.table(companyData);
      }
    }

    // 4. Buscar todos los datos para ver qué podría estar mostrando "TechCorp - División Desarrollo"
    console.log('\n📋 Mostrando todos los corporate_clients:');
    const { data: allCorporate, error: allCorporateError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (allCorporateError) {
      console.error('❌ Error obteniendo todos los corporate_clients:', allCorporateError);
    } else {
      console.log(`📊 Total de corporate_clients: ${allCorporate.length}`);
      console.table(allCorporate);
    }

    console.log('\n📋 Mostrando todos los clients:');
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*');

    if (allClientsError) {
      console.error('❌ Error obteniendo todos los clients:', allClientsError);
    } else {
      console.log(`📊 Total de clients: ${allClients.length}`);
      console.table(allClients);
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
findTechCorp();