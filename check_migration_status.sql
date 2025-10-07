-- Verificar estado de la migración
SELECT
    '🔍 VERIFICACIÓN DE SISTEMA' as status,
    NOW() as check_time;

-- Verificar tablas
SELECT
    '📋 TABLAS EXISTENTES' as section,
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name IN ('companies', 'company_verifications', 'verification_history')
AND table_schema = 'public'
ORDER BY table_name;

-- Verificar columnas de companies
SELECT
    '🏢 COLUMNAS EN COMPANIES' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT
    '🔒 POLÍTICAS RLS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual, 100) as qual_preview
FROM pg_policies
WHERE tablename IN ('companies', 'company_verifications', 'verification_history')
ORDER BY tablename, policyname;

-- Verificar si RLS está habilitado
SELECT
    '🛡️ RLS HABILITADO' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('companies', 'company_verifications', 'verification_history')
AND schemaname = 'public';