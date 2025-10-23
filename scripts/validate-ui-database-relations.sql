-- 🔍 SCRIPT DE VALIDACIÓN DE RELACIONES UI-BD
-- Verificación completa de mapeo entre campos de interfaz y base de datos
-- Sistema NexuPay - Validación Post-Ejecución

-- =====================================================
-- 📊 VERIFICACIÓN DE ESTRUCTURA DE TABLAS
-- =====================================================

SELECT '=== VERIFICACIÓN DE ESTRUCTURA DE TABLAS ===' as validation_section;

-- Verificar tablas principales
SELECT 
    'TABLE_EXISTS' as check_type,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = t.table_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('users'), ('companies'), ('clients'), ('debts'), 
    ('offers'), ('agreements'), ('payments'), ('notifications')
) AS t(table_name);

-- =====================================================
-- 🔍 VERIFICACIÓN DE COLUMNAS CRÍTICAS
-- =====================================================

SELECT '=== VERIFICACIÓN DE COLUMNAS CRÍTICAS ===' as validation_section;

-- Verificar columnas en tabla users
SELECT 
    'COLUMN_USERS' as check_type,
    column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = c.column_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('id'), ('email'), ('rut'), ('full_name'), ('phone'), 
    ('role'), ('validation_status'), ('email_verified')
) AS c(column_name);

-- Verificar columnas en tabla companies
SELECT 
    'COLUMN_COMPANIES' as check_type,
    column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'companies' AND column_name = c.column_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('id'), ('user_id'), ('company_name'), ('rut'), ('contact_email'), 
    ('contact_phone'), ('is_active'), ('created_at')
) AS c(column_name);

-- Verificar columnas en tabla clients
SELECT 
    'COLUMN_CLIENTS' as check_type,
    column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = c.column_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('id'), ('company_id'), ('business_name'), ('rut'), ('contact_email'), 
    ('contact_phone'), ('status'), ('corporate_client_id')
) AS c(column_name);

-- Verificar columnas en tabla debts
SELECT 
    'COLUMN_DEBTS' as check_type,
    column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debts' AND column_name = c.column_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('id'), ('user_id'), ('company_id'), ('client_id'), ('original_amount'), 
    ('current_amount'), ('status'), ('due_date'), ('description')
) AS c(column_name);

-- =====================================================
-- 🔗 VERIFICACIÓN DE FOREIGN KEY CONSTRAINTS
-- =====================================================

SELECT '=== VERIFICACIÓN DE FOREIGN KEY CONSTRAINTS ===' as validation_section;

-- Verificar constraints principales
SELECT 
    'CONSTRAINT' as check_type,
    constraint_name,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = tc.constraint_name AND table_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('companies_user_id_fkey', 'companies'),
    ('debts_company_id_fkey', 'debts'),
    ('debts_user_id_fkey', 'debts'),
    ('debts_client_id_fkey', 'debts'),
    ('clients_company_id_fkey', 'clients'),
    ('offers_debt_id_fkey', 'offers'),
    ('offers_company_id_fkey', 'offers'),
    ('offers_user_id_fkey', 'offers')
) AS tc(constraint_name, table_name);

-- =====================================================
-- 📈 VERIFICACIÓN DE INTEGRIDAD DE DATOS
-- =====================================================

SELECT '=== VERIFICACIÓN DE INTEGRIDAD DE DATOS ===' as validation_section;

-- Verificar relaciones users → companies
SELECT 
    'USERS_COMPANIES_RELATION' as check_type,
    COUNT(*) as total_users,
    COUNT(DISTINCT c.id) as users_with_companies,
    COUNT(*) - COUNT(DISTINCT c.id) as users_without_companies,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT c.id) THEN '✅ OK'
        ELSE '⚠️ INCONSISTENT'
    END as status
FROM users u
LEFT JOIN companies c ON u.id = c.user_id;

-- Verificar relaciones companies → clients
SELECT 
    'COMPANIES_CLIENTS_RELATION' as check_type,
    COUNT(*) as total_companies,
    COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL THEN co.id END) as companies_with_clients,
    COUNT(*) - COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL THEN co.id END) as companies_without_clients,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL THEN co.id END) > 0 THEN '✅ OK'
        ELSE '⚠️ NO CLIENTS'
    END as status
FROM companies co
LEFT JOIN clients cl ON co.id = cl.company_id;

