-- =============================================
-- Crear tablas faltantes en la base de datos
-- =============================================

-- =============================================
-- TABLA: offers (Ofertas de negociación)
-- =============================================
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    offered_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    payment_plan JSONB,
    validity_days INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para offers
CREATE INDEX IF NOT EXISTS idx_offers_debt_id ON public.offers(debt_id);
CREATE INDEX IF NOT EXISTS idx_offers_company_id ON public.offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON public.offers(validity_days);

-- =============================================
-- TABLA: consents (Consentimientos de usuarios)
-- =============================================
CREATE TABLE IF NOT EXISTS public.consents (
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
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_company_id ON public.consents(company_id);

-- =============================================
-- TABLA: wallet_transactions (Transacciones de billetera)
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    related_payment_id UUID REFERENCES public.payments(id),
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- =============================================
-- TABLA: proposals (Propuestas de pago personalizadas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    proposed_amount DECIMAL(15, 2) NOT NULL,
    payment_plan JSONB,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    company_response TEXT,
    counter_amount DECIMAL(15, 2),
    accepted BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para proposals
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_debt_id ON public.proposals(debt_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);

-- =============================================
-- TABLA: conversations (Conversaciones entre usuarios y empresas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.conversations (
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
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON public.conversations(company_id);

-- =============================================
-- TABLA: messages (Mensajes en conversaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);

-- =============================================
-- HABILITAR RLS EN TABLAS NUEVAS
-- =============================================
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS PARA TABLAS NUEVAS
-- =============================================

-- Políticas para offers
CREATE POLICY IF NOT EXISTS "Users can view offers for their debts" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Companies can manage offers from their company" ON public.offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = offers.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para consents
CREATE POLICY IF NOT EXISTS "Users can view their own consents" ON public.consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Companies can view consents for their company" ON public.consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = consents.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para wallet_transactions
CREATE POLICY IF NOT EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para proposals
CREATE POLICY IF NOT EXISTS "Users can view their own proposals" ON public.proposals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create proposals for their debts" ON public.proposals
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.debts
            WHERE debts.id = proposals.debt_id
            AND debts.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update their own proposals" ON public.proposals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Companies can view proposals for their company" ON public.proposals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = proposals.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Companies can update proposals for their company" ON public.proposals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = proposals.company_id
            AND c.user_id = auth.uid()
        )
    );

-- Políticas para conversations
CREATE POLICY IF NOT EXISTS "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Companies can view conversations for their company" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = conversations.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para messages
CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Companies can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.companies comp ON comp.id = c.company_id
            WHERE c.id = messages.conversation_id
            AND comp.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
        AND sender_type = 'user'
    );

CREATE POLICY IF NOT EXISTS "Companies can send messages in their conversations" ON public.messages
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
-- TRIGGERS PARA UPDATED_AT EN TABLAS NUEVAS
-- =============================================
CREATE TRIGGER IF NOT EXISTS update_offers_updated_at 
    BEFORE UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_proposals_updated_at 
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =============================================
COMMENT ON TABLE public.offers IS 'Ofertas de negociación entre empresas y deudores';
COMMENT ON TABLE public.consents IS 'Consentimientos de usuarios para compartir datos';
COMMENT ON TABLE public.wallet_transactions IS 'Transacciones de billetera de usuarios';
COMMENT ON TABLE public.proposals IS 'Propuestas de pago personalizadas de deudores a empresas';
COMMENT ON TABLE public.conversations IS 'Conversaciones entre usuarios y empresas';
COMMENT ON TABLE public.messages IS 'Mensajes dentro de conversaciones';