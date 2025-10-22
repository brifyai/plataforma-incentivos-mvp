const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMariaConchaAssociation() {
  try {
    console.log('🔧 Corrigiendo asociación de María Concha...\n');

    // 1. Obtener el cliente correcto para María Concha
    console.log('📋 Buscando cliente de María Concha...');
    const { data: mariaClient, error: mariaClientError } = await supabase
      .from('clients')
      .select('*')
      .eq('business_name', 'María Concha')
      .single();

    if (mariaClientError) {
      console.error('❌ Error buscando cliente de María Concha:', mariaClientError);
      return;
    }

    console.log(`✅ Cliente encontrado: ${mariaClient.business_name} (ID: ${mariaClient.id})`);

    // 2. Obtener la deuda de María Concha
    console.log('\n📋 Buscando deuda de María Concha...');
    const { data: mariaDebt, error: mariaDebtError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut)
      `)
      .eq('user_id', (await supabase
        .from('users')
        .select('id')
        .eq('full_name', 'María Concha')
        .single()
      ).data?.id)
      .single();

    if (mariaDebtError) {
      console.error('❌ Error buscando deuda de María Concha:', mariaDebtError);
      return;
    }

    console.log(`✅ Deuda encontrada: ID ${mariaDebt.id}, Monto: $${mariaDebt.current_amount}`);
    console.log(`   Client ID actual: ${mariaDebt.client_id || 'N/A'}`);
    console.log(`   Usuario: ${mariaDebt.user?.full_name} (${mariaDebt.user?.email})`);

    // 3. Actualizar la deuda para que apunte al cliente correcto
    console.log('\n🔧 Actualizando asociación...');
    const { error: updateError } = await supabase
      .from('debts')
      .update({
        client_id: mariaClient.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', mariaDebt.id);

    if (updateError) {
      console.error('❌ Error actualizando deuda:', updateError);
      return;
    }

    console.log('✅ Asociación actualizada correctamente');

    // 4. Verificar el resultado
    console.log('\n📋 Verificando resultado...');
    const { data: updatedDebt, error: verifyError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email)
      `)
      .eq('id', mariaDebt.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando actualización:', verifyError);
      return;
    }

    console.log('✅ Verificación exitosa:');
    console.log(`   Deuda ID: ${updatedDebt.id}`);
    console.log(`   Usuario: ${updatedDebt.user?.full_name}`);
    console.log(`   Cliente: ${updatedDebt.client?.business_name} (${updatedDebt.client?.contact_email})`);
    console.log(`   Monto: $${updatedDebt.current_amount}`);

    // 5. Verificar todos los clientes de la empresa
    console.log('\n📋 Verificando todos los clientes de la empresa...');
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', mariaClient.company_id);

    if (allClientsError) {
      console.error('❌ Error consultando todos los clientes:', allClientsError);
      return;
    }

    console.log(`✅ Total clientes en la empresa: ${allClients?.length || 0}`);
    allClients?.forEach(client => {
      console.log(`   - ${client.business_name} (${client.contact_email})`);
    });

    // 6. Verificar todas las deudas de la empresa
    console.log('\n📋 Verificando todas las deudas de la empresa...');
    const { data: allDebts, error: allDebtsError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email),
        client:clients(id, business_name, contact_email)
      `)
      .eq('company_id', mariaClient.company_id);

    if (allDebtsError) {
      console.error('❌ Error consultando todas las deudas:', allDebtsError);
      return;
    }

    console.log(`✅ Total deudas en la empresa: ${allDebts?.length || 0}`);
    allDebts?.forEach(debt => {
      console.log(`   - ${debt.user?.full_name || 'Usuario desconocido'} -> ${debt.client?.business_name || 'Sin cliente'} ($${debt.current_amount})`);
    });

    console.log('\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE');
    console.log('=====================================');
    console.log('✅ María Concha ahora está correctamente asociada como cliente');
    console.log('✅ La página de clientes debería mostrar los datos correctamente');

  } catch (error) {
    console.error('💥 Error en corrección:', error);
  }
}

// Ejecutar corrección
fixMariaConchaAssociation();