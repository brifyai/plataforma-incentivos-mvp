/**
 * Script para diagnosticar el acceso al bucket verification-documents
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseBucketAccess() {
  try {
    console.log('🔍 Diagnosticando acceso al bucket verification-documents...');
    console.log('=' .repeat(60));

    // Paso 1: Verificar que el bucket existe
    console.log('📋 Paso 1: Verificando existencia del bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listando buckets:', listError);
      return { success: false, error: listError.message };
    }

    const verificationBucket = buckets?.find(b => b.name === 'verification-documents');
    if (!verificationBucket) {
      console.error('❌ Bucket verification-documents no encontrado');
      return { success: false, error: 'Bucket no encontrado' };
    }

    console.log('✅ Bucket verification-documents encontrado');
    console.log('📋 Configuración:', {
      name: verificationBucket.name,
      public: verificationBucket.public,
      file_size_limit: verificationBucket.file_size_limit,
      allowed_mime_types: verificationBucket.allowed_mime_types
    });

    // Paso 2: Verificar acceso al bucket
    console.log('\n📋 Paso 2: Verificando acceso al bucket...');
    try {
      const { data: files, error: accessError } = await supabase.storage
        .from('verification-documents')
        .list('', { limit: 10 });

      if (accessError) {
        console.error('❌ Error de acceso al bucket:', accessError);
        
        if (accessError.message.includes('permission') || accessError.message.includes('unauthorized')) {
          console.log('🔧 Problema: Permisos denegados');
          console.log('💡 Solución: Configurar políticas RLS');
          console.log('🔗 Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies');
        } else if (accessError.message.includes('not found')) {
          console.log('🔧 Problema: Bucket no accesible');
          console.log('💡 Solución: Verificar configuración del bucket');
        }
        
        return { success: false, error: accessError.message };
      }

      console.log('✅ Acceso al bucket exitoso');
      console.log('📄 Archivos encontrados:', files?.length || 0);
      files?.forEach(file => {
        console.log(`  - ${file.name} (${file.created_at})`);
      });

    } catch (accessException) {
      console.error('❌ Excepción verificando acceso:', accessException);
      return { success: false, error: accessException.message };
    }

    // Paso 3: Probar subida de un archivo de prueba
    console.log('\n📋 Paso 3: Probando subida de archivo de prueba...');
    try {
      // Crear un archivo de prueba simple
      const testContent = 'Test file content';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

      const testFileName = `test_${Date.now()}.txt`;
      
      console.log('📤 Intentando subir archivo de prueba...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(testFileName, testFile);

      if (uploadError) {
        console.error('❌ Error en subida de prueba:', uploadError);
        
        if (uploadError.message.includes('mime') || uploadError.message.includes('type')) {
          console.log('🔧 Problema: Tipo de archivo no permitido');
          console.log('💡 Solución: El bucket solo permite PDF, JPEG, PNG');
        } else if (uploadError.message.includes('size')) {
          console.log('🔧 Problema: Archivo demasiado grande');
          console.log('💡 Solución: Verificar límite de tamaño del bucket');
        } else if (uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
          console.log('🔧 Problema: Políticas RLS bloqueando la subida');
          console.log('💡 Solución: Configurar políticas RLS para permitir subidas');
        }
        
        return { success: false, error: uploadError.message };
      }

      console.log('✅ Subida de prueba exitosa');
      console.log('📋 Datos:', uploadData);

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(testFileName);

      console.log('🔗 URL pública:', urlData.publicUrl);

      // Limpiar archivo de prueba
      await supabase.storage
        .from('verification-documents')
        .remove([testFileName]);

      console.log('🧹 Archivo de prueba eliminado');

    } catch (uploadException) {
      console.error('❌ Excepción en subida de prueba:', uploadException);
      return { success: false, error: uploadException.message };
    }

    // Paso 4: Verificar políticas RLS
    console.log('\n📋 Paso 4: Verificando políticas RLS...');
    console.log('📝 Nota: Las políticas RLS deben configurarse manualmente');
    console.log('🔗 Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies');
    console.log('📋 Políticas recomendadas:');
    console.log('');
    console.log('CREATE POLICY "Allow authenticated uploads" ON storage.objects');
    console.log('FOR INSERT WITH CHECK (');
    console.log('  bucket_id = \'verification-documents\' AND');
    console.log('  auth.role() = \'authenticated\'');
    console.log(');');
    console.log('');
    console.log('CREATE POLICY "Allow authenticated reads" ON storage.objects');
    console.log('FOR SELECT USING (');
    console.log('  bucket_id = \'verification-documents\' AND');
    console.log('  auth.role() = \'authenticated\'');
    console.log(');');

    return { success: true, message: 'Bucket accesible correctamente' };

  } catch (error) {
    console.error('💥 Error general en diagnoseBucketAccess:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Diagnóstico de Acceso a Bucket');
  console.log('🔧 NexuPay - Sistema de Verificación');
  console.log('=' .repeat(60));

  const result = await diagnoseBucketAccess();

  console.log('\n' + '=' .repeat(60));
  if (result.success) {
    console.log('✅ ÉXITO:', result.message);
    console.log('🎯 El bucket verification-documents funciona correctamente');
    console.log('📤 Los botones de subida deberían funcionar ahora');
  } else {
    console.log('❌ ERROR:', result.error);
    console.log('\n🔧 Solución recomendada:');
    console.log('1. Verifica las políticas RLS en el panel de Supabase');
    console.log('2. Configura las políticas sugeridas en la salida anterior');
    console.log('3. Asegúrate que el bucket sea público');
    console.log('4. Verifica los MIME types permitidos');
  }

  console.log('\n🎯 Prueba nuevamente en: http://localhost:3002/empresa/verification');
}

main().catch(console.error);