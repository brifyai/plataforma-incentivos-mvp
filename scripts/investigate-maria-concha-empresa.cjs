/**
 * Script para investigar por qué María Concha aparece como empresa
 * Buscará en todas las tablas posibles donde podría estar registrada
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

async function investigateMariaConcha() {
  try {
    console.log('🔍 Investigando exhaustivamente a María Concha (16610128-k)...');

    // 1. Buscar en companies (tabla principal de empresas)
    console.log('\n📋 Buscando en companies:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .or('company_name.ilike.%María Concha%,rut.eq.16610128-k');

    if (companiesError) {
      console.error('❌ Error en companies:', companiesError);
    } else {
      console.log(`📊 Encontradas ${companies.length} empresas:`);
      if (companies.length > 0) {
        console.table(companies);
      }
    }

    // 2. Buscar en corporate_clients
    console.log('\n📋 Buscando en corporate_clients:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .or('contact_email.ilike.%maria%,rut.eq.16610128-k');

    if (corporateError) {
      console.error('❌ Error en corporate_clients:', corporateError);
    } else {
      console.log(`📊 Encontrados ${corporateClients.length} clientes corporativos:`);
      if (corporateClients.length > 0) {
        console.table(corporateClients);
      }
    }

    // 3. Buscar en clients
    console.log('\n📋 Buscando en clients:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .or('business_name.ilike.%María Concha%,contact_email.ilike.%maria%,rut.eq.16610128-k');

    if (clientsError) {
      console.error('❌ Error en clients:', clientsError);
    } else {
      console.log(`📊 Encontrados ${clients.length} clientes:`);
      if (clients.length > 0) {
        console.table(clients);
      }
    }

    // 4. Buscar en users (por si quedó algún registro)
    console.log('\n📋 Buscando en users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .or('full_name.ilike.%María Concha%,email.ilike.%maria%,rut.eq.16610128-k');

    if (usersError) {
      console.error('❌ Error en users:', usersError);
    } else {
      console.log(`📊 Encontrados ${users.length} usuarios:`);
      if (users.length > 0) {
        console.table(users);
      }
    }

    // 5. Buscar en debts (por si hay deudas asociadas)
    console.log('\n📋 Buscando en debts:');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(10); // Solo mostrar los primeros 10 para no saturar

    if (debtsError) {
      console.error('❌ Error en debts:', debtsError);
    } else {
      console.log(`📊 Total de deudas en la base: ${debts.length}`);
      
      // Buscar deudas que puedan estar relacionadas con María Concha
      const mariaDebts = debts.filter(debt => 
        (debt.debtor_name && debt.debtor_name.includes('María Concha')) ||
        (debt.description && debt.description.includes('María Concha'))
      );
      
      if (mariaDebts.length > 0) {
        console.log(`📊 Deudas relacionadas con María Concha (${mariaDebts.length}):`);
        console.table(mariaDebts);
      }
    }

    // 6. Mostrar todas las empresas para ver qué podría estar mostrando la UI
    console.log('\n📋 Todas las empresas en la tabla companies:');
    const { data: allCompanies, error: allCompaniesError } = await supabase
      .from('companies')
      .select('id, company_name, rut, contact_email');

    if (allCompaniesError) {
      console.error('❌ Error obteniendo todas las empresas:', allCompaniesError);
    } else {
      console.log(`📊 Total de empresas: ${allCompanies.length}`);
      console.table(allCompanies);
    }

    // 7. Revisar si hay alguna vista o consulta que pueda estar mostrando datos incorrectos
    console.log('\n📋 Verificando si hay alguna relación entre tablas:');
    
    // Buscar relaciones que puedan estar causando el problema
    if (companies && companies.length > 0) {
      for (const company of companies) {
        console.log(`\n🔍 Analizando empresa: ${company.company_name}`);
        
        // Verificar si hay clientes asociados
        const { data: relatedClients, error: relatedClientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', company.id);

        if (!relatedClientsError && relatedClients.length > 0) {
          console.log(`  📊 Clientes asociados (${relatedClients.length}):`);
          console.table(relatedClients);
        }

        // Verificar si hay corporate_clients asociados
        const { data: relatedCorporate, error: relatedCorporateError } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('company_id', company.id);

        if (!relatedCorporateError && relatedCorporate.length > 0) {
          console.log(`  📊 Clientes corporativos asociados (${relatedCorporate.length}):`);
          console.table(relatedCorporate);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
investigateMariaConcha();