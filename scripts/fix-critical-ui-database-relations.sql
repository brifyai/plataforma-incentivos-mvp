-- 🔧 SCRIPT DE CORRECCIÓN DE RELACIONES CRÍTICAS UI-BD
-- Sistema NexuPay - Corrección de problemas identificados en el análisis
-- 
-- Este script corrige los problemas críticos encontrados en el análisis
-- de relaciones entre campos de UI y tablas de base de datos.

-- =====================================================
-- 🚨 PROBLEMA CRÍTICO #1: CLIENT_ID EN DEBTS
-- =====================================================

-- Paso 1: Diagnosticar el estado actual
-- Nota: Los RAISE NOTICE han sido reemplazados con SELECT para compatibilidad
SELECT
    '📊 DIAGNÓSTICO INICIAL' as diagnostic_step,
    (SELECT COUNT(*) FROM debts) as total_debts,
    (SELECT COUNT(*) FROM debts d LEFT JOIN clients c ON d.client_id = c.id WHERE d.client_id IS NOT NULL AND c.id IS NULL) as orphaned_client_count,
    (SELECT COUNT(*) FROM debts d JOIN clients c ON d.client_id = c.id WHERE d.company_id != c.company_id) as mismatched_client_count;

-- Paso 2: Crear tabla de respaldo de las relaciones problemáticas
CREATE TABLE IF NOT EXISTS debts_client_backup AS
SELECT 
    d.id as debt_id,
    d.client_id as original_client_id,
    d.company_id as debt_company_id,
    c.name as client_name,
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

SELECT
    '💾 Tabla de respaldo creada' as backup_step,
    'debts_client_backup' as table_name,
    COUNT(*) as record_count
FROM debts_client_backup;

-- Paso 3: Corregir datos huérfanos (client_id que no existe)
UPDATE debts 
SET client_id = NULL 
WHERE client_id NOT IN (SELECT id FROM clients);

RAISE NOTICE '🔧 Datos huérfanos corregidos: % registros eliminados', 
    (SELECT COUNT(*) FROM debts_client_backup WHERE issue_type = 'CLIENT_NOT_FOUND'));

-- Paso 4: Corregir inconsistencias de compañía (client_id de diferente company_id)
UPDATE debts d
SET client_id = NULL
FROM clients c
WHERE d.client_id = c.id AND c.company_id != d.company_id;

RAISE NOTICE '🔧 Inconsistencias de compañía corregidas: % registros', 
    (SELECT COUNT(*) FROM debts_client_backup WHERE issue_type = 'COMPANY_MISMATCH');

-- =====================================================
-- 🚨 PROBLEMA CRÍTICO #2: CORPORATE_CLIENT_ID EN CLIENTS
-- =====================================================

-- Paso 5: Diagnosticar corporate_client_id
SELECT
    '📊 DIAGNÓSTICO CORPORATE_CLIENT' as diagnostic_step,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM clients c LEFT JOIN corporate_clients cc ON c.corporate_client_id = cc.id WHERE c.corporate_client_id IS NOT NULL AND cc.id IS NULL) as orphaned_corporate_count;

-- Paso 6: Crear tabla de respaldo para corporate_client_id
CREATE TABLE IF NOT EXISTS clients_corporate_backup AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    c.corporate_client_id as original_corporate_client_id,
    cc.name as corporate_client_name,
    CASE 
        WHEN cc.id IS NULL THEN 'CORPORATE_CLIENT_NOT_FOUND'
        ELSE 'VALID'
    END as issue_type,
    NOW() as backup_timestamp
FROM clients c
LEFT JOIN corporate_clients cc ON c.corporate_client_id = cc.id
WHERE c.corporate_client_id IS NOT NULL AND cc.id IS NULL;

SELECT
    '💾 Tabla de respaldo corporate creada' as backup_step,
    'clients_corporate_backup' as table_name,
    COUNT(*) as record_count
FROM clients_corporate_backup;

-- Paso 7: Corregir corporate_client_id inválidos
UPDATE clients 
SET corporate_client_id = NULL 
WHERE corporate_client_id NOT IN (SELECT id FROM corporate_clients);

RAISE NOTICE '🔧 Corporate_client_id inválidos corregidos: % registros', 
    (SELECT COUNT(*) FROM clients_corporate_backup));

-- =====================================================
-- 🔒 AGREGAR CONSTRAINTS FALTANTES
-- =====================================================

-- Paso 8: Crear tabla corporate_clients si no existe
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

-- Paso 9: Agregar foreign key constraints mejorados
DO $$
BEGIN
    -- Eliminar constraints existentes si hay
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'debts_company_id_fkey'
    ) THEN
        ALTER TABLE debts DROP CONSTRAINT debts_company_id_fkey;
        SELECT '🗑️ Constraint existente eliminado: debts_company_id_fkey' as constraint_status;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'debts_client_id_fkey'
    ) THEN
        ALTER TABLE debts DROP CONSTRAINT debts_client_id_fkey;
        SELECT '🗑️ Constraint existente eliminado: debts_client_id_fkey' as constraint_status;
    END IF;
END $$;

-- Paso 10: Agregar constraints proper
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
-- ✅ CREAR TRIGGERS DE VALIDACIÓN
-- =====================================================

