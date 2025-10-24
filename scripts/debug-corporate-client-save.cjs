/**
 * Script de diagnóstico para identificar por qué los clientes corporativos no se guardan
 * 
 * Este script verificará:
 * 1. Si la tabla corporate_clients existe
 * 2. Si tiene los campos correctos
 * 3. Si los permisos RLS están configurados
 * 4. Si podemos insertar datos de prueba
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCorporateClientSave() {
  console.log('🔍 DIAGNÓSTICO COMPLETO: CLIENTES CORPORATIVOS');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('\n📡 1. Verificando conexión a Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError.message);
      return;
    }
    console.log('✅ Conexión a Supabase exitosa');
    
    // 2. Verificar si la tabla corporate_clients existe
    console.log('\n📋 2. Verificando existencia de tabla corporate_clients...');
    
    try {
      const { data: tableExists, error: tableError } = await supabase
        .from('corporate_clients')
        .select('*')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === 'PGRST116') {
          console.error('❌ La tabla corporate_clients NO existe');
          console.error('   Código de error:', tableError.code);
          console.error('   Mensaje:', tableError.message);
          return;
        } else {
          console.error('❌ Error al verificar tabla:', tableError.message);
          return;
        }
      }
      
      console.log('✅ Tabla corporate_clients existe');
      
      // 3. Verificar estructura de la tabla
      console.log('\n🏗️ 3. Verificando estructura de la tabla...');
      
      // Intentar obtener datos para ver la estructura
      const { data: sampleData, error: sampleError } = await supabase
        .from('corporate_clients')
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.error('❌ Error al obtener muestra:', sampleError.message);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Estructura de tabla encontrada:');
        console.log('   Campos:', Object.keys(sampleData[0]).join(', '));
        console.log('   Registros existentes:', sampleData.length);
      } else {
        console.log('✅ Tabla existe pero está vacía');
        console.log('   Campos desconocidos (tabla vacía)');
      }
      
      // 4. Verificar si podemos obtener companies para el test
      console.log('\n🏢 4. Verificando empresas existentes...');
      
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .limit(1);
      
      if (companiesError) {
        console.error('❌ Error al obtener empresas:', companiesError.message);
        return;
      }
      
      if (!companies || companies.length === 0) {
        console.error('❌ No hay empresas en la base de datos');
        console.error('   Se necesita una empresa para crear clientes corporativos');
        return;
      }
      
      const testCompany = companies[0];
      console.log('✅ Empresa encontrada para prueba:');
      console.log('   ID:', testCompany.id);
      console.log('   Nombre:', testCompany.company_name);
      
      // 5. Intentar insertar un cliente corporativo de prueba
      console.log('\n💾 5. Intentando insertar cliente corporativo de prueba...');
      
      const testClientData = {
        name: 'CLIENTE PRUEBA DIAGNÓSTICO',
        display_category: 'testing',
        trust_level: 'high',
        contact_info: {
          email: 'test@diagnostico.com',
          phone: '+56 9 1234 5678',
          contact_person: 'Persona Prueba'
        },
        business_info: {
          industry: 'Testing',
          size: 'small',
          location: 'Santiago, Chile'
        },
        company_id: testCompany.id,
        is_active: true,
        segment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Datos de prueba a insertar:');
      console.log(JSON.stringify(testClientData, null, 2));
      
      const { data: insertedClient, error: insertError } = await supabase
        .from('corporate_clients')
        .insert(testClientData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ ERROR AL INSERTAR CLIENTE CORPORATIVO:');
        console.error('   Código:', insertError.code);
        console.error('   Mensaje:', insertError.message);
        console.error('   Detalles:', insertError.details);
        
        // Análisis específico del error
        if (insertError.code === '42501') {
          console.error('\n🚫 PROBLEMA DE PERMISOS RLS:');
          console.error('   La tabla tiene políticas de seguridad que impiden la inserción');
          console.error('   Solución: Configurar políticas RLS para permitir inserciones');
        } else if (insertError.code === '42P01') {
          console.error('\n🚫 PROBLEMA DE TABLA:');
          console.error('   La tabla no existe realmente');
          console.error('   Solución: Crear la tabla corporate_clients');
        } else if (insertError.code === '23502') {
          console.error('\n🚫 PROBLEMA DE CAMPO REQUERIDO:');
          console.error('   Falta un campo requerido en la tabla');
          console.error('   Solución: Agregar el campo faltante o proporcionarlo');
        } else if (insertError.code === '23505') {
          console.error('\n🚫 PROBLEMA DE DUPLICADO:');
          console.error('   Ya existe un registro con los mismos datos únicos');
        }
        
        return;
      }
      
      console.log('✅ CLIENTE CORPORATIVO INSERTADO EXITOSAMENTE:');
      console.log('   ID:', insertedClient.id);
      console.log('   Nombre:', insertedClient.name);
      console.log('   Company ID:', insertedClient.company_id);
      
      // 6. Verificar que el cliente se pueda leer
      console.log('\n📖 6. Verificando que el cliente insertado se pueda leer...');
      
      const { data: readClient, error: readError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('id', insertedClient.id)
        .single();
      
      if (readError) {
        console.error('❌ Error al leer cliente insertado:', readError.message);
        return;
      }
      
      console.log('✅ Cliente leído correctamente:');
      console.log('   ID:', readClient.id);
      console.log('   Nombre:', readClient.name);
      console.log('   Campos:', Object.keys(readClient).join(', '));
      
      // 7. Limpiar datos de prueba
      console.log('\n🧹 7. Limpiando datos de prueba...');
      
      const { error: deleteError } = await supabase
        .from('corporate_clients')
        .delete()
        .eq('id', insertedClient.id);
      
      if (deleteError) {
        console.warn('⚠️ No se pudo eliminar el cliente de prueba:', deleteError.message);
      } else {
        console.log('✅ Cliente de prueba eliminado');
      }
      
      // 8. Resumen final
      console.log('\n🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
      console.log('='.repeat(60));
      console.log('✅ La tabla corporate_clients existe y es accesible');
      console.log('✅ Los permisos permiten inserciones');
      console.log('✅ Los datos se guardan y leen correctamente');
      console.log('\n🔍 CONCLUSIÓN: El problema NO está en la base de datos');
      console.log('   El problema debe estar en el frontend o en el flujo de datos');
      console.log('   Revise los logs del navegador y la consola para más detalles');
      
    } catch (error) {
      console.error('❌ ERROR INESPERADO:', error.message);
      console.error('   Stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL EN EL DIAGNÓSTICO:', error.message);
  }
}

// Ejecutar diagnóstico
debugCorporateClientSave()
  .then(() => {
    console.log('\n🏁 Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal en el diagnóstico:', error);
    process.exit(1);
  });