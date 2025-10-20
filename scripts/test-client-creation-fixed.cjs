/**
 * Test para verificar la creación de clientes después de las correcciones
 */

// Usamos dynamic import para ES modules
async function importServices() {
  const { createClient } = await import('../src/services/databaseService.js');
  return { createClient };
}

async function testClientCreation(createClient) {
  console.log('🧪 Iniciando prueba de creación de clientes...\n');

  // Datos de prueba
  const testClientData = {
    company_id: 'test-company-id',
    business_name: 'Cliente de Prueba Corregido',
    contact_email: 'test@cliente.com',
    contact_phone: '+56912345678',
    rut: '11.222.333-4',
    corporate_client_id: null, // Test sin cliente corporativo
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('📋 Datos del cliente de prueba:');
    console.log(JSON.stringify(testClientData, null, 2));
    console.log('');

    // Intentar crear el cliente
    const { client, error } = await createClient(testClientData);

    if (error) {
      console.error('❌ Error al crear cliente:');
      console.error('Mensaje:', error.message);
      console.error('Código:', error.code);
      console.error('Detalles:', error.details);
      return false;
    }

    if (client) {
      console.log('✅ Cliente creado exitosamente:');
      console.log('ID:', client.id);
      console.log('Nombre:', client.business_name);
      console.log('Email:', client.contact_email);
      console.log('RUT:', client.rut);
      console.log('Cliente Corporativo ID:', client.corporate_client_id);
      console.log('Creado:', client.created_at);
      return true;
    } else {
      console.error('❌ No se recibió respuesta del cliente');
      return false;
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return false;
  }
}

async function testClientCreationWithCorporate(createClient) {
  console.log('\n🧪 Iniciando prueba de creación de clientes CON cliente corporativo...\n');

  // Datos de prueba con cliente corporativo
  const testClientData = {
    company_id: 'test-company-id',
    business_name: 'Cliente Corporativo de Prueba',
    contact_email: 'corporate@cliente.com',
    contact_phone: '+56987654321',
    rut: '22.333.444-5',
    corporate_client_id: 'test-corporate-client-id', // Test con cliente corporativo
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('📋 Datos del cliente corporativo de prueba:');
    console.log(JSON.stringify(testClientData, null, 2));
    console.log('');

    // Intentar crear el cliente
    const { client, error } = await createClient(testClientData);

    if (error) {
      console.error('❌ Error al crear cliente corporativo:');
      console.error('Mensaje:', error.message);
      console.error('Código:', error.code);
      console.error('Detalles:', error.details);
      return false;
    }

    if (client) {
      console.log('✅ Cliente corporativo creado exitosamente:');
      console.log('ID:', client.id);
      console.log('Nombre:', client.business_name);
      console.log('Email:', client.contact_email);
      console.log('RUT:', client.rut);
      console.log('Cliente Corporativo ID:', client.corporate_client_id);
      console.log('Creado:', client.created_at);
      return true;
    } else {
      console.error('❌ No se recibió respuesta del cliente corporativo');
      return false;
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return false;
  }
}

async function testInvalidClientData(createClient) {
  console.log('\n🧪 Iniciando prueba con datos inválidos (debe fallar)...\n');

  // Datos inválidos (falta email obligatorio)
  const invalidClientData = {
    company_id: 'test-company-id',
    business_name: 'Cliente Inválido',
    contact_email: '', // Email vacío - debe fallar
    contact_phone: '+56912345678',
    rut: '33.444.555-6',
    corporate_client_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('📋 Datos inválidos de prueba:');
    console.log(JSON.stringify(invalidClientData, null, 2));
    console.log('');

    // Intentar crear el cliente (debe fallar)
    const { client, error } = await createClient(invalidClientData);

    if (error) {
      console.log('✅ Error esperado al crear cliente inválido:');
      console.log('Mensaje:', error.message);
      console.log('Esto es correcto - la validación funcionó');
      return true;
    }

    if (client) {
      console.error('❌ ERROR: Se creó un cliente con datos inválidos');
      console.log('Cliente creado:', client);
      return false;
    } else {
      console.error('❌ No se recibió respuesta ni error');
      return false;
    }
  } catch (error) {
    console.log('✅ Error esperado al crear cliente inválido:');
    console.log('Mensaje:', error.message);
    console.log('Esto es correcto - la validación funcionó');
    return true;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE CREACIÓN DE CLIENTES');
  console.log('='.repeat(50));

  // Importar servicios
  const { createClient } = await importServices();
  
  const results = [];

  // Probar creación sin cliente corporativo
  results.push(await testClientCreation(createClient));

  // Probar creación con cliente corporativo
  results.push(await testClientCreationWithCorporate(createClient));

  // Probar datos inválidos
  results.push(await testInvalidClientData(createClient));

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS:');
  console.log('='.repeat(50));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Pruebas pasadas: ${passed}/${total}`);
  console.log(`❌ Pruebas fallidas: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON');
    console.log('✅ La creación de clientes funciona correctamente');
  } else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
    console.log('❌ Revisar los errores mostrados arriba');
  }

  process.exit(passed === total ? 0 : 1);
}

// Ejecutar pruebas
runAllTests().catch(error => {
  console.error('💥 Error general en las pruebas:', error);
  process.exit(1);
});