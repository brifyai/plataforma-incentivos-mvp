/**
 * Script para configurar el bucket verification-documents en Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupVerificationBucket() {
  try {
    console.log('🔧 Configurando bucket verification-documents...');
    console.log('=' .repeat(60));

    // Paso 1: Verificar si el bucket existe
    console.log('📋 Paso 1: Verificando buckets existentes...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listando buckets:', listError);
      console.log('⚠️ Esto puede ser un problema de permisos. Intentando acceso directo...');
    } else {
      console.log('✅ Buckets encontrados:', buckets?.length || 0);
      buckets?.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });

      const verificationBucket = buckets?.find(b => b.name === 'verification-documents');
      if (verificationBucket) {
        console.log('✅ Bucket verification-documents ya existe');
        if (!verificationBucket.public) {
          console.log('⚠️ El bucket existe pero no es público. Esto puede causar problemas.');
        }
        return { success: true, message: 'Bucket ya existe' };
      }
    }

    // Paso 2: Intentar crear el bucket
    console.log('\n📋 Paso 2: Creando bucket verification-documents...');
    
    try {
      const { data, error } = await supabase.storage.createBucket('verification-documents', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creando bucket:', error);
        
        if (error.message.includes('already exists')) {
          console.log('✅ El bucket ya existe (error esperado)');
          return { success: true, message: 'Bucket ya existe' };
        }
        
        console.log('\n🔧 Solución manual requerida:');
        console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage');
        console.log('2. Haz clic en "New bucket"');
        console.log('3. Nombre: verification-documents');
        console.log('4. Marca "Public"');
        console.log('5. File size limit: 5242880 (5MB)');
        console.log('6. Allowed MIME types: application/pdf, image/jpeg, image/png');
        console.log('7. Haz clic en "Save"');
        
        return { success: false, error: error.message };
      }

      console.log('✅ Bucket verification-documents creado exitosamente');
      console.log('📋 Detalles:', data);

    } catch (createError) {
      console.error('❌ Excepción creando bucket:', createError);
      
      if (createError.message.includes('already exists')) {
        console.log('✅ El bucket ya existe (error esperado)');
        return { success: true, message: 'Bucket ya existe' };
      }
      
      return { success: false, error: createError.message };
    }

    // Paso 3: Verificar que el bucket sea accesible
    console.log('\n📋 Paso 3: Verificando acceso al bucket...');
    try {
      const { data: testFiles, error: accessError } = await supabase.storage
        .from('verification-documents')
        .list('', { limit: 1 });

      if (accessError) {
        console.error('❌ Error de acceso al bucket:', accessError);
        return { success: false, error: 'Bucket creado pero no accesible' };
      }

      console.log('✅ Bucket accesible correctamente');
      console.log('📄 Archivos en bucket:', testFiles?.length || 0);

    } catch (accessError) {
      console.error('❌ Excepción verificando acceso:', accessError);
      return { success: false, error: 'Error verificando acceso' };
    }

    // Paso 4: Configurar políticas RLS si es necesario
    console.log('\n📋 Paso 4: Verificando políticas de acceso...');
    console.log('📝 Nota: Las políticas RLS (Row Level Security) deben configurarse manualmente en el panel de Supabase');
    console.log('🔗 Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies');
    console.log('📋 Política recomendada:');
    console.log('CREATE POLICY "Allow authenticated uploads" ON storage.objects');
    console.log('FOR INSERT WITH CHECK (bucket_id = \'verification-documents\' AND auth.role() = \'authenticated\');');
    console.log('CREATE POLICY "Allow authenticated reads" ON storage.objects');
    console.log('FOR SELECT USING (bucket_id = \'verification-documents\' AND auth.role() = \'authenticated\');');

    return { success: true, message: 'Bucket configurado exitosamente' };

  } catch (error) {
    console.error('💥 Error general en setupVerificationBucket:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Configuración del Bucket de Verificación');
  console.log('🔧 NexuPay - Sistema de Subida de Documentos');
  console.log('=' .repeat(60));

  const result = await setupVerificationBucket();

  console.log('\n' + '=' .repeat(60));
  if (result.success) {
    console.log('✅ ÉXITO:', result.message);
    console.log('🎯 El bucket verification-documents está listo para usar');
    console.log('📤 Ahora puedes subir documentos desde la página de verificación');
  } else {
    console.log('❌ ERROR:', result.error);
    console.log('\n🔧 Solución manual:');
    console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage');
    console.log('2. Crea el bucket "verification-documents" manualmente');
    console.log('3. Configúralo como público con límite de 5MB');
    console.log('4. Permite MIME types: application/pdf, image/jpeg, image/png');
    console.log('5. Configura las políticas RLS si es necesario');
  }

  console.log('\n🎯 Prueba la subida de documentos en: http://localhost:3002/empresa/verification');
}

main().catch(console.error);