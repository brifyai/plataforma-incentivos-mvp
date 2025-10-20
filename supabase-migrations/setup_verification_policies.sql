-- ==========================================
-- Configuración del Bucket verification-documents
-- ==========================================
-- Ejecutar este SQL en el editor SQL de Supabase Dashboard
-- ==========================================

-- 1. Crear el bucket verification-documents
-- Nota: Esto debe hacerse manualmente desde el dashboard de Supabase
-- Ve a Storage -> Create new bucket -> Name: verification-documents
-- Configuración:
-- - Public bucket: NO
-- - File size limit: 5MB
-- - Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg

-- 2. Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Política para permitir a usuarios autenticados leer sus archivos
CREATE POLICY "Users can read own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política para permitir a usuarios autenticados actualizar sus archivos
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

-- 6. Política para permitir a usuarios autenticados eliminar sus archivos
CREATE POLICY "Users can delete own verification documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Política para permitir a administradores ver todos los documentos (opcional)
CREATE POLICY "Admins can read all verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
);

-- ==========================================
-- Verificación de configuración
-- ==========================================

-- Verificar que las políticas fueron creadas correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%verification%';

-- Verificar que el bucket existe (después de crearlo manualmente)
SELECT * FROM storage.buckets WHERE name = 'verification-documents';

-- ==========================================
-- Instrucciones manuales
-- ==========================================
/*
Pasos para configurar el bucket verification-documents:

1. IR AL DASHBOARD DE SUPABASE:
   - Ve a tu proyecto: https://wvluqdldygmgncqqjkow.supabase.co
   - Inicia sesión

2. CREAR EL BUCKET:
   - Ve a la sección "Storage" en el menú izquierdo
   - Haz clic en "Create new bucket"
   - Name: verification-documents
   - Public bucket: NO (desmarcar)
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg
   - Haz clic en "Save"

3. EJECUTAR ESTE SQL:
   - Ve a la sección "SQL Editor"
   - Copia y pega todo este script
   - Haz clic en "Run"

4. VERIFICAR CONFIGURACIÓN:
   - Ve a Storage -> verification-documents
   - Deberías ver el bucket creado
   - Las políticas deberían aparecer en la sección "Policies"

5. PROBAR LA SUBIDA:
   - Ve a la aplicación: http://localhost:3002/empresa/perfil
   - Intenta subir un documento de verificación
   - Debería funcionar sin errores
*/