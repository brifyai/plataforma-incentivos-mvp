-- =============================================
-- PLATAFORMA DE INCENTIVOS - SETUP INICIAL
-- Migración: Estructura Base de Datos
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS
-- =============================================

-- Rol del usuario
CREATE TYPE user_role AS ENUM ('debtor', 'company', 'god_mode');

-- Estado de validación
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');

-- Estado de deuda
CREATE TYPE debt_status AS ENUM ('active', 'negotiating', 'agreed', 'paid', 'cancelled');

-- Estado de oferta
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Estado de acuerdo
CREATE TYPE agreement_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'breached');

-- Estado de pago
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Tipo de notificación
CREATE TYPE notification_type AS ENUM (
    'payment_reminder',
    'offer_received',
    'agreement_signed',
    'payment_due',
    'achievement_unlocked',
    'system_message'
);

-- Estado de notificación
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

-- =============================================
-- TABLA: users
-- Usuarios de la plataforma
-- =============================================
CREATE TABLE public.users (
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

-- Índices para users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_rut ON public.users(rut);
CREATE INDEX idx_users_role ON public.users(role);

-- =============================================
-- TABLA: companies
-- Empresas de cobranza
-- =============================================
CREATE TABLE public.companies (
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

-- Índices para companies
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_rut ON public.companies(rut);

-- =============================================
-- TABLA: consents
-- Consentimientos de usuarios
-- =============================================
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

-- Índices para consents
CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_company_id ON public.consents(company_id);

-- =============================================
-- TABLA: debts
-- Deudas de usuarios
-- =============================================
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

-- Índices para debts
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_company_id ON public.debts(company_id);
CREATE INDEX idx_debts_status ON public.debts(status);

-- =============================================
-- TABLA: offers
-- Ofertas de negociación
-- =============================================
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    offered_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    payment_plan JSONB, -- Array de pagos
    validity_days INTEGER DEFAULT 30,
    status offer_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para offers
CREATE INDEX idx_offers_debt_id ON public.offers(debt_id);
CREATE INDEX idx_offers_company_id ON public.offers(company_id);
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_validity ON public.offers(validity_days);

-- =============================================
-- TABLA: agreements
-- Acuerdos firmados
-- =============================================
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

-- Índices para agreements
CREATE INDEX idx_agreements_offer_id ON public.agreements(offer_id);
CREATE INDEX idx_agreements_user_id ON public.agreements(user_id);
CREATE INDEX idx_agreements_debt_id ON public.agreements(debt_id);
CREATE INDEX idx_agreements_company_id ON public.agreements(company_id);
CREATE INDEX idx_agreements_status ON public.agreements(status);

-- =============================================
-- TABLA: payments
-- Pagos realizados
-- =============================================
CREATE TABLE public.payments (
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

-- Índices para payments
CREATE INDEX idx_payments_agreement_id ON public.payments(agreement_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_transaction_date ON public.payments(transaction_date DESC);

-- =============================================
-- TABLA: wallet_transactions
-- Transacciones de billetera
-- =============================================
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'incentive'
    description TEXT,
    related_payment_id UUID REFERENCES public.payments(id),
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para wallet_transactions
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

-- =============================================
-- TABLA: notifications
-- Notificaciones del sistema
-- =============================================
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

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- =============================================
-- TABLA: proposals
-- Propuestas de pago personalizadas (deudor -> empresa)
-- =============================================
CREATE TABLE public.proposals (
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

-- Índices para proposals
CREATE INDEX idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX idx_proposals_debt_id ON public.proposals(debt_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- =============================================
-- TABLA: conversations
-- Conversaciones entre usuarios y empresas
-- =============================================
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

-- Índices para conversations
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_company_id ON public.conversations(company_id);

-- =============================================
-- TABLA: messages
-- Mensajes en conversaciones
-- =============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'company'
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'system'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para companies
CREATE POLICY "Companies can view their own profile" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can update their own profile" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para consents
CREATE POLICY "Users can view their own consents" ON public.consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view consents for their company" ON public.consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = consents.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para debts
CREATE POLICY "Users can view their own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view debts from their company" ON public.debts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para offers
CREATE POLICY "Users can view offers for their debts" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can manage offers from their company" ON public.offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = offers.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para agreements
CREATE POLICY "Users can view their own agreements" ON public.agreements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view agreements from their company" ON public.agreements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = agreements.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view payments from their company" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = payments.company_id
            AND companies.user_id = auth.uid()
        )
    );

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
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = conversations.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para proposals
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

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.companies comp ON comp.id = c.company_id
            WHERE c.id = messages.conversation_id
            AND comp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
        AND sender_type = 'user'
    );

CREATE POLICY "Companies can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.companies comp ON comp.id = c.company_id
            WHERE c.id = messages.conversation_id
            AND comp.user_id = auth.uid()
        )
        AND sender_type = 'company'
    );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON public.agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Usuario de prueba (debtor)
INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('test@example.com', '12345678-9', 'Usuario de Prueba', 'debtor', 'validated', true);

-- Usuario de prueba (company)
INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('company@example.com', '87654321-0', 'Empresa de Prueba', 'company', 'validated', true);

-- Empresa de prueba
INSERT INTO public.companies (user_id, company_name, rut, api_key)
VALUES (
    (SELECT id FROM public.users WHERE email = 'company@example.com'),
    'Empresa de Cobranza S.A.',
    '87654321-0',
    'test-api-key-123'
);

-- =============================================
-- FIN DE LA MIGRACIÓN INICIAL
-- =============================================