-- SOLUCIÓN RÁPIDA: Agregar solo las columnas necesarias para el perfil de empresa
-- Ejecutar esta migración para que el perfil de empresa funcione

-- Agregar columnas faltantes a companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct_creditor' CHECK (company_type IN ('direct_creditor', 'collection_agency')),
ADD COLUMN IF NOT EXISTS nexupay_commission_type TEXT DEFAULT 'percentage' CHECK (nexupay_commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS user_incentive_type TEXT DEFAULT 'percentage' CHECK (user_incentive_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(10,2) DEFAULT 5.00;

-- Agregar columna faltante a users si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Verificar que las columnas se agregaron
SELECT
    'companies' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
    AND column_name IN ('company_type', 'nexupay_commission_type', 'nexupay_commission', 'user_incentive_type', 'user_incentive_percentage')
ORDER BY ordinal_position;