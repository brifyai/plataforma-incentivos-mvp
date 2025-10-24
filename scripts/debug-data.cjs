const { createClient } = require('@supabase/supabase-js');

// Configuración directa de Supabase (desde .env)
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const debugData = async () => {
  try {
    console.log('🔍 DEBUG COMPLETO DE DATOS');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 1. Verificar empresas
    console.log('\n📊 1. VERIFICANDO EMPRESAS...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, validation_status, user_id');
    
    if (companiesError) {
      console.error('❌ Error en companies:', companiesError);
    } else {
      console.log('📊 EMPRESAS:', companies);
    }
    
    // 2. Verificar corporate_clients
    console.log('\n🏢 2. VERIFICANDO CORPORATE_CLIENTS...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');
    
    if (corporateError) {
      console.error('❌ Error en corporate_clients:', corporateError);
    } else {
      console.log('🏢 CORPORATE_CLIENTS:', corporateClients);
    }
    
    // 3. Verificar clients
    console.log('\n👥 3. VERIFICANDO CLIENTS...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) {
      console.error('❌ Error en clients:', clientsError);
    } else {
      console.log('👥 CLIENTS:', clients);
    }
    
    // 4. Verificar debts
    console.log('\n💰 4. VERIFICANDO DEBTS...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*');
    
    if (debtsError) {
      console.error('❌ Error en debts:', debtsError);
    } else {
      console.log('💰 DEBTS:', debts);
    }
    
    // 5. Verificar users
    console.log('\n👤 5. VERIFICANDO USERS...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (usersError) {
      console.error('❌ Error en users:', usersError);
    } else {
      console.log('👤 USERS:', users);
    }
    
    // 6. Análisis de relaciones
    console.log('\n🔗 6. ANÁLISIS DE RELACIONES...');
    
    if (companies && companies.length > 0) {
      for (const company of companies) {
        console.log(`\n📋 Empresa: ${company.company_name} (${company.id})`);
        
        // Buscar corporate_client asociado
        const corporateClient = corporateClients?.find(cc => cc.company_id === company.id);
        if (corporateClient) {
          console.log(`  ✅ Tiene corporate_client: ${corporateClient.contact_email || 'Sin email'}`);
          
          // Buscar clientes individuales asociados
          const individualClients = clients?.filter(c => c.corporate_client_id === corporateClient.id);
          if (individualClients && individualClients.length > 0) {
            console.log(`  👥 Clientes individuales (${individualClients.length}):`);
            individualClients.forEach(client => {
              console.log(`    - ${client.business_name || 'Sin nombre'} (${client.rut})`);
              
              // Buscar deudas del cliente
              const clientDebts = debts?.filter(d => d.client_id === client.id);
              if (clientDebts && clientDebts.length > 0) {
                console.log(`      💰 Deudas (${clientDebts.length}):`);
                clientDebts.forEach(debt => {
                  console.log(`        - $${debt.current_amount || debt.original_amount} (${debt.status})`);
                });
              } else {
                console.log(`      💰 Sin deudas`);
              }
            });
          } else {
            console.log(`  👥 Sin clientes individuales`);
          }
        } else {
          console.log(`  ❌ No tiene corporate_client`);
        }
      }
    }
    
    // 7. Resumen final
    console.log('\n📈 7. RESUMEN FINAL:');
    console.log(`📊 Empresas: ${companies?.length || 0}`);
    console.log(`🏢 Corporate Clients: ${corporateClients?.length || 0}`);
    console.log(`👥 Clients: ${clients?.length || 0}`);
    console.log(`💰 Debts: ${debts?.length || 0}`);
    console.log(`👤 Users: ${users?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error general en debug:', error);
  }
};

debugData().then(() => {
  console.log('\n✅ Debug completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});