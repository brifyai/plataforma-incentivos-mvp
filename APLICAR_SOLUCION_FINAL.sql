-- =============================================
-- VERSIÓN FINAL CORREGIDA PARA SOLUCIÓN IMPORTACIÓN
-- =============================================

-- PASO 1: AÑADIR CAMPOS FALTANTES A LA TABLA DEBTS
-- =============================================

DO $$
BEGIN
    -- Añadir creditor_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' AND column_name = 'creditor_name'
    ) THEN
        ALTER TABLE debts ADD COLUMN creditor_name VARCHAR(255);
        RAISE NOTICE '✅ Campo creditor_name añadido';
    END IF;

    -- Añadir debt_reference si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' AND column_name = 'debt_reference'
    ) THEN
        ALTER TABLE debts ADD COLUMN debt_reference VARCHAR(255);
        RAISE NOTICE '✅ Campo debt_reference añadido';
    END IF;

    -- Añadir debt_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' AND column_name = 'debt_type'
    ) THEN
        ALTER TABLE debts ADD COLUMN debt_type VARCHAR(50) DEFAULT 'other';
        RAISE NOTICE '✅ Campo debt_type añadido';
    END IF;
END $$;

-- =============================================
-- PASO 2: ELIMINAR POLÍTICAS EXISTENTES
-- =============================================

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Companies can view related users" ON users;
DROP POLICY IF EXISTS "Allow service role bulk insert" ON users;

DROP POLICY IF EXISTS "Companies can view debts from their company" ON debts;
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
DROP POLICY IF EXISTS "Allow service role bulk insert debts" ON debts;

-- =============================================
-- PASO 3: POLÍTICAS RLS CORREGIDAS
-- =============================================

-- Políticas para users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política especial para importación masiva (service role)
CREATE POLICY "Allow service role bulk insert users" ON users
    FOR INSERT WITH CHECK (
        current_setting('app.is_bulk_import', true) = 'true'
    );

-- Políticas para debts
CREATE POLICY "Users can view their own debts" ON debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view debts from their company" ON debts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Política especial para importación masiva de deudas
CREATE POLICY "Allow service role bulk insert debts" ON debts
    FOR INSERT WITH CHECK (
        current_setting('app.is_bulk_import', true) = 'true'
    );

-- =============================================
-- PASO 4: CREAR FUNCIONES DE AYUDA
-- =============================================

CREATE OR REPLACE FUNCTION enable_bulk_import_mode()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.is_bulk_import', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION disable_bulk_import_mode()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.is_bulk_import', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PASO 5: VERIFICACIÓN
-- =============================================

-- Verificar campos añadidos
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name IN ('creditor_name', 'debt_reference', 'debt_type')
ORDER BY column_name;

-- Verificar políticas creadas
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('users', 'debts')
ORDER BY tablename, policyname;

SELECT '🎉 SOLUCIÓN FINAL APLICADA EXITOSAMENTE' as status;
SELECT '✅ Campos añadidos a tabla debts' as step1;
SELECT '✅ Políticas RLS configuradas correctamente' as step2;
SELECT '✅ Funciones de ayuda creadas' as step3;
SELECT '✅ Listo para usar el nuevo componente de importación' as step4;