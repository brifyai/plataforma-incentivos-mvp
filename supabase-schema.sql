-- =============================================
-- PLATAFORMA DE INCENTIVOS PARA ACUERDOS DE PAGO
-- Esquema de Base de Datos para Supabase
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TIPOS ENUMERADOS
-- =============================================

-- Tipo de usuario
CREATE TYPE user_role AS ENUM ('debtor', 'company', 'admin', 'god_mode');

-- Estado de validación de identidad
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');

-- Método de validación
CREATE TYPE validation_method AS ENUM ('clave_unica', 'biometric');

-- Estado de deuda
CREATE TYPE debt_status AS ENUM ('active', 'in_negotiation', 'paid', 'condoned', 'defaulted');

-- Tipo de deuda
CREATE TYPE debt_type AS ENUM ('credit_card', 'loan', 'service', 'mortgage', 'other');

-- Tipo de oferta
CREATE TYPE offer_type AS ENUM ('discount', 'installment_plan', 'renegotiation', 'partial_condonation');

-- Estado de oferta
CREATE TYPE offer_status AS ENUM ('active', 'expired', 'cancelled', 'used');

-- Estado de acuerdo
CREATE TYPE agreement_status AS ENUM ('active', 'completed', 'defaulted', 'cancelled');

-- Estado de pago
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'awaiting_validation');

-- Método de pago
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'mercadopago', 'wallet');

-- Estado de validación de comprobante
CREATE TYPE payment_validation_status AS ENUM ('pending', 'approved', 'rejected');

-- Tipo de transacción de wallet
CREATE TYPE wallet_transaction_type AS ENUM ('credit', 'debit');

-- Concepto de transacción
CREATE TYPE transaction_concept AS ENUM ('payment_incentive', 'withdrawal', 'cross_payment', 'gift_card_redemption', 'monthly_commission');

-- Estado de facturación mensual
CREATE TYPE billing_status AS ENUM ('pending', 'paid', 'overdue');

-- Estado de transferencias bancarias
CREATE TYPE transfer_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Tipo de cuenta bancaria
CREATE TYPE bank_account_type AS ENUM ('checking', 'savings');

-- Estado de notificación
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

-- Tipo de notificación
CREATE TYPE notification_type AS ENUM ('new_offer', 'payment_confirmed', 'agreement_accepted', 'incentive_credited', 'payment_reminder', 'agreement_completed', 'message_received');

-- =============================================
-- TABLA: users (extiende auth.users de Supabase)
-- =============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255), -- Contraseña en texto plano (INSEGURO - usar hash en producción)
    rut VARCHAR(12) UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    role user_role NOT NULL DEFAULT 'debtor',
    validation_status validation_status DEFAULT 'pending',
    validation_method validation_method,
    validation_date TIMESTAMP WITH TIME ZONE,
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "frequency": "realtime"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_rut ON public.users(rut);
CREATE INDEX idx_users_email ON public.users(email);

-- =============================================
-- TABLA: companies
-- =============================================
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    company_type VARCHAR(50), -- 'direct_creditor' o 'collection_agency'
    commission_percentage DECIMAL(5, 2) DEFAULT 15.00,
    api_key TEXT UNIQUE,
    webhook_url TEXT,
    -- Información de Mercado Pago para split de pagos
    mercadopago_account_id VARCHAR(255), -- ID de cuenta de Mercado Pago de la empresa
    mercadopago_access_token TEXT, -- Token de acceso (encriptado)
    bank_account_info JSONB DEFAULT '{}'::jsonb, -- Información bancaria para transferencias
    configuration JSONB DEFAULT '{"auto_accept_payments": true, "allow_counteroffers": true, "default_offer_validity_days": 30, "payment_methods": {"bank_transfer": true, "mercadopago": true}}'::jsonb,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_rut ON public.companies(rut);

-- =============================================
-- TABLA: clients (clientes de empresas de cobranza)
-- =============================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    contact_name VARCHAR(255),
    industry VARCHAR(100), -- Sector económico
    address TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    commission_percentage DECIMAL(5, 2) DEFAULT 15.00, -- Comisión específica para este cliente
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    notes TEXT,
    configuration JSONB DEFAULT '{
        "auto_accept_payments": true,
        "allow_counteroffers": true,
        "default_offer_validity_days": 30,
        "payment_methods": {"bank_transfer": true, "mercadopago": true}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_rut ON public.clients(rut);
