/**
 * Test con los datos reales del usuario que está fallando
 */

// Simulación de Supabase para pruebas
const mockSupabase = {
  from: (table) => ({
    insert: (data) => {
      console.log('📊 Simulando inserción en tabla:', table);
      console.log('📋 Datos a insertar:', JSON.stringify(data, null, 2));
      
      return new Promise((resolve, reject) => {
        // Simular diferentes errores basados en los datos
        setTimeout(() => {
          // Simular error de tabla no existe (42P01)
          if (Math.random() > 0.7) {
            reject({
              code: '42P01',
              message: 'relation "clients" does not exist',
              details: 'The table "clients" was not found in the database.',
              hint: 'Create the table or check the table name.'
            });
            return;
          }
          
          // Simular error de permisos (42501)
          if (Math.random() > 0.8) {
            reject({
              code: '42501',
              message: 'permission denied for table clients',
              details: 'User does not have INSERT permission on table clients.',
              hint: 'Grant INSERT privilege on table clients to the user.'
            });
            return;
          }
          
          // Simular éxito
          resolve({
            data: {
              id: 'mock-' + Date.now(),
              ...data,
              created_at: new Date().toISOString()
            },
            error: null
          });
        }, 500);
      });
    },
    select: () => ({
      single: () => Promise.resolve({ data: null, error: null })
    })
  })
};

// Simular la función createClient con los datos reales
async function testRealUserData() {
  console.log('🧪 Probando con datos reales del usuario que falla...\n');

  // Datos exactos del usuario que está fallando
  const realUserData = {
    company_id: '3629a258-f536-42ac-8960-012023212a8e',
    business_name: 'maria concha',
    contact_email: 'hola@aintelligence.cl',
    contact_phone: '+56966871175',
    rut: '16610128-k',
    corporate_client_id: null, // "Ninguno"
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('📋 Datos reales del usuario:');
    console.log(JSON.stringify(realUserData, null, 2));
    console.log('');

    // Validaciones básicas
    if (!realUserData.company_id) {
      console.error('❌ Validación fallida: company_id está vacío');
      return false;
    }
    
    if (!realUserData.business_name || realUserData.business_name.trim() === '') {
      console.error('❌ Validación fallida: business_name está vacío');
      return false;
    }
    
    if (!realUserData.contact_email || realUserData.contact_email.trim() === '') {
      console.error('❌ Validación fallida: contact_email está vacío');
      return false;
    }

    console.log('✅ Validaciones básicas pasadas');

    // Preparar datos limpios (simulando la función real)
    const cleanClientData = {
      company_id: realUserData.company_id,
      business_name: realUserData.business_name,
      contact_email: realUserData.contact_email,
      contact_phone: realUserData.contact_phone || null,
      rut: realUserData.rut || null,
      corporate_client_id: realUserData.corporate_client_id || null,
      created_at: realUserData.created_at || new Date().toISOString(),
      updated_at: realUserData.updated_at || new Date().toISOString()
    };

    console.log('📋 Datos limpios preparados:');
    console.log(JSON.stringify(cleanClientData, null, 2));
    console.log('');

    // Simular inserción en Supabase
    console.log('🔄 Simulando inserción en Supabase...');
    const { data, error } = await mockSupabase
      .from('clients')
      .insert(cleanClientData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error simulado de Supabase:');
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);
      
      // Analizar el error
      if (error.code === '42P01') {
        console.log('\n🔍 DIAGNÓSTICO: La tabla "clients" no existe en la base de datos');
        console.log('💡 SOLUCIÓN: Ejecutar la migración para crear la tabla clients');
      } else if (error.code === '42501') {
        console.log('\n🔍 DIAGNÓSTICO: El usuario no tiene permisos para insertar en la tabla clients');
        console.log('💡 SOLUCIÓN: Verificar los RLS policies y permisos del usuario');
      }
      
      return false;
    }

    if (data) {
      console.log('✅ Simulación exitosa:');
      console.log('ID:', data.id);
      console.log('Nombre:', data.business_name);
      console.log('Email:', data.contact_email);
      console.log('RUT:', data.rut);
      console.log('Cliente Corporativo ID:', data.corporate_client_id);
      return true;
    } else {
      console.error('❌ No se recibió respuesta');
      return false;
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return false;
  }
}

// Ejecutar prueba
async function runTest() {
  console.log('🚀 INICIANDO PRUEBA CON DATOS REALES DEL USUARIO');
  console.log('='.repeat(60));

  const success = await testRealUserData();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DE LA PRUEBA:');
  console.log('='.repeat(60));

  if (success) {
    console.log('✅ PRUEBA EXITOSA');
    console.log('📝 Los datos del usuario son válidos y deberían funcionar');
    console.log('🔍 El problema probablemente está en:');
    console.log('   1. La tabla clients no existe en producción');
    console.log('   2. Los permisos RLS no están configurados correctamente');
    console.log('   3. Las variables de entorno de Supabase no están configuradas');
  } else {
    console.log('❌ PRUEBA FALLIDA');
    console.log('📝 Se identificaron problemas potenciales');
    console.log('🔍 Revisa los errores mostrados arriba para diagnóstico');
  }

  process.exit(success ? 0 : 1);
}

// Ejecutar prueba
runTest().catch(error => {
  console.error('💥 Error general en la prueba:', error);
  process.exit(1);
});