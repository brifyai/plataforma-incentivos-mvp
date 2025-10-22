require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCorporateFilter() {
  try {
    console.log('🔍 Debug del filtro "Cliente Corporativo"');
    console.log('=====================================');

    // 1. Obtener la empresa de usuario empresa@nexupay.cl
    console.log('\n📋 Paso 1: Obteniendo empresa de empresa@nexupay.cl...');
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userCompanyError) {
      console.error('❌ Error obteniendo usuario:', userCompanyError);
      return;
    }

    console.log('✅ Usuario encontrado:', userCompany);

    // 2. Obtener la empresa asociada
    console.log('\n📋 Paso 2: Obteniendo empresa asociada...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userCompany.id)
      .single();

    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', {
      id: company.id,
      business_name: company.business_name,
      contact_email: company.contact_email
    });

    // 3. Obtener clientes corporativos de esta empresa (como lo hace ClientsPage)
    console.log('\n📋 Paso 3: Obteniendo clientes corporativos (getCorporateClients)...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .order('contact_email');

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
      return;
    }

    console.log(`✅ Clientes corporativos encontrados: ${corporateClients?.length || 0}`);
    
    if (corporateClients && corporateClients.length > 0) {
      console.log('📋 Detalle de clientes corporativos:');
      corporateClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ID: ${client.id}`);
        console.log(`      Nombre: ${client.contact_email || 'Sin nombre'}`);
        console.log(`      RUT: ${client.rut || 'Sin RUT'}`);
        console.log(`      Teléfono: ${client.contact_phone || 'Sin teléfono'}`);
        console.log(`      Industria: ${client.industry || 'Sin industria'}`);
        console.log('      ---');
      });
    }

    // 4. Verificar la estructura que se usa en el filtro
    console.log('\n📋 Paso 4: Verificando estructura para el filtro...');
    const normalized = (corporateClients || []).map((c) => ({
      id: c.id,
      company_name: c.contact_email || 'Cliente',
      company_rut: c.rut || '',
      industry: c.industry || '',
      contract_value: null,
      status: 'active',
      created_at: c.created_at || null
    }));

    console.log('✅ Estructura normalizada para el filtro:');
    console.log(JSON.stringify(normalized, null, 2));

    // 5. Obtener clientes individuales para ver si tienen corporate_client_id
    console.log('\n📋 Paso 5: Obteniendo clientes individuales...');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .order('business_name');

    if (individualError) {
      console.error('❌ Error obteniendo clientes individuales:', individualError);
      return;
    }

    console.log(`✅ Clientes individuales encontrados: ${individualClients?.length || 0}`);
    
    if (individualClients && individualClients.length > 0) {
      console.log('📋 Detalle de clientes individuales:');
      individualClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ID: ${client.id}`);
        console.log(`      Nombre: ${client.business_name || 'Sin nombre'}`);
        console.log(`      Email: ${client.contact_email || 'Sin email'}`);
        console.log(`      RUT: ${client.rut || 'Sin RUT'}`);
        console.log(`      Corporate Client ID: ${client.corporate_client_id || 'Sin asociación'}`);
        console.log('      ---');
      });
    }

    // 6. Simular el filtro - verificar qué clientes coincidirían
    console.log('\n📋 Paso 6: Simulando filtro por cliente corporativo...');
    if (normalized.length > 0) {
      const selectedCorporateClientId = normalized[0].id; // Seleccionar el primero
      console.log(`🔍 Filtrando por corporate_client_id: ${selectedCorporateClientId}`);
      
      const filteredIndividual = (individualClients || []).filter(client => 
        client.corporate_client_id === selectedCorporateClientId
      );
      
      console.log(`✅ Clientes individuales que coinciden: ${filteredIndividual.length}`);
      filteredIndividual.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.business_name} (${client.contact_email})`);
      });
    }

    // 7. Obtener deudas para ver si tienen client_id
    console.log('\n📋 Paso 7: Obteniendo deudas con client_id...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        id,
        user_id,
        company_id,
        client_id,
        original_amount,
        current_amount,
        description,
        status,
        due_date,
        created_at,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
      return;
    }

    console.log(`✅ Deudas encontradas: ${debts?.length || 0}`);
    
    if (debts && debts.length > 0) {
      console.log('📋 Detalle de deudas con información de cliente:');
      debts.forEach((debt, index) => {
        console.log(`   ${index + 1}. ID Deuda: ${debt.id}`);
        console.log(`      Monto: $${debt.current_amount || debt.original_amount || 0}`);
        console.log(`      Client ID: ${debt.client_id || 'Sin cliente'}`);
        console.log(`      Usuario: ${debt.user?.full_name || 'Sin usuario'} (${debt.user?.email || 'Sin email'})`);
        console.log(`      Cliente: ${debt.client?.business_name || 'Sin cliente'} (${debt.client?.contact_email || 'Sin email'})`);
        console.log('      ---');
      });
    }

    console.log('\n🎉 Análisis completado');
    console.log('=====================================');
    console.log('📊 Resumen:');
    console.log(`   • Empresa: ${company.business_name} (${company.id})`);
    console.log(`   • Clientes corporativos: ${corporateClients?.length || 0}`);
    console.log(`   • Clientes individuales: ${individualClients?.length || 0}`);
    console.log(`   • Deudas: ${debts?.length || 0}`);
    
    if (corporateClients && corporateClients.length > 0) {
      console.log('\n💡 El filtro debería mostrar los siguientes clientes corporativos:');
      normalized.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.company_name} - ${client.company_rut}`);
      });
    }

  } catch (error) {
    console.error('💥 Error en debugCorporateFilter:', error);
  }
}

debugCorporateFilter();