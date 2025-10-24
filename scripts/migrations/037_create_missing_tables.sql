
-- MIGRACIÓN PARA TABLAS VACÍAS O INCOMPLETAS
-- Crear estructura básica para tablas que no tienen datos

-- Tabla clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rut TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    region TEXT,
    debt_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla debts
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    original_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2) DEFAULT 0,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    target_clients TEXT[],
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla proposals
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    terms TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla agreements
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_schedule JSONB,
    status VARCHAR(50) DEFAULT 'active',
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON public.clients(rut);
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON public.debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON public.campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_debt_id ON public.proposals(debt_id);
CREATE INDEX IF NOT EXISTS idx_agreements_proposal_id ON public.agreements(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payments_agreement_id ON public.payments(agreement_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas
CREATE POLICY "Users can view their own company clients" ON public.clients
    FOR SELECT USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own company debts" ON public.debts
    FOR SELECT USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));
