-- =============================================
-- MIGRACIÓN COMPLETA: SISTEMA DE TRANSFERENCIAS AUTOMÁTICAS
-- Crea tabla transactions y agrega campos bancarios a companies
-- =============================================

-- Crear tabla transactions para rastrear transacciones de Mercado Pago
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) UNIQUE, -- ID de Mercado Pago
    external_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CLP',
    payment_method VARCHAR(50),
    payment_type VARCHAR(50),
    payer_email VARCHAR(255),
    payer_identification JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    date_created TIMESTAMP WITH TIME ZONE,
    date_approved TIMESTAMP WITH TIME ZONE,
    date_last_updated TIMESTAMP WITH TIME ZONE,

    -- Campos para seguimiento de transferencias
    transfer_status VARCHAR(20) DEFAULT NULL CHECK (transfer_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    transfer_id VARCHAR(255),
    transfer_amount DECIMAL(15, 2),
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    transfer_initiated_at TIMESTAMP WITH TIME ZONE,
    transfer_completed_at TIMESTAMP WITH TIME ZONE,
    transfer_error TEXT,
    transfer_reference VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para la tabla transactions
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_reference ON transactions(external_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_status ON transactions(transfer_status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);

-- Agregar campos bancarios a la tabla companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS bank_account_info JSONB,
ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id VARCHAR(255);

-- Crear índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_mercadopago_beneficiary_id ON companies(mercadopago_beneficiary_id);

-- Crear trigger para updated_at en transactions
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT
    '✅ MIGRACIÓN DE TRANSFERENCIAS COMPLETADA' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') as transactions_table_created,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN ('transfer_status', 'transfer_id', 'transfer_amount')) as transfer_columns_added,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'companies' AND column_name IN ('bank_account_info', 'mercadopago_beneficiary_id')) as company_columns_added;