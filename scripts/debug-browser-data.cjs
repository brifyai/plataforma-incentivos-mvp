require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugBrowserData() {
  try {
    console.log('🔍 Debug: Verificando datos exactos que debería ver el navegador');
    console.log('==========================================================');

    // 1. Obtener usuario empresa@nexupay.cl
    console.log('\n📋 Paso 1: Obteniendo usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }
    console.log('✅ Usuario encontrado:', user);

    // 2. Obtener empresa asociada
    console.log('\n📋 Paso 2: Obteniendo empresa asociada...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
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

    // 3. Ejecutar EXACTAMENTE la misma lógica que getCompanyDebts
    console.log('\n📋 Paso 3: Ejecutando getCompanyDebts exactamente como en el navegador...');
    
    let query = supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', company.id);
    
    const { data: debts, error: debtsError } = await query;
    
    if (debtsError) {
      console.error('❌ Error en getCompanyDebts:', debtsError);
      return;
    }
    
    console.log(`✅ Deudas encontradas: ${debts.length}`);
    
    // Enriquecer los datos con información del deudor desde clients
    const enrichedDebts = (debts || []).map(debt => {
      const debtorName = debt.client?.business_name || debt.user?.full_name || 'Deudor desconocido';
      const debtorRut = debt.client?.rut || debt.user?.rut || null;
      const debtorEmail = debt.client?.contact_email || debt.user?.email || null;
      const debtorPhone = debt.client?.contact_phone || null;

      return {
        ...debt,
        debtor_name: debtorName,
        debtor_rut: debtorRut,
        debtor_email: debtorEmail,
        debtor_phone: debtorPhone,
        client_info: debt.client,
        user_info: debt.user
      };
    });
    
    console.log('📋 Deudas enriquecidas:');
    enrichedDebts.forEach((debt, index) => {
      console.log(`   ${index + 1}. ID: ${debt.id}`);
      console.log(`      Deudor: ${debt.debtor_name}`);
      console.log(`      Email: ${debt.debtor_email}`);
      console.log(`      RUT: ${debt.debtor_rut}`);
      console.log(`      Monto: ${debt.current_amount || debt.amount}`);
      console.log(`      Estado: ${debt.status}`);
      console.log('      ---');
    });

    // 4. Verificar getCompanyClients
    console.log('\n📋 Paso 4: Ejecutando getCompanyClients...');
    const { data: companyClients, error: companyClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);
    
    if (companyClientsError) {
      console.error('❌ Error en getCompanyClients:', companyClientsError);
      return;
    }
    
    console.log(`✅ Clientes individuales encontrados: ${companyClients.length}`);
    companyClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id}`);
      console.log(`      Nombre: ${client.business_name}`);
      console.log(`      Email: ${client.contact_email}`);
      console.log(`      RUT: ${client.rut}`);
      console.log(`      Corporate Client ID: ${client.corporate_client_id}`);
      console.log('      ---');
    });

    // 5. Verificar getCorporateClients
    console.log('\n📋 Paso 5: Ejecutando getCorporateClients...');
    const { data: corporateClients, error: corporateClientsError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id);
    
    if (corporateClientsError) {
      console.error('❌ Error en getCorporateClients:', corporateClientsError);
      return;
    }
    
    console.log(`✅ Clientes corporativos encontrados: ${corporateClients.length}`);
    corporateClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id}`);
      console.log(`      Email: ${client.contact_email}`);
      console.log(`      RUT: ${client.rut}`);
      console.log('      ---');
    });

    // 6. Simular el procesamiento completo que hace ClientsPage
    console.log('\n📋 Paso 6: Simulando procesamiento completo de ClientsPage...');
    
    // Crear deudores (como en ClientsPage)
    const mapByUser = new Map();
    for (const d of enrichedDebts) {
      const uid = d.user?.id || d.user_id;
      if (!uid) continue;
      if (!mapByUser.has(uid)) {
        mapByUser.set(uid, {
          id: uid,
          name: d.user?.full_name || 'Usuario',
          email: d.user?.email || '',
          phone: d.user?.phone || '',
          rut: d.user?.rut || '',
          totalDebt: 0,
          paidAmount: 0,
          pendingAmount: 0,
          lastPayment: null,
          status: 'active',
          companyName: company?.business_name || company?.name || 'Empresa',
          corporateClientName: d.client?.business_name || null,
          corporateClientId: d.client?.id || null,
          corporate_client_id: d.client?.id || null,
          firstDebtDate: d.created_at,
          type: 'debtor'
        });
      }
      const item = mapByUser.get(uid);
      const current = parseFloat(d.current_amount ?? d.amount ?? d.original_amount ?? 0);
      item.totalDebt += isNaN(current) ? 0 : current;
      
      if (d.status === 'completed') {
        item.status = 'completed';
      }
      if (!item.firstDebtDate || new Date(d.created_at) < new Date(item.firstDebtDate)) {
        item.firstDebtDate = d.created_at;
      }
      if (d.client?.business_name) item.corporateClientName = d.client.business_name;
      if (d.client?.id) {
        item.corporateClientId = d.client.id;
        item.corporate_client_id = d.client.id;
      }
    }

    // Crear clientes individuales (como en ClientsPage)
    const individualClientSummaries = (companyClients || []).map(client => {
      const associatedCorporate = (corporateClients || []).find(corp => corp.id === client.corporate_client_id);
      
      return {
        id: client.id,
        name: client.business_name || 'Cliente Individual',
        email: client.contact_email || '',
        phone: client.contact_phone || '',
        rut: client.rut || '',
        totalDebt: 0,
        paidAmount: 0,
        pendingAmount: 0,
        lastPayment: null,
        status: 'active',
        companyName: company?.business_name || company?.name || 'Empresa',
        corporateClientName: associatedCorporate?.contact_email || 'Sin cliente corporativo',
        corporateClientId: client.corporate_client_id,
        corporate_client_id: client.corporate_client_id,
        firstDebtDate: client.created_at,
        type: 'individual'
      };
    });

    // Combinar todos los clientes
    const allClientSummaries = [
      ...Array.from(mapByUser.values()),
      ...individualClientSummaries
    ];

    console.log(`✅ Total de clientes que debería mostrar la UI: ${allClientSummaries.length}`);
    console.log('📋 Clientes finales:');
    allClientSummaries.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} (${client.type})`);
      console.log(`      ID: ${client.id}`);
      console.log(`      Email: ${client.email}`);
      console.log(`      RUT: ${client.rut}`);
      console.log(`      Total Deuda: ${client.totalDebt}`);
      console.log(`      Estado: ${client.status}`);
      console.log(`      CorporateClientId: ${client.corporateClientId}`);
      console.log(`      corporate_client_id: ${client.corporate_client_id}`);
      console.log('      ---');
    });

    console.log('\n🎉 Análisis completado');
    console.log('==========================================================');

  } catch (error) {
    console.error('💥 Error en debugBrowserData:', error);
  }
}

debugBrowserData();