-- =====================================================
-- SOLUCIÓN DEUDORES: USAR TABLA DEBTS DIRECTAMENTE
-- =====================================================
-- Enfoque: La tabla debts contendrá toda la información del deudor
-- No se necesita tabla clients separada para este caso de uso

-- Agregar campos de deudor directamente a la tabla debts si no existen
DO $$
BEGIN
    -- Campos de información personal del deudor
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debtor_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN debtor_name TEXT;
        RAISE NOTICE '✅ Columna debtor_name agregada a debts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debtor_email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN debtor_email TEXT;
        RAISE NOTICE '✅ Columna debtor_email agregada a debts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debtor_phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN debtor_phone TEXT;
        RAISE NOTICE '✅ Columna debtor_phone agregada a debts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'debtor_rut'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN debtor_rut TEXT;
        RAISE NOTICE '✅ Columna debtor_rut agregada a debts';
    END IF;

    -- Campo para relación con clientes corporativos (si aplica)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE '✅ Columna corporate_client_id agregada a debts';
    END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_debtor_rut ON debts(debtor_rut);
CREATE INDEX IF NOT EXISTS idx_debts_corporate_client_id ON debts(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_debts_debtor_email ON debts(debtor_email);

-- Confirmar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND table_schema = 'public'
AND column_name IN ('debtor_name', 'debtor_email', 'debtor_phone', 'debtor_rut', 'corporate_client_id')
ORDER BY column_name;

RAISE NOTICE '🎯 Estructura de deudores en tabla debts completada';
RAISE NOTICE '📋 Ahora debts contiene toda la información del deudor directamente';