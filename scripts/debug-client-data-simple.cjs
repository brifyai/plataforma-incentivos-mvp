const { createClient } = require('@supabase/supabase-js');

// Configuración directa de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugClientData() {
  console.log('🔍 Iniciando depuración de datos de clientes y deudores...\n');

  try {
    // 1. Verificar empresas
    console.log('📋 1. Verificando empresas:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      console.error('❌ Error consultando empresas:', companiesError);
      return;
    }

    console.log(`📊 Empresas encontradas: ${companies.length}`);
    companies.forEach(company => {
      console.log(`   - ${company.id}: ${company.name} (${company.contact_email || company.email || 'sin email'})`);
    });

    // Buscar empresa por contacto_email o email
    let company = companies.find(c =>
      (c.contact_email && c.contact_email === 'empresa@nexupay.cl') ||
      (c.email && c.email === 'empresa@nexupay.cl')
    );

    if (!company) {
      console.log('❌ No se encontró la empresa empresa@nexupay.cl');
      console.log('🔍 Usando primera empresa disponible como fallback');
      if (companies.length === 0) {
        return;
      }
      company = companies[0];
    }

    console.log(`✅ Usando empresa: ${company.id} - ${company.name}\n`);

    // 2. Verificar clientes corporativos
    console.log('🏢 2. Verificando clientes corporativos:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id);

    if (corporateError) {
      console.error('❌ Error consultando clientes corporativos:', corporateError);
      return;
    }

    console.log(`📊 Clientes corporativos encontrados: ${corporateClients.length}`);
    corporateClients.forEach(client => {
      console.log(`   - ${client.id}: ${client.contact_name} (${client.contact_email})`);
    });

    // 3. Verificar clientes individuales
    console.log('\n👤 3. Verificando clientes individuales:');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);

    if (individualError) {
      console.error('❌ Error consultando clientes individuales:', individualError);
      return;
    }

    console.log(`📊 Clientes individuales encontrados: ${individualClients.length}`);
    console.log('🔍 Estructura de la tabla clients:');
    if (individualClients.length > 0) {
      console.log('   Campos disponibles:', Object.keys(individualClients[0]));
      console.log('   Valores:', JSON.stringify(individualClients[0], null, 2));
    }
    
    individualClients.forEach(client => {
      console.log(`   - ${client.id}: ${client.name || client.contact_name || 'undefined'} (${client.email || client.contact_email || 'undefined'}) - Corporate Client ID: ${client.corporate_client_id}`);
    });

    // 4. Verificar deudas
    console.log('\n💰 4. Verificando deudas:');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error consultando deudas:', debtsError);
      return;
    }

    console.log(`📊 Deudas encontradas: ${debts.length}`);
    debts.forEach(debt => {
      console.log(`   - ${debt.id}: ${debt.debtor_name} (${debt.debtor_rut}) - $${debt.amount} - Client ID: ${debt.client_id}`);
    });

    // 5. Analizar detalles de las deudas para encontrar deudores
    console.log('\n🧾 5. Analizando deudas para encontrar deudores:');
    
    // Obtener detalles completos de las deudas
    const { data: detailedDebts, error: detailedError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', company.id);

    if (detailedError) {
      console.error('❌ Error consultando detalles de deudas:', detailedError);
      return;
    }

    console.log(`📊 Deudas detalladas encontradas: ${detailedDebts.length}`);
    console.log('🔍 Estructura completa de la deuda:');
    if (detailedDebts.length > 0) {
      console.log('   Campos disponibles:', Object.keys(detailedDebts[0]));
      console.log('   Valores:', JSON.stringify(detailedDebts[0], null, 2));
    }
    
    detailedDebts.forEach(debt => {
      console.log(`   - Deuda ID: ${debt.id}`);
      console.log(`     • Debtor Name: ${debt.debtor_name || debt.name || 'undefined'}`);
      console.log(`     • Debtor RUT: ${debt.debtor_rut || debt.rut || 'undefined'}`);
      console.log(`     • Debtor Email: ${debt.debtor_email || debt.email || 'undefined'}`);
      console.log(`     • Amount: ${debt.amount || 'undefined'}`);
      console.log(`     • Client ID: ${debt.client_id || 'undefined'}`);
      console.log(`     • Status: ${debt.status || 'undefined'}`);
      console.log('');
    });

    // Extraer deudores únicos de las deudas
    const uniqueDebtors = [];
    const debtorMap = new Map();
    
    detailedDebts.forEach(debt => {
      const debtorName = debt.debtor_name || debt.name;
      const debtorRut = debt.debtor_rut || debt.rut;
      const debtorEmail = debt.debtor_email || debt.email;
      const key = `${debtorRut || debtorEmail || debtorName}`;
      
      if (!debtorMap.has(key) && (debtorName || debtorRut)) {
        debtorMap.set(key, {
          id: debt.id,
          name: debtorName,
          rut: debtorRut,
          email: debtorEmail,
          totalDebt: debt.amount || 0,
          debtCount: 1
        });
      } else if (debtorMap.has(key)) {
        const existing = debtorMap.get(key);
        existing.totalDebt += (debt.amount || 0);
        existing.debtCount += 1;
      }
    });

    const debtors = Array.from(debtorMap.values());
    console.log(`📊 Deudores únicos extraídos de deudas: ${debtors.length}`);
    debtors.forEach(debtor => {
      console.log(`   - ${debtor.name || 'Sin nombre'} (${debtor.rut || 'Sin RUT'}) - ${debtor.debtCount} deudas - $${debtor.totalDebt}`);
    });

    // 6. Verificar si hay problema con los datos y mostrar solución
    if (detailedDebts.length > 0 && !detailedDebts[0].debtor_name && !detailedDebts[0].name) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('   La deuda existe pero no tiene información del deudor');
      console.log('   Esto explica por qué no se muestran deudores en Gestión de Clientes');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Necesitamos actualizar la deuda con información del deudor');
      console.log('   o verificar la estructura correcta de la tabla debts');
    }

    // 6. Análisis final
    console.log('\n📈 6. Análisis final:');
    console.log(`   - Empresas: ${companies.length}`);
    console.log(`   - Clientes corporativos: ${corporateClients.length}`);
    console.log(`   - Clientes individuales: ${individualClients.length}`);
    console.log(`   - Deudas: ${debts.length}`);
    console.log(`   - Deudores: ${debtors.length}`);

    // Verificar si hay deudores que deberían mostrarse
    const debtorsWithDebts = debts.filter(debt => debt.debtor_rut);
    console.log(`   - Deudores con RUT en deudas: ${debtorsWithDebts.length}`);

    if (debtorsWithDebts.length > 0) {
      console.log('\n🎯 Deudores que deberían mostrarse en Gestión de Clientes:');
      debtorsWithDebts.forEach(debt => {
        const client = individualClients.find(c => c.id === debt.client_id);
        const corporateClient = corporateClients.find(cc => cc.id === (client?.corporate_client_id));
        
        console.log(`   - ${debtor.debtor_name} (${debtor.debtor_rut})`);
        console.log(`     → Deuda: $${debt.amount}`);
        console.log(`     → Cliente individual: ${client ? client.name : 'No asociado'}`);
        console.log(`     → Cliente corporativo: ${corporateClient ? corporateClient.contact_name : 'No asociado'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Error en la depuración:', error.message);
  }
}

// Ejecutar la depuración
debugClientData();