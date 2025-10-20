-- =============================================
-- TABLA: clients
-- Clientes de las empresas de cobranza
-- =============================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_name VARCHAR(255),
    industry VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    corporate_client_id UUID REFERENCES public.corporate_clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_business_name ON public.clients(business_name);
CREATE INDEX idx_clients_rut ON public.clients(rut);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_corporate_client_id ON public.clients(corporate_client_id);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

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

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();