CREATE INDEX idx_clients_status ON public.clients(status);

-- =============================================
-- TABLA: consents (consentimientos de usuarios)
-- =============================================
CREATE TABLE public.consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    granted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'revoked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_company_id ON public.consents(company_id);

-- =============================================
-- TABLA: debts
-- =============================================
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, -- Empresa de cobranza
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    debt_reference VARCHAR(100), -- ID externo del cliente
    original_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    origin_date DATE NOT NULL,
    debt_type debt_type NOT NULL,
    status debt_status DEFAULT 'active',
    payment_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debts_client_id ON public.debts(client_id);
CREATE INDEX idx_debts_company_id ON public.debts(company_id);
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_status ON public.debts(status);

-- =============================================
-- TABLA: offers
-- =============================================
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, -- NULL si es oferta masiva sin cliente específico
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE, -- NULL si es oferta masiva
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL si es oferta masiva
    offer_type offer_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    segment_criteria JSONB, -- Criterios de segmentación para ofertas masivas
    parameters JSONB NOT NULL, -- {discount_percentage, installments, new_interest_rate, initial_payment, etc.}
    user_incentive_percentage DECIMAL(5, 2) DEFAULT 5.00,
    validity_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validity_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status offer_status DEFAULT 'active',
    metrics JSONB DEFAULT '{"eligible_users": 0, "views": 0, "acceptances": 0}'::jsonb,
    ab_test_variant VARCHAR(10), -- NULL, 'A', o 'B'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offers_company_id ON public.offers(company_id);
CREATE INDEX idx_offers_client_id ON public.offers(client_id);
CREATE INDEX idx_offers_debt_id ON public.offers(debt_id);
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_validity ON public.offers(validity_start, validity_end);

-- =============================================
-- TABLA: agreements
-- =============================================
CREATE TABLE public.agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    acceptance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agreed_terms JSONB NOT NULL, -- Términos completos del acuerdo
    payment_plan JSONB DEFAULT '[]'::jsonb, -- Array de cuotas con fechas y montos
    status agreement_status DEFAULT 'active',
    total_agreed_amount DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0.00,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agreements_offer_id ON public.agreements(offer_id);
CREATE INDEX idx_agreements_user_id ON public.agreements(user_id);
CREATE INDEX idx_agreements_debt_id ON public.agreements(debt_id);
CREATE INDEX idx_agreements_client_id ON public.agreements(client_id);
CREATE INDEX idx_agreements_company_id ON public.agreements(company_id);
CREATE INDEX idx_agreements_status ON public.agreements(status);

-- =============================================
-- TABLA: payments
-- =============================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_gateway_id VARCHAR(255), -- ID de Mercado Pago u otra pasarela
    -- Modelo económico actualizado: comisión fija $60.000 por negocio cerrado
    platform_commission DECIMAL(15, 2) DEFAULT 0, -- Comisión de MP (asumida por empresa)
    user_incentive DECIMAL(15, 2) DEFAULT 30000, -- Incentivo fijo: $30.000 por cierre
    business_closure_fee DECIMAL(15, 2) DEFAULT 60000, -- Comisión fija: $60.000 por negocio
    installment_number INTEGER,
    -- Campos para validación de comprobantes (transferencias)
    requires_validation BOOLEAN DEFAULT FALSE,
    validation_status payment_validation_status DEFAULT 'pending',
    validated_by UUID REFERENCES public.users(id), -- Usuario que validó
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_agreement_id ON public.payments(agreement_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_transaction_date ON public.payments(transaction_date);
CREATE INDEX idx_payments_validation_status ON public.payments(validation_status);
CREATE INDEX idx_payments_requires_validation ON public.payments(requires_validation);

-- =============================================
-- TABLA: payment_receipts (comprobantes de pago)
-- =============================================
CREATE TABLE public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- URL de Supabase Storage
    file_type VARCHAR(50), -- 'image/jpeg', 'application/pdf', etc.
    file_size INTEGER, -- Tamaño en bytes
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES public.users(id), -- Usuario empresa que validó
    validation_status payment_validation_status DEFAULT 'pending',
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_receipts_payment_id ON public.payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX idx_payment_receipts_client_id ON public.payment_receipts(client_id);
CREATE INDEX idx_payment_receipts_company_id ON public.payment_receipts(company_id);
CREATE INDEX idx_payment_receipts_validation_status ON public.payment_receipts(validation_status);

-- =============================================
-- TABLA: monthly_billings (facturación mensual a empresas)
-- =============================================
CREATE TABLE public.monthly_billings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    billing_period DATE NOT NULL, -- Primer día del mes (YYYY-MM-01)
    closed_businesses_count INTEGER DEFAULT 0, -- Número de negocios cerrados en el período
    total_amount DECIMAL(15, 2) DEFAULT 0, -- Total a pagar: closed_businesses_count * 60000
    status billing_status DEFAULT 'pending',
    due_date DATE NOT NULL, -- Fecha de vencimiento (último día del mes)
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255), -- Referencia de pago
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, billing_period)
);

