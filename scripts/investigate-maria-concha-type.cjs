const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateMariaConchaType() {
  console.log('🔍 Investigando el tipo de María Concha en la base de datos...');
  
  try {
    // 1. Buscar a María Concha en la tabla clients
    console.log('\n📋 Buscando a María Concha en la tabla clients...');
    const { data: mariaClients, error: mariaError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k');
    
    if (mariaError) {
      console.error('❌ Error buscando María Concha en clients:', mariaError);
      return;
    }
    
    console.log('✅ María Concha en tabla clients:', mariaClients);
    
    // 2. Verificar todos los clientes de NexuPay Cobranzas
    console.log('\n🏢 Verificando todos los clientes de la empresa NexuPay Cobranzas...');
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (allClientsError) {
      console.error('❌ Error buscando todos los clientes:', allClientsError);
      return;
    }
    
    console.log(`✅ Total de clientes encontrados: ${allClients.length}`);
    console.log('📋 Lista de todos los clientes:');
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.business_name} (${client.rut}) - corporate_client_id: ${client.corporate_client_id}`);
    });
    
    // 3. Verificar la tabla corporate_clients
    console.log('\n🏢 Verificando la tabla corporate_clients...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (corporateError) {
      console.error('❌ Error buscando clientes corporativos:', corporateError);
      return;
    }
    
    console.log(`✅ Total de clientes corporativos encontrados: ${corporateClients.length}`);
    console.log('📋 Lista de clientes corporativos:');
    corporateClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.business_name} (${client.rut})`);
    });
    
    // 4. Análisis del problema
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    console.log('=====================================');
    
    if (mariaClients.length > 0) {
      const maria = mariaClients[0];
      console.log('📊 María Concha:');
      console.log(`  - ID: ${maria.id}`);
      console.log(`  - business_name: ${maria.business_name}`);
      console.log(`  - corporate_client_id: ${maria.corporate_client_id}`);
      console.log(`  - company_id: ${maria.company_id}`);
      
      if (maria.corporate_client_id) {
        console.log('  ⚠️ María Concha tiene un corporate_client_id, por eso se muestra como cliente corporativo');
        
        // Buscar el cliente corporativo padre
        const { data: parentCorporate } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('id', maria.corporate_client_id);
        
        if (parentCorporate && parentCorporate.length > 0) {
          console.log(`  - Cliente corporativo padre: ${parentCorporate[0].business_name}`);
        }
      } else {
        console.log('  ✅ María Concha no tiene corporate_client_id, debería mostrarse como cliente individual');
      }
    }
    
    console.log('\n🎯 SOLUCIÓN:');
    console.log('=============');
    console.log('El problema está en ClientsPage.jsx líneas 370-387 donde se tratan TODOS los registros de la tabla clients como "clientes corporativos"');
    console.log('Se debe diferenciar entre:');
    console.log('- Clientes individuales (corporate_client_id es null)');
    console.log('- Clientes corporativos (tienen registro en corporate_clients)');
    
  } catch (error) {
    console.error('💥 Error en la investigación:', error);
  }
}

investigateMariaConchaType();