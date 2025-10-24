require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function verifyTestData() {
  try {
    console.log('🔍 Verificando datos de prueba...');

    // 1. Verificar deudas creadas
    console.log('\n📋 DEUDAS:');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        id,
        original_amount,
        current_amount,
        status,
        user_id,
        company_id,
        client_id,
        users!debts_user_id_fkey (
          full_name,
          rut
        ),
        companies!debts_company_id_fkey (
          company_name,
          contact_email
        ),
        clients!debts_client_id_fkey (
          business_name
        )
      `)
      .order('created_at', { ascending: false });

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
    } else {
      console.log(`✅ Encontradas ${debts.length} deudas:`);
      debts.forEach(debt => {
        console.log(`   - ${debt.users?.full_name} (${debt.users?.rut}) - $${debt.current_amount} - Empresa: ${debt.companies?.company_name}`);
      });
    }

    // 2. Verificar clientes individuales
    console.log('\n👥 CLIENTES INDIVIDUALES:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        business_name,
        email,
        rut,
        corporate_client_id,
        corporate_clients!clients_corporate_client_id_fkey (
          business_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('❌ Error obteniendo clientes:', clientsError);
    } else {
      console.log(`✅ Encontrados ${clients.length} clientes individuales:`);
      clients.forEach(client => {
        console.log(`   - ${client.business_name} (${client.rut}) - Corporativo: ${client.corporate_clients?.business_name || 'N/A'}`);
      });
    }

    // 3. Verificar clientes corporativos
    console.log('\n🏢 CLIENTES CORPORATIVOS:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select(`
        id,
        business_name,
        email,
        company_id,
        companies!corporate_clients_company_id_fkey (
          company_name,
          contact_email
        )
      `)
      .order('created_at', { ascending: false });

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
    } else {
      console.log(`✅ Encontrados ${corporateClients.length} clientes corporativos:`);
      corporateClients.forEach(corp => {
        console.log(`   - ${corp.business_name} (${corp.email}) - Empresa: ${corp.companies?.company_name}`);
      });
    }

    // 4. Verificar usuarios
    console.log('\n👤 USUARIOS:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, rut, role')
      .eq('rut', '16610128-k');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`✅ Usuario María Concha encontrado:`);
      users.forEach(user => {
        console.log(`   - ${user.full_name} (${user.rut}) - ${user.email} - Rol: ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyTestData();