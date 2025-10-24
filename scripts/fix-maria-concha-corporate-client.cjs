const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMariaConchaCorporateClient() {
  try {
    console.log('🔧 Corrigiendo cliente corporativo de María Concha...');
    
    const nexuPayCobranzasId = 'e27b3162-e7db-4b00-bc60-32abea7e171b';
    const mariaConchaRut = '16610128-k';
    
    // 1. Verificar clientes corporativos disponibles para NexuPay Cobranzas
    console.log('\n📋 Verificando clientes corporativos disponibles...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', nexuPayCobranzasId);
    
    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
      return;
    }
    
    console.log(`✅ Clientes corporativos encontrados: ${corporateClients.length}`);
    corporateClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.business_name} (${client.rut}) - ID: ${client.id}`);
    });
    
    // 2. Verificar el estado actual de María Concha
    console.log('\n👤 Verificando estado actual de María Concha...');
    const { data: mariaClient, error: mariaError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', mariaConchaRut)
      .single();
    
    if (mariaError) {
      console.error('❌ Error obteniendo María Concha:', mariaError);
      return;
    }
    
    console.log('📊 Estado actual de María Concha:', {
      id: mariaClient.id,
      name: mariaClient.business_name,
      corporate_client_id: mariaClient.corporate_client_id,
      company_id: mariaClient.company_id
    });
    
    // 3. Verificar si el corporate_client_id actual existe
    if (mariaClient.corporate_client_id) {
      console.log('\n🔍 Verificando si el corporate_client_id actual existe...');
      const { data: existingCorporate, error: existingError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('id', mariaClient.corporate_client_id)
        .single();
      
      if (existingError || !existingCorporate) {
        console.log('⚠️ El corporate_client_id actual no existe o fue eliminado');
        
        // 4. Asociar a un cliente corporativo válido
        if (corporateClients.length > 0) {
          // Usar el primer cliente corporativo disponible
          const targetCorporateClient = corporateClients[0];
          console.log(`\n🔗 Asociando María Concha a: ${targetCorporateClient.business_name}`);
          
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              corporate_client_id: targetCorporateClient.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', mariaClient.id);
          
          if (updateError) {
            console.error('❌ Error actualizando María Concha:', updateError);
            return;
          }
          
          console.log('✅ María Concha asociada correctamente al cliente corporativo');
          console.log(`📋 Nueva asociación: ${mariaClient.business_name} → ${targetCorporateClient.business_name}`);
          
        } else {
          console.log('\n❌ No hay clientes corporativos disponibles para asociar');
          console.log('🔧 Solución: Crear un cliente corporativo por defecto para NexuPay Cobranzas');
          
          // Crear un cliente corporativo por defecto
          const { data: newCorporate, error: createError } = await supabase
            .from('corporate_clients')
            .insert({
              company_id: nexuPayCobranzasId,
              business_name: 'Clientes Generales',
              rut: '76.123.456-7',
              contact_email: 'clientes@nexupay.cl',
              contact_phone: '+56912345678',
              industry: 'General',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('❌ Error creando cliente corporativo por defecto:', createError);
            return;
          }
          
          console.log('✅ Cliente corporativo por defecto creado:', newCorporate);
          
          // Asociar María Concha al nuevo cliente corporativo
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              corporate_client_id: newCorporate.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', mariaClient.id);
          
          if (updateError) {
            console.error('❌ Error actualizando María Concha:', updateError);
            return;
          }
          
          console.log('✅ María Concha asociada correctamente al cliente corporativo por defecto');
        }
      } else {
        console.log('✅ El corporate_client_id actual existe y es válido');
        console.log(`📋 Asociación actual: ${mariaClient.business_name} → ${existingCorporate.business_name}`);
      }
    }
    
    // 5. Verificación final
    console.log('\n🔍 Verificación final...');
    const { data: finalMaria, error: finalError } = await supabase
      .from('clients')
      .select(`
        *,
        corporate_clients (
          business_name,
          rut
        )
      `)
      .eq('rut', mariaConchaRut)
      .single();
    
    if (finalError) {
      console.error('❌ Error en verificación final:', finalError);
      return;
    }
    
    console.log('✅ Estado final de María Concha:', {
      name: finalMaria.business_name,
      corporate_client: finalMaria.corporate_clients?.business_name || 'Sin asociación',
      corporate_rut: finalMaria.corporate_clients?.rut || 'N/A'
    });
    
    console.log('\n🎉 Corrección completada exitosamente');
    
  } catch (error) {
    console.error('💥 Error general en corrección:', error);
  }
}

fixMariaConchaCorporateClient();