const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairCorporateClient() {
  try {
    console.log('🔧 Reparando cliente corporativo corrupto...');
    
    const corporateClientId = '5f15d831-3a51-4288-a363-d6fb2b2dd1ef';
    const nexuPayCobranzasId = 'e27b3162-e7db-4b00-bc60-32abea7e171b';
    
    // 1. Verificar el estado actual del cliente corporativo
    console.log('\n📋 Verificando estado actual del cliente corporativo...');
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('id', corporateClientId)
      .single();
    
    if (corporateError) {
      console.error('❌ Error obteniendo cliente corporativo:', corporateError);
      return;
    }
    
    console.log('📊 Estado actual:', corporateClient);
    
    // 2. Reparar el cliente corporativo con datos válidos
    console.log('\n🔧 Reparando cliente corporativo...');
    const { error: updateError } = await supabase
      .from('corporate_clients')
      .update({
        business_name: 'Clientes Generales NexuPay',
        contact_email: 'clientes@nexupay.cl',
        contact_phone: '+56912345678',
        industry: 'Servicios Financieros',
        updated_at: new Date().toISOString()
      })
      .eq('id', corporateClientId);
    
    if (updateError) {
      console.error('❌ Error actualizando cliente corporativo:', updateError);
      return;
    }
    
    console.log('✅ Cliente corporativo reparado');
    
    // 3. Verificar la reparación
    console.log('\n🔍 Verificando reparación...');
    const { data: repairedClient, error: verifyError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('id', corporateClientId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando reparación:', verifyError);
      return;
    }
    
    console.log('✅ Cliente corporativo reparado:', {
      id: repairedClient.id,
      business_name: repairedClient.business_name,
      contact_email: repairedClient.contact_email,
      rut: repairedClient.rut
    });
    
    // 4. Verificar la asociación con María Concha
    console.log('\n👤 Verificando asociación con María Concha...');
    const { data: mariaClient, error: mariaError } = await supabase
      .from('clients')
      .select('*')
      .eq('corporate_client_id', corporateClientId)
      .eq('rut', '16610128-k')
      .single();
    
    if (mariaError) {
      console.error('❌ Error obteniendo María Concha:', mariaError);
      return;
    }
    
    console.log('✅ Asociación verificada:', {
      client_name: mariaClient.business_name,
      corporate_client: repairedClient.business_name,
      corporate_rut: repairedClient.rut
    });
    
    console.log('\n🎉 Reparación completada exitosamente');
    console.log('📋 Ahora María Concha debería mostrarse correctamente como:');
    console.log(`   "${repairedClient.business_name} • Cliente Individual"`);
    
  } catch (error) {
    console.error('💥 Error general en reparación:', error);
  }
}

repairCorporateClient();