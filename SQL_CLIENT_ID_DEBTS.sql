-- =====================================================
-- AGREGAR client_id A TABLA DEBTS
-- =====================================================
-- Este SQL agrega únicamente el campo client_id a la tabla debts
-- La tabla clients ya tiene corporate_client_id (confirmado por el usuario)

-- Agregar client_id a debts (seguro)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        RAISE NOTICE '✅ Columna client_id agregada a debts';
    ELSE
        RAISE NOTICE 'ℹ️ Columna client_id ya existe en debts';
    END IF;
END $$;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);

-- Confirmar operación
SELECT 
    'debts' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'client_id'
AND table_schema = 'public';

RAISE NOTICE '🎯 Operación completada: client_id ahora disponible en debts';