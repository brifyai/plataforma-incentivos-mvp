-- MIGRACIÓN SEGURA: Solo agrega lo que falta
-- Esta migración es segura de ejecutar múltiples veces

-- =============================================
-- CREAR TIPOS ENUMERADOS (si no existen)
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

-- =============================================
-- CREAR TABLAS (si no existen)
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

-- =============================================
-- AGREGAR COLUMNAS FALTANTES A COMPANIES
-- =============================================

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct_creditor' CHECK (company_type IN ('direct_creditor', 'collection_agency')),
ADD COLUMN IF NOT EXISTS nexupay_commission_type TEXT DEFAULT 'percentage' CHECK (nexupay_commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS user_incentive_type TEXT DEFAULT 'percentage' CHECK (user_incentive_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(10,2) DEFAULT 5.00;

-- Agregar columna password a users si falta
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- =============================================
-- CREAR TABLAS ADICIONALES (si no existen)
-- =============================================

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
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
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
-- VERIFICACIÓN FINAL
-- =============================================

SELECT
    'SUCCESS: Migration completed successfully!' as status,
    NOW() as completed_at;

-- Mostrar columnas de companies para verificar
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
    AND table_schema = 'public'
ORDER BY ordinal_position;