CREATE INDEX idx_monthly_billings_company_id ON public.monthly_billings(company_id);
CREATE INDEX idx_monthly_billings_period ON public.monthly_billings(billing_period);
CREATE INDEX idx_monthly_billings_status ON public.monthly_billings(status);

-- =============================================
-- TABLA: business_closures (tracking de negocios cerrados)
-- =============================================
CREATE TABLE public.business_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    closure_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    incentive_paid BOOLEAN DEFAULT FALSE, -- Si el incentivo ya fue pagado al usuario
    billing_period DATE NOT NULL, -- Período de facturación (mes/año)
    commission_amount DECIMAL(15, 2) DEFAULT 60000, -- Comisión fija: $60.000
    user_incentive_amount DECIMAL(15, 2) DEFAULT 30000, -- Incentivo al usuario: $30.000
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_business_closures_payment_id ON public.business_closures(payment_id);
CREATE INDEX idx_business_closures_client_id ON public.business_closures(client_id);
CREATE INDEX idx_business_closures_company_id ON public.business_closures(company_id);
CREATE INDEX idx_business_closures_billing_period ON public.business_closures(billing_period);
CREATE INDEX idx_business_closures_incentive_paid ON public.business_closures(incentive_paid);

-- =============================================
-- TABLA: bank_transfers (transferencias bancarias automáticas)
-- =============================================
CREATE TABLE public.bank_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    bank_account_type bank_account_type NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_holder_rut VARCHAR(12) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    description VARCHAR(500),
    status transfer_status DEFAULT 'pending',
    transfer_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    mercado_pago_transfer_id VARCHAR(255), -- ID de transferencia en MP
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_transfers_company_id ON public.bank_transfers(company_id);
CREATE INDEX idx_bank_transfers_status ON public.bank_transfers(status);
CREATE INDEX idx_bank_transfers_created_at ON public.bank_transfers(created_at);

-- =============================================
-- TABLA: transfer_batches (lotes de transferencias masivas)
-- =============================================
CREATE TABLE public.transfer_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_transfers INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    processed_transfers INTEGER DEFAULT 0,
    successful_transfers INTEGER DEFAULT 0,
    failed_transfers INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, partial, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfer_batches_status ON public.transfer_batches(status);
CREATE INDEX idx_transfer_batches_created_at ON public.transfer_batches(created_at);

-- =============================================
-- TABLA: batch_transfers (relación batch-transfer)
-- =============================================
CREATE TABLE public.batch_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.transfer_batches(id) ON DELETE CASCADE,
    transfer_id UUID NOT NULL REFERENCES public.bank_transfers(id) ON DELETE CASCADE,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, transfer_id)
);

CREATE INDEX idx_batch_transfers_batch_id ON public.batch_transfers(batch_id);
CREATE INDEX idx_batch_transfers_transfer_id ON public.batch_transfers(transfer_id);

-- =============================================
-- TABLA: wallet_transactions
-- =============================================
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_type wallet_transaction_type NOT NULL,
    concept transaction_concept NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    related_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);

