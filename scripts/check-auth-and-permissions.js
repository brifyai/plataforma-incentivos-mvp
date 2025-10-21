/**
 * Script para verificar autenticación y permisos de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthAndPermissions() {
  try {
    console.log('🔍 Verificando autenticación y permisos...');
    console.log('=' .repeat(60));

    // Paso 1: Verificar conexión básica
    console.log('📋 Paso 1: Verificando conexión a Supabase...');
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Error de conexión básica:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Conexión a Supabase exitosa');
    } catch (connError) {
      console.error('❌ Excepción en conexión básica:', connError);
      return { success: false, error: connError.message };
    }

    // Paso 2: Verificar autenticación actual
    console.log('\n📋 Paso 2: Verificando autenticación...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.log('⚠️ No hay usuario autenticado (usando clave anónima)');
        console.log('🔑 Usando rol: anónimo');
      } else {
        console.log('✅ Usuario autenticado:', user?.email || 'No email');
        console.log('🔑 Rol:', user?.user_metadata?.role || 'No role');
      }
    } catch (authException) {
      console.warn('⚠️ Error verificando autenticación:', authException.message);
    }

    // Paso 3: Intentar listar buckets con diferentes métodos
    console.log('\n📋 Paso 3: Verificando acceso a Storage...');
    
    // Método 1: listBuckets
    console.log('🔄 Método 1: listBuckets...');
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error con listBuckets:', listError);
        console.log('📋 Detalles:', {
          message: listError.message,
          status: listError.status,
          statusCode: listError.statusCode
        });
      } else {
        console.log('✅ listBuckets exitoso');
        console.log('📁 Buckets encontrados:', buckets?.length || 0);
        buckets?.forEach(bucket => {
          console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
      }
    } catch (listException) {
      console.error('❌ Excepción con listBuckets:', listException);
    }

    // Método 2: Acceso directo al bucket
    console.log('\n🔄 Método 2: Acceso directo al bucket...');
    try {
      const { data: files, error: accessError } = await supabase.storage
        .from('verification-documents')
        .list('', { limit: 1 });

      if (accessError) {
        console.error('❌ Error de acceso directo:', accessError);
        console.log('📋 Detalles:', {
          message: accessError.message,
          status: accessError.status,
          statusCode: accessError.statusCode
        });
        
        // Analizar el error específico
        if (accessError.message.includes('not found') || accessError.message.includes('does not exist')) {
          console.log('🔧 Diagnóstico: El bucket no existe o no es accesible');
        } else if (accessError.message.includes('permission') || accessError.message.includes('unauthorized')) {
          console.log('🔧 Diagnóstico: Problema de permisos (RLS)');
        } else if (accessError.message.includes('403') || accessError.statusCode === 403) {
          console.log('🔧 Diagnóstico: Acceso denegado (posible RLS)');
        }
      } else {
        console.log('✅ Acceso directo exitoso');
        console.log('📄 Archivos encontrados:', files?.length || 0);
      }
    } catch (accessException) {
      console.error('❌ Excepción en acceso directo:', accessException);
    }

    // Paso 4: Verificar información del proyecto
    console.log('\n📋 Paso 4: Información del proyecto...');
    console.log('🔗 URL del proyecto:', supabaseUrl);
    console.log('🔑 Clave usada:', supabaseKey.substring(0, 20) + '...');
    console.log('📋 Proyecto ID: wvluqdldygmgncqqjkow');

    // Paso 5: Sugerencias basadas en los resultados
    console.log('\n📋 Paso 5: Recomendaciones...');
    console.log('🔧 Si el bucket existe pero no es accesible:');
    console.log('   1. Verifica que estés en el proyecto correcto');
    console.log('   2. Configura políticas RLS para Storage');
    console.log('   3. Asegúrate que el bucket sea público');
    console.log('   4. Verifica los permisos del usuario anónimo');
    
    console.log('\n🔗 Enlaces útiles:');
    console.log('   - Storage: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage');
    console.log('   - Políticas: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies');
    console.log('   - Settings: https://app.supabase.com/project/wvluqdldygmgncqqjkow/settings/api');

    return { success: true, message: 'Diagnóstico completado' };

  } catch (error) {
    console.error('💥 Error general en checkAuthAndPermissions:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Verificación de Autenticación y Permisos');
  console.log('🔧 NexuPay - Diagnóstico de Sistema');
  console.log('=' .repeat(60));

  const result = await checkAuthAndPermissions();

  console.log('\n' + '=' .repeat(60));
  if (result.success) {
    console.log('✅ Diagnóstico completado');
    console.log('📋 Revisa la salida anterior para identificar el problema');
  } else {
    console.log('❌ Error en diagnóstico:', result.error);
  }

  console.log('\n🎯 Siguiente paso: Configurar el bucket según las recomendaciones');
}

main().catch(console.error);