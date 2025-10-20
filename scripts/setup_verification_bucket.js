/**
 * Script para configurar el bucket verification-documents en Supabase Storage
 * Ejecutar con: node scripts/setup_verification_bucket.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Necesario: VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupVerificationBucket() {
  console.log('🔧 Configurando bucket verification-documents en Supabase Storage...\n');

  try {
    // 1. Verificar si el bucket ya existe
    console.log('📋 Verificando si el bucket ya existe...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error al listar buckets:', listError);
      throw listError;
    }

    const existingBucket = buckets?.find(bucket => bucket.name === 'verification-documents');

    if (existingBucket) {
      console.log('✅ El bucket verification-documents ya existe');
      console.log('📊 Información del bucket:', {
        name: existingBucket.name,
        id: existingBucket.id,
        public: existingBucket.public,
        created_at: existingBucket.created_at
      });
    } else {
      console.log('⚠️  El bucket verification-documents no existe, creándolo...');

      // 2. Crear el bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('verification-documents', {
        public: false, // Los documentos de verificación deben ser privados
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ],
        fileSizeLimit: 5242880, // 5MB
        descriptions: 'Documentos de verificación empresarial'
      });

      if (createError) {
        console.error('❌ Error al crear bucket:', createError);
        throw createError;
      }

      console.log('✅ Bucket verification-documents creado exitosamente');
      console.log('📊 Información del nuevo bucket:', newBucket);
    }

    // 3. Configurar políticas de acceso (RLS)
    console.log('\n🔐 Configurando políticas de acceso...');

    // Política para que los usuarios autenticados puedan subir archivos
    const { error: policyError } = await supabase.rpc('create_verification_policies');

    if (policyError) {
      console.log('⚠️  No se pudieron crear las políticas automáticamente');
      console.log('💡 Debes configurar las políticas manualmente en el dashboard de Supabase');
      console.log('📝 Políticas recomendadas:');
      console.log(`
1. Política para INSERT (subir archivos):
   - Permite a usuarios autenticados subir archivos
   - Condición: auth.uid() = company_id
   - Bucket: verification-documents

2. Política para SELECT (descargar archivos):
   - Permite a usuarios autenticados descargar sus propios archivos
   - Condición: auth.uid() = company_id
   - Bucket: verification-documents

3. Política para UPDATE (actualizar archivos):
   - Permite a usuarios autenticados actualizar sus propios archivos
   - Condición: auth.uid() = company_id
   - Bucket: verification-documents

4. Política para DELETE (eliminar archivos):
   - Permite a usuarios autenticados eliminar sus propios archivos
   - Condición: auth.uid() = company_id
   - Bucket: verification-documents
      `);
    } else {
      console.log('✅ Políticas de acceso configuradas exitosamente');
    }

    // 4. Verificar configuración final
    console.log('\n🔍 Verificando configuración final...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();

    if (finalError) {
      console.error('❌ Error al verificar configuración final:', finalError);
    } else {
      const verificationBucket = finalBuckets?.find(b => b.name === 'verification-documents');
      if (verificationBucket) {
        console.log('✅ Configuración verificada exitosamente');
        console.log('📋 Resumen final:', {
          name: verificationBucket.name,
          id: verificationBucket.id,
          public: verificationBucket.public,
          created_at: verificationBucket.created_at
        });
      }
    }

    console.log('\n🎉 Configuración del bucket verification-documents completada');
    console.log('💡 Ahora puedes subir documentos de verificación desde el perfil corporativo');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    console.error('📋 Detalles del error:', error);
    process.exit(1);
  }
}

// Función para crear las políticas SQL manualmente
async function createPoliciesManually() {
  console.log('\n📝 Generando SQL para políticas manuales...');
  
  const policiesSQL = `
-- Políticas para el bucket verification-documents
-- Ejecutar en el editor SQL de Supabase Dashboard

-- 1. Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Política para permitir a usuarios autenticados leer sus archivos
CREATE POLICY "Users can read own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Política para permitir a usuarios autenticados actualizar sus archivos
CREATE POLICY "Users can update own verification documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Política para permitir a usuarios autenticados eliminar sus archivos
CREATE POLICY "Users can delete own verification documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  `;

  console.log('SQL generado para políticas manuales:');
  console.log(policiesSQL);

  // Guardar SQL en archivo
  const fs = await import('fs');
  const path = await import('path');
  
  const sqlFilePath = path.join(__dirname, '../supabase-migrations/setup_verification_policies.sql');
  fs.writeFileSync(sqlFilePath, policiesSQL);
  
  console.log(`\n💾 SQL guardado en: ${sqlFilePath}`);
  console.log('📋 Ejecuta este SQL en el editor SQL de Supabase Dashboard');
}

// Ejecutar configuración
async function main() {
  try {
    await setupVerificationBucket();
    await createPoliciesManually();
  } catch (error) {
    console.error('❌ Error en la ejecución principal:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();