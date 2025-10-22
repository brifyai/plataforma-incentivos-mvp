const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyClientsSimple() {
  try {
    console.log('🔍 Verificación simple de clientes y deudas...\n');

    // 1. Verificar estructura de tabla companies
    console.log('📋 Estructura de tabla companies:');
    const { data: companiesColumns, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companiesError) {
      console.error('❌ Error en companies:', companiesError);
    } else if (companiesColumns && companiesColumns.length > 0) {
      console.log('   Columnas disponibles:', Object.keys(companiesColumns[0]));
    }

    // 2. Obtener todos los clientes
    console.log('\n📋 Todos los clientes registrados:');
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*');

    if (allClientsError) {
      console.error('❌ Error consultando clientes:', allClientsError);
      return;
    }

    console.log(`   Total clientes: ${allClients?.length || 0}`);
    if (allClients && allClients.length > 0) {
      allClients.forEach(client => {
        console.log(`   - ID: ${client.id}`);
        console.log(`     Business Name: ${client.business_name || 'N/A'}`);
        console.log(`     Contact Email: ${client.contact_email || 'N/A'}`);
        console.log(`     Company ID: ${client.company_id || 'N/A'}`);
        console.log(`     RUT: ${client.rut || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Obtener todas las deudas con client_id
    console.log('📋 Deudas con client_id:');
    const { data: debtsWithClients, error: debtsError } = await supabase
      .from('debts')
      .select(`
        id,
        client_id,
        company_id,
        user_id,
        current_amount,
        user:users(id, full_name, email, rut)
      `)
      .not('client_id', 'is', null);

    if (debtsError) {
      console.error('❌ Error consultando deudas:', debtsError);
      return;
    }

    console.log(`   Total deudas con client_id: ${debtsWithClients?.length || 0}`);
    if (debtsWithClients && debtsWithClients.length > 0) {
      for (const debt of debtsWithClients) {
        console.log(`   - Deuda ID: ${debt.id}`);
        console.log(`     Usuario: ${debt.user?.full_name || 'N/A'} (${debt.user?.email || 'N/A'})`);
        console.log(`     Client ID: ${debt.client_id}`);
        console.log(`     Company ID: ${debt.company_id}`);
        console.log(`     Monto: $${debt.current_amount || 0}`);
        
        // Buscar el cliente asociado
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', debt.client_id)
          .single();
        
        if (!clientError && clientData) {
          console.log(`     Cliente Asociado: ${clientData.business_name} (${clientData.contact_email})`);
        } else {
          console.log(`     ⚠️  Cliente no encontrado para client_id: ${debt.client_id}`);
        }
        console.log('');
      }
    }

    // 4. Verificar empresas
    console.log('📋 Empresas registradas:');
    const { data: allCompanies, error: allCompaniesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        contact_email,
        user_id
      `)
      .limit(10);

    if (allCompaniesError) {
      console.error('❌ Error consultando empresas:', allCompaniesError);
    } else {
      console.log(`   Total empresas: ${allCompanies?.length || 0}`);
      if (allCompanies && allCompanies.length > 0) {
        allCompanies.forEach(company => {
          console.log(`   - ID: ${company.id}`);
          console.log(`     Company Name: ${company.company_name || 'N/A'}`);
          console.log(`     Contact Email: ${company.contact_email || 'N/A'}`);
          console.log(`     User ID: ${company.user_id || 'N/A'}`);
          console.log('');
        });
      }
    }

    // 5. Diagnóstico final
    console.log('🎯 DIAGNÓSTICO FINAL:');
    console.log('==================');
    console.log(`✅ Clientes registrados: ${allClients?.length || 0}`);
    console.log(`✅ Deudas con client_id: ${debtsWithClients?.length || 0}`);
    console.log(`✅ Empresas registradas: ${allCompanies?.length || 0}`);
    
    if (allClients && allClients.length > 0 && debtsWithClients && debtsWithClients.length > 0) {
      console.log('\n✅ El sistema tiene datos para mostrar');
      console.log('🔧 El problema está en la función getCompanyDebts() que no usa client_id correctamente');
    } else {
      console.log('\n⚠️  Faltan datos para mostrar correctamente');
    }

  } catch (error) {
    console.error('💥 Error en verificación:', error);
  }
}

// Ejecutar verificación
verifyClientsSimple();