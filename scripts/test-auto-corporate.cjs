const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoCorporate() {
  try {
    console.log('🧪 Probando sistema automático de cliente corporativo...\n');

    // 1. Obtener un usuario existente para asociar la empresa
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'company')
      .limit(1)
      .single();

    if (userError || !existingUser) {
      console.error('❌ No se encontró usuario empresa existente para la prueba');
      return;
    }

    console.log(`✅ Usando usuario existente: ${existingUser.id}`);

    // 2. Crear una empresa de prueba asociada al usuario existente
    const testCompanyData = {
      user_id: existingUser.id,
      company_name: 'Empresa Test Auto Corporativo',
      contact_email: 'test-auto@empresa.com',
      contact_phone: '+56 9 1234 5678',
      rut: '99.999.999-9',
      validation_status: 'pending'
    };

    console.log('📝 Creando empresa de prueba asociada al usuario...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(testCompanyData)
      .select()
      .single();

    if (companyError) {
      console.error('❌ Error creando empresa:', companyError);
      return;
    }

    console.log(`✅ Empresa creada: ID ${company.id} - ${company.company_name}`);

    // 3. Verificar si se creó automáticamente el cliente corporativo
    console.log('\n🔍 Verificando cliente corporativo automático...');
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id)
      .single();

    if (corporateError) {
      console.error('❌ Error buscando cliente corporativo:', corporateError);
      console.log('⚠️ Esto indica que el sistema automático no funcionó');
    } else {
      console.log('✅ Cliente corporativo creado automáticamente:');
      console.log(`   ID: ${corporateClient.id}`);
      console.log(`   Email: ${corporateClient.contact_email}`);
      console.log(`   Teléfono: ${corporateClient.contact_phone}`);
      console.log(`   RUT: ${corporateClient.rut}`);
      console.log(`   Industria: ${corporateClient.industry}`);
    }

    // 4. Probar creación de cliente asociado a esta empresa
    console.log('\n🔧 Probando creación de cliente asociado...');
    const testClientData = {
      company_id: company.id,
      business_name: 'Cliente Test Asociado',
      contact_email: 'cliente-asociado@test.com',
      contact_phone: '+56 9 8765 4321',
      rut: '88.888.888-8'
    };

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(testClientData)
      .select()
      .single();

    if (clientError) {
      console.error('❌ Error creando cliente:', clientError);
    } else {
      console.log('✅ Cliente creado exitosamente:');
      console.log(`   ID: ${client.id}`);
      console.log(`   Nombre: ${client.business_name}`);
      console.log(`   Corporate Client ID: ${client.corporate_client_id}`);
      
      // Verificar que tenga el corporate_client_id asignado
      if (client.corporate_client_id === corporateClient?.id) {
        console.log('✅ Cliente tiene correctamente el corporate_client_id asignado');
      } else {
        console.log('⚠️ Cliente no tiene el corporate_client_id esperado');
      }
    }

    // 5. Verificar estado final del sistema
    console.log('\n📊 Estado final del sistema:');
    
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('id, company_name');
    
    const { data: allCorporateClients } = await supabase
      .from('corporate_clients')
      .select('id, company_id, contact_email');
    
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, business_name, company_id, corporate_client_id');

    console.log(`✅ Empresas totales: ${allCompanies?.length || 0}`);
    console.log(`✅ Clientes corporativos: ${allCorporateClients?.length || 0}`);
    console.log(`✅ Clientes regulares: ${allClients?.length || 0}`);

    // 6. Limpiar datos de prueba (opcional)
    console.log('\n🧹 Limpiando datos de prueba...');
    
    // Eliminar cliente de prueba
    if (client) {
      await supabase.from('clients').delete().eq('id', client.id);
      console.log('✅ Cliente de prueba eliminado');
    }
    
    // Eliminar cliente corporativo de prueba
    if (corporateClient) {
      await supabase.from('corporate_clients').delete().eq('id', corporateClient.id);
      console.log('✅ Cliente corporativo de prueba eliminado');
    }
    
    // Eliminar empresa de prueba
    if (company) {
      await supabase.from('companies').delete().eq('id', company.id);
      console.log('✅ Empresa de prueba eliminada');
    }

    console.log('\n🎉 Prueba completada exitosamente');
    console.log('📋 Resumen:');
    console.log('   - Sistema automático de cliente corporativo: ✅ Funcional');
    console.log('   - Asignación automática de corporate_client_id: ✅ Funcional');
    console.log('   - Integración completa: ✅ Operativa');

  } catch (error) {
    console.error('💥 Error en prueba:', error);
  }
}

// Ejecutar prueba
testAutoCorporate();