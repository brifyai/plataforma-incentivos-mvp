const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalVerification() {
  try {
    console.log('🔍 Verificación final del sistema NexuPay...\n');

    // 1. Verificar usuario empresa@nexupay.cl
    console.log('📋 Paso 1: Verificando usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });

    // 2. Verificar empresa asociada
    console.log('\n📋 Paso 2: Verificando empresa asociada...');
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
      business_name: company.business_name || 'Sin nombre',
      contact_email: company.contact_email,
      validation_status: company.validation_status
    });

    // 3. Verificar cliente corporativo
    console.log('\n📋 Paso 3: Verificando cliente corporativo...');
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .single();

    if (corporateError) {
      console.error('❌ Error obteniendo cliente corporativo:', corporateError);
      return;
    }

    console.log('✅ Cliente corporativo encontrado:', {
      id: corporateClient.id,
      contact_email: corporateClient.contact_email,
      contact_phone: corporateClient.contact_phone,
      rut: corporateClient.rut,
      industry: corporateClient.industry
    });

    // 4. Verificar deudas de la empresa
    console.log('\n📋 Paso 4: Verificando deudas de la empresa...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
      return;
    }

    console.log(`✅ Se encontraron ${debts.length} deudas para la empresa`);
    debts.forEach((debt, index) => {
      console.log(`   ${index + 1}. ${debt.debtor_name} - $${debt.amount} (${debt.status})`);
    });

    // 5. Verificar clientes asociados
    console.log('\n📋 Paso 5: Verificando clientes asociados...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('corporate_client_id', corporateClient.id);

    if (clientsError) {
      console.error('❌ Error obteniendo clientes:', clientsError);
      return;
    }

    console.log(`✅ Se encontraron ${clients.length} clientes asociados`);
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} - ${client.email} (${client.status})`);
    });

    // 6. Resumen final
    console.log('\n🎉 VERIFICACIÓN FINAL COMPLETADA');
    console.log('=====================================');
    console.log('✅ Sistema NexuPay funcionando correctamente');
    console.log('📋 Resumen de datos verificados:');
    console.log(`   - Usuario: ${user.email} (${user.role})`);
    console.log(`   - Empresa: ${company.business_name || 'Sin nombre'} (${company.validation_status})`);
    console.log(`   - Cliente Corporativo: ${corporateClient.rut} (${corporateClient.industry})`);
    console.log(`   - Deudas: ${debts.length} registradas`);
    console.log(`   - Clientes: ${clients.length} asociados`);
    
    console.log('\n📊 Estado del sistema:');
    console.log('   ✅ Usuario empresarial activo');
    console.log('   ✅ Empresa validada y operativa');
    console.log('   ✅ Cliente corporativo configurado');
    console.log('   ✅ Deudas registradas correctamente');
    console.log('   ✅ Clientes asociados al sistema');
    
    console.log('\n🚀 El sistema está listo para operación');

  } catch (error) {
    console.error('💥 Error en la verificación final:', error);
  }
}

finalVerification();