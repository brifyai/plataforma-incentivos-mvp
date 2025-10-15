-- Crear bucket verification-documents si no existe
-- Este SQL debe ejecutarse en el editor SQL de Supabase Dashboard

-- Nota: La creación de buckets debe hacerse manualmente desde el dashboard
-- o usando el service role key. Este archivo contiene solo las políticas.

-- Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;

-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados leer sus propios archivos
CREATE POLICY "Users can read own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados actualizar sus propios archivos
CREATE POLICY "Users can update own verification documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados eliminar sus propios archivos
CREATE POLICY "Users can delete own verification documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Verificación de políticas creadas
SELECT 
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