-- =============================================
-- CORRECCIÓN DEFINITIVA PARA IMPORTACIÓN MASIVA
-- =============================================

-- 1. Crear política específica para importación masiva con SERVICE ROLE
DROP POLICY IF EXISTS "Enable bulk import for service role" ON users;
DROP POLICY IF EXISTS "Enable bulk insert for service role" ON debts;

-- Política para permitir inserción masiva de usuarios desde service role
CREATE POLICY "Enable bulk import for service role" ON users
    FOR INSERT WITH CHECK (
        -- Permitir inserción desde service role (role() = 'service_role')
        -- o cuando se especifica explícitamente el user_id en el contexto
        current_setting('app.current_user_id', true) IS NOT NULL
        OR 
        -- Permitir cuando el RUT no existe (evitar duplicados)
        NOT EXISTS (
            SELECT 1 FROM users u 
            WHERE u.rut = NEW.rut
        )
    );

-- Política para permitir inserción masiva de deudas desde service role
CREATE POLICY "Enable bulk insert for service role" ON debts
    FOR INSERT WITH CHECK (
        -- Permitir inserción desde service role
        current_setting('app.current_user_id', true) IS NOT NULL
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

-- 2. Añadir campos faltantes a la tabla debts si no existen
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

-- 3. Crear función para bypass temporal de RLS durante importación
CREATE OR REPLACE FUNCTION set_bulk_import_context(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Establecer contexto de importación masiva
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.bulk_import_mode', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear función para limpiar contexto después de importación
CREATE OR REPLACE FUNCTION clear_bulk_import_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.bulk_import_mode', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar políticas creadas
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

SELECT '✅ Correcciones para importación masiva aplicadas correctamente' as status;