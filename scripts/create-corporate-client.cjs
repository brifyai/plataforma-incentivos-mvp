const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCorporateClient() {
  try {
    console.log('🏢 Creando empresa corporativa para NexuPay Cobranzas...');

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

    // 2. Verificar si ya existe un cliente corporativo
    console.log('\n📋 Paso 2: Verificando si ya existe cliente corporativo...');
    const { data: existingCorporate, error: existingError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.warn('⚠️ Error verificando cliente corporativo existente:', existingError);
    }

    if (existingCorporate) {
      console.log('✅ Ya existe un cliente corporativo:', existingCorporate);
      console.log('📋 Datos actuales:', {
        id: existingCorporate.id,
        name: existingCorporate.contact_info?.name || 'Sin nombre',
        rut: existingCorporate.contact_info?.rut || 'Sin RUT',
        industry: existingCorporate.contact_info?.industry || 'Sin industria'
      });
      return;
    }

    // 3. Crear el cliente corporativo
    console.log('\n📋 Paso 3: Creando cliente corporativo...');
    
    const corporateClientData = {
      company_id: company.id,
      contact_info: {
        name: 'NexuPay Cobranzas',
        rut: '76.123.456-7',
        email: company.contact_email,
        phone: company.contact_phone || null,
        industry: '🏢 Acreedor Directo',
        address: company.address || null,
        contact_person: company.contact_person || null
      },
      display_category: 'Acreedor Directo',
      segment_count: 0,
      debtor_count: 0,
      total_debt_amount: 0,
      trust_level: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Datos a insertar:', JSON.stringify(corporateClientData, null, 2));

    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .insert(corporateClientData)
      .select()
      .single();

    if (corporateError) {
      console.error('❌ Error creando cliente corporativo:', corporateError);
      return;
    }

    console.log('✅ Cliente corporativo creado exitosamente:');
    console.log('📋 ID:', corporateClient.id);
    console.log('📋 Nombre:', corporateClient.contact_info?.name);
    console.log('📋 RUT:', corporateClient.contact_info?.rut);
    console.log('📋 Industria:', corporateClient.contact_info?.industry);
    console.log('📋 Categoría:', corporateClient.display_category);

    // 4. Verificar resultado final
    console.log('\n📋 Paso 4: Verificando resultado final...');
    const { data: finalCorporate, error: finalError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
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

    console.log('\n🎉 ¡EMPRESA CORPORATIVA CREADA CON ÉXITO!');
    console.log('✅ NexuPay Cobranzas ahora tiene su cliente corporativo');
    console.log('✅ Sistema listo para operar con estructura corporativa completa');

  } catch (error) {
    console.error('💥 Error en creación de cliente corporativo:', error);
  }
}

// Ejecutar creación
createCorporateClient();