-- =============================================
-- FIX DATABASE ISSUES - Migración de corrección
-- Soluciona problemas con RLS y tablas faltantes
-- =============================================

-- =============================================
-- DESHABILITAR RLS TEMPORALMENTE PARA DIAGNOSTICO
-- =============================================

-- Deshabilitar RLS en todas las tablas para diagnóstico
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICAR Y CREAR TABLAS FALTANTES
-- =============================================

-- Verificar si existe la tabla payments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        -- Crear tabla payments si no existe
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

        -- Crear índices para payments
        CREATE INDEX idx_payments_agreement_id ON public.payments(agreement_id);
        CREATE INDEX idx_payments_user_id ON public.payments(user_id);
        CREATE INDEX idx_payments_status ON public.payments(status);
        CREATE INDEX idx_payments_transaction_date ON public.payments(transaction_date DESC);

        RAISE NOTICE 'Tabla payments creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla payments ya existe';
    END IF;
END $$;

-- Verificar si existe la tabla wallets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        -- Crear tabla wallets
        CREATE TABLE public.wallets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
            balance DECIMAL(15, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices para wallets
        CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

        RAISE NOTICE 'Tabla wallets creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla wallets ya existe';
    END IF;
END $$;

-- Verificar si existe la tabla payment_preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_preferences') THEN
        -- Crear tabla payment_preferences para MercadoPago
        CREATE TABLE public.payment_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            preference_id VARCHAR(255) NOT NULL UNIQUE,
            debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
            debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            amount DECIMAL(15, 2) NOT NULL,
            external_reference VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices para payment_preferences
        CREATE INDEX idx_payment_preferences_debt_id ON public.payment_preferences(debt_id);
        CREATE INDEX idx_payment_preferences_debtor_id ON public.payment_preferences(debtor_id);

        RAISE NOTICE 'Tabla payment_preferences creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla payment_preferences ya existe';
    END IF;
END $$;

-- Verificar si existe la tabla transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        -- Crear tabla transactions para MercadoPago
        CREATE TABLE public.transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            payment_id VARCHAR(255) NOT NULL UNIQUE,
            external_reference VARCHAR(255),
            status VARCHAR(50),
            status_detail VARCHAR(255),
            amount DECIMAL(15, 2),
            currency VARCHAR(10) DEFAULT 'CLP',
            payment_method VARCHAR(50),
            payment_type VARCHAR(50),
            payer_email VARCHAR(255),
            metadata JSONB,
            date_created TIMESTAMP WITH TIME ZONE,
            date_approved TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices para transactions
        CREATE INDEX idx_transactions_payment_id ON public.transactions(payment_id);
        CREATE INDEX idx_transactions_external_reference ON public.transactions(external_reference);

        RAISE NOTICE 'Tabla transactions creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla transactions ya existe';
    END IF;
END $$;

-- Verificar si existe la tabla payment_history
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_history') THEN
        -- Crear tabla payment_history
        CREATE TABLE public.payment_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
            payment_id VARCHAR(255),
            amount DECIMAL(15, 2) NOT NULL,
            payment_method VARCHAR(50),
            status VARCHAR(50),
            paid_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices para payment_history
        CREATE INDEX idx_payment_history_debtor_id ON public.payment_history(debtor_id);
        CREATE INDEX idx_payment_history_debt_id ON public.payment_history(debt_id);

        RAISE NOTICE 'Tabla payment_history creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla payment_history ya existe';
    END IF;
END $$;

-- =============================================
-- VOLVER A HABILITAR RLS CON POLÍTICAS CORREGIDAS
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ELIMINAR POLÍTICAS ANTIGUAS PROBLEMÁTICAS
-- =============================================

-- Eliminar todas las políticas existentes para recrearlas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Companies can view their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own consents" ON public.consents;
DROP POLICY IF EXISTS "Companies can view consents for their company" ON public.consents;
DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
DROP POLICY IF EXISTS "Companies can view debts from their company" ON public.debts;
DROP POLICY IF EXISTS "Users can view offers for their debts" ON public.offers;
DROP POLICY IF EXISTS "Companies can manage offers from their company" ON public.offers;
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Companies can view agreements from their company" ON public.agreements;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Companies can view payments from their company" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Companies can view conversations for their company" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Companies can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Companies can send messages in their conversations" ON public.messages;

-- =============================================
-- CREAR POLÍTICAS RLS CORREGIDAS
-- =============================================

-- Políticas para users (simplificadas)
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para companies
CREATE POLICY "Companies can view their own profile" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can update their own profile" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert their own profile" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para consents
CREATE POLICY "Users can view their own consents" ON public.consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view consents for their company" ON public.consents
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para debts
CREATE POLICY "Users can view their own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view debts from their company" ON public.debts
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para offers
CREATE POLICY "Users can view offers for their debts" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can manage offers from their company" ON public.offers
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para agreements
CREATE POLICY "Users can view their own agreements" ON public.agreements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view agreements from their company" ON public.agreements
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view payments from their company" ON public.payments
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view conversations for their company" ON public.conversations
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
        AND sender_type = 'user'
    );

CREATE POLICY "Companies can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
        AND sender_type = 'company'
    );

-- Políticas para payment_preferences
CREATE POLICY "Users can view their payment preferences" ON public.payment_preferences
    FOR SELECT USING (auth.uid() = debtor_id);

-- Políticas para transactions
CREATE POLICY "Users can view their transactions" ON public.transactions
    FOR SELECT USING (
        metadata->>'debtor_id' = auth.uid()::text
    );

-- Políticas para payment_history
CREATE POLICY "Users can view their payment history" ON public.payment_history
    FOR SELECT USING (auth.uid() = debtor_id);

-- =============================================
-- AGREGAR TRIGGERS PARA TABLAS NUEVAS
-- =============================================

-- Trigger para wallets
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para payment_preferences
CREATE TRIGGER update_payment_preferences_updated_at BEFORE UPDATE ON public.payment_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERTAR DATOS DE PRUEBA PARA TESTING
-- =============================================

-- Insertar datos de prueba para wallets si no existen
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.wallets);

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
    NULL, -- Sin agreement por ahora
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
    'pending',
    'mercadopago',
    'MP_' || uuid_generate_v4()
);

-- =============================================
-- FIN DE LA MIGRACIÓN DE CORRECCIÓN
-- =============================================