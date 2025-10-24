const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClientIdColumnIssue() {
  try {
    console.log('🔍 Diagnosticando problema con columna client_id...');

    // 1. Verificar si la columna client_id realmente existe en debts
    console.log('\n📋 Verificando estructura de tabla debts...');
    
    // Usar una consulta simple para verificar si podemos filtrar por client_id
    const { data: testClientData, error: testClientError } = await supabase
      .from('debts')
      .select('id, client_id, company_id, user_id')
      .limit(1);

    if (testClientError) {
      console.error('❌ Error al verificar tabla debts:', testClientError);
      return;
    }

    console.log('✅ Tabla debts accesible');

    // 2. Verificar deudas con client_id no nulo
    const { data: debtsWithClientId, error: debtsError } = await supabase
      .from('debts')
      .select('id, client_id, company_id, user_id')
      .not('client_id', 'is', null)
      .limit(10);

    if (debtsError) {
      console.error('❌ Error al consultar deudas con client_id:', debtsError);
      return;
    }

    console.log(`📊 Encontradas ${debtsWithClientId?.length || 0} deudas con client_id no nulo`);

    // 3. Verificar clientes existentes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, business_name, company_id')
      .limit(10);

    if (clientsError) {
      console.error('❌ Error al consultar clients:', clientsError);
      return;
    }

    console.log(`📊 Encontrados ${clients?.length || 0} clientes en la tabla clients`);

    // 4. Verificar específicamente a María Concha
    console.log('\n🔍 Buscando a María Concha...');
    
    const { data: mariaClients, error: mariaError } = await supabase
      .from('clients')
      .select('*')
      .ilike('business_name', '%maría%')
      .or('business_name.ilike.%Maria%');

    if (mariaError) {
      console.error('❌ Error buscando a María Concha:', mariaError);
    } else {
      console.log(`📋 Encontrados ${mariaClients?.length || 0} clientes con "María" en el nombre`);
      if (mariaClients && mariaClients.length > 0) {
        mariaClients.forEach(client => {
          console.log(`  - ${client.business_name} (ID: ${client.id}, Company: ${client.company_id})`);
        });
      }
    }

    // 5. Verificar deudas de empresa@nexupay.cl
    console.log('\n🔍 Buscando empresa@nexupay.cl...');
    
    const { data: empresaUser, error: empresaUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (empresaUserError) {
      console.error('❌ Error buscando usuario empresa@nexupay.cl:', empresaUserError);
      return;
    }

    const { data: empresaCompany, error: empresaCompanyError } = await supabase
      .from('companies')
      .select('id, business_name')
      .eq('user_id', empresaUser.id)
      .single();

    if (empresaCompanyError) {
      console.error('❌ Error buscando empresa de empresa@nexupay.cl:', empresaCompanyError);
      return;
    }

    console.log(`✅ Empresa encontrada: ${empresaCompany.business_name} (ID: ${empresaCompany.id})`);

    // 6. Verificar deudas de esta empresa
    const { data: empresaDebts, error: empresaDebtsError } = await supabase
      .from('debts')
      .select(`
        id,
        client_id,
        company_id,
        user_id,
        current_amount,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email)
      `)
      .eq('company_id', empresaCompany.id);

    if (empresaDebtsError) {
      console.error('❌ Error consultando deudas de la empresa:', empresaDebtsError);
      return;
    }

    console.log(`📊 Deudas de ${empresaCompany.business_name}: ${empresaDebts?.length || 0}`);
    
    if (empresaDebts && empresaDebts.length > 0) {
      empresaDebts.forEach(debt => {
        console.log(`  - Deuda ID: ${debt.id}`);
        console.log(`    Usuario: ${debt.user?.full_name || 'N/A'} (${debt.user?.email || 'N/A'})`);
        console.log(`    Cliente ID: ${debt.client_id || 'N/A'}`);
        console.log(`    Cliente: ${debt.client?.business_name || 'N/A'}`);
        console.log(`    Monto: $${debt.current_amount || 0}`);
        console.log('');
      });
    }

    // 7. Verificar clientes de esta empresa
    const { data: empresaClients, error: empresaClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', empresaCompany.id);

    if (empresaClientsError) {
      console.error('❌ Error consultando clientes de la empresa:', empresaClientsError);
      return;
    }

    console.log(`📊 Clientes de ${empresaCompany.business_name}: ${empresaClients?.length || 0}`);
    
    if (empresaClients && empresaClients.length > 0) {
      empresaClients.forEach(client => {
        console.log(`  - ${client.business_name} (ID: ${client.id}, Email: ${client.contact_email})`);
      });
    }

    // 8. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('===================');
    
    if (empresaDebts && empresaDebts.length > 0) {
      const debtsWithClientAssociation = empresaDebts.filter(d => d.client_id && d.client);
      const debtsWithoutClientAssociation = empresaDebts.filter(d => !d.client_id || !d.client);
      
      console.log(`✅ Deudas con asociación de cliente correcta: ${debtsWithClientAssociation.length}`);
      console.log(`⚠️  Deudas sin asociación de cliente: ${debtsWithoutClientAssociation.length}`);
      
      if (debtsWithoutClientAssociation.length > 0) {
        console.log('\n🔧 ACCIONES RECOMENDADAS:');
        console.log('1. La función getCompanyDebts necesita ser corregida');
        console.log('2. Eliminar la verificación de information_schema');
        console.log('3. Asumir que client_id existe y usarlo correctamente');
      }
    } else {
      console.log('⚠️  No hay deudas para esta empresa');
    }

    if (empresaClients && empresaClients.length > 0) {
      console.log(`✅ Clientes registrados: ${empresaClients.length}`);
      console.log('✅ La tabla clients está funcionando correctamente');
    } else {
      console.log('❌ No hay clientes registrados para esta empresa');
    }

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
fixClientIdColumnIssue();