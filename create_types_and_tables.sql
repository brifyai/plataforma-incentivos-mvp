-- =============================================
-- CREATE TYPES AND TABLES - Tipos ENUM + Tablas
-- =============================================

-- Crear tipos ENUM si no existen
DO $$
BEGIN
    -- debt_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_status') THEN
        CREATE TYPE debt_status AS ENUM ('active', 'negotiating', 'agreed', 'paid', 'cancelled');
        RAISE NOTICE 'Tipo debt_status creado';
    END IF;

    -- offer_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
        RAISE NOTICE 'Tipo offer_status creado';
    END IF;

    -- agreement_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_status') THEN
        CREATE TYPE agreement_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'breached');
        RAISE NOTICE 'Tipo agreement_status creado';
    END IF;

    -- payment_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
        RAISE NOTICE 'Tipo payment_status creado';
    END IF;

    -- notification_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'payment_reminder',
            'offer_received',
            'agreement_signed',
            'payment_due',
            'achievement_unlocked',
            'system_message'
        );
        RAISE NOTICE 'Tipo notification_type creado';
    END IF;

    -- notification_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
        RAISE NOTICE 'Tipo notification_status creado';
    END IF;
END $$;

-- =============================================
-- CREAR TABLAS EN ORDEN DE DEPENDENCIAS
-- =============================================

-- Verificar y crear tabla debts si no existe
DO $$
BEGIN
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

        RAISE NOTICE 'Tabla debts creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla debts ya existe';
    END IF;
END $$;

-- Verificar y crear tabla offers si no existe
DO $$
BEGIN
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
        CREATE INDEX idx_offers_validity ON public.offers(validity_days);

        RAISE NOTICE 'Tabla offers creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla offers ya existe';
    END IF;
END $$;

-- Verificar y crear tabla agreements si no existe
DO $$
BEGIN
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

        RAISE NOTICE 'Tabla agreements creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla agreements ya existe';
    END IF;
END $$;

-- Verificar y crear tabla consents si no existe
DO $$
BEGIN
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

        RAISE NOTICE 'Tabla consents creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla consents ya existe';
    END IF;
END $$;

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

-- =============================================
-- HABILITAR RLS Y POLÍTICAS SIMPLIFICADAS
-- =============================================

-- Habilitar RLS en todas las tablas nuevas
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

-- Políticas simplificadas para administradores
CREATE POLICY "Admin can view all debts" ON public.debts FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all offers" ON public.offers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all agreements" ON public.agreements FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all conversations" ON public.conversations FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all messages" ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));
CREATE POLICY "Admin can view all notifications" ON public.notifications FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'god_mode'));

-- Políticas para usuarios normales
CREATE POLICY "Users can view their own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can view debts from their company" ON public.debts FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view offers for their debts" ON public.offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can manage offers from their company" ON public.offers FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can view agreements from their company" ON public.agreements FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can view payments from their company" ON public.payments FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can view conversations for their company" ON public.conversations FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- INSERTAR DATOS DE PRUEBA
-- =============================================

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
AND role = 'debtor'
ON CONFLICT DO NOTHING;

-- =============================================
-- FIN DE LA MIGRACIÓN COMPLETA
-- =============================================