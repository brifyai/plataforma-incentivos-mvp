-- =====================================================================
-- FIX PARA CLIENTES CORPORATIVOS - NEXUPAY
-- =====================================================================
-- Este SQL agrega las columnas faltantes para que funcionen los clientes corporativos
-- Ejecutar en: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql
-- =====================================================================

-- Agregar client_id a la tabla debts (seguro - verifica si existe primero)
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
        RAISE NOTICE '✅ Columna client_id ya existe en debts';
    END IF;
END $$;

-- Agregar corporate_client_id a la tabla clients (seguro - verifica si existe primero)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE '✅ Columna corporate_client_id agregada a clients';
    ELSE
        RAISE NOTICE '✅ Columna corporate_client_id ya existe en clients';
    END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Mensaje de éxito
SELECT '🎉 Fix aplicado exitosamente - Columnas para clientes corporativos agregadas' as status;

-- =====================================================================
-- VERIFICACIÓN (opcional - ejecutar después para confirmar)
-- =====================================================================
-- Verificar que las columnas existen
SELECT 
    'debts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'client_id'
AND table_schema = 'public'

UNION ALL

SELECT 
    'clients' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'corporate_client_id'
AND table_schema = 'public';