-- Paso 11: Crear función de validación para debts
CREATE OR REPLACE FUNCTION validate_debt_client_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que si hay client_id, pertenezca a la misma compañía
    IF NEW.client_id IS NOT NULL THEN
        DECLARE
            client_company_id UUID;
        BEGIN
            SELECT company_id INTO client_company_id
            FROM clients
            WHERE id = NEW.client_id;
            
            IF client_company_id IS NULL THEN
                RAISE EXCEPTION 'Client % does not exist', NEW.client_id;
            END IF;
            
            IF client_company_id != NEW.company_id THEN
                RAISE EXCEPTION 'Client % belongs to company %, but debt is for company %', 
                    NEW.client_id, client_company_id, NEW.company_id;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 12: Crear trigger para debts
DROP TRIGGER IF EXISTS trg_validate_debt_client_consistency ON debts;
CREATE TRIGGER trg_validate_debt_client_consistency
    BEFORE INSERT OR UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION validate_debt_client_consistency();

SELECT '✅ Trigger de validación creado para debts' as trigger_status;

-- =====================================================
-- 📊 CREAR FUNCIONES DE DIAGNÓSTICO
-- =====================================================

-- Paso 13: Función para diagnosticar relaciones
CREATE OR REPLACE FUNCTION diagnose_ui_database_relations()
RETURNS TABLE(
    table_name TEXT,
    issue_type TEXT,
    issue_count BIGINT,
    description TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Diagnosticar debts sin company_id
    RETURN QUERY
    SELECT 
        'debts'::TEXT,
        'missing_company_id'::TEXT,
        COUNT(*)::BIGINT,
        'Debts sin company_id'::TEXT,
        'HIGH'::TEXT
    FROM debts
    WHERE company_id IS NULL;
    
    -- Diagnosticar clients sin company_id
    RETURN QUERY
    SELECT 
        'clients'::TEXT,
        'missing_company_id'::TEXT,
        COUNT(*)::BIGINT,
        'Clients sin company_id'::TEXT,
        'MEDIUM'::TEXT
    FROM clients
    WHERE company_id IS NULL;
    
    -- Diagnosticar deudas con montos inválidos
    RETURN QUERY
    SELECT 
        'debts'::TEXT,
        'invalid_amount'::TEXT,
        COUNT(*)::BIGINT,
        'Debts con amount <= 0'::TEXT,
        'MEDIUM'::TEXT
    FROM debts
    WHERE amount <= 0;
    
    -- Diagnosticar pagos sin deuda asociada
    RETURN QUERY
    SELECT 
        'payments'::TEXT,
        'orphaned_payment'::TEXT,
        COUNT(*)::BIGINT,
        'Payments sin debt_id válido'::TEXT,
        'HIGH'::TEXT
    FROM payments p
    LEFT JOIN debts d ON p.debt_id = d.id
    WHERE p.debt_id IS NOT NULL AND d.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 📋 CREAR TABLAS DE CONFIGURACIÓN FALTANTES
-- =====================================================

-- Paso 14: Crear tablas de configuración
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

RAISE NOTICE '📋 Tablas de configuración creadas exitosamente';

-- =====================================================
-- ✅ VERIFICACIÓN FINAL
-- =====================================================

-- Paso 15: Verificación final
DO $$
DECLARE
    total_issues BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_issues FROM diagnose_ui_database_relations();
    
    RAISE NOTICE '';
    SELECT '🎉 CORRECCIÓN COMPLETADA' as completion_status;
    SELECT '✅ Client_id en debts: CORREGIDO' as fix_status;
    SELECT '✅ Corporate_client_id en clients: CORREGIDO' as fix_status;
    SELECT '✅ Foreign key constraints: AGREGADOS' as fix_status;
    SELECT '✅ Triggers de validación: CREADOS' as fix_status;
    SELECT '✅ Tablas de configuración: CREADAS' as fix_status;
    
    SELECT
        '📊 Issues restantes' as status_type,
        total_issues as issue_count;
    
    SELECT
        CASE
            WHEN total_issues = 0 THEN '🎉 Todas las relaciones están correctas'
            ELSE format('⚠️ Quedan %s issues por revisar', total_issues)
        END as final_status;
    
    SELECT '📋 Respaldo de datos modificado:' as backup_info;
    SELECT '   • debts_client_backup' as backup_table;
    SELECT '   • clients_corporate_backup' as backup_table;
    SELECT '🔧 Para revertir cambios, revisa las tablas de respaldo' as revert_info;
END $$;

-- =====================================================
-- 📈 REPORTE FINAL
-- =====================================================

-- Mostrar estado final de las relaciones
SELECT 
    'ESTADO FINAL DE RELACIONES' as report_type,
    table_name,
    issue_type,
    issue_count,
    description,
    severity
FROM diagnose_ui_database_relations()
ORDER BY 
    CASE severity 
        WHEN 'HIGH' THEN 1 
        WHEN 'MEDIUM' THEN 2 
        ELSE 3 
    END,
    table_name,
    issue_type;

-- Mostrar estadísticas generales
SELECT 
    'ESTADÍSTICAS GENERALES' as report_type,
    'Total Companies' as metric,
    COUNT(*) as value
FROM companies
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as report_type,
    'Total Clients' as metric,
    COUNT(*) as value
FROM clients
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as report_type,
    'Total Debts' as metric,
    COUNT(*) as value
FROM debts
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as report_type,
    'Debts with Client ID' as metric,
    COUNT(*) as value
FROM debts
WHERE client_id IS NOT NULL
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as report_type,
    'Orphaned Debts (Backup)' as metric,
    COUNT(*) as value
FROM debts_client_backup;

RAISE NOTICE '';
RAISE NOTICE '✅ Script de corrección completado exitosamente';
RAISE NOTICE '📄 Guarda este output para referencia futura';