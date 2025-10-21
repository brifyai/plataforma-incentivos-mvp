-- ========================================
-- POLÍTICAS RLS PARA TABLA COMPANY_VERIFICATIONS
-- ========================================
-- Ejecuta este SQL en: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql

-- 1. Habilitar RLS en la tabla company_verifications (si no está habilitado)
ALTER TABLE company_verifications ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan causar conflictos
DROP POLICY IF EXISTS "Users can view their company verification" ON company_verifications;
DROP POLICY IF EXISTS "Users can insert their company verification" ON company_verifications;
DROP POLICY IF EXISTS "Users can update their company verification" ON company_verifications;
DROP POLICY IF EXISTS "Users can manage their company verification" ON company_verifications;

-- 3. Crear políticas para usuarios autenticados

-- Política para INSERT (crear nuevas verificaciones)
CREATE POLICY "Users can insert their company verification" ON company_verifications
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Política para SELECT (leer verificaciones)
CREATE POLICY "Users can view their company verification" ON company_verifications
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Política para UPDATE (actualizar verificaciones)
CREATE POLICY "Users can update their company verification" ON company_verifications
FOR UPDATE USING (
  auth.role() = 'authenticated'
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
WHERE tablename = 'company_verifications' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 5. Información adicional para diagnóstico
SELECT 
  'public.company_verifications' as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_enforced
FROM pg_class 
WHERE relname = 'company_verifications' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ========================================
-- INSTRUCCIONES ADICIONALES
-- ========================================
/*
Si después de ejecutar este SQL sigues teniendo problemas:

1. Asegúrate de que la tabla company_verifications exista:
   SELECT * FROM company_verifications LIMIT 1;

2. Verifica que el usuario esté autenticado en la aplicación:
   - Revisa el console.log para ver los datos del usuario
   - Asegúrate de que auth.user() no sea null

3. Si el problema persiste, puedes hacer la tabla temporalmente sin RLS:
   ALTER TABLE company_verifications DISABLE ROW LEVEL SECURITY;

4. Para diagnóstico avanzado, revisa los logs de Supabase en:
   https://app.supabase.com/project/wvluqdldygmgncqqjkow/logs
*/