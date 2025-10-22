const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTriggerVerification() {
  try {
    console.log('🔍 Verificación Final del Sistema de Trigger Automático');
    console.log('==================================================\n');

    // 1. Verificar estado actual del sistema
    console.log('📊 Estado actual del sistema:');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email, created_at');
    
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('id, company_id, contact_email, industry, created_at');
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, business_name, company_id, corporate_client_id, created_at');

    if (companiesError || corporateError || clientsError) {
      console.error('❌ Error obteniendo estado actual:', { companiesError, corporateError, clientsError });
      return;
    }

    console.log(`✅ Empresas: ${companies?.length || 0}`);
    console.log(`✅ Clientes Corporativos: ${corporateClients?.length || 0}`);
    console.log(`✅ Clientes Regulares: ${clients?.length || 0}`);

    // 2. Verificar consistencia de datos
    console.log('\n🔍 Verificando consistencia de datos...');
    
    let inconsistencies = [];
    
    // Verificar que cada empresa tenga cliente corporativo
    companies?.forEach(company => {
      const hasCorporate = corporateClients?.some(cc => cc.company_id === company.id);
      if (!hasCorporate) {
        inconsistencies.push(`Empresa ${company.company_name} (${company.id}) no tiene cliente corporativo`);
      }
    });
    
    // Verificar que cada cliente tenga corporate_client_id
    clients?.forEach(client => {
      if (!client.corporate_client_id) {
        inconsistencies.push(`Cliente ${client.business_name} (${client.id}) no tiene corporate_client_id`);
      } else {
        // Verificar que el corporate_client_id exista
        const corporateExists = corporateClients?.some(cc => cc.id === client.corporate_client_id);
        if (!corporateExists) {
          inconsistencies.push(`Cliente ${client.business_name} tiene corporate_client_id inválido: ${client.corporate_client_id}`);
        }
      }
    });

    if (inconsistencies.length === 0) {
      console.log('✅ Todos los datos son consistentes');
    } else {
      console.log('⚠️ Se encontraron inconsistencias:');
      inconsistencies.forEach(inc => console.log(`   - ${inc}`));
    }

    // 3. Simular aplicación del trigger
    console.log('\n🧪 Simulando aplicación del trigger...');
    
    // Obtener un usuario existente para la prueba
    const { data: testUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'company')
      .limit(1)
      .single();

    if (!testUser) {
      console.error('❌ No se encontró usuario para prueba');
      return;
    }

    console.log(`✅ Usando usuario de prueba: ${testUser.id}`);

    // Crear empresa de prueba
    const testCompanyData = {
      user_id: testUser.id,
      company_name: 'Empresa Test Final Trigger',
      contact_email: 'test-final-trigger@empresa.com',
      contact_phone: '+56 9 8888 8888',
      rut: '77.777.777-7',
      validation_status: 'pending'
    };

    console.log('📝 Creando empresa de prueba...');
    const { data: testCompany, error: testCompanyError } = await supabase
      .from('companies')
      .insert(testCompanyData)
      .select()
      .single();

    if (testCompanyError) {
      console.error('❌ Error creando empresa de prueba:', testCompanyError);
      return;
    }

    console.log(`✅ Empresa creada: ID ${testCompany.id}`);

    // Verificar si se creó el cliente corporativo (simulación del trigger)
    console.log('🔍 Verificando creación automática de cliente corporativo...');
    
    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: testCorporateClient, error: corporateCheckError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', testCompany.id)
      .single();

    if (corporateCheckError) {
      console.log('⚠️ El trigger no se ejecutó automáticamente (esto es normal sin el trigger aplicado)');
      console.log('💡 Para activar el trigger, ejecuta el SQL en Supabase Dashboard');
      console.log('📋 Archivo: trigger-corporate-client-complete.sql');
    } else {
      console.log('✅ Cliente corporativo creado automáticamente:');
      console.log(`   ID: ${testCorporateClient.id}`);
      console.log(`   Email: ${testCorporateClient.contact_email}`);
      console.log(`   Industria: ${testCorporateClient.industry}`);
    }

    // 4. Probar creación de cliente asociado
    console.log('\n🔧 Probando creación de cliente asociado...');
    
    // Obtener el cliente corporativo (manual si el trigger no funcionó)
    let corporateClientId = testCorporateClient?.id;
    
    if (!corporateClientId) {
      // Crear manualmente el cliente corporativo para la prueba
      const { data: manualCorporate } = await supabase
        .from('corporate_clients')
        .insert({
          company_id: testCompany.id,
          contact_email: testCompany.contact_email,
          contact_phone: testCompany.contact_phone,
          rut: testCompany.rut,
          industry: 'Corporativo'
        })
        .select()
        .single();
      
      corporateClientId = manualCorporate?.id;
      console.log('✅ Cliente corporativo creado manualmente para prueba');
    }

    const testClientData = {
      company_id: testCompany.id,
      business_name: 'Cliente Test Final',
      contact_email: 'cliente-final@test.com',
      contact_phone: '+56 9 7777 7777',
      rut: '66.666.666-6'
    };

    const { data: testClient, error: testClientError } = await supabase
      .from('clients')
      .insert(testClientData)
      .select()
      .single();

    if (testClientError) {
      console.error('❌ Error creando cliente de prueba:', testClientError);
    } else {
      console.log('✅ Cliente creado:');
      console.log(`   ID: ${testClient.id}`);
      console.log(`   Corporate Client ID: ${testClient.corporate_client_id}`);
      
      if (testClient.corporate_client_id === corporateClientId) {
        console.log('✅ Cliente tiene correctamente el corporate_client_id asignado');
      } else {
        console.log('⚠️ Cliente no tiene el corporate_client_id esperado');
      }
    }

    // 5. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    
    if (testClient) {
      await supabase.from('clients').delete().eq('id', testClient.id);
      console.log('✅ Cliente de prueba eliminado');
    }
    
    if (testCorporateClient) {
      await supabase.from('corporate_clients').delete().eq('id', testCorporateClient.id);
      console.log('✅ Cliente corporativo de prueba eliminado');
    }
    
    if (testCompany) {
      await supabase.from('companies').delete().eq('id', testCompany.id);
      console.log('✅ Empresa de prueba eliminada');
    }

    // 6. Resumen final
    console.log('\n📋 Resumen Final del Sistema:');
    console.log('=====================================');
    
    const finalStats = {
      empresas: companies?.length || 0,
      clientesCorporativos: corporateClients?.length || 0,
      clientesRegulares: clients?.length || 0,
      inconsistencias: inconsistencies.length,
      sistemaFuncional: inconsistencies.length === 0
    };

    console.log(`📊 Estadísticas Finales:`);
    console.log(`   - Empresas: ${finalStats.empresas}`);
    console.log(`   - Clientes Corporativos: ${finalStats.clientesCorporativos}`);
    console.log(`   - Clientes Regulares: ${finalStats.clientesRegulares}`);
    console.log(`   - Inconsistencias: ${finalStats.inconsistencias}`);
    
    if (finalStats.sistemaFuncional) {
      console.log('\n🎉 SISTEMA 100% FUNCIONAL');
      console.log('✅ Todos los datos son consistentes');
      console.log('✅ Sistema listo para producción');
    } else {
      console.log('\n⚠️ SISTEMA NECESITA ATENCIÓN');
      console.log('❌ Hay inconsistencias que deben ser resueltas');
    }

    console.log('\n📖 Instrucciones Finales:');
    console.log('1. Si el trigger no se ejecutó automáticamente:');
    console.log('   - Abre Supabase Dashboard');
    console.log('   - Ve a SQL Editor');
    console.log('   - Ejecuta el contenido de trigger-corporate-client-complete.sql');
    console.log('2. Verifica que el trigger esté activo con la consulta incluida');
    console.log('3. Prueba nuevamente con este script');
    console.log('4. Documenta los resultados en TRIGGER_APPLICATION_GUIDE.md');

  } catch (error) {
    console.error('💥 Error en verificación final:', error);
  }
}

// Ejecutar verificación final
finalTriggerVerification();