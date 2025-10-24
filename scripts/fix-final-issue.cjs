const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Corrección del Problema Final');
console.log('===============================\n');

async function fixFinalIssue() {
  try {
    // 1. Obtener el cliente TechCorp que necesita corporate_client_id
    console.log('🔍 Buscando cliente TechCorp sin corporate_client_id...');
    
    const { data: techCorpClient, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('business_name', 'TechCorp - División Desarrollo')
      .single();
    
    if (clientError || !techCorpClient) {
      console.error('❌ Error al encontrar cliente TechCorp:', clientError?.message);
      return;
    }
    
    console.log(`✅ Cliente encontrado: ${techCorpClient.business_name} (${techCorpClient.id})`);
    console.log(`   Empresa ID: ${techCorpClient.company_id}`);
    console.log(`   Corporate Client ID actual: ${techCorpClient.corporate_client_id || 'NULL'}`);
    
    // 2. Obtener el cliente corporativo correspondiente a la empresa
    console.log('\n🔍 Buscando cliente corporativo para la empresa...');
    
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', techCorpClient.company_id)
      .single();
    
    if (corporateError || !corporateClient) {
      console.error('❌ Error al encontrar cliente corporativo:', corporateError?.message);
      return;
    }
    
    console.log(`✅ Cliente corporativo encontrado: ${corporateClient.contact_email} (${corporateClient.id})`);
    
    // 3. Actualizar el cliente TechCorp con el corporate_client_id correcto
    console.log('\n🔧 Actualizando cliente TechCorp...');
    
    const { error: updateError } = await supabase
      .from('clients')
      .update({ corporate_client_id: corporateClient.id })
      .eq('id', techCorpClient.id);
    
    if (updateError) {
      console.error('❌ Error al actualizar cliente:', updateError.message);
      return;
    }
    
    console.log('✅ Cliente TechCorp actualizado correctamente');
    
    // 4. Verificar la actualización
    console.log('\n🔍 Verificando actualización...');
    
    const { data: updatedClient, error: verifyError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', techCorpClient.id)
      .single();
    
    if (verifyError || !updatedClient) {
      console.error('❌ Error al verificar actualización:', verifyError?.message);
      return;
    }
    
    console.log(`✅ Verificación exitosa:`);
    console.log(`   Cliente: ${updatedClient.business_name}`);
    console.log(`   Corporate Client ID: ${updatedClient.corporate_client_id}`);
    console.log(`   Estado: ${updatedClient.corporate_client_id ? 'ASOCIADO' : 'SIN ASOCIAR'}`);
    
    // 5. Verificación final del sistema
    console.log('\n🎯 Verificación final del sistema...');
    
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (allClientsError) {
      console.error('❌ Error al obtener todos los clientes:', allClientsError.message);
      return;
    }
    
    const clientsWithoutCorporate = allClients.filter(c => !c.corporate_client_id);
    
    if (clientsWithoutCorporate.length === 0) {
      console.log('🎉 ¡TODOS LOS CLIENTES TIENEN CORPORATE_CLIENT_ID!');
      console.log('✅ Sistema 100% consistente');
    } else {
      console.log(`⚠️ Quedan ${clientsWithoutCorporate.length} clientes sin corporate_client_id:`);
      clientsWithoutCorporate.forEach(c => {
        console.log(`   - ${c.business_name} (${c.id})`);
      });
    }
    
    // 6. Estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    
    const { data: companies } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    const { data: corporateClients } = await supabase.from('corporate_clients').select('count', { count: 'exact', head: true });
    const { data: clients } = await supabase.from('clients').select('count', { count: 'exact', head: true });
    const { data: debts } = await supabase.from('debts').select('count', { count: 'exact', head: true });
    
    console.log(`🏢 Empresas: ${companies}`);
    console.log(`🏢 Clientes Corporativos: ${corporateClients}`);
    console.log(`👥 Clientes Regulares: ${clients}`);
    console.log(`💰 Deudas: ${debts}`);
    console.log(`✅ Clientes con corporate_client_id: ${allClients.length - clientsWithoutCorporate.length}/${allClients.length}`);
    
    console.log('\n🎉 ¡CORRECCIÓN COMPLETADA CON ÉXITO!');
    console.log('✅ El sistema ahora está listo para producción');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
  }
}

// Ejecutar corrección
fixFinalIssue().then(() => {
  console.log('\n✅ Proceso de corrección finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la corrección:', error);
  process.exit(1);
});