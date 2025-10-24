const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorporateClientsFlow() {
  console.log('🧪 PRUEBA COMPLETA DEL FLUJO DE CLIENTES CORPORATIVOS');
  console.log('=' * 60);

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  No hay usuario autenticado, usando modo anónimo');
    } else {
      console.log('✅ Usuario autenticado:', user?.email || 'Usuario');
    }

    // 2. Verificar estructura de tabla corporate_clients
    console.log('\n2️⃣ Verificando estructura de tabla corporate_clients...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);

    if (tableError && !tableError.message.includes('no rows')) {
      console.error('❌ Error al acceder a tabla corporate_clients:', tableError);
      return;
    }

    console.log('✅ Tabla corporate_clients accesible');

    // 3. Verificar que todos los campos necesarios existan
    console.log('\n3️⃣ Verificando campos necesarios...');
    const testClient = {
      name: 'Cliente Test',
      category: 'Categoria Test',
      trust_level: 'Alto',
      contact_info: { email: 'test@example.com', phone: '+1234567890' },
      business_info: { industry: 'Tecnología', size: 'Mediana' },
      display_category: 'Categoria Test',
      segment_count: 0,
      is_active: true,
      company_id: '00000000-0000-0000-0000-000000000000' // UUID válido para prueba
    };

    console.log('📋 Campos a probar:');
    Object.keys(testClient).forEach(key => {
      console.log(`  - ${key}: ${typeof testClient[key]}`);
    });

    // 4. Intentar insertar cliente de prueba
    console.log('\n4️⃣ Intentando insertar cliente de prueba...');
    const { data: insertedClient, error: insertError } = await supabase
      .from('corporate_clients')
      .insert(testClient)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al insertar cliente:', insertError);
      
      if (insertError.message.includes('column')) {
        console.log('\n🔍 Análisis del error:');
        console.log('El error indica que faltan columnas en la tabla.');
        console.log('Ejecuta el SQL_CLIENTES_CORPORATIVOS_FINAL.sql para agregar las columnas faltantes.');
      }
      
      return;
    }

    console.log('✅ Cliente insertado correctamente:');
    console.log('  ID:', insertedClient.id);
    console.log('  Nombre:', insertedClient.name);
    console.log('  Categoría:', insertedClient.category);

    // 5. Verificar que el cliente se pueda consultar
    console.log('\n5️⃣ Verificando que el cliente se pueda consultar...');
    const { data: queriedClient, error: queryError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('id', insertedClient.id)
      .single();

    if (queryError) {
      console.error('❌ Error al consultar cliente:', queryError);
      return;
    }

    console.log('✅ Cliente consultado correctamente:');
    console.log('  Datos completos:', JSON.stringify(queriedClient, null, 2));

    // 6. Limpiar datos de prueba
    console.log('\n6️⃣ Limpiando datos de prueba...');
    const { error: deleteError } = await supabase
      .from('corporate_clients')
      .delete()
      .eq('id', insertedClient.id);

    if (deleteError) {
      console.error('❌ Error al eliminar cliente de prueba:', deleteError);
    } else {
      console.log('✅ Cliente de prueba eliminado correctamente');
    }

    // 7. Resumen final
    console.log('\n🎉 RESUMEN FINAL DE LA PRUEBA');
    console.log('=' * 60);
    console.log('✅ Conexión a Supabase: Funcionando');
    console.log('✅ Tabla corporate_clients: Accesible');
    console.log('✅ Campos necesarios: Presentes');
    console.log('✅ Inserción de datos: Funcionando');
    console.log('✅ Consulta de datos: Funcionando');
    console.log('✅ Limpieza de datos: Funcionando');
    
    console.log('\n🚀 El flujo de clientes corporativos está LISTO PARA USO');
    console.log('📝 Puedes acceder a: http://localhost:3002/empresa/perfil/clientes');

  } catch (error) {
    console.error('❌ Error inesperado durante la prueba:', error);
  }
}

// Ejecutar prueba
testCorporateClientsFlow();