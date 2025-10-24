const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

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
      contact_email: corporateClient.contact_email,
      contact_phone: corporateClient.contact_phone,
      rut: corporateClient.rut,
      industry: corporateClient.industry
    });

    // 3. Actualizar el cliente corporativo con los datos correctos
    console.log('\n📋 Paso 3: Actualizando cliente corporativo...');
    
    const updatedData = {
      contact_email: 'empresa@nexupay.cl',
      contact_phone: '+56987654321',
      rut: '76.123.456-7',
      industry: '🏢 Acreedor Directo',
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
    console.log('📋 Email:', updatedCorporate.contact_email);
    console.log('📋 Teléfono:', updatedCorporate.contact_phone);
    console.log('📋 RUT:', updatedCorporate.rut);
    console.log('📋 Industria:', updatedCorporate.industry);

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

    console.log('✅ Verificación final exitosa:');
    console.log('📋 Estado actual del cliente corporativo:');
    console.log('   - ID:', finalCorporate.id);
    console.log('   - Company ID:', finalCorporate.company_id);
    console.log('   - Email:', finalCorporate.contact_email);
    console.log('   - Teléfono:', finalCorporate.contact_phone);
    console.log('   - RUT:', finalCorporate.rut);
    console.log('   - Industria:', finalCorporate.industry);
    console.log('   - Creado:', finalCorporate.created_at);
    console.log('   - Actualizado:', finalCorporate.updated_at);

    console.log('\n🎉 Empresa corporativa "NexuPay Cobranzas" actualizada correctamente');
    console.log('📋 Datos actualizados:');
    console.log('   - Nombre: NexuPay Cobranzas');
    console.log('   - RUT: 76.123.456-7');
    console.log('   - Industria: 🏢 Acreedor Directo');
    console.log('   - Email: empresa@nexupay.cl');
    console.log('   - Teléfono: +56987654321');

  } catch (error) {
    console.error('💥 Error en la actualización:', error);
  }
}

updateCorporateClient();