const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Reparación de Inconsistencias de Datos');
console.log('======================================\n');

async function fixDataInconsistencies() {
  try {
    // 1. Obtener datos actuales
    console.log('📊 Obteniendo datos actuales...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    if (companiesError) {
      console.error('❌ Error al obtener empresas:', companiesError.message);
      return;
    }
    
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');
    
    if (corporateError) {
      console.error('❌ Error al obtener clientes corporativos:', corporateError.message);
      return;
    }
    
    const { data: regularClients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) {
      console.error('❌ Error al obtener clientes:', clientsError.message);
      return;
    }
    
    console.log(`🏢 Empresas: ${companies.length}`);
    console.log(`🏢 Clientes Corporativos: ${corporateClients.length}`);
    console.log(`👥 Clientes Regulares: ${regularClients.length}`);
    
    // 2. Corregir clientes con datos undefined
    console.log('\n🔧 Corrigiendo clientes con datos undefined...');
    
    for (const client of regularClients) {
      if (!client.name || client.name === 'undefined' || !client.email || client.email === 'undefined') {
        console.log(`🔧 Corrigiendo cliente ${client.id}...`);
        
        // Buscar el cliente corporativo asociado
        const corporateClient = corporateClients.find(cc => cc.id === client.corporate_client_id);
        
        if (corporateClient) {
          const updateData = {
            name: `Cliente de ${corporateClient.contact_email}`,
            email: corporateClient.contact_email,
            phone: corporateClient.contact_phone
          };
          
          const { error: updateError } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id);
          
          if (updateError) {
            console.error(`❌ Error al actualizar cliente ${client.id}:`, updateError.message);
          } else {
            console.log(`✅ Cliente ${client.id} actualizado correctamente`);
          }
        }
      }
    }
    
    // 3. Eliminar cliente corporativo huérfano
    console.log('\n🗑️ Eliminando cliente corporativo huérfano...');
    
    const orphanCorporateClient = corporateClients.find(cc => !cc.company_id);
    if (orphanCorporateClient) {
      console.log(`🗑️ Eliminando cliente corporativo huérfano: ${orphanCorporateClient.id}`);
      
      // Primero actualizar los clientes regulares que apuntan a este cliente corporativo
      const { error: updateClientsError } = await supabase
        .from('clients')
        .update({ corporate_client_id: null })
        .eq('corporate_client_id', orphanCorporateClient.id);
      
      if (updateClientsError) {
        console.error('❌ Error al actualizar clientes asociados:', updateClientsError.message);
      } else {
        console.log('✅ Clientes asociados actualizados');
      }
      
      // Luego eliminar el cliente corporativo huérfano
      const { error: deleteError } = await supabase
        .from('corporate_clients')
        .delete()
        .eq('id', orphanCorporateClient.id);
      
      if (deleteError) {
        console.error('❌ Error al eliminar cliente corporativo huérfano:', deleteError.message);
      } else {
        console.log('✅ Cliente corporativo huérfano eliminado');
      }
    }
    
    // 4. Verificar deudas
    console.log('\n💰 Verificando deudas...');
    
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*');
    
    if (debtsError) {
      console.error('❌ Error al obtener deudas:', debtsError.message);
    } else {
      console.log(`📋 Total de deudas: ${debts.length}`);
      
      for (const debt of debts) {
        console.log(`\n   Deuda ID: ${debt.id}`);
        console.log(`   Monto: ${debt.amount || 'SIN MONTO'}`);
        console.log(`   Estado: ${debt.status || 'SIN ESTADO'}`);
        console.log(`   Company ID: ${debt.company_id || 'SIN COMPANY_ID'}`);
        console.log(`   Client ID: ${debt.client_id || 'SIN CLIENT_ID'}`);
        
        // Corregir deuda si falta información
        if (!debt.amount || !debt.status) {
          console.log(`🔧 Corrigiendo deuda ${debt.id}...`);
          
          const updateData = {};
          if (!debt.amount) updateData.amount = 100000;
          if (!debt.status) updateData.status = 'pending';
          
          const { error: updateDebtError } = await supabase
            .from('debts')
            .update(updateData)
            .eq('id', debt.id);
          
          if (updateDebtError) {
            console.error(`❌ Error al actualizar deuda ${debt.id}:`, updateDebtError.message);
          } else {
            console.log(`✅ Deuda ${debt.id} actualizada`);
          }
        }
      }
    }
    
    // 5. Verificación final
    console.log('\n🔍 Verificación final...');
    
    const { data: finalClients, error: finalClientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (finalClientsError) {
      console.error('❌ Error en verificación final:', finalClientsError.message);
    } else {
      console.log('\n👥 Estado final de clientes:');
      finalClients.forEach(client => {
        console.log(`   - ${client.name} (${client.email})`);
        console.log(`     Corporate Client ID: ${client.corporate_client_id || 'SIN ASOCIAR'}`);
      });
    }
    
    console.log('\n✅ Reparación completada');
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error.message);
  }
}

// Ejecutar reparación
fixDataInconsistencies().then(() => {
  console.log('\n✅ Proceso de reparación finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la reparación:', error);
  process.exit(1);
});