-- =============================================
-- MIGRACIÓN: Agregar campos de comisión avanzada
-- =============================================
-- Esta migración agrega los campos necesarios para el sistema de comisiones
-- que permite elegir entre porcentaje o monto fijo por negocio cerrado

-- Agregar columnas para tipos de comisión
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS nexupay_commission_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(15, 2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS user_incentive_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(15, 2) DEFAULT 5.00;

-- Migrar datos existentes
UPDATE public.companies
SET
  nexupay_commission = COALESCE(commission_percentage, 15.00),
  user_incentive_percentage = 5.00
WHERE nexupay_commission IS NULL;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_companies_nexupay_commission_type ON public.companies(nexupay_commission_type);
CREATE INDEX IF NOT EXISTS idx_companies_user_incentive_type ON public.companies(user_incentive_type);

-- Agregar comentarios a las columnas
COMMENT ON COLUMN public.companies.nexupay_commission_type IS 'Tipo de comisión a NexuPay: percentage o fixed';
COMMENT ON COLUMN public.companies.nexupay_commission IS 'Valor de comisión a NexuPay (porcentaje o monto fijo)';
COMMENT ON COLUMN public.companies.user_incentive_type IS 'Tipo de incentivo al usuario: percentage o fixed';
COMMENT ON COLUMN public.companies.user_incentive_percentage IS 'Valor de incentivo al usuario (porcentaje o monto fijo)';

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================