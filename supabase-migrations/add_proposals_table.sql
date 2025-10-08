-- =============================================
-- MIGRACIÓN: Agregar tabla proposals
-- Fecha: 2025-01-08
-- Descripción: Agrega la tabla proposals para el sistema de propuestas de pago
-- =============================================

-- =============================================
-- TABLA: proposals
-- Propuestas de pago personalizadas (deudor -> empresa)
-- =============================================

-- Crear tabla si no existe
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS public.proposals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
        proposed_amount DECIMAL(15, 2) NOT NULL,
        payment_plan JSONB, -- Array de pagos propuestos
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'responded', 'accepted', 'rejected'
        company_response TEXT,
        counter_amount DECIMAL(15, 2), -- Contraoferta de la empresa
        accepted BOOLEAN DEFAULT FALSE,
        responded_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Tabla proposals ya existe o error al crear: %', SQLERRM;
END $$;

-- Índices para proposals (crear si no existen)
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_debt_id ON public.proposals(debt_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);

-- Habilitar RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proposals (con manejo de existentes)
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create proposals for their debts" ON public.proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Companies can view proposals for their company" ON public.proposals;
DROP POLICY IF EXISTS "Companies can update proposals for their company" ON public.proposals;

CREATE POLICY "Users can view their own proposals" ON public.proposals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create proposals for their debts" ON public.proposals
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.debts
            WHERE debts.id = proposals.debt_id
            AND debts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own proposals" ON public.proposals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Companies can view proposals for their company" ON public.proposals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = proposals.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can update proposals for their company" ON public.proposals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = proposals.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Trigger para updated_at (crear si no existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_proposals_updated_at'
        AND tgrelid = 'public.proposals'::regclass
    ) THEN
        CREATE TRIGGER update_proposals_updated_at
            BEFORE UPDATE ON public.proposals
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================