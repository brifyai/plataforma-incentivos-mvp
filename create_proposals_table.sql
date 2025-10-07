-- Crear tabla para propuestas de pago de deudores
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Información de la propuesta
    proposed_amount DECIMAL(15, 2) NOT NULL,
    payment_plan TEXT NOT NULL, -- 'single_payment', 'monthly_installments', 'quarterly_payments', etc.
    description TEXT,
    status proposal_status DEFAULT 'pending',

    -- Información de respuesta de la empresa
    company_response TEXT,
    counter_amount DECIMAL(15, 2),
    accepted BOOLEAN DEFAULT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tipo enum para el estado de las propuestas
CREATE TYPE proposal_status AS ENUM ('pending', 'responded', 'accepted', 'rejected', 'expired');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_proposals_debt_id ON public.proposals(debt_id);
CREATE INDEX idx_proposals_debtor_id ON public.proposals(debtor_id);
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at DESC);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Política para que los deudores puedan ver sus propias propuestas
CREATE POLICY "Users can view their own proposals" ON public.proposals
    FOR SELECT USING (auth.uid() = debtor_id);

-- Política para que las empresas puedan ver propuestas de sus deudores
CREATE POLICY "Companies can view proposals for their debts" ON public.proposals
    FOR SELECT USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            WHERE c.user_id = auth.uid()
        )
    );

-- Política para que los deudores puedan crear propuestas
CREATE POLICY "Users can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = debtor_id);

-- Política para que las empresas puedan actualizar propuestas (responder)
CREATE POLICY "Companies can update proposals" ON public.proposals
    FOR UPDATE USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            WHERE c.user_id = auth.uid()
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_proposals_updated_at();