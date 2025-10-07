-- Crear tablas faltantes para completar la funcionalidad
-- Ejecutar esta migración para agregar las tablas clients y payment_receipts

-- =============================================
-- TABLA: clients
-- Clientes/Deudores de las empresas de cobranza
-- =============================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Usuario registrado (opcional)
    business_name VARCHAR(255), -- Nombre de empresa del cliente
    rut VARCHAR(12) NOT NULL,
    contact_name VARCHAR(255), -- Nombre del contacto
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    business_sector VARCHAR(100),
    credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
    total_debt_amount DECIMAL(15, 2) DEFAULT 0.00,
    active_debts_count INTEGER DEFAULT 0,
    last_payment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_rut ON public.clients(rut);
CREATE INDEX idx_clients_business_name ON public.clients(business_name);

-- =============================================
-- TABLA: payment_receipts
-- Recibos de pago subidos por usuarios
-- =============================================
CREATE TABLE public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    receipt_file_url VARCHAR(500) NOT NULL,
    receipt_file_name VARCHAR(255),
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
    validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    amount_claimed DECIMAL(15, 2),
    payment_date DATE,
    payment_method VARCHAR(50),
    debt_reference VARCHAR(100),
    notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payment_receipts
CREATE INDEX idx_payment_receipts_payment_id ON public.payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX idx_payment_receipts_company_id ON public.payment_receipts(company_id);
CREATE INDEX idx_payment_receipts_validation_status ON public.payment_receipts(validation_status);
CREATE INDEX idx_payment_receipts_uploaded_at ON public.payment_receipts(uploaded_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
CREATE POLICY "Companies can view their own clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can manage their own clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para payment_receipts
CREATE POLICY "Users can view their own receipts" ON public.payment_receipts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own receipts" ON public.payment_receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view receipts from their company" ON public.payment_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = payment_receipts.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can validate receipts from their company" ON public.payment_receipts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = payment_receipts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_receipts_updated_at BEFORE UPDATE ON public.payment_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Insertar algunos clientes de prueba para la empresa existente
INSERT INTO public.clients (
    company_id,
    business_name,
    rut,
    contact_name,
    contact_email,
    contact_phone,
    business_sector,
    total_debt_amount,
    active_debts_count
) VALUES (
    (SELECT id FROM public.companies WHERE user_id = '3629a258-f536-42ac-8960-012023212a8e'),
    'Cliente Prueba S.A.',
    '11111111-1',
    'Juan Pérez',
    'juan@cliente.com',
    '+56987654321',
    'Tecnología',
    500000.00,
    2
);
