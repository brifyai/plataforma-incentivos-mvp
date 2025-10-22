require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleSystemCheck() {
  console.log('🔍 VERIFICACIÓN SIMPLE DEL SISTEMA');
  console.log('===================================');

  try {
    // Verificar empresas
    console.log('\n📋 Empresas:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email, validation_status, rut')
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('❌ Error:', companiesError);
    } else {
      console.log(`✅ ${companies.length} empresas encontradas:`);
      companies.forEach(company => {
        console.log(`   - ${company.company_name} (${company.contact_email}) - ${company.validation_status}`);
      });
    }

    // Verificar clientes corporativos
    console.log('\n📋 Clientes Corporativos:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('id, contact_email, rut, industry');

    if (corporateError) {
      console.error('❌ Error:', corporateError);
    } else {
      console.log(`✅ ${corporateClients.length} clientes corporativos encontrados:`);
      corporateClients.forEach(corporate => {
        console.log(`   - ${corporate.contact_email} (${corporate.rut}) - ${corporate.industry}`);
      });
    }

    // Verificar clientes
    console.log('\n📋 Clientes:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error('❌ Error:', clientsError);
    } else {
      console.log(`✅ ${clients.length} clientes encontrados (mostrando primeros 5):`);
      if (clients.length > 0) {
        console.log('Columnas disponibles:', Object.keys(clients[0]));
        clients.forEach(client => {
          const name = client.name || client.client_name || 'Sin nombre';
          const email = client.email || client.contact_email || 'Sin email';
          console.log(`   - ${name} (${email})`);
        });
      }
    }

    // Verificar deudas
    console.log('\n📋 Deudas:');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(5);

    if (debtsError) {
      console.error('❌ Error:', debtsError);
    } else {
      console.log(`✅ ${debts.length} deudas encontradas (mostrando primeras 5):`);
      if (debts.length > 0) {
        console.log('Columnas disponibles:', Object.keys(debts[0]));
        debts.forEach(debt => {
          console.log(`   - $${debt.amount?.toLocaleString()} (${debt.status})`);
        });
      }
    }

    // Verificación específica
    console.log('\n🔍 Verificación específica:');
    
    // Buscar TechCorp
    const { data: techcorp } = await supabase
      .from('companies')
      .select('id, company_name')
      .ilike('company_name', '%TechCorp%');

    if (techcorp && techcorp.length > 0) {
      console.log(`⚠️ Se encontraron ${techcorp.length} empresas TechCorp`);
    } else {
      console.log('✅ No se encontraron empresas TechCorp');
    }

    // Buscar AIntelligence
    const { data: aintelligence } = await supabase
      .from('companies')
      .select('id, company_name, validation_status')
      .ilike('company_name', '%AIntelligence%');

    if (aintelligence && aintelligence.length > 0) {
      console.log(`✅ Se encontraron ${aintelligence.length} empresas AIntelligence`);
      aintelligence.forEach(company => {
        console.log(`   - ${company.company_name} (${company.validation_status})`);
      });
    } else {
      console.log('❌ No se encontraron empresas AIntelligence');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

simpleSystemCheck();