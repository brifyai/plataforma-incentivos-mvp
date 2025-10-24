const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (desde .env)
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRealtimeClients() {
  console.log('🔍 DIAGNÓSTICO EN TIEMPO REAL - PÁGINA DE CLIENTES');
  console.log('='.repeat(60));

  try {
    // 1. Verificar usuario empresa@nexupay.cl
    console.log('\n1️⃣ Verificando usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError) {
      console.log('❌ Error al obtener usuario:', userError.message);
      return;
    }
    console.log('✅ Usuario encontrado:', user.id);

    // 2. Obtener empresa del usuario
    console.log('\n2️⃣ Verificando empresa del usuario...');
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (userCompanyError) {
      console.log('❌ Error al obtener empresa del usuario:', userCompanyError.message);
      return;
    }
    console.log('✅ Empresa del usuario:', userCompany.company_id);

    // 3. Verificar datos de la empresa
    console.log('\n3️⃣ Verificando datos de la empresa...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userCompany.company_id)
      .single();

    if (companyError) {
      console.log('❌ Error al obtener empresa:', companyError.message);
      return;
    }
    console.log('✅ Empresa encontrada:', company.company_name);
    console.log('📊 Estado de validación:', company.validation_status);

    // 4. Verificar clientes corporativos de la empresa
    console.log('\n4️⃣ Verificando clientes corporativos...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', userCompany.company_id);

    if (corporateError) {
      console.log('❌ Error al obtener clientes corporativos:', corporateError.message);
    } else {
      console.log(`✅ Encontrados ${corporateClients.length} clientes corporativos:`);
      corporateClients.forEach(client => {
        console.log(`   - ${client.business_name} (${client.id})`);
      });
    }

    // 5. Verificar clientes individuales
    console.log('\n5️⃣ Verificando clientes individuales...');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', userCompany.company_id);

    if (individualError) {
      console.log('❌ Error al obtener clientes individuales:', individualError.message);
    } else {
      console.log(`✅ Encontrados ${individualClients.length} clientes individuales:`);
      individualClients.forEach(client => {
        console.log(`   - ${client.business_name} (${client.id}) - RUT: ${client.rut}`);
      });
    }

    // 6. Verificar deudores (debtors)
    console.log('\n6️⃣ Verificando deudores...');
    const { data: debtors, error: debtorsError } = await supabase
      .from('debtors')
      .select('*')
      .eq('company_id', userCompany.company_id);

    if (debtorsError) {
      console.log('❌ Error al obtener deudores:', debtorsError.message);
    } else {
      console.log(`✅ Encontrados ${debtors.length} deudores:`);
      debtors.forEach(debtor => {
        console.log(`   - ${debtor.name} (${debtor.id}) - RUT: ${debtor.rut}`);
      });
    }

    // 7. Verificar deudas
    console.log('\n7️⃣ Verificando deudas...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', userCompany.company_id);

    if (debtsError) {
      console.log('❌ Error al obtener deudas:', debtsError.message);
    } else {
      console.log(`✅ Encontradas ${debts.length} deudas:`);
      debts.forEach(debt => {
        console.log(`   - $${debt.amount} - Cliente: ${debt.client_id || 'No asignado'}`);
      });
    }

    // 8. Simular la llamada exacta que hace getCompanyClients
    console.log('\n8️⃣ Simulando getCompanyClients...');
    const { data: companyClients, error: companyClientsError } = await supabase
      .from('clients')
      .select(`
        id,
        business_name,
        rut,
        contact_email,
        phone,
        address,
        city,
        country,
        created_at,
        updated_at,
        company_id,
        corporate_client_id,
        corporate_clients!inner (
          id,
          business_name,
          rut,
          contact_email
        )
      `)
      .eq('company_id', userCompany.company_id);

    if (companyClientsError) {
      console.log('❌ Error en getCompanyClients:', companyClientsError.message);
      console.log('Detalles del error:', companyClientsError);
    } else {
      console.log(`✅ getCompanyClients encontró ${companyClients.length} clientes con relación:`);
      companyClients.forEach(client => {
        console.log(`   - ${client.business_name} -> ${client.corporate_clients?.business_name || 'Sin corporativo'}`);
      });
    }

    // 9. Simular la llamada exacta que hace getCorporateClients
    console.log('\n9️⃣ Simulando getCorporateClients...');
    const { data: corporateClientsData, error: corporateClientsDataError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', userCompany.company_id);

    if (corporateClientsDataError) {
      console.log('❌ Error en getCorporateClients:', corporateClientsDataError.message);
      console.log('Detalles del error:', corporateClientsDataError);
    } else {
      console.log(`✅ getCorporateClients encontró ${corporateClientsData.length} clientes corporativos:`);
      corporateClientsData.forEach(client => {
        console.log(`   - ${client.business_name} (${client.id})`);
      });
    }

    // 10. Resumen
    console.log('\n📋 RESUMEN DE DATOS REALES:');
    console.log(`   - Empresa: ${company.company_name}`);
    console.log(`   - Clientes corporativos: ${corporateClients?.length || 0}`);
    console.log(`   - Clientes individuales: ${individualClients?.length || 0}`);
    console.log(`   - Deudores: ${debtors?.length || 0}`);
    console.log(`   - Deudas: ${debts?.length || 0}`);
    console.log(`   - Total clientes potenciales: ${(corporateClients?.length || 0) + (individualClients?.length || 0) + (debtors?.length || 0)}`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

debugRealtimeClients();