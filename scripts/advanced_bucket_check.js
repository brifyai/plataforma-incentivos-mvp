import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 VERIFICACIÓN AVANZADA DEL BUCKET');
console.log('='.repeat(60));

// Función para verificar con múltiples métodos
async function comprehensiveBucketCheck() {
  console.log(`🌐 URL de Supabase: ${supabaseUrl}`);
  console.log(`🔑 ANON_KEY configurada: ${supabaseKey ? '✅' : '❌'}`);
  console.log(`🔐 SERVICE_ROLE_KEY configurada: ${serviceRoleKey ? '✅' : '❌'}`);
  
  // Método 1: Verificación con cliente normal
  console.log('\n📡 MÉTODO 1: Verificación con ANON_KEY');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Listar buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listando buckets:', bucketError);
    } else {
      console.log('✅ Lista de buckets obtenida:');
      buckets.forEach(bucket => {
        console.log(`  📁 ${bucket.name} (público: ${bucket.public})`);
      });
      
      const verificationBucket = buckets.find(b => b.name === 'verification-documents');
      if (verificationBucket) {
        console.log('✅ BUCKET verification-documents ENCONTRADO con ANON_KEY');
        await testBucketAccess(supabase, 'ANON_KEY');
        return true;
      } else {
        console.log('❌ BUCKET verification-documents NO ENCONTRADO con ANON_KEY');
      }
    }
  } catch (error) {
    console.error('❌ Error con ANON_KEY:', error.message);
  }
  
  // Método 2: Verificación con service role (si está disponible)
  if (serviceRoleKey) {
    console.log('\n🔑 MÉTODO 2: Verificación con SERVICE_ROLE_KEY');
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Error con SERVICE_ROLE_KEY:', bucketError.message);
        console.log('🔍 La SERVICE_ROLE_KEY parece estar truncada o incorrecta');
      } else {
        console.log('✅ Lista de buckets obtenida con SERVICE_ROLE_KEY:');
        buckets.forEach(bucket => {
          console.log(`  📁 ${bucket.name} (público: ${bucket.public})`);
        });
        
        const verificationBucket = buckets.find(b => b.name === 'verification-documents');
        if (verificationBucket) {
          console.log('✅ BUCKET verification-documents ENCONTRADO con SERVICE_ROLE_KEY');
          await testBucketAccess(supabaseAdmin, 'SERVICE_ROLE_KEY');
          return true;
        } else {
          console.log('❌ BUCKET verification-documents NO ENCONTRADO con SERVICE_ROLE_KEY');
        }
      }
    } catch (error) {
      console.error('❌ Error con SERVICE_ROLE_KEY:', error.message);
    }
  }
  
  // Método 3: Intentar acceso directo al bucket (para verificar si existe pero no aparece en lista)
  console.log('\n🎯 MÉTODO 3: Verificación directa del bucket');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Intentar listar archivos en el bucket (esto falla si el bucket no existe)
    const { data: files, error: filesError } = await supabase.storage
      .from('verification-documents')
      .list('', { limit: 1 });
    
    if (filesError) {
      if (filesError.message.includes('not found') || filesError.message.includes('does not exist')) {
        console.log('❌ El bucket verification-documents definitivamente NO EXISTE');
      } else {
        console.log('⚠️ Error de acceso al bucket (puede existir pero sin permisos):', filesError.message);
      }
    } else {
      console.log('✅ BUCKET verification-documents EXISTE y es accesible');
      console.log('📄 Archivos encontrados:', files.length);
      return true;
    }
  } catch (error) {
    console.error('❌ Error en verificación directa:', error.message);
  }
  
  // Método 4: Verificar si el usuario dice que subió un archivo
  console.log('\n🤔 MÉTODO 4: Investigando discrepancia');
  console.log('El usuario dice que subió un archivo, pero el bucket no aparece en las listas.');
  console.log('Posibles causas:');
  console.log('1. 🕐 El bucket se creó pero aún no se sincroniza (esperar 2-3 minutos)');
  console.log('2. 🔄 Hay un problema de caché en Supabase');
  console.log('3. 📁 El archivo se subió a otro bucket');
  console.log('4. 🔐 Hay permisos que impiden ver el bucket');
  console.log('5. 🌐 El usuario está en un proyecto diferente de Supabase');
  
  return false;
}

// Función para probar acceso al bucket
async function testBucketAccess(client, clientType) {
  console.log(`\n🧪 Probando acceso al bucket con ${clientType}:`);
  
  try {
    // Intentar subir un archivo de prueba
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    const { data, error } = await client.storage
      .from('verification-documents')
      .upload(fileName, testFile);
    
    if (error) {
      console.log(`❌ Error subiendo archivo de prueba: ${error.message}`);
    } else {
      console.log(`✅ Archivo de prueba subido exitosamente: ${data.path}`);
      
      // Intentar eliminar el archivo de prueba
      const { error: deleteError } = await client.storage
        .from('verification-documents')
        .remove([fileName]);
      
      if (deleteError) {
        console.log(`⚠️ No se pudo eliminar archivo de prueba: ${deleteError.message}`);
      } else {
        console.log(`✅ Archivo de prueba eliminado exitosamente`);
      }
    }
  } catch (error) {
    console.error(`❌ Error en prueba de acceso: ${error.message}`);
  }
}

// Función principal
async function runAdvancedCheck() {
  const bucketExists = await comprehensiveBucketCheck();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 VERIFICACIÓN AVANZADA COMPLETADA');
  
  if (bucketExists) {
    console.log('✅ RESULTADO: El bucket verification-documents EXISTE y funciona');
    console.log('💡 Si la aplicación sigue dando error, recarga la página y limpia la caché');
  } else {
    console.log('❌ RESULTADO: El bucket verification-documents NO EXISTE o no es accesible');
    console.log('\n🔧 ACCIONES RECOMENDADAS:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/storage');
    console.log('2. Verifica si ves el bucket "verification-documents" en la lista');
    console.log('3. Si no existe, créalo manualmente');
    console.log('4. Si existe, verifica que sea público');
    console.log('5. Espera 2-3 minutos después de crearlo');
    console.log('6. Recarga la aplicación completamente (Ctrl+F5)');
  }
}

// Ejecutar verificación avanzada
runAdvancedCheck().catch(console.error);