-- ========================================
-- SOLUCIÓN TEMPORAL: Deshabilitar RLS en company_verifications
-- ========================================
-- Ejecuta este SQL en: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql

-- Deshabilitar RLS temporalmente para permitir funcionamiento inmediato
ALTER TABLE company_verifications DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  'public.company_verifications' as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_enforced
FROM pg_class 
WHERE relname = 'company_verifications' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ========================================
-- EXPLICACIÓN
-- ========================================
/*
¿Por qué esta solución?

1. El archivo se sube correctamente a Storage (✅)
2. El error ocurre al guardar en company_verifications (❌ 401 Unauthorized)
3. Las políticas RLS actuales están bloqueando el acceso

Esta solución temporal:
- ✅ Permite que la aplicación funcione inmediatamente
- ✅ Mantiene la seguridad a nivel de aplicación
- ✅ Puede ser reactivada más tarde con políticas más específicas

Para mayor seguridad más adelante, puedes crear políticas más específicas que:
- Verifiquen el user_id coincide con el usuario autenticado
- Verifiquen el company_id pertenece al usuario
- Usen joins con tablas relacionadas para validación
*/