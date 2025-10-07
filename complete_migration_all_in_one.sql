-- =============================================
-- MIGRACIÓN COMPLETA - TODAS LAS TABLAS Y COLUMNAS
-- Ejecutar este archivo ÚNICO en Supabase SQL Editor
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS
-- =============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('debtor', 'company', 'god_mode');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE debt_status AS ENUM ('active', 'negotiating', 'agreed', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agreement_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'breached');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE badge_type AS ENUM (
        'first_payment', 'three_consecutive', 'debt_reduction_25',
        'debt_reduction_50', 'debt_reduction_75', 'debt_free',
        'early_payment', 'full_payment', 'five_agreements',
        'ten_agreements', 'wallet_master', 'negotiator', 'consistent_payer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'bounced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE email_type AS ENUM (
        'payment_reminder_3days', 'payment_reminder_1day', 'payment_confirmation',
        'achievement_unlocked', 'weekly_report', 'monthly_report', 'level_up', 'new_offer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_frequency AS ENUM ('realtime', 'daily_digest', 'weekly_digest', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLAS BASE
-- =============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    rut VARCHAR(12) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    validation_status validation_status DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    api_key VARCHAR(255) UNIQUE,
    webhook_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    original_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    due_date DATE,
    status debt_status DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    offered_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    payment_plan JSONB,
    validity_days INTEGER DEFAULT 30,
    status offer_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    agreed_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    payment_plan JSONB NOT NULL,
    status agreement_status DEFAULT 'pending',
    signed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    installment_number INTEGER,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLAS DE GAMIFICACIÓN
-- =============================================

CREATE TABLE IF NOT EXISTS public.gamification_levels (
    id SERIAL PRIMARY KEY,
    level_number INTEGER NOT NULL UNIQUE,
    level_name VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL,
    benefits JSONB DEFAULT '{}'::jsonb,
    icon_url VARCHAR(500),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gamification_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_type badge_type NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    points_reward INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common',
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    points_to_next_level INTEGER DEFAULT 100,
    consecutive_payments INTEGER DEFAULT 0,
    total_payments_made INTEGER DEFAULT 0,
    total_agreements_accepted INTEGER DEFAULT 0,
    total_debt_reduced DECIMAL(15, 2) DEFAULT 0.00,
    achievements_unlocked INTEGER DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLAS ADICIONALES
-- =============================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    rut VARCHAR(12) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    business_sector VARCHAR(100),
    credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
    total_debt_amount DECIMAL(15, 2) DEFAULT 0.00,
    active_debts_count INTEGER DEFAULT 0,
    last_payment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    receipt_file_url VARCHAR(500) NOT NULL,
    receipt_file_name VARCHAR(255),
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    validation_status VARCHAR(20) DEFAULT 'pending',
    validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    amount_claimed DECIMAL(15, 2),
    payment_date DATE,
    payment_method VARCHAR(50),
    debt_reference VARCHAR(100),
    notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLAS DE TRANSFERENCIAS BANCARIAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.transfer_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_transfers INTEGER NOT NULL DEFAULT 0,
    transfer_method VARCHAR(50) DEFAULT 'bank_transfer',
    description TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transfer_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.transfer_batches(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    transfer_status VARCHAR(20) DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'processing', 'completed', 'failed')),
    transfer_method VARCHAR(50) DEFAULT 'bank_transfer',
    mercadopago_beneficiary_id VARCHAR(255),
    bank_account_info JSONB,
    transfer_reference VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AGREGAR COLUMNAS FALTANTES A COMPANIES
-- =============================================

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct_creditor' CHECK (company_type IN ('direct_creditor', 'collection_agency')),
ADD COLUMN IF NOT EXISTS nexupay_commission_type TEXT DEFAULT 'percentage' CHECK (nexupay_commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS user_incentive_type TEXT DEFAULT 'percentage' CHECK (user_incentive_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(10,2) DEFAULT 5.00;

-- Agregar columna password si falta
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_rut ON public.users(rut);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_rut ON public.companies(rut);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON public.debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON public.clients(rut);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_company_id ON public.payment_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_transfer_batches_company_id ON public.transfer_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_transfer_batches_created_by ON public.transfer_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_transfer_batches_status ON public.transfer_batches(status);
CREATE INDEX IF NOT EXISTS idx_transfer_batch_items_batch_id ON public.transfer_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_transfer_batch_items_company_id ON public.transfer_batch_items(company_id);
CREATE INDEX IF NOT EXISTS idx_transfer_batch_items_transfer_status ON public.transfer_batch_items(transfer_status);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debts_updated_at ON public.debts;
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_receipts_updated_at ON public.payment_receipts;
CREATE TRIGGER update_payment_receipts_updated_at BEFORE UPDATE ON public.payment_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfer_batches_updated_at ON public.transfer_batches;
CREATE TRIGGER update_transfer_batches_updated_at BEFORE UPDATE ON public.transfer_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfer_batch_items_updated_at ON public.transfer_batch_items;
CREATE TRIGGER update_transfer_batch_items_updated_at BEFORE UPDATE ON public.transfer_batch_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Usuario de prueba (debtor)
INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('test@example.com', '12345678-9', 'Usuario de Prueba', 'debtor', 'validated', true)
ON CONFLICT (email) DO NOTHING;

-- Usuario de prueba (company)
INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('company@example.com', '87654321-0', 'Empresa de Prueba', 'company', 'validated', true)
ON CONFLICT (email) DO NOTHING;

-- Empresa de prueba
INSERT INTO public.companies (user_id, company_name, rut, api_key)
SELECT
    (SELECT id FROM public.users WHERE email = 'company@example.com'),
    'Empresa de Cobranza S.A.',
    '87654321-0',
    'test-api-key-123'
WHERE NOT EXISTS (
    SELECT 1 FROM public.companies WHERE rut = '87654321-0'
);

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

SELECT
    '✅ MIGRACIÓN COMPLETA EXITOSA - TODAS LAS TABLAS Y COLUMNAS CREADAS' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'companies') as company_columns;

-- Verificar tablas críticas
SELECT
    '📋 VERIFICACIÓN DE TABLAS CRÍTICAS' as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN '✅' ELSE '❌' END as companies,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_batches' AND table_schema = 'public') THEN '✅' ELSE '❌' END as transfer_batches,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_batch_items' AND table_schema = 'public') THEN '✅' ELSE '❌' END as transfer_batch_items,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'nexupay_commission_type') THEN '✅' ELSE '❌' END as commission_columns;

-- Mostrar resumen final
SELECT
    'Tablas creadas:' as info,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
    'Columnas en companies:',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'companies'
UNION ALL
SELECT
    'Columnas en transfer_batches:',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'transfer_batches'
UNION ALL
SELECT
    'Columnas en transfer_batch_items:',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'transfer_batch_items';