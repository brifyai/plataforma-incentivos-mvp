-- ========================================
-- SQL COMPLETO PARA CLIENTES CORPORATIVOS
-- ========================================
-- Ejecutar este SQL en el editor SQL de Supabase
-- ========================================

-- 1. Agregar todos los campos faltantes a la tabla corporate_clients
ALTER TABLE corporate_clients 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS trust_level TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB,
ADD COLUMN IF NOT EXISTS business_info JSONB,
ADD COLUMN IF NOT EXISTS display_category TEXT,
ADD COLUMN IF NOT EXISTS segment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. Verificar que los campos se hayan agregado correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'corporate_clients' 
    AND table_schema = 'public'
    AND column_name IN (
        'name', 'category', 'trust_level', 'contact_info', 
        'business_info', 'display_category', 'segment_count', 
        'is_active', 'company_id'
    )
ORDER BY column_name;

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_corporate_clients_company_id ON corporate_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_clients_category ON corporate_clients(category);
CREATE INDEX IF NOT EXISTS idx_corporate_clients_is_active ON corporate_clients(is_active);

-- 4. Verificar estructura final de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'corporate_clients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- RESULTADO ESPERADO:
-- Todos los campos deben aparecer en la consulta de verificación
-- ========================================