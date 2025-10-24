const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClientFlow() {
  console.log('🔍 Iniciando depuración del flujo de clientes...\n');

  try {
    // 1. Obtener empresa de usuario empresa@nexupay.cl
    console.log('📋 Paso 1: Obteniendo empresa de usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, role: user.role });

    // 2. Obtener empresa asociada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', { id: company.id, name: company.business_name });

    // 3. Replicar getCompanyDebts exactamente como está en ClientsPage
    console.log('\n📋 Paso 2: Replicando getCompanyDebts...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error en getCompanyDebts:', debtsError);
      return;
    }

    console.log(`✅ Encontradas ${debts.length} deudas`);

    // Enriquecer los datos con información del deudor desde clients (como está en databaseService.js)
    const enrichedDebts = (debts || []).map(debt => {
      const debtorName = debt.client?.business_name || debt.user?.full_name || 'Deudor desconocido';
      const debtorRut = debt.client?.rut || debt.user?.rut || null;
      const debtorEmail = debt.client?.contact_email || debt.user?.email || null;
      const debtorPhone = debt.client?.contact_phone || debt.user?.phone || null;

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

    console.log('✅ Deudas enriquecidas:', enrichedDebts.length);

    // 4. Replicar getCorporateClients exactamente como está en ClientsPage
    console.log('\n📋 Paso 3: Replicando getCorporateClients...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .order('contact_email');

    if (corporateError) {
      console.error('❌ Error en getCorporateClients:', corporateError);
      return;
    }

    console.log(`✅ Encontrados ${corporateClients.length} clientes corporativos`);

    // 5. Replicar getCompanyClients exactamente como está en ClientsPage
    console.log('\n📋 Paso 4: Replicando getCompanyClients...');
    const { data: companyClients, error: companyClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .order('business_name');

    if (companyClientsError) {
      console.error('❌ Error en getCompanyClients:', companyClientsError);
      return;
    }

    console.log(`✅ Encontrados ${companyClients.length} clientes individuales`);

    // 6. Replicar la lógica de combinación de ClientsPage
    console.log('\n📋 Paso 5: Replicando lógica de combinación de ClientsPage...');

    // Agrupar deudas por usuario (como está en ClientsPage)
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
          companyName: company.business_name,
          corporateClientName: d.client?.business_name || null,
          corporateClientId: d.client?.id || null,
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

    console.log(`✅ Deudores procesados: ${mapByUser.size}`);

    // Crear resúmenes de clientes corporativos
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
      companyName: company.business_name,
      corporateClientName: client.contact_email,
      corporateClientId: client.id,
      corporate_client_id: null,
      firstDebtDate: client.created_at,
      type: 'corporate'
    }));

    console.log(`✅ Clientes corporativos procesados: ${corporateClientSummaries.length}`);

    // Crear resúmenes de clientes individuales
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
        companyName: company.business_name,
        corporateClientName: associatedCorporate?.contact_email || 'Sin cliente corporativo',
        corporateClientId: client.corporate_client_id,
        corporate_client_id: client.corporate_client_id,
        firstDebtDate: client.created_at,
        type: 'individual'
      };
    });

    console.log(`✅ Clientes individuales procesados: ${individualClientSummaries.length}`);

    // Combinar clientes como está en ClientsPage - SOLO DEUDORES CON DEUDA
    const allClientSummaries = Array.from(mapByUser.values()) // Solo deudores con deudas
      .filter(debtor => debtor.totalDebt > 0) // Solo deudores con deuda mayor a 0
      .sort((a, b) => {
        // Ordenar por: mayor deuda primero
        return b.totalDebt - a.totalDebt;
      });

    console.log(`\n✅ RESUMEN FINAL - Clientes combinados: ${allClientSummaries.length}`);
    console.log('📋 Detalle de clientes combinados:');
    allClientSummaries.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name} (${client.type})`);
      console.log(`     ID: ${client.id}`);
      console.log(`     Deuda Total: $${client.totalDebt.toLocaleString()}`);
      console.log(`     Estado: ${client.status}`);
      console.log(`     Cliente Corporativo: ${client.corporateClientName || 'None'}`);
      console.log(`     Corporate Client ID: ${client.corporateClientId}`);
      console.log('');
    });

    // 7. Verificar si María Concha está en la lista
    console.log('🔍 Buscando a María Concha...');
    const mariaConcha = allClientSummaries.find(client => 
      client.name?.toLowerCase().includes('maría') || 
      client.name?.toLowerCase().includes('maria') ||
      client.rut === '16610128-k'
    );

    if (mariaConcha) {
      console.log('✅ María Concha encontrada:');
      console.log('   Nombre:', mariaConcha.name);
      console.log('   Tipo:', mariaConcha.type);
      console.log('   ID:', mariaConcha.id);
      console.log('   Deuda Total:', mariaConcha.totalDebt);
      console.log('   Cliente Corporativo:', mariaConcha.corporateClientName);
    } else {
      console.log('❌ María Concha NO encontrada en la lista combinada');
    }

  } catch (error) {
    console.error('💥 Error en la depuración:', error);
  }
}

debugClientFlow();