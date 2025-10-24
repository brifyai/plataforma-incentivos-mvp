require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCompleteFilter() {
  try {
    console.log('🔍 Debug completo del filtro de Cliente Corporativo');
    console.log('================================================');

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

    // 3. Obtener clientes corporativos (como lo hace loadCorporateClients en ClientsPage)
    console.log('\n📋 Paso 3: Obteniendo clientes corporativos...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .order('contact_email');

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
      return;
    }
    console.log(`✅ Clientes corporativos encontrados: ${corporateClients.length}`);
    corporateClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id}`);
      console.log(`      Email: ${client.contact_email}`);
      console.log(`      RUT: ${client.rut}`);
      console.log('      ---');
    });

    // 4. Normalizar clientes corporativos (como lo hace ClientsPage)
    console.log('\n📋 Paso 4: Normalizando clientes corporativos...');
    const normalizedCorporateClients = (corporateClients || []).map((c) => ({
      id: c.id,
      company_name: c.contact_email || 'Cliente',
      company_rut: c.rut || '',
      industry: c.industry || '',
      contract_value: null,
      status: 'active',
      created_at: c.created_at || null
    }));
    console.log('✅ Clientes corporativos normalizados:', normalizedCorporateClients);

    // 5. Obtener clientes individuales (como lo hace getCompanyClients)
    console.log('\n📋 Paso 5: Obteniendo clientes individuales...');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);

    if (individualError) {
      console.error('❌ Error obteniendo clientes individuales:', individualError);
      return;
    }
    console.log(`✅ Clientes individuales encontrados: ${individualClients.length}`);
    individualClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id}`);
      console.log(`      Nombre: ${client.business_name}`);
      console.log(`      Email: ${client.contact_email}`);
      console.log(`      RUT: ${client.rut}`);
      console.log(`      Corporate Client ID: ${client.corporate_client_id}`);
      console.log('      ---');
    });

    // 6. Obtener deudas (como lo hace getCompanyDebts)
    console.log('\n📋 Paso 6: Obteniendo deudas...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
      return;
    }
    console.log(`✅ Deudas encontradas: ${debts.length}`);
    debts.forEach((debt, index) => {
      console.log(`   ${index + 1}. ID Deuda: ${debt.id}`);
      console.log(`      Monto: ${debt.current_amount || debt.amount}`);
      console.log(`      Client ID: ${debt.client_id}`);
      console.log(`      Usuario: ${debt.user?.full_name} (${debt.user?.email})`);
      console.log(`      Cliente: ${debt.client?.business_name} (${debt.client?.contact_email})`);
      console.log('      ---');
    });

    // 7. Simular el proceso completo de ClientsPage
    console.log('\n📋 Paso 7: Simulando proceso completo de ClientsPage...');
    
    // Agrupar pagos por usuario (simulado)
    const payByUser = {};
    
    // Crear deudores con deudas
    const mapByUser = new Map();
    for (const d of debts) {
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
          corporate_client_id: d.client?.id || null, // ← Agregar ambos formatos
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
        item.corporate_client_id = d.client.id; // ← Agregar ambos formatos
      }
    }

    // Aplicar pagos a deudores
    mapByUser.forEach((item, uid) => {
      const pay = payByUser[uid];
      item.paidAmount = pay ? pay.total : 0;
      item.lastPayment = pay && pay.last ? pay.last.toISOString() : null;
      item.pendingAmount = Math.max(item.totalDebt - item.paidAmount, 0);
      if (item.pendingAmount <= 0 && item.totalDebt > 0) {
        item.status = 'completed';
      }
    });

    // Crear clientes corporativos
    const corporateClientSummaries = (corporateClients || []).map(client => ({
      id: client.id,
      name: client.contact_email || 'Cliente Corporativo',
      email: client.contact_email || '',
      phone: client.contact_phone || '',
      rut: client.rut || '',
      totalDebt: 0,
      paidAmount: 0,
      pendingAmount: 0,
      lastPayment: null,
      status: 'corporate',
      companyName: company?.business_name || company?.name || 'Empresa',
      corporateClientName: client.contact_email,
      corporateClientId: client.id,
      corporate_client_id: null, // ← Los clientes corporativos no tienen padre
      firstDebtDate: client.created_at,
      type: 'corporate'
    }));

    // Crear clientes individuales
    const individualClientSummaries = (individualClients || []).map(client => {
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
        corporate_client_id: client.corporate_client_id, // ← Agregar ambos formatos
        firstDebtDate: client.created_at,
        type: 'individual'
      };
    });

    // Combinar todos los clientes
    const allClientSummaries = [
      ...Array.from(mapByUser.values()),
      ...corporateClientSummaries,
      ...individualClientSummaries
    ];

    console.log(`✅ Total de clientes combinados: ${allClientSummaries.length}`);
    
    // 8. Simular el filtro para cada cliente corporativo
    console.log('\n📋 Paso 8: Simulando filtro por cliente corporativo...');
    
    for (const corporateClient of normalizedCorporateClients) {
      console.log(`\n🔍 Filtrando por cliente corporativo: ${corporateClient.company_name} (${corporateClient.id})`);
      
      const filtered = allClientSummaries.filter(client => 
        client.corporateClientId === corporateClient.id || 
        client.corporate_client_id === corporateClient.id
      );
      
      console.log(`✅ Clientes que coinciden: ${filtered.length}`);
      filtered.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (${client.type})`);
        console.log(`      corporateClientId: ${client.corporateClientId}`);
        console.log(`      corporate_client_id: ${client.corporate_client_id}`);
        console.log('      ---');
      });
    }

    console.log('\n🎉 Análisis completado');
    console.log('================================================');

  } catch (error) {
    console.error('💥 Error en debugCompleteFilter:', error);
  }
}

debugCompleteFilter();