/**
 * Test script to verify debtors are being loaded correctly in Client Management
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDebtorsDisplay() {
  try {
    console.log('🔍 Verificando display de deudores en Gestión de Clientes...\n');

    // 1. Obtener la empresa empresa@nexupay.cl
    console.log('📋 Paso 1: Obteniendo empresa empresa@nexupay.cl...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();

    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', {
      id: company.id,
      name: company.business_name,
      email: company.business_email
    });

    // 2. Probar la función getCompanyDebts directamente
    console.log('\n📋 Paso 2: Probando getCompanyDebts...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut, phone),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error en getCompanyDebts:', debtsError);
      return;
    }

    console.log(`✅ Found ${debts.length} debts for company ${company.id}`);

    // Enriquecer los datos como lo hace la función real
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

    console.log('\n📊 Deudas enriquecidas:');
    enrichedDebts.forEach((debt, index) => {
      console.log(`  ${index + 1}. ${debt.debtor_name} (${debt.debtor_rut}) - $${debt.current_amount || debt.amount || 0}`);
      console.log(`     Email: ${debt.debtor_email}`);
      console.log(`     Teléfono: ${debt.debtor_phone}`);
      console.log(`     Descripción: ${debt.description}`);
      console.log(`     Estado: ${debt.status}`);
      console.log(`     Cliente ID: ${debt.client_id}`);
      console.log(`     User ID: ${debt.user_id}`);
      console.log('');
    });

    // 3. Verificar estructura de datos para ClientManagement
    console.log('📋 Paso 3: Verificando estructura de datos para ClientManagement...');
    
    // Agrupar por usuario como lo hace ClientsPage
    const mapByUser = new Map();
    for (const d of enrichedDebts) {
      const uid = d.user?.id || d.user_id;
      if (!uid) continue;
      
      if (!mapByUser.has(uid)) {
        mapByUser.set(uid, {
          id: uid,
          name: d.debtor_name,
          email: d.debtor_email,
          phone: d.debtor_phone,
          rut: d.debtor_rut,
          totalDebt: 0,
          paidAmount: 0,
          pendingAmount: 0,
          lastPayment: null,
          status: 'active',
          companyName: company.business_name,
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
    }

    const debtorSummaries = Array.from(mapByUser.values());
    
    console.log(`✅ Generated ${debtorSummaries.length} debtor summaries for ClientManagement:`);
    debtorSummaries.forEach((debtor, index) => {
      console.log(`  ${index + 1}. ${debtor.name} (${debtor.rut})`);
      console.log(`     Type: ${debtor.type}`);
      console.log(`     Total Debt: $${debtor.totalDebt}`);
      console.log(`     Status: ${debtor.status}`);
      console.log(`     Corporate Client: ${debtor.corporateClientName || 'None'}`);
      console.log(`     Corporate Client ID: ${debtor.corporateClientId}`);
      console.log('');
    });

    // 4. Verificar clientes corporativos e individuales
    console.log('📋 Paso 4: Verificando clientes corporativos e individuales...');
    
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id);

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
    } else {
      console.log(`✅ Found ${corporateClients.length} corporate clients`);
    }

    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);

    if (individualError) {
      console.error('❌ Error obteniendo clientes individuales:', individualError);
    } else {
      console.log(`✅ Found ${individualClients.length} individual clients`);
    }

    // 5. Simular combinación final como lo hace ClientsPage
    console.log('\n📋 Paso 5: Simulando combinación final de ClientsPage...');
    
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
        companyName: company.business_name,
        corporateClientName: associatedCorporate?.contact_email || 'Sin cliente corporativo',
        corporateClientId: client.corporate_client_id,
        corporate_client_id: client.corporate_client_id,
        firstDebtDate: client.created_at,
        type: 'individual'
      };
    });

    const allClientSummaries = [
      ...debtorSummaries,
      ...corporateClientSummaries,
      ...individualClientSummaries
    ];

    console.log(`✅ Combined ${allClientSummaries.length} total clients for display:`);
    console.log(`   - Debtors: ${debtorSummaries.length}`);
    console.log(`   - Corporate Clients: ${corporateClientSummaries.length}`);
    console.log(`   - Individual Clients: ${individualClientSummaries.length}`);

    console.log('\n📊 Resumen final para ClientManagement:');
    allClientSummaries.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name} (${client.type})`);
      console.log(`     ID: ${client.id}`);
      console.log(`     Email: ${client.email}`);
      console.log(`     RUT: ${client.rut}`);
      console.log(`     Total Debt: $${client.totalDebt}`);
      console.log(`     Status: ${client.status}`);
      console.log(`     Corporate Client ID: ${client.corporateClientId}`);
      console.log(`     Corporate Client Name: ${client.corporateClientName}`);
      console.log('');
    });

    console.log('🎉 Verificación completada. Los deudores deberían mostrarse correctamente en ClientManagement.');

  } catch (error) {
    console.error('💥 Error en testDebtorsDisplay:', error);
  }
}

testDebtorsDisplay();