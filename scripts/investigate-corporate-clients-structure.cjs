const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateCorporateClientsStructure() {
  try {
    console.log('🔍 Investigando estructura de la tabla corporate_clients...');
    
    // 1. Obtener todos los datos para ver la estructura
    console.log('\n📋 Obteniendo datos de corporate_clients...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);
    
    if (corporateError) {
      console.error('❌ Error obteniendo corporate_clients:', corporateError);
      return;
    }
    
    if (corporateClients.length > 0) {
      console.log('📊 Estructura de corporate_clients (columnas):');
      console.log(Object.keys(corporateClients[0]));
      console.log('\n📋 Datos de ejemplo:');
      console.log(corporateClients[0]);
    } else {
      console.log('⚠️ No hay datos en corporate_clients');
    }
    
    // 2. Comparar con la tabla clients
    console.log('\n📋 Comparando con tabla clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Error obteniendo clients:', clientsError);
      return;
    }
    
    if (clients.length > 0) {
      console.log('📊 Estructura de clients (columnas):');
      console.log(Object.keys(clients[0]));
      console.log('\n📋 Datos de María Concha:');
      console.log(clients[0]);
    }
    
    // 3. Verificar qué columna se usa para el nombre en corporate_clients
    console.log('\n🔍 Verificando columna de nombre en corporate_clients...');
    const { data: allCorporate, error: allError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (allError) {
      console.error('❌ Error obteniendo todos los corporate_clients:', allError);
      return;
    }
    
    console.log(`✅ Encontrados ${allCorporate.length} clientes corporativos:`);
    allCorporate.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id}`);
      Object.keys(client).forEach(key => {
        if (key.includes('name') || key.includes('email')) {
          console.log(`   ${key}: ${client[key]}`);
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('💥 Error general en investigación:', error);
  }
}

investigateCorporateClientsStructure();