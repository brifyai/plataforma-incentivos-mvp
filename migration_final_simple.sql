-- =============================================
-- MIGRACIÓN FINAL SIMPLIFICADA
-- =============================================

-- PRIMERO: Crear tipos ENUM faltantes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_status') THEN
        CREATE TYPE debt_status AS ENUM ('active', 'negotiating', 'agreed', 'paid', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_status') THEN
        CREATE TYPE agreement_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'breached');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'payment_reminder',
            'offer_received',
            'agreement_signed',
            'payment_due',
            'achievement_unlocked',
            'system_message'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
    END IF;
END $$;

-- SEGUNDO: Crear tablas faltantes
DO $$
BEGIN
    -- debts
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
        CREATE TABLE public.debts (
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
        CREATE INDEX idx_debts_user_id ON public.debts(user_id);
        CREATE INDEX idx_debts_company_id ON public.debts(company_id);
        CREATE INDEX idx_debts_status ON public.debts(status);
    END IF;

    -- offers
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offers') THEN
        CREATE TABLE public.offers (
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
        CREATE INDEX idx_offers_debt_id ON public.offers(debt_id);
        CREATE INDEX idx_offers_company_id ON public.offers(company_id);
        CREATE INDEX idx_offers_user_id ON public.offers(user_id);
        CREATE INDEX idx_offers_status ON public.offers(status);
    END IF;

    -- agreements
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agreements') THEN
        CREATE TABLE public.agreements (
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
        CREATE INDEX idx_agreements_offer_id ON public.agreements(offer_id);
        CREATE INDEX idx_agreements_user_id ON public.agreements(user_id);
        CREATE INDEX idx_agreements_debt_id ON public.agreements(debt_id);
        CREATE INDEX idx_agreements_company_id ON public.agreements(company_id);
        CREATE INDEX idx_agreements_status ON public.agreements(status);
    END IF;

    -- consents
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consents') THEN
        CREATE TABLE public.consents (
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
        CREATE INDEX idx_consents_user_id ON public.consents(user_id);
        CREATE INDEX idx_consents_company_id ON public.consents(company_id);
    END IF;

    -- payments
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
    END IF;

    -- wallets
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        CREATE TABLE public.wallets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
            balance DECIMAL(15, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
    END IF;

    -- wallet_transactions
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
    END IF;

    -- conversations
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
    END IF;

    -- messages
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
    END IF;

    -- notifications
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
    END IF;
END $$;

-- TERCERO: Habilitar RLS y crear políticas simples
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas simples para administradores
CREATE POLICY "Admin access debts" ON public.debts FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access offers" ON public.offers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access agreements" ON public.agreements FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access conversations" ON public.conversations FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access messages" ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin access notifications" ON public.notifications FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));

-- Políticas para usuarios normales
CREATE POLICY "Users access own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies access company debts" ON public.debts FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users access own offers" ON public.offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies manage company offers" ON public.offers FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users access own agreements" ON public.agreements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies access company agreements" ON public.agreements FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users access own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies access company payments" ON public.payments FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users access own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users access own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users access own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies access company conversations" ON public.conversations FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users access own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- CUARTO: Insertar datos de prueba
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

INSERT INTO public.wallets (user_id, balance)
SELECT id, 0
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
AND role = 'debtor'
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRACIÓN COMPLETADA
-- =============================================