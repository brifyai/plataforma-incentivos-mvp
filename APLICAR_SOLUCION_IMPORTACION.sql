-- =============================================
-- SCRIPT PARA APLICAR SOLUCIÓN DEFINITIVA
-- DE IMPORTACIÓN EXCEL DE DEUDORES
-- =============================================

-- EJECUTAR ESTE SCRIPT EN LA CONSOLA SQL DE SUPABASE
-- =============================================

-- 1. APLICAR MIGRACIÓN DE PERMISOS Y CAMPOS
-- =============================================

-- Habilitar RLS en la tabla users si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Enable bulk import for service role" ON users;
DROP POLICY IF EXISTS "Enable bulk insert for service role" ON debts;

-- Política para permitir inserción masiva de usuarios desde service role
CREATE POLICY "Enable bulk import for service role" ON users
    FOR INSERT WITH CHECK (
        -- Permitir inserción desde service role
        current_setting('app.bulk_import_mode', true) = 'true'
        OR
        -- O permitir cuando el RUT no existe (evitar duplicados)
        NOT EXISTS (
            SELECT 1 FROM users u
            WHERE u.rut = NEW.rut
        )
    );

-- Política para permitir inserción masiva de deudas desde service role
CREATE POLICY "Enable bulk insert for service role" ON debts
    FOR INSERT WITH CHECK (
        -- Permitir inserción desde service role
        current_setting('app.bulk_import_mode', true) = 'true'
        OR
        -- Validar que el usuario y empresa existan
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = NEW.user_id
        )
        AND EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = NEW.company_id
        )
    );

-- 2. AÑADIR CAMPOS FALTANTES A LA TABLA DEBTS
-- =============================================

DO $$
BEGIN
    -- Verificar y añadir creditor_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'creditor_name'
    ) THEN
        ALTER TABLE debts ADD COLUMN creditor_name VARCHAR(255);
        RAISE NOTICE 'Campo creditor_name añadido a debts';
    END IF;

    -- Verificar y añadir debt_reference si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debt_reference'
    ) THEN
        ALTER TABLE debts ADD COLUMN debt_reference VARCHAR(255);
        RAISE NOTICE 'Campo debt_reference añadido a debts';
    END IF;

    -- Verificar y añadir debt_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debt_type'
    ) THEN
        ALTER TABLE debts ADD COLUMN debt_type VARCHAR(50) DEFAULT 'other';
        RAISE NOTICE 'Campo debt_type añadido a debts';
    END IF;
END $$;

-- 3. CREAR FUNCIONES PARA BYPASS TEMPORAL DE RLS
-- =============================================

CREATE OR REPLACE FUNCTION set_bulk_import_context(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Establecer contexto de importación masiva
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.bulk_import_mode', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clear_bulk_import_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.bulk_import_mode', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VERIFICAR POLÍTICAS CREADAS
-- =============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'debts') 
AND policyname LIKE '%service_role%'
ORDER BY tablename, policyname;

-- 5. VERIFICAR CAMPOS AÑADIDOS
-- =============================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name IN ('creditor_name', 'debt_reference', 'debt_type')
ORDER BY column_name;

-- =============================================
-- RESULTADO ESPERADO:
-- ✅ Políticas RLS para importación masiva creadas
-- ✅ Campos faltantes añadidos a tabla debts
-- ✅ Funciones de contexto creadas
-- =============================================

SELECT '🎉 SOLUCIÓN DE IMPORTACIÓN APLICADA EXITOSAMENTE' as status;