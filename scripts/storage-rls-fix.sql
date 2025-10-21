-- ========================================
-- POLÍTICAS RLS PARA SUPABASE STORAGE
-- ========================================
-- Ejecuta este SQL en: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql

-- 1. Primero, eliminar cualquier política existente que pueda causar conflictos
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Read verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- 2. Habilitar RLS en la tabla storage.objects (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para el bucket verification-documents

-- Política para INSERT (subir archivos)
CREATE POLICY "Allow authenticated uploads to verification docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para SELECT (leer/descargar archivos)
CREATE POLICY "Allow authenticated reads from verification docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para UPDATE (actualizar archivos)
CREATE POLICY "Allow authenticated updates to verification docs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Política para DELETE (eliminar archivos)
CREATE POLICY "Allow authenticated deletes from verification docs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- 4. Verificar que las políticas se crearon correctamente
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
ORDER BY policyname;

-- 5. Información adicional para diagnóstico
SELECT 
  'storage.objects' as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_enforced
FROM pg_class 
WHERE relname = 'objects' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- ========================================
-- INSTRUCCIONES ADICIONALES
-- ========================================
/*
Si después de ejecutar este SQL sigues teniendo problemas:

1. Verifica que el bucket "verification-documents" exista:
   - Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage
   - Si no existe, créalo con el nombre exacto "verification-documents"

2. Asegúrate de que el bucket sea público:
   - En la configuración del bucket, marca "Public" si es necesario

3. Espera 1-2 minutos después de ejecutar el SQL para que las políticas se activen

4. Limpia la caché del navegador y recarga la página

5. Si el problema persiste, recarga la página de Supabase y verifica las políticas en:
   https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies
*/