-- =============================================
-- TABLA: notifications
-- =============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'unread',
    related_entity_id UUID, -- ID de la entidad relacionada (oferta, pago, etc.)
    related_entity_type VARCHAR(50), -- 'offer', 'payment', 'agreement', etc.
    action_url VARCHAR(500), -- URL a donde redirigir al hacer click
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- =============================================
-- TABLA: conversations (para sistema de mensajería)
-- =============================================
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'closed'
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id, debt_id)
);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_company_id ON public.conversations(company_id);

-- =============================================
-- TABLA: messages
-- =============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'company', 'system'
    sender_id UUID NOT NULL,
    content TEXT NOT NULL, -- Encriptado en aplicación
    attachments JSONB DEFAULT '[]'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'delivered', 'read'
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
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

-- Función para actualizar balance de wallet
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'credit' THEN
        UPDATE public.users
        SET wallet_balance = wallet_balance + NEW.amount
        WHERE id = NEW.user_id;
    ELSE
        UPDATE public.users
        SET wallet_balance = wallet_balance - NEW.amount
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_on_transaction AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Función para procesar cierre de negocio cuando un pago se completa
CREATE OR REPLACE FUNCTION process_business_closure()
RETURNS TRIGGER AS $$
DECLARE
    billing_period DATE;
    existing_closure UUID;
BEGIN
    -- Solo procesar cuando el pago se completa por primera vez
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Calcular período de facturación (primer día del mes actual)
        billing_period := DATE_TRUNC('month', NEW.transaction_date)::DATE;

        -- Verificar si ya existe un cierre para este pago
        SELECT id INTO existing_closure
        FROM public.business_closures
        WHERE payment_id = NEW.id;

        -- Si no existe, crear el registro de cierre de negocio
        IF existing_closure IS NULL THEN
            INSERT INTO public.business_closures (
                payment_id,
                agreement_id,
                user_id,
                company_id,
                debt_id,
                billing_period,
                commission_amount,
                user_incentive_amount
            ) VALUES (
                NEW.id,
                NEW.agreement_id,
                NEW.user_id,
                NEW.company_id,
                NEW.debt_id,
                billing_period,
                COALESCE(NEW.business_closure_fee, 60000),
                COALESCE(NEW.user_incentive, 30000)
            );

            -- Actualizar o crear facturación mensual
            INSERT INTO public.monthly_billings (
                company_id,
                billing_period,
                closed_businesses_count,
                total_amount,
                due_date
            ) VALUES (
                NEW.company_id,
                billing_period,
                1,
                COALESCE(NEW.business_closure_fee, 60000),
                (billing_period + INTERVAL '1 month - 1 day')::DATE
            )
            ON CONFLICT (company_id, billing_period)
            DO UPDATE SET
                closed_businesses_count = monthly_billings.closed_businesses_count + 1,
                total_amount = monthly_billings.total_amount + COALESCE(NEW.business_closure_fee, 60000),
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_business_closure_on_payment_completion
    AFTER UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION process_business_closure();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS para producción (IMPORTANTE PARA SEGURIDAD)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS deshabilitadas para desarrollo
-- Políticas para USERS (deshabilitadas para autenticación directa)
-- CREATE POLICY "Users can view their own data" ON public.users
--     FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update their own data" ON public.users
--     FOR UPDATE USING (auth.uid() = id);

