-- =============================================
-- MIGRACIÓN: Agregar campos bancarios a companies
-- Fecha: 2025-01-07
-- Descripción: Agrega campos para información bancaria y beneficiario Mercado Pago
-- =============================================

-- Agregar campos bancarios a la tabla companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id VARCHAR(255);

-- Agregar comentarios a las columnas
COMMENT ON COLUMN public.companies.bank_account_info IS 'Información bancaria para transferencias (banco, cuenta, tipo, etc.)';
COMMENT ON COLUMN public.companies.mercadopago_beneficiary_id IS 'ID del beneficiario registrado en Mercado Pago';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_companies_mercadopago_beneficiary_id ON public.companies(mercadopago_beneficiary_id);

-- Verificar que las columnas se agregaron correctamente
SELECT
    'companies table columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
    AND table_schema = 'public'
    AND column_name IN ('bank_account_info', 'mercadopago_beneficiary_id')
ORDER BY ordinal_position;

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================