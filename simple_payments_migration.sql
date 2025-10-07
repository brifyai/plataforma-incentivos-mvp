-- =============================================
-- SIMPLE PAYMENTS TABLE CREATION
-- =============================================

-- Crear tipos enum necesarios si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'awaiting_validation', 'completed', 'failed', 'refunded');
    END IF;
END $$;

-- Crear tabla payments si no existe
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID, -- Sin referencia por ahora para evitar dependencias
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

-- Crear índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_agreement_id ON public.payments(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON public.payments(transaction_date DESC);

-- Habilitar RLS en la tabla payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Companies can view payments from their company" ON public.payments;

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view payments from their company" ON public.payments
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Insertar algunos pagos de prueba
INSERT INTO public.payments (
    agreement_id,
    user_id,
    company_id,
    amount,
    transaction_date,
    status,
    payment_method,
    transaction_id
) VALUES
(
    NULL,
    (SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1),
    (SELECT id FROM public.companies LIMIT 1),
    50000.00,
    NOW() - INTERVAL '2 days',
    'completed',
    'mercadopago',
    'MP_' || uuid_generate_v4()
),
(
    NULL,
    (SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1),
    (SELECT id FROM public.companies LIMIT 1),
    75000.00,
    NOW() - INTERVAL '1 day',
    'completed',
    'transferencia',
    'TX_' || uuid_generate_v4()
),
(
    NULL,
    (SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1),
    (SELECT id FROM public.companies LIMIT 1),
    25000.00,
    NOW(),
    'awaiting_validation',
    'mercadopago',
    'MP_' || uuid_generate_v4()
);

-- =============================================
-- FIN DE LA MIGRACIÓN SIMPLE
-- =============================================