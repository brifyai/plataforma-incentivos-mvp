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

-- Paso 4: Crear tabla de respaldo para corporate_client_id (solo si existe la tabla corporate_clients)
DO $$
BEGIN
    -- Verificar si existe la tabla corporate_clients y el campo corporate_client_id en clients
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'corporate_clients' AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'corporate_client_id' AND table_schema = 'public'
    ) THEN
        -- Ejecutar el backup solo si ambas tablas existen
        EXECUTE '
            CREATE TABLE IF NOT EXISTS clients_corporate_backup AS
            SELECT
                c.id as client_id,
                c.business_name as client_name,
                c.corporate_client_id as original_corporate_client_id,
                cc.name as corporate_client_name,
                CASE
                    WHEN cc.id IS NULL THEN ''CORPORATE_CLIENT_NOT_FOUND''
                    ELSE ''VALID''
                END as issue_type,
                NOW() as backup_timestamp
            FROM clients c
            LEFT JOIN corporate_clients cc ON c.corporate_client_id = cc.id
            WHERE c.corporate_client_id IS NOT NULL AND cc.id IS NULL';
        
        RAISE NOTICE 'Tabla de respaldo corporate creada';
    ELSE
        RAISE NOTICE 'Omitiendo backup de corporate_clients - tabla o campo no existe';
    END IF;
END $$;

-- Mostrar resultados del backup solo si la tabla existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'clients_corporate_backup' AND table_schema = 'public'
    ) THEN
        EXECUTE '
            SELECT ''💾 Tabla de respaldo corporate creada'' as backup_step, ''clients_corporate_backup'' as table_name, COUNT(*) as record_count
            FROM clients_corporate_backup';
    END IF;
END $$;

-- Paso 5: Corregir corporate_client_id inválidos (solo si existen las tablas)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'corporate_clients' AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'corporate_client_id' AND table_schema = 'public'
    ) THEN
        -- Corregir corporate_client_id inválidos
        EXECUTE 'UPDATE clients SET corporate_client_id = NULL WHERE corporate_client_id NOT IN (SELECT id FROM corporate_clients)';
        
        RAISE NOTICE 'Corporate_client_id inválidos corregidos';
    ELSE
        RAISE NOTICE 'Omitiendo corrección de corporate_client_id - tabla o campo no existe';
    END IF;
END $$;

-- Mostrar resultados de la corrección solo si la tabla de backup existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'clients_corporate_backup' AND table_schema = 'public'
    ) THEN
        EXECUTE 'SELECT ''🔧 Corporate_client_id inválidos corregidos'' as correction_step, COUNT(*) as records_corrected FROM clients_corporate_backup';
    END IF;
END $$;

-- =====================================================
-- 🔒 AGREGAR CONSTRAINTS FALTANTES
-- =====================================================

-- Paso 6: Crear tabla corporate_clients si no existe
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

-- Paso 7: Eliminar constraints existentes si hay
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'debts_company_id_fkey'
    ) THEN
        ALTER TABLE debts DROP CONSTRAINT debts_company_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'debts_client_id_fkey'
    ) THEN
        ALTER TABLE debts DROP CONSTRAINT debts_client_id_fkey;
    END IF;
END $$;

-- Paso 8: Agregar foreign key constraints mejorados
ALTER TABLE debts 
ADD CONSTRAINT debts_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE debts 
ADD CONSTRAINT debts_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE clients 
ADD CONSTRAINT clients_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE clients 
ADD CONSTRAINT clients_corporate_client_id_fkey 
FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE SET NULL;

SELECT '🔒 Foreign key constraints agregados exitosamente' as constraint_status;

-- =====================================================
-- ✅ CREAR TABLAS DE CONFIGURACIÓN FALTANTES
-- =====================================================

-- Paso 9: Crear tablas de configuración
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

-- Mostrar estado final de las relaciones
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

-- Diagnóstico final de problemas restantes
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

SELECT '✅ Script de corrección simplificado completado exitosamente' as final_status;
SELECT '📄 Guarda este output para referencia futura' as note;