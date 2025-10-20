-- =============================================
-- MIGRACIÓN: Agregar corporate_client_id a tabla clients
-- Esta migración asegura que la columna exista en producción
-- =============================================

-- Primero verificar si la columna existe, si no, agregarla
DO $$
BEGIN
    -- Verificar si la columna corporate_client_id existe en la tabla clients
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        -- La columna no existe, agregarla
        ALTER TABLE public.clients 
        ADD COLUMN corporate_client_id UUID REFERENCES public.corporate_clients(id) ON DELETE SET NULL;
        
        -- Crear índice para la nueva columna
        CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON public.clients(corporate_client_id);
        
        RAISE NOTICE 'Columna corporate_client_id agregada exitosamente a la tabla clients';
    ELSE
        RAISE NOTICE 'La columna corporate_client_id ya existe en la tabla clients';
    END IF;
END $$;

-- Asegurar que las políticas RLS permitan la columna
-- (las políticas existentes deberían cubrir esta columna automáticamente)

-- Actualizar el comentario de la tabla para documentar la nueva columna
COMMENT ON COLUMN public.clients.corporate_client_id IS 'Referencia opcional al cliente corporativo asociado';

-- Verificar el estado final de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;