-- Políticas para COMPANIES
-- CREATE POLICY "Companies can view their own data" ON public.companies
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Companies can update their own data" ON public.companies
--     FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para DEBTS (deshabilitadas)
-- CREATE POLICY "Users can view their own debts" ON public.debts
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Companies can view their debts" ON public.debts
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = debts.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Companies can insert debts" ON public.debts
--     FOR INSERT WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = debts.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Companies can update their debts" ON public.debts
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = debts.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- Políticas para OFFERS (deshabilitadas)
-- CREATE POLICY "Users can view offers for their debts" ON public.offers
--     FOR SELECT USING (
--         auth.uid() = user_id OR
--         EXISTS (
--             SELECT 1 FROM public.debts
--             WHERE debts.id = offers.debt_id
--             AND debts.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Companies can manage their offers" ON public.offers
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = offers.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- Todas las políticas RLS deshabilitadas para desarrollo
-- Políticas para AGREEMENTS
-- CREATE POLICY "Users can view their agreements" ON public.agreements
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Companies can view their agreements" ON public.agreements
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = agreements.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Users can create agreements" ON public.agreements
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para PAYMENTS
-- CREATE POLICY "Users can view their payments" ON public.payments
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Companies can view payments for their agreements" ON public.payments
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = payments.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Users can create payments" ON public.payments
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Companies can update payment validation" ON public.payments
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = payments.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- Políticas para PAYMENT_RECEIPTS
-- CREATE POLICY "Users can view their payment receipts" ON public.payment_receipts
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can upload payment receipts" ON public.payment_receipts
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Companies can view payment receipts for their payments" ON public.payment_receipts
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = payment_receipts.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Companies can validate payment receipts" ON public.payment_receipts
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = payment_receipts.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- Políticas para WALLET_TRANSACTIONS
-- CREATE POLICY "Users can view their wallet transactions" ON public.wallet_transactions
--     FOR SELECT USING (auth.uid() = user_id);

-- Políticas para NOTIFICATIONS
-- CREATE POLICY "Users can view their notifications" ON public.notifications
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update their notifications" ON public.notifications
--     FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para CONVERSATIONS
-- CREATE POLICY "Users can view their conversations" ON public.conversations
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Companies can view their conversations" ON public.conversations
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.companies
--             WHERE companies.id = conversations.company_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- Políticas para MESSAGES
-- CREATE POLICY "Users can view messages in their conversations" ON public.messages
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.conversations
--             WHERE conversations.id = messages.conversation_id
--             AND conversations.user_id = auth.uid()
--         )
--     );
-- CREATE POLICY "Companies can view messages in their conversations" ON public.messages
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.conversations
--             JOIN public.companies ON companies.id = conversations.company_id
--             WHERE conversations.id = messages.conversation_id
--             AND companies.user_id = auth.uid()
--         )
--     );

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =============================================

/*
-- Estos datos son solo para desarrollo/testing
-- NO ejecutar en producción

-- Crear usuario deudor de ejemplo (requiere que el auth.users ya exista)
-- INSERT INTO public.users (id, email, rut, full_name, role, validation_status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'deudor@example.com',
--     '12345678-9',
--     'Juan Pérez',
--     'debtor',
--     'validated'
-- );

-- Crear usuario empresa de ejemplo
-- INSERT INTO public.users (id, email, rut, full_name, role, validation_status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000002',
--     'empresa@example.com',
--     '98765432-1',
--     'Empresa Cobranzas SA',
--     'company',
--     'validated'
-- );
*/

-- =============================================
-- MIGRACIÓN PARA ESTRUCTURA MULTI-CLIENTE
-- =============================================
-- Este script migra los datos existentes para la nueva estructura multi-cliente
-- Ejecutar después de crear todas las tablas

-- Crear un cliente por defecto para cada empresa existente
INSERT INTO public.clients (
    company_id,
    business_name,
    rut,
    contact_email,
    contact_name,
    industry,
    status,
    notes
)
SELECT
    id as company_id,
    business_name,
    rut,
    contact_email,
    'Contacto Principal' as contact_name,
    'Sin especificar' as industry,
    'active' as status,
    'Cliente migrado automáticamente del sistema anterior' as notes
FROM public.companies;

-- Actualizar las deudas para que referencien al cliente por defecto de cada empresa
UPDATE public.debts
SET client_id = clients.id
FROM public.clients
WHERE public.debts.company_id = public.clients.company_id;

-- Hacer client_id NOT NULL después de la migración
-- ALTER TABLE public.debts ALTER COLUMN client_id SET NOT NULL;

-- =============================================
-- RECREAR TABLA USERS CON PASSWORD
-- =============================================
-- Si hay problemas con ALTER TABLE, ejecuta esto para recrear la tabla:
-- DROP TABLE IF EXISTS public.users CASCADE;
-- Luego ejecuta la definición completa de la tabla users de arriba

-- =============================================
-- FIN DEL ESQUEMA
-- =============================================
