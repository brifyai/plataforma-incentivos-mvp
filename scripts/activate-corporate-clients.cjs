const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateCorporateClients() {
  console.log('🔧 Activando clientes corporativos inactivos\n');

  try {
    // 1. Obtener todos los clientes corporativos inactivos
    const { data: inactiveClients, error: fetchError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('is_active', false);

    if (fetchError) {
      console.error('❌ Error al obtener clientes corporativos inactivos:', fetchError);
      return;
    }

    if (inactiveClients.length === 0) {
      console.log('✅ No hay clientes corporativos inactivos');
      return;
    }

    console.log(`📋 Se encontraron ${inactiveClients.length} clientes corporativos inactivos:`);
    inactiveClients.forEach(client => {
      console.log(`   - ID: ${client.id}`);
      console.log(`     Nombre: ${client.company_name || client.contact_email}`);
      console.log(`     Email: ${client.contact_email}`);
      console.log(`     Company ID: ${client.company_id}`);
    });
    console.log('');

    // 2. Activar todos los clientes corporativos inactivos
    console.log('🔄 Activando clientes corporativos...');
    
    const { data: updatedClients, error: updateError } = await supabase
      .from('corporate_clients')
      .update({ is_active: true })
      .eq('is_active', false)
      .select();

    if (updateError) {
      console.error('❌ Error al activar clientes corporativos:', updateError);
      return;
    }

    console.log(`✅ Se activaron ${updatedClients.length} clientes corporativos:`);
    updatedClients.forEach(client => {
      console.log(`   - ✅ ${client.company_name || client.contact_email} (ID: ${client.id})`);
    });
    console.log('');

    // 3. Verificar el estado final
    console.log('🔍 Verificando estado final:');
    const { data: allClients, error: verifyError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (verifyError) {
      console.error('❌ Error al verificar estado final:', verifyError);
      return;
    }

    const activeCount = allClients.filter(c => c.is_active).length;
    const inactiveCount = allClients.filter(c => !c.is_active).length;

    console.log(`   📊 Total de clientes corporativos: ${allClients.length}`);
    console.log(`   ✅ Activos: ${activeCount}`);
    console.log(`   ❌ Inactivos: ${inactiveCount}`);
    console.log('');

    // 4. Mostrar información específica de empresa@nexupay.cl
    console.log('🏢 Estado específico de empresa@nexupay.cl:');
    const empresaClient = allClients.find(c => c.contact_email === 'empresa@nexupay.cl');
    if (empresaClient) {
      console.log(`   ✅ empresa@nexupay.cl está ${empresaClient.is_active ? 'ACTIVO' : 'INACTIVO'}`);
      console.log(`   📋 ID: ${empresaClient.id}`);
      console.log(`   🏢 Company ID: ${empresaClient.company_id}`);
    } else {
      console.log('   ❌ No se encontró el cliente corporativo empresa@nexupay.cl');
    }

    // 5. Verificar clientes individuales asociados
    console.log('');
    console.log('👥 Verificando clientes individuales asociados:');
    const { data: individualClients } = await supabase
      .from('clients')
      .select('*')
      .in('corporate_client_id', updatedClients.map(c => c.id));

    if (individualClients && individualClients.length > 0) {
      console.log(`✅ Se encontraron ${individualClients.length} clientes individuales que ahora deberían ser visibles:`);
      individualClients.forEach(client => {
        const corporate = updatedClients.find(c => c.id === client.corporate_client_id);
        console.log(`   - 👤 ${client.business_name || 'Sin nombre'} (${client.rut})`);
        console.log(`     🏢 Asociado a: ${corporate?.company_name || corporate?.contact_email}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

activateCorporateClients();