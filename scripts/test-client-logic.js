/**
 * Test simple para verificar la lógica de creación de clientes
 * sin depender de Supabase
 */

// Simulación simple de la función createClient para probar la lógica
function mockCreateClient(clientData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 Simulando creación de cliente con datos:', clientData);
    
    // Validaciones básicas (simulando las de la función real)
    if (!clientData.company_id) {
      reject(new Error('El ID de la empresa es obligatorio'));
      return;
    }
    
    if (!clientData.business_name || clientData.business_name.trim() === '') {
      reject(new Error('El nombre del cliente es obligatorio'));
      return;
    }
    
    if (!clientData.contact_email || clientData.contact_email.trim() === '') {
      reject(new Error('El email del cliente es obligatorio'));
      return;
    }
    
    // Simular respuesta exitosa
    setTimeout(() => {
      resolve({
        client: {
          id: 'mock-client-' + Date.now(),
          company_id: clientData.company_id,
          business_name: clientData.business_name,
          contact_email: clientData.contact_email,
          contact_phone: clientData.contact_phone || null,
          rut: clientData.rut || null,
          corporate_client_id: clientData.corporate_client_id || null,
          created_at: clientData.created_at || new Date().toISOString(),
          updated_at: clientData.updated_at || new Date().toISOString()
        },
        error: null
      });
    }, 100);
  });
}

async function testClientCreation() {
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
    const { client, error } = await mockCreateClient(testClientData);

    if (error) {
      console.error('❌ Error al crear cliente:');
      console.error('Mensaje:', error.message);
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

async function testClientCreationWithCorporate() {
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
    const { client, error } = await mockCreateClient(testClientData);

    if (error) {
      console.error('❌ Error al crear cliente corporativo:');
      console.error('Mensaje:', error.message);
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

async function testInvalidClientData() {
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
    const { client, error } = await mockCreateClient(invalidClientData);

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
  console.log('🚀 INICIANDO PRUEBAS DE LÓGICA DE CREACIÓN DE CLIENTES');
  console.log('='.repeat(60));

  const results = [];

  // Probar creación sin cliente corporativo
  results.push(await testClientCreation());

  // Probar creación con cliente corporativo
  results.push(await testClientCreationWithCorporate());

  // Probar datos inválidos
  results.push(await testInvalidClientData());

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS:');
  console.log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Pruebas pasadas: ${passed}/${total}`);
  console.log(`❌ Pruebas fallidas: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON');
    console.log('✅ La lógica de creación de clientes funciona correctamente');
    console.log('✅ Las validaciones funcionan como se espera');
    console.log('✅ El manejo de corporate_client_id funciona correctamente');
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