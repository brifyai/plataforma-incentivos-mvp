-- =============================================
-- CREATE MISSING TABLES ONLY - Solo tablas faltantes
-- Evita recrear tipos ENUM que ya existen
-- =============================================

-- Verificar y crear tabla payments si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        CREATE TABLE public.payments (
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

        CREATE INDEX idx_payments_agreement_id ON public.payments(agreement_id);
        CREATE INDEX idx_payments_user_id ON public.payments(user_id);
        CREATE INDEX idx_payments_status ON public.payments(status);
        CREATE INDEX idx_payments_transaction_date ON public.payments(transaction_date DESC);

        RAISE NOTICE 'Tabla payments creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla payments ya existe';
    END IF;
END $$;

-- Verificar y crear tabla wallets si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        CREATE TABLE public.wallets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
            balance DECIMAL(15, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

        RAISE NOTICE 'Tabla wallets creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla wallets ya existe';
    END IF;
END $$;

-- Verificar y crear tabla wallet_transactions si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions') THEN
        CREATE TABLE public.wallet_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            amount DECIMAL(15, 2) NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT,
            related_payment_id UUID REFERENCES public.payments(id),
            balance_after DECIMAL(15, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
        CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

        RAISE NOTICE 'Tabla wallet_transactions creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla wallet_transactions ya existe';
    END IF;
END $$;

-- Verificar y crear tabla notifications si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            type notification_type NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status notification_status DEFAULT 'unread',
            related_entity_id UUID,
            related_entity_type VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX idx_notifications_status ON public.notifications(status);
        CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

        RAISE NOTICE 'Tabla notifications creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla notifications ya existe';
    END IF;
END $$;

-- Verificar y crear tabla conversations si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        CREATE TABLE public.conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
            subject VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, company_id, debt_id)
        );

        CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
        CREATE INDEX idx_conversations_company_id ON public.conversations(company_id);

        RAISE NOTICE 'Tabla conversations creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla conversations ya existe';
    END IF;
END $$;

-- Verificar y crear tabla messages si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        CREATE TABLE public.messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            sender_type VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
        CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

        RAISE NOTICE 'Tabla messages creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla messages ya existe';
    END IF;
END $$;

-- Habilitar RLS en tablas que lo necesiten
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas para administradores
CREATE POLICY "Admin can view all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view payments from their company" ON public.payments
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view conversations for their company" ON public.conversations
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Insertar algunos datos de prueba si no existen
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
    25000.00,
    NOW(),
    'awaiting_validation',
    'mercadopago',
    'MP_' || uuid_generate_v4()
)
ON CONFLICT DO NOTHING;

-- Insertar datos de prueba para wallets
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
AND role = 'debtor';

-- =============================================
-- FIN DE LA MIGRACIÓN CONDICIONAL
-- =============================================