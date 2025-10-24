-- MIGRACIÓN COMPLETA PARA TABLA COMPANIES
-- Resuelve todos los campos críticos faltantes

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS legal_representative_email TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_phone TEXT;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_region TEXT,
ADD COLUMN IF NOT EXISTS company_commune TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT DEFAULT 'Chile',
ADD COLUMN IF NOT EXISTS company_postal_code TEXT;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS economic_activity TEXT,
ADD COLUMN IF NOT EXISTS constitution_date DATE,
ADD COLUMN IF NOT EXISTS social_capital DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS identity_validation_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_documents JSONB,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS company_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS industry_sector TEXT;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS integration_settings JSONB,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_legal_representative_rut ON public.companies(legal_representative_rut);
CREATE INDEX IF NOT EXISTS idx_companies_business_type ON public.companies(business_type);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON public.companies(subscription_status);

UPDATE public.companies 
SET 
    legal_representative_email = 'camilo.alegia@nexupay.cl',
    legal_representative_phone = '+56966685967',
    company_address = 'Av. Providencia 1234',
    company_region = 'Metropolitana',
    company_commune = 'Providencia',
    company_city = 'Santiago',
    business_type = 'Servicios Financieros',
    economic_activity = 'Cobranza y Recuperación de Créditos',
    constitution_date = '2020-01-15',
    social_capital = 10000000,
    company_website = 'https://nexupay.cl',
    company_description = 'Plataforma especializada en gestión de cobranzas y recuperación de créditos',
    identity_validation_status = 'verified',
    verification_status = 'verified',
    verified_at = NOW(),
    is_active = true,
    is_verified = true,
    company_size = 'mediana',
    industry_sector = 'Finanzas',
    updated_at = NOW()
WHERE contact_email = 'empresa@nexupay.cl';

SELECT 
    company_name,
    rut,
    legal_representative_name,
    legal_representative_rut,
    legal_representative_email,
    legal_representative_phone,
    company_address,
    company_region,
    business_type,
    verification_status,
    is_verified,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';