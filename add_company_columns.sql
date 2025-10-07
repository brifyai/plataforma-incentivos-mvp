-- Agregar columnas faltantes a la tabla companies
-- Ejecutar esta migración para agregar soporte completo de comisiones

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct_creditor' CHECK (company_type IN ('direct_creditor', 'collection_agency')),

ADD COLUMN IF NOT EXISTS nexupay_commission_type TEXT DEFAULT 'percentage' CHECK (nexupay_commission_type IN ('percentage', 'fixed')),

ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(10,2) DEFAULT 15.00,

ADD COLUMN IF NOT EXISTS user_incentive_type TEXT DEFAULT 'percentage' CHECK (user_incentive_type IN ('percentage', 'fixed')),

ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(10,2) DEFAULT 5.00;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN companies.company_type IS 'Tipo de empresa: direct_creditor o collection_agency';
COMMENT ON COLUMN companies.nexupay_commission_type IS 'Tipo de comisión NexuPay: percentage o fixed';
COMMENT ON COLUMN companies.nexupay_commission IS 'Valor de comisión NexuPay (porcentaje o monto fijo)';
COMMENT ON COLUMN companies.user_incentive_type IS 'Tipo de incentivo usuario: percentage o fixed';
COMMENT ON COLUMN companies.user_incentive_percentage IS 'Valor de incentivo usuario (porcentaje o monto fijo)';