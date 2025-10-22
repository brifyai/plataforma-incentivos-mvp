const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetAllVerifications() {
  try {
    console.log('🔍 Probando getAllVerifications()...');
    
    // Simular la función getAllVerifications exactamente como está en el código
    let query = supabase
      .from('company_verifications')
      .select(`
        *,
        company:companies (
          company_name,
          rut,
          contact_email,
          user_id
        )
      `)
      .order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error en getAllVerifications:', error);
      return;
    }

    console.log('📊 Resultado de getAllVerifications:');
    console.log(`Total de verificaciones: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      data.forEach((verification, index) => {
        console.log(`\n${index + 1}. ${verification.company?.company_name || 'Empresa sin nombre'}`);
        console.log(`   ID: ${verification.id}`);
        console.log(`   Status: ${verification.status}`);
        console.log(`   Company ID: ${verification.company_id}`);
        console.log(`   Submitted: ${verification.submitted_at}`);
        console.log(`   Updated: ${verification.updated_at}`);
        
        if (verification.status === 'rejected') {
          console.log(`   Rejected at: ${verification.rejected_at}`);
          console.log(`   Rejection reason: ${verification.rejection_reason}`);
        }
      });
    } else {
      console.log('⚠️ No se encontraron verificaciones');
    }

    // Buscar específicamente la empresa NexuPay
    console.log('\n🔍 Buscando específicamente Empresa NexuPay...');
    const nexuPayVerification = data?.find(v => 
      v.company?.company_name?.includes('NexuPay') || 
      v.company_id === '7c834069-d92e-44b1-b0c0-474310fad1ff'
    );
    
    if (nexuPayVerification) {
      console.log('✅ Empresa NexuPay encontrada:');
      console.log(`   Status: ${nexuPayVerification.status}`);
      console.log(`   Company validation_status: ${nexuPayVerification.company?.validation_status || 'No disponible'}`);
    } else {
      console.log('❌ Empresa NexuPay NO encontrada en los resultados');
    }

    // Probar sin relaciones para ver si el problema está ahí
    console.log('\n🔍 Probando consulta sin relaciones...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('company_verifications')
      .select('*')
      .eq('company_id', '7c834069-d92e-44b1-b0c0-474310fad1ff');

    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError);
    } else {
      console.log('📋 Resultado consulta simple:');
      console.log(JSON.stringify(simpleData, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

testGetAllVerifications();