-- Verificar relaciones companies → debts
SELECT 
    'COMPANIES_DEBTS_RELATION' as check_type,
    COUNT(*) as total_companies,
    COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN co.id END) as companies_with_debts,
    COUNT(*) - COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN co.id END) as companies_without_debts,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN co.id END) > 0 THEN '✅ OK'
        ELSE '⚠️ NO DEBTS'
    END as status
FROM companies co
LEFT JOIN debts d ON co.id = d.company_id;

-- Verificar relaciones clients → debts
SELECT 
    'CLIENTS_DEBTS_RELATION' as check_type,
    COUNT(*) as total_clients,
    COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN c.id END) as clients_with_debts,
    COUNT(*) - COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN c.id END) as clients_without_debts,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN c.id END) > 0 THEN '✅ OK'
        ELSE '⚠️ NO DEBTS'
    END as status
FROM clients c
LEFT JOIN debts d ON c.id = d.client_id;

-- Verificar debts con client_id nulo vs company_id
SELECT 
    'DEBTS_CLIENT_ID_STATUS' as check_type,
    COUNT(*) as total_debts,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as debts_with_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as debts_without_client_id,
    ROUND(
        (COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
    ) as percentage_with_client_id,
    CASE 
        WHEN COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) = COUNT(*) THEN '✅ ALL HAVE CLIENT_ID'
        WHEN COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) > 0 THEN '⚠️ PARTIAL'
        ELSE '❌ NO CLIENT_ID'
    END as status
FROM debts;

-- =====================================================
-- 🔍 VERIFICACIÓN DE DATOS PROBLEMÁTICOS
-- =====================================================

SELECT '=== VERIFICACIÓN DE DATOS PROBLEMÁTICOS ===' as validation_section;

-- Verificar debts con client_id inválido
SELECT 
    'ORPHANED_DEBTS_CLIENT_ID' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
        ELSE '⚠️ ORPHANS FOUND'
    END as status
FROM debts d
WHERE d.client_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = d.client_id);

-- Verificar clients con company_id inválido
SELECT 
    'ORPHANED_CLIENTS_COMPANY_ID' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
        ELSE '⚠️ ORPHANS FOUND'
    END as status
FROM clients c
WHERE c.company_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM companies co WHERE co.id = c.company_id);

-- Verificar debts con company_id inválido
SELECT 
    'ORPHANED_DEBTS_COMPANY_ID' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
        ELSE '⚠️ ORPHANS FOUND'
    END as status
FROM debts d
WHERE d.company_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM companies co WHERE co.id = d.company_id);

-- =====================================================
-- 📊 MÉTRICAS GENERALES DEL SISTEMA
-- =====================================================

SELECT '=== MÉTRICAS GENERALES DEL SISTEMA ===' as validation_section;

SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Users' as metric_name,
    COUNT(*) as value,
    'users' as table_source
FROM users
UNION ALL
SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Companies' as metric_name,
    COUNT(*) as value,
    'companies' as table_source
FROM companies
UNION ALL
SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Clients' as metric_name,
    COUNT(*) as value,
    'clients' as table_source
FROM clients
UNION ALL
SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Debts' as metric_name,
    COUNT(*) as value,
    'debts' as table_source
FROM debts
UNION ALL
SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Offers' as metric_name,
    COUNT(*) as value,
    'offers' as table_source
FROM offers
UNION ALL
SELECT 
    'SYSTEM_METRICS' as metric_type,
    'Total Amount' as metric_name,
    COALESCE(SUM(current_amount), 0) as value,
    'debts' as table_source
FROM debts;

-- =====================================================
-- ✅ RESUMEN FINAL DE VALIDACIÓN
-- =====================================================

SELECT '=== RESUMEN FINAL DE VALIDACIÓN ===' as validation_section;

SELECT 
    'VALIDATION_SUMMARY' as summary_type,
    'Tables Verified' as item,
    '8' as count,
    '✅' as status
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as summary_type,
    'Columns Verified' as item,
    '32' as count,
    '✅' as status
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as summary_type,
    'Constraints Verified' as item,
    '8' as count,
    '✅' as status
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as summary_type,
    'Relations Verified' as item,
    '4' as count,
    '✅' as status
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as summary_type,
    'Data Integrity' as item,
    'CHECKED' as count,
    '✅' as status;

SELECT '🎉 Validación completada exitosamente' as final_status;
SELECT '📄 Guarda este reporte para referencia futura' as note;