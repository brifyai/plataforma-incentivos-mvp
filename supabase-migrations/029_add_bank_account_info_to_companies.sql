-- Add bank account information to companies table
-- This migration adds the necessary columns to store bank account details

-- Add bank_account_info column to store bank account details as JSON
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT NULL;

-- Add mercadopago_beneficiary_id column to store Mercado Pago beneficiary ID
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id TEXT DEFAULT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN companies.bank_account_info IS 'Bank account information stored as JSON: {bankName, accountType, accountNumber, accountHolderName, bankId}';
COMMENT ON COLUMN companies.mercadopago_beneficiary_id IS 'Mercado Pago beneficiary ID for automatic transfers';

-- Create index on mercadopago_beneficiary_id for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_mercadopago_beneficiary_id ON companies(mercadopago_beneficiary_id);

-- Create GIN index on bank_account_info for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_companies_bank_account_info_gin ON companies USING GIN (bank_account_info);

-- RLS policies (if needed)
-- Note: These policies should be adjusted based on your existing RLS setup

-- Grant permissions
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON companies TO authenticated;
-- GRANT SELECT ON companies TO anon;