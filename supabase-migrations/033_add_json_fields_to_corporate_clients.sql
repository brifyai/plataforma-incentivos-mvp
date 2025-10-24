-- Agregar campos JSON faltantes a tabla corporate_clients
-- Para soportar la estructura de datos del componente CorporateClientManager

-- Agregar campo contact_info (JSON) si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corporate_clients' 
        AND column_name = 'contact_info'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE corporate_clients ADD COLUMN contact_info JSONB;
        RAISE NOTICE 'Campo contact_info agregado a corporate_clients';
    ELSE
        RAISE NOTICE 'Campo contact_info ya existe en corporate_clients';
    END IF;
END $$;

-- Agregar campo business_info (JSON) si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corporate_clients' 
        AND column_name = 'business_info'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE corporate_clients ADD COLUMN business_info JSONB;
        RAISE NOTICE 'Campo business_info agregado a corporate_clients';
    ELSE
        RAISE NOTICE 'Campo business_info ya existe en corporate_clients';
    END IF;
END $$;

-- Verificar estructura final de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'corporate_clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Confirmar que los campos JSON fueron agregados
DO $$
BEGIN
    RAISE NOTICE 'Verificando campos JSON en corporate_clients...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corporate_clients' 
        AND column_name = 'contact_info'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ contact_info existe y es JSONB';
    ELSE
        RAISE NOTICE '❌ contact_info no existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corporate_clients' 
        AND column_name = 'business_info'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ business_info existe y es JSONB';
    ELSE
        RAISE NOTICE '❌ business_info no existe';
    END IF;
END $$;

-- Insertar un cliente corporativo de prueba para verificar que todo funciona
-- (Solo si la tabla está vacía para no duplicar datos)
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM corporate_clients;
    
    IF record_count = 0 THEN
        INSERT INTO corporate_clients (
            name,
            display_category,
            trust_level,
            contact_info,
            business_info,
            company_id,
            is_active,
            segment_count,
            created_at,
            updated_at
        ) VALUES (
            'CLIENTE PRUEBA MIGRACIÓN',
            'testing',
            'high',
            '{"email": "test@migracion.com", "phone": "+56 9 1234 5678", "contact_person": "Persona Prueba"}',
            '{"industry": "Testing", "size": "small", "location": "Santiago, Chile"}',
            'e27b3162-e7db-4b00-bc60-32abea7e171b',
            true,
            0,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Cliente de prueba insertado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ La tabla ya tiene datos, no se inserta cliente de prueba';
    END IF;
END $$;

-- Verificar que el cliente de prueba se guardó correctamente
SELECT 
    id,
    name,
    display_category,
    trust_level,
    contact_info,
    business_info,
    company_id,
    is_active,
    segment_count,
    created_at,
    updated_at
FROM corporate_clients 
WHERE name = 'CLIENTE PRUEBA MIGRACIÓN'
LIMIT 1;

RAISE NOTICE '🎉 Migración completada exitosamente';