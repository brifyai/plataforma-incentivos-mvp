-- =============================================
-- MIGRACIÓN: SISTEMA DE SEGUIMIENTO DE TRANSFERENCIAS AUTOMÁTICAS
-- Agrega campos para rastrear transferencias automáticas en la tabla transactions
-- =============================================

-- Agregar columnas para seguimiento de transferencias
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(20) DEFAULT NULL CHECK (transfer_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transfer_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transfer_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transfer_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transfer_error TEXT,
ADD COLUMN IF NOT EXISTS transfer_reference VARCHAR(255);

-- Agregar índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_status ON transactions(transfer_status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);

-- Agregar columna para almacenar información bancaria en companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS bank_account_info JSONB,
ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id VARCHAR(255);

-- Agregar índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_mercadopago_beneficiary_id ON companies(mercadopago_beneficiary_id);

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT
    '✅ MIGRACIÓN DE TRANSFERENCIAS COMPLETADA' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN ('transfer_status', 'transfer_id', 'transfer_amount')) as transfer_columns_added,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'companies' AND column_name IN ('bank_account_info', 'mercadopago_beneficiary_id')) as company_columns_added;