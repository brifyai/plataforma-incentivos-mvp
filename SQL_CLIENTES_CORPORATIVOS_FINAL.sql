-- ===================================
-- SOLUCIÓN FINAL: CLIENTES CORPORATIVOS
-- ===================================
-- Ejecutar este archivo SQL directamente en el editor SQL de Supabase
-- No contiene código JavaScript, solo SQL puro

-- 1. Agregar campo name a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Agregar campo contact_info a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS contact_info JSONB;

-- 3. Agregar campo business_info a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS business_info JSONB;

-- 4. Agregar campo display_category a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS display_category TEXT;

-- 5. Agregar campo trust_level a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS trust_level TEXT;

-- 6. Agregar campo segment_count a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS segment_count INTEGER DEFAULT 0;

-- 7. Agregar campo is_active a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 8. Agregar campo company_id a la tabla corporate_clients
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS company_id UUID;

-- 3. Verificar que los campos se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'corporate_clients' 
AND table_schema = 'public'
AND column_name IN ('contact_info', 'business_info')
ORDER BY column_name;

-- 4. Contar clientes corporativos existentes
SELECT 
    COUNT(*) as total_corporate_clients,
    COUNT(CASE WHEN contact_info IS NOT NULL THEN 1 END) as with_contact_info,
    COUNT(CASE WHEN business_info IS NOT NULL THEN 1 END) as with_business_info
FROM corporate_clients;

-- 5. Mostrar estructura completa de la tabla corporate_clients
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'corporate_clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ===================================
-- Después de ejecutar este SQL:
-- 1. Ve a: http://localhost:3002/empresa/perfil/clientes
-- 2. Intenta crear un nuevo cliente corporativo
-- 3. Llena todos los campos incluyendo email, teléfono, etc.
-- 4. Haz clic en "Crear Cliente"
-- 5. Debería guardarse sin errores

-- Si aún tienes problemas, ejecuta este diagnóstico:
-- SELECT * FROM corporate_clients ORDER BY created_at DESC LIMIT 5;