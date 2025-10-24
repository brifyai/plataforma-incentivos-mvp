/**
 * Script para depurar datos de clientes y deudores
 */

async function debugClientData() {
  console.log('🔍 Iniciando depuración de datos de clientes y deudores...\n');

  try {
    // Importar dinámicamente el cliente de Supabase
    const { createClient } = await import('../src/services/supabaseInstances.js');
    const supabase = createClient();

    // 1. Verificar deudas en la tabla debts
    console.log('📊 Verificando deudas en la tabla debts...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        id,
        user_id,
        company_id,
        client_id,
        current_amount,
        status,
        created_at,
        user:users(id, full_name, email, rut)
      `)
      .order('created_at', { ascending: false });

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
    } else {
      console.log(`✅ Encontradas ${debts?.length || 0} deudas:`);
      debts.forEach(debt => {
        console.log(`  - ID: ${debt.id}, Usuario: ${debt.user?.full_name || 'N/A'}, Empresa: ${debt.company_id}, Cliente: ${debt.client_id || 'N/A'}, Monto: $${debt.current_amount}`);
      });
    }

    // 2. Verificar clientes corporativos
    console.log('\n📊 Verificando clientes corporativos...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
    } else {
      console.log(`✅ Encontrados ${corporateClients?.length || 0} clientes corporativos:`);
      corporateClients.forEach(client => {
        console.log(`  - ID: ${client.id}, Empresa: ${client.company_id}, Email: ${client.contact_email}`);
      });
    }

    // 3. Verificar clientes individuales
    console.log('\n📊 Verificando clientes individuales...');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (individualError) {
      console.error('❌ Error obteniendo clientes individuales:', individualError);
    } else {
      console.log(`✅ Encontrados ${individualClients?.length || 0} clientes individuales:`);
      individualClients.forEach(client => {
        console.log(`  - ID: ${client.id}, Empresa: ${client.company_id}, Corporativo: ${client.corporate_client_id}, Nombre: ${client.business_name}`);
      });
    }

    // 4. Verificar empresas
    console.log('\n📊 Verificando empresas...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, business_name, contact_email, validation_status')
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
    } else {
      console.log(`✅ Encontradas ${companies?.length || 0} empresas:`);
      companies.forEach(company => {
        console.log(`  - ID: ${company.id}, Nombre: ${company.business_name}, Email: ${company.contact_email}, Estado: ${company.validation_status}`);
      });
    }

    // 5. Verificar usuarios deudores
    console.log('\n📊 Verificando usuarios deudores...');
    const { data: debtors, error: debtorsError } = await supabase
      .from('users')
      .select('id, full_name, email, rut, role, validation_status')
      .eq('role', 'debtor')
      .order('created_at', { ascending: false });

    if (debtorsError) {
      console.error('❌ Error obteniendo deudores:', debtorsError);
    } else {
      console.log(`✅ Encontrados ${debtors?.length || 0} usuarios deudores:`);
      debtors.forEach(debtor => {
        console.log(`  - ID: ${debtor.id}, Nombre: ${debtor.full_name}, Email: ${debtor.email}, RUT: ${debtor.rut}`);
      });
    }

    console.log('\n🎉 Depuración completada exitosamente');

  } catch (error) {
    console.error('💥 Error en la depuración:', error);
  }
}

// Ejecutar la depuración
debugClientData();