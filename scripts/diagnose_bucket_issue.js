import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DIAGNÓSTICO DEL BUCKET VERIFICATION-DOCUMENTS');
console.log('='.repeat(60));

// Función para probar conexión normal
async function testNormalConnection() {
  console.log('\n📡 Probando conexión con ANON_KEY...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Probar listar buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listando buckets con ANON_KEY:', bucketError);
      return false;
    }
    
    console.log('✅ Conexión exitosa con ANON_KEY');
    console.log('📋 Buckets encontrados:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const verificationBucket = buckets.find(b => b.name === 'verification-documents');
    if (verificationBucket) {
      console.log('✅ Bucket verification-documents encontrado');
      return true;
    } else {
      console.log('❌ Bucket verification-documents NO encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en conexión normal:', error.message);
    return false;
  }
}

// Función para probar conexión con service role
async function testServiceRoleConnection() {
  console.log('\n🔑 Probando conexión con SERVICE_ROLE_KEY...');
  
  if (!serviceRoleKey) {
    console.log('❌ VITE_SUPABASE_SERVICE_ROLE_KEY no configurada en .env');
    return false;
  }
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Probar listar buckets
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listando buckets con SERVICE_ROLE_KEY:', bucketError);
      return false;
    }
    
    console.log('✅ Conexión exitosa con SERVICE_ROLE_KEY');
    console.log('📋 Buckets encontrados:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const verificationBucket = buckets.find(b => b.name === 'verification-documents');
    if (verificationBucket) {
      console.log('✅ Bucket verification-documents encontrado');
      return true;
    } else {
      console.log('❌ Bucket verification-documents NO encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en conexión service role:', error.message);
    return false;
  }
}

// Función para intentar crear el bucket
async function tryCreateBucket() {
  console.log('\n🔧 Intentando crear bucket verification-documents...');
  
  if (!serviceRoleKey) {
    console.log('❌ No se puede crear bucket sin VITE_SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { data, error } = await supabaseAdmin.storage.createBucket('verification-documents', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
      fileSizeLimit: 5242880,
    });
    
    if (error) {
      console.error('❌ Error creando bucket:', error);
      return false;
    }
    
    console.log('✅ Bucket creado exitosamente:', data);
    return true;
  } catch (error) {
    console.error('❌ Error creando bucket:', error.message);
    return false;
  }
}

// Función principal de diagnóstico
async function runDiagnosis() {
  console.log(`🌐 URL de Supabase: ${supabaseUrl}`);
  console.log(`🔑 ANON_KEY configurada: ${supabaseKey ? '✅' : '❌'}`);
  console.log(`🔐 SERVICE_ROLE_KEY configurada: ${serviceRoleKey ? '✅' : '❌'}`);
  
  // Probar conexión normal
  const normalConnection = await testNormalConnection();
  
  // Probar conexión service role
  const serviceRoleConnection = await testServiceRoleConnection();
  
  // Si no existe el bucket, intentar crearlo
  if (!normalConnection && !serviceRoleConnection) {
    console.log('\n🚨 Bucket verification-documents no encontrado en ninguna conexión');
    
    const created = await tryCreateBucket();
    if (created) {
      console.log('\n✅ Bucket creado exitosamente. Intenta subir el documento nuevamente.');
    } else {
      console.log('\n❌ No se pudo crear el bucket automáticamente.');
      console.log('\n📋 SOLUCIÓN MANUAL:');
      console.log('1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/storage');
      console.log('2. Haz clic en "New bucket"');
      console.log('3. Nombre: verification-documents');
      console.log('4. Marca "Public bucket"');
      console.log('5. File size limit: 5242880');
      console.log('6. Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg');
      console.log('7. Haz clic en "Save"');
      console.log('8. Espera 1-2 minutos y vuelve a intentar subir el documento');
    }
  } else {
    console.log('\n✅ Bucket verification-documents existe y es accesible');
    console.log('🔄 Si el problema persiste, recarga la página y vuelve a intentar');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar diagnóstico
runDiagnosis().catch(console.error);