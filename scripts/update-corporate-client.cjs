const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCorporateClient() {
  try {
    console.log('🔄 Actualizando empresa corporativa para NexuPay Cobranzas...');

    // 1. Obtener la empresa NexuPay Cobranzas
    console.log('\n📋 Paso 1: Buscando empresa NexuPay Cobranzas...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();

    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', {
      id: company.id,
      business_name: company.business_name || 'Sin nombre',
      contact_email: company.contact_email,
      validation_status: company.validation_status
    });

    // 2. Obtener el cliente corporativo existente
    console.log('\n📋 Paso 2: Buscando cliente corporativo existente...');
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .single();

    if (corporateError) {
      console.error('❌ Error obteniendo cliente corporativo:', corporateError);
      return;
    }

    console.log('✅ Cliente corporativo encontrado:', {
      id: corporateClient.id,
      contact_info: corporateClient.contact_info,
      display_category: corporateClient.display_category
    });

    // 3. Actualizar el cliente corporativo con los datos correctos
    console.log('\n📋 Paso 3: Actualizando cliente corporativo...');
    
    const updatedData = {
      contact_info: {
        name: 'NexuPay Cobranzas',
        rut: '76.123.456-7',
        email: company.contact_email,
        phone: company.contact_phone || '+56987654321',
        industry: '🏢 Acreedor Directo',
        address: company.address || null,
        contact_person: company.contact_person || null
      },
      display_category: 'Acreedor Directo',
      trust_level: 'verified',
      updated_at: new Date().toISOString()
    };

    console.log('📋 Datos a actualizar:', JSON.stringify(updatedData, null, 2));

    const { data: updatedCorporate, error: updateError } = await supabase
      .from('corporate_clients')
      .update(updatedData)
      .eq('id', corporateClient.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando cliente corporativo:', updateError);
      return;
    }

    console.log('✅ Cliente corporativo actualizado exitosamente:');
    console.log('📋 ID:', updatedCorporate.id);
    console.log('📋 Nombre:', updatedCorporate.contact_info?.name);
    console.log('📋 RUT:', updatedCorporate.contact_info?.rut);
    console.log('📋 Industria:', updatedCorporate.contact_info?.industry);
    console.log('📋 Categoría:', updatedCorporate.display_category);
    console.log('📋 Nivel de Confianza:', updatedCorporate.trust_level);

    // 4. Verificar resultado final
    console.log('\n📋 Paso 4: Verificando resultado final...');
    const { data: finalCorporate, error: finalError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('id', corporateClient.id)
      .single();

    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError);
      return;
    }

    console.log('✅ Verificación exitosa:');
    console.log('📋 Cliente corporativo final:', {
      id: finalCorporate.id,
      company_id: finalCorporate.company_id,
      name: finalCorporate.contact_info?.name,
      rut: finalCorporate.contact_info?.rut,
      industry: finalCorporate.contact_info?.industry,
      display_category: finalCorporate.display_category,
      trust_level: finalCorporate.trust_level
    });

    console.log('\n🎉 ¡EMPRESA CORPORATIVA ACTUALIZADA CON ÉXITO!');
    console.log('✅ NexuPay Cobranzas ahora tiene su cliente corporativo con datos correctos');
    console.log('✅ Nombre: NexuPay Cobranzas');
    console.log('✅ RUT: 76.123.456-7');
    console.log('✅ Industria: 🏢 Acreedor Directo');
    console.log('✅ Sistema listo para operar con estructura corporativa completa');

  } catch (error) {
    console.error('💥 Error en actualización de cliente corporativo:', error);
  }
}

// Ejecutar actualización
updateCorporateClient();