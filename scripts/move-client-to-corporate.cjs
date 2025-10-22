const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function moveClientToCorporate() {
  try {
    console.log('🔍 Verificando estado actual de la cliente 16610128-k (María Concha)...');
    
    // 1. Buscar a María Concha en la tabla clients
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k')
      .single();
    
    if (clientError) {
      console.log('❌ Error buscando cliente:', clientError);
      return;
    }
    
    console.log('📋 Datos actuales del cliente:', clientData);
    
    // 2. Verificar a qué cliente corporativo está asociada actualmente
    console.log('🔍 ID del cliente corporativo actual:', clientData.corporate_client_id);
    
    // 3. Buscar todos los clientes corporativos para identificar el correcto
    const { data: allCorporates, error: corporatesError } = await supabase
      .from('corporate_clients')
      .select('*');
    
    if (corporatesError) {
      console.log('❌ Error buscando clientes corporativos:', corporatesError);
      return;
    }
    
    console.log('📋 Todos los clientes corporativos:', allCorporates);
    
    // 4. Buscar el cliente corporativo específico de empresa@nexupay.cl
    const targetCorporate = allCorporates.find(c =>
      c.contact_email === 'empresa@nexupay.cl' ||
      c.contact_email === 'hola@aintelligence.cl' ||
      c.id === clientData.corporate_client_id
    );
    
    if (!targetCorporate) {
      console.log('❌ No se encontró el cliente corporativo de empresa@nexupay.cl');
      return;
    }
    
    console.log('🏢 Cliente corporativo encontrado:', targetCorporate);
    
    // 5. Verificar si ya está asociado al cliente corporativo correcto
    if (clientData.corporate_client_id === targetCorporate.id) {
      console.log('✅ María Concha ya está asociada al cliente corporativo correcto');
      console.log('   Cliente Corporativo ID:', targetCorporate.id);
      console.log('   Email:', targetCorporate.contact_email);
    } else {
      // 6. Actualizar el cliente para asociarlo al cliente corporativo correcto
      const { data: updateData, error: updateError } = await supabase
        .from('clients')
        .update({
          corporate_client_id: targetCorporate.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientData.id)
        .select();
      
      if (updateError) {
        console.log('❌ Error actualizando cliente:', updateError);
        return;
      }
      
      console.log('✅ Cliente actualizado exitosamente:', updateData[0]);
    }
    
    // 4. Verificar la actualización
    const { data: verifyData, error: verifyError } = await supabase
      .from('clients')
      .select(`
        *,
        corporate_clients (
          id,
          company_name
        )
      `)
      .eq('id', clientData.id)
      .single();
    
    if (verifyError) {
      console.log('❌ Error verificando actualización:', verifyError);
      return;
    }
    
    console.log('✅ Verificación exitosa:');
    console.log('- Cliente:', verifyData.business_name);
    console.log('- RUT:', verifyData.rut);
    console.log('- Cliente Corporativo:', verifyData.corporate_clients?.company_name);
    console.log('- ID Cliente Corporativo:', verifyData.corporate_client_id);
    
  } catch (error) {
    console.error('💥 Error en el proceso:', error);
  }
}

// Ejecutar la función
moveClientToCorporate();