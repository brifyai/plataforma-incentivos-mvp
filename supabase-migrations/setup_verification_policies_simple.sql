-- ==========================================
-- Configuración Simplificada del Bucket verification-documents
-- ==========================================
-- Ejecutar este SQL en el editor SQL de Supabase Dashboard
-- ==========================================

-- NOTA IMPORTANTE: Si recibes error "must be owner of table objects",
-- entonces debes configurar las políticas manualmente desde el dashboard

-- ==========================================
-- PASO 1: Verificar si ya existen políticas
-- ==========================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%verification%';

-- ==========================================
-- PASO 2: Si tienes permisos, ejecuta esto:
-- ==========================================

-- Habilitar RLS (si no está habilitado)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
-- DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can read own verification documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;

-- Crear políticas simplificadas
-- CREATE POLICY "Users can upload verification documents"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'verification-documents' 
--   AND auth.role() = 'authenticated'
-- );

-- CREATE POLICY "Users can read own verification documents"
-- ON storage.objects
-- FOR SELECT
-- USING (
--   bucket_id = 'verification-documents' 
--   AND auth.role() = 'authenticated'
-- );

-- ==========================================
-- PASO 3: Si no tienes permisos, haz esto manualmente:
-- ==========================================

/*
INSTRUCCIONES MANUALES (cuando no tienes permisos de owner):

1. CREAR EL BUCKET:
   - Ve a Storage en el dashboard
   - Click en "Create new bucket"
   - Name: verification-documents
   - Public bucket: NO
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg

2. CONFIGURAR POLÍTICAS MANUALMENTE:
   - Ve a Storage → verification-documents
   - Click en la pestaña "Policies"
   - Click en "New Policy"
   - Para cada política, usa:
     
   POLICY 1 - INSERT:
   - Policy name: "Users can upload verification documents"
   - Allowed operation: INSERT
   - Target roles: authenticated
   - Policy definition: 
     bucket_id = 'verification-documents' AND auth.role() = 'authenticated'

   POLICY 2 - SELECT:
   - Policy name: "Users can read own verification documents"
   - Allowed operation: SELECT
   - Target roles: authenticated
   - Policy definition:
     bucket_id = 'verification-documents' AND auth.role() = 'authenticated'

   POLICY 3 - UPDATE:
   - Policy name: "Users can update own verification documents"
   - Allowed operation: UPDATE
   - Target roles: authenticated
   - Policy definition:
     bucket_id = 'verification-documents' AND auth.role() = 'authenticated'

   POLICY 4 - DELETE:
   - Policy name: "Users can delete own verification documents"
   - Allowed operation: DELETE
   - Target roles: authenticated
   - Policy definition:
     bucket_id = 'verification-documents' AND auth.role() = 'authenticated'

3. VERIFICAR:
   - Deberías ver 4 políticas creadas
   - Prueba subir un documento desde la aplicación
*/

-- ==========================================
-- PASO 4: Verificación final
-- ==========================================
-- Verificar si el bucket existe (después de crearlo manualmente)
-- SELECT * FROM storage.buckets WHERE name = 'verification-documents';

-- Verificar políticas (después de crearlas)
-- SELECT policyname, permissive, roles, cmd FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%verification%';