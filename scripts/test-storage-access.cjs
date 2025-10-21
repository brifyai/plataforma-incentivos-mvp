/**
 * Script para probar acceso a Supabase Storage
 * Diagnostica problemas con políticas RLS
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU2NjM3NCwiZXhwIjoyMDUzMTQyMzc0fQ.qRJkWqjz3hX1mQr9sYhFqZQ5L7X8nK1V2J3m4P5e6T8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageAccess() {
  console.log('🔍 Iniciando prueba de acceso a Supabase Storage...\n');

  try {
    // 1. Verificar si el bucket existe
    console.log('1️⃣ Verificando si el bucket "verification-documents" existe...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listando buckets:', bucketError);
      return;
    }

    const verificationBucket = buckets.find(b => b.name === 'verification-documents');
    
    if (!verificationBucket) {
      console.error('❌ El bucket "verification-documents" NO existe');
      console.log('💡 Solución: Crea el bucket en https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage');
      return;
    }

    console.log('✅ Bucket "verification-documents" encontrado');
    console.log('📋 Detalles del bucket:', {
      name: verificationBucket.name,
      id: verificationBucket.id,
      public: verificationBucket.public
    });

    // 2. Probar acceso al bucket
    console.log('\n2️⃣ Probando acceso al bucket...');
    const { data: files, error: accessError } = await supabase.storage
      .from('verification-documents')
      .list('', { limit: 1 });

    if (accessError) {
      console.error('❌ Error accediendo al bucket:', accessError);
      
      if (accessError.message.includes('permission') || accessError.message.includes('policy')) {
        console.log('\n🔧 PROBLEMA IDENTIFICADO: Políticas RLS bloqueando el acceso');
        console.log('\n📋 SOLUCIÓN - Ejecuta estos SQL en Supabase SQL Editor:');
        console.log(`
-- 1. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Read verification docs" ON storage.objects;

-- 2. Crear políticas correctas para INSERT
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- 3. Crear políticas correctas para SELECT
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- 4. Crear políticas para UPDATE (opcional)
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- 5. Crear políticas para DELETE (opcional)
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);
        `);
      }
      return;
    }

    console.log('✅ Acceso al bucket exitoso');
    console.log('📄 Archivos encontrados:', files?.length || 0);

    // 3. Probar subida de archivo de prueba
    console.log('\n3️⃣ Probando subida de archivo de prueba...');
    
    // Crear un buffer simple para el archivo de prueba
    const testContent = 'Este es un archivo de prueba para verificar el acceso a Storage';
    const buffer = Buffer.from(testContent, 'utf8');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload('test/access-test.txt', buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo de prueba:', uploadError);
      
      if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
        console.log('\n🔧 PROBLEMA: Las políticas RLS no permiten INSERT');
        console.log('💡 Asegúrate de haber ejecutado el SQL proporcionado anteriormente');
      }
      return;
    }

    console.log('✅ Subida de prueba exitosa');
    console.log('📋 Detalles:', uploadData);

    // 4. Probar obtener URL pública
    console.log('\n4️⃣ Probando obtener URL pública...');
    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl('test/access-test.txt');

    if (urlData?.publicUrl) {
      console.log('✅ URL pública generada:', urlData.publicUrl);
    } else {
      console.log('⚠️ No se pudo generar URL pública');
    }

    // 5. Limpiar archivo de prueba
    console.log('\n5️⃣ Limpiando archivo de prueba...');
    const { error: deleteError } = await supabase.storage
      .from('verification-documents')
      .remove(['test/access-test.txt']);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar archivo de prueba:', deleteError);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 Todas las pruebas pasaron exitosamente');
    console.log('✅ El acceso a Supabase Storage está configurado correctamente');

  } catch (error) {
    console.error('💥 Error general en la prueba:', error);
  }
}

// Ejecutar prueba
testStorageAccess();