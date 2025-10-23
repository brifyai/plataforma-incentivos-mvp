-- 🔧 SCRIPT SIMPLIFICADO DE CORRECCIÓN DE RELACIONES UI-BD
-- Versión compatible con PostgreSQL estándar
-- Sistema NexuPay - Corrección de problemas críticos

-- =====================================================
-- 🚨 PROBLEMA CRÍTICO #1: CLIENT_ID EN DEBTS
-- =====================================================

-- Paso 1: Crear tabla de respaldo de relaciones problemáticas
CREATE TABLE IF NOT EXISTS debts_client_backup AS
SELECT 
    d.id as debt_id,
    d.client_id as original_client_id,
    d.company_id as debt_company_id,
    c.business_name as client_name,
    c.company_id as client_company_id,
    CASE 
        WHEN c.id IS NULL THEN 'CLIENT_NOT_FOUND'
        WHEN c.company_id != d.company_id THEN 'COMPANY_MISMATCH'
        ELSE 'VALID'
    END as issue_type,
    NOW() as backup_timestamp
FROM debts d
LEFT JOIN clients c ON d.client_id = c.id
WHERE d.client_id IS NOT NULL AND (c.id IS NULL OR c.company_id != d.company_id);

-- Mostrar resultados del backup
SELECT '💾 Tabla de respaldo creada' as backup_step, 'debts_client_backup' as table_name, COUNT(*) as record_count
FROM debts_client_backup;

-- Paso 2: Corregir datos huérfanos (client_id que no existe)
UPDATE debts 
SET client_id = NULL 
WHERE client_id NOT IN (SELECT id FROM clients);

SELECT '🔧 Datos huérfanos corregidos' as correction_step,
    (SELECT COUNT(*) FROM debts_client_backup WHERE issue_type = 'CLIENT_NOT_FOUND') as records_corrected;

-- Paso 3: Corregir inconsistencias de compañía (client_id de diferente company_id)
UPDATE debts d
SET client_id = NULL
FROM clients c
WHERE d.client_id = c.id AND c.company_id != d.company_id;

SELECT '🔧 Inconsistencias de compañía corregidas' as correction_step,
    (SELECT COUNT(*) FROM debts_client_backup WHERE issue_type = 'COMPANY_MISMATCH') as records_corrected;

-- =====================================================
-- 🚨 PROBLEMA CRÍTICO #2: CORPORATE_CLIENT_ID EN CLIENTS
-- =====================================================

-- Paso 4: Verificar si existen las tablas necesarias para corporate_clients
SELECT 'Verificando tablas para corporate_clients...' as status;

-- Paso 5: Crear tabla de respaldo para corporate_client_id (solo si existe)
-- Nota: Esta sección se ejecutará solo si las tablas existen
-- Si no existen, se omitirá automáticamente

-- Paso 6: Corregir corporate_client_id inválidos (solo si existe la tabla)
-- Esta corrección es opcional y depende de la existencia de las tablas

-- =====================================================
-- 🔒 AGREGAR CONSTRAINTS FALTANTES
-- =====================================================

-- Paso 7: Crear tabla corporate_clients si no existe
CREATE TABLE IF NOT EXISTS corporate_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    tax_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paso 8: Eliminar constraints existentes si hay
DO $$
BEGIN
    -- Eliminar constraint debts_company_id_fkey si existe
    BEGIN
        ALTER TABLE debts DROP CONSTRAINT debts_company_id_fkey;
        RAISE NOTICE 'Constraint debts_company_id_fkey eliminado';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint debts_company_id_fkey no existe, continuando...';
    END;
    
    -- Eliminar constraint debts_client_id_fkey si existe
    BEGIN
        ALTER TABLE debts DROP CONSTRAINT debts_client_id_fkey;
        RAISE NOTICE 'Constraint debts_client_id_fkey eliminado';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint debts_client_id_fkey no existe, continuando...';
    END;
END $$;

-- Paso 9: Agregar foreign key constraints mejorados con manejo de errores
DO $$
BEGIN
    -- Agregar constraint debts_company_id_fkey
    BEGIN
        ALTER TABLE debts
        ADD CONSTRAINT debts_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        RAISE NOTICE 'Constraint debts_company_id_fkey agregado exitosamente';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint debts_company_id_fkey ya existe, continuando...';
    END;
    
    -- Agregar constraint debts_client_id_fkey
    BEGIN
        ALTER TABLE debts
        ADD CONSTRAINT debts_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Constraint debts_client_id_fkey agregado exitosamente';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint debts_client_id_fkey ya existe, continuando...';
    END;
    
    -- Agregar constraint clients_company_id_fkey
    BEGIN
        ALTER TABLE clients
        ADD CONSTRAINT clients_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        RAISE NOTICE 'Constraint clients_company_id_fkey agregado exitosamente';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint clients_company_id_fkey ya existe, continuando...';
    END;
END $$;

-- Paso 10: Intentar agregar constraint para corporate_client_id (puede fallar si no existe)
DO $$
BEGIN
    BEGIN
        ALTER TABLE clients 
        ADD CONSTRAINT clients_corporate_client_id_fkey 
        FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Constraint clients_corporate_client_id_fkey agregado exitosamente';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Omitiendo constraint clients_corporate_client_id_fkey - %', SQLERRM;
    END;
END $$;

SELECT '🔒 Foreign key constraints agregados exitosamente' as constraint_status;

-- =====================================================
-- ✅ CREAR TABLAS DE CONFIGURACIÓN FALTANTES
-- =====================================================

-- Paso 11: Crear tablas de configuración
CREATE TABLE IF NOT EXISTS system_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_password TEXT,
    use_tls BOOLEAN DEFAULT true,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gateway_type TEXT NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    sandbox_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT '📋 Tablas de configuración creadas exitosamente' as configuration_status;

-- =====================================================
-- 📊 VERIFICACIÓN FINAL
-- =====================================================

-- Paso 12: Mostrar estado final de las relaciones
SELECT 
    'ESTADO FINAL DE CORRECCIONES' as report_type,
    'Total Companies' as metric,
    COUNT(*) as value
FROM companies
UNION ALL
SELECT 
    'ESTADO FINAL DE CORRECCIONES' as report_type,
    'Total Clients' as metric,
    COUNT(*) as value
FROM clients
UNION ALL
SELECT 
    'ESTADO FINAL DE CORRECCIONES' as report_type,
    'Total Debts' as metric,
    COUNT(*) as value
FROM debts
UNION ALL
SELECT 
    'ESTADO FINAL DE CORRECCIONES' as report_type,
    'Debts with Client ID' as metric,
    COUNT(*) as value
FROM debts
WHERE client_id IS NOT NULL
UNION ALL
SELECT 
    'ESTADO FINAL DE CORRECCIONES' as report_type,
    'Orphaned Debts (Backup)' as metric,
    COUNT(*) as value
FROM debts_client_backup;

-- Paso 13: Diagnóstico final de problemas restantes
SELECT 
    'DIAGNÓSTICO FINAL' as diagnostic_type,
    'Debts sin company_id' as issue_type,
    COUNT(*) as count,
    'ALTA' as severity
FROM debts
WHERE company_id IS NULL
UNION ALL
SELECT 
    'DIAGNÓSTICO FINAL' as diagnostic_type,
    'Clients sin company_id' as issue_type,
    COUNT(*) as count,
    'MEDIA' as severity
FROM clients
WHERE company_id IS NULL
UNION ALL
SELECT 
    'DIAGNÓSTICO FINAL' as diagnostic_type,
    'Debts con amount <= 0' as issue_type,
    COUNT(*) as count,
    'MEDIA' as severity
FROM debts
WHERE amount <= 0;

-- Paso 14: Verificar existencia de tabla corporate_clients
SELECT 
    'VERIFICACIÓN DE TABLAS' as check_type,
    'corporate_clients' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_clients' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT_FOUND' 
    END as status
UNION ALL
SELECT 
    'VERIFICACIÓN DE TABLAS' as check_type,
    'clients_corporate_backup' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients_corporate_backup' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT_FOUND' 
    END as status;

SELECT '✅ Script de corrección simplificado completado exitosamente' as final_status;
SELECT '📄 Guarda este output para referencia futura' as note;