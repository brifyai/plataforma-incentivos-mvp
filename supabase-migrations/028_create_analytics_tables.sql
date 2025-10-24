-- Migration: Create analytics and related tables
-- Description: Creates missing tables for analytics functionality

-- Create analytics_metrics table
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('revenue', 'payments', 'campaigns', 'conversions', 'engagement')),
    metric_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    comparison_value DECIMAL(15,2) DEFAULT 0,
    change_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debtor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50) DEFAULT 'transfer',
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) DEFAULT 'email' CHECK (campaign_type IN ('email', 'sms', 'whatsapp', 'mixed')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    responded_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
    agreement_type VARCHAR(50) DEFAULT 'payment_plan' CHECK (agreement_type IN ('payment_plan', 'settlement', 'reduction', 'extension')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'breached')),
    original_amount DECIMAL(15,2) NOT NULL,
    agreed_amount DECIMAL(15,2) NOT NULL,
    payment_count INTEGER DEFAULT 0,
    completed_payments INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terms JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_company_id ON public.analytics_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period_end ON public.analytics_metrics(period_end DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON public.analytics_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON public.payments(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_debtor_id ON public.payments(debtor_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON public.campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agreements_company_id ON public.agreements(company_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_debtor_id ON public.agreements(debtor_id);
CREATE INDEX IF NOT EXISTS idx_agreements_created_at ON public.agreements(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_metrics
CREATE POLICY "Companies can view their own analytics metrics" ON public.analytics_metrics
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can insert their own analytics metrics" ON public.analytics_metrics
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Policies for payments
CREATE POLICY "Companies can view their own payments" ON public.payments
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Policies for campaigns
CREATE POLICY "Companies can view their own campaigns" ON public.campaigns
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can manage their own campaigns" ON public.campaigns
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Policies for agreements
CREATE POLICY "Companies can view their own agreements" ON public.agreements
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can manage their own agreements" ON public.agreements
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER handle_analytics_metrics_updated_at
    BEFORE UPDATE ON public.analytics_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_agreements_updated_at
    BEFORE UPDATE ON public.agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data for empresa@nexupay.cl
-- Get the company ID for empresa user
DO $$
DECLARE
    empresa_company_id UUID;
BEGIN
    SELECT id INTO empresa_company_id FROM public.companies WHERE user_id = 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b';
    
    IF empresa_company_id IS NOT NULL THEN
        -- Insert sample analytics metrics
        INSERT INTO public.analytics_metrics (company_id, period_start, period_end, metric_type, metric_value, comparison_value, change_percentage)
        VALUES 
            (empresa_company_id, '2025-10-01'::TIMESTAMP, '2025-10-07'::TIMESTAMP, 'revenue', 150000.00, 120000.00, 25.00),
            (empresa_company_id, '2025-10-01'::TIMESTAMP, '2025-10-07'::TIMESTAMP, 'payments', 45, 38, 18.42),
            (empresa_company_id, '2025-10-01'::TIMESTAMP, '2025-10-07'::TIMESTAMP, 'campaigns', 3, 2, 50.00),
            (empresa_company_id, '2025-10-01'::TIMESTAMP, '2025-10-07'::TIMESTAMP, 'conversions', 12, 8, 50.00);
        
        -- Insert sample payments
        INSERT INTO public.payments (company_id, amount, transaction_date, status, payment_method)
        VALUES 
            (empresa_company_id, 25000.00, '2025-10-15'::TIMESTAMP, 'completed', 'transfer'),
            (empresa_company_id, 15000.00, '2025-10-14'::TIMESTAMP, 'completed', 'transfer'),
            (empresa_company_id, 8000.00, '2025-10-13'::TIMESTAMP, 'completed', 'transfer'),
            (empresa_company_id, 12000.00, '2025-10-12'::TIMESTAMP, 'completed', 'transfer'),
            (empresa_company_id, 5000.00, '2025-10-11'::TIMESTAMP, 'pending', 'transfer');
        
        -- Insert sample campaigns
        INSERT INTO public.campaigns (company_id, name, description, campaign_type, status, sent_count, opened_count, responded_count, converted_count, start_date, end_date)
        VALUES 
            (empresa_company_id, 'Campaña Recuperación Octubre', 'Campaña de recuperación de deudores morosos', 'email', 'completed', 150, 120, 45, 12, '2025-10-01'::TIMESTAMP, '2025-10-15'::TIMESTAMP),
            (empresa_company_id, 'Nuevos Convenios', 'Oferta de convenios de pago', 'mixed', 'active', 80, 65, 25, 8, '2025-10-10'::TIMESTAMP, '2025-10-25'::TIMESTAMP),
            (empresa_company_id, 'Recordatorio Pagos', 'Recordatorios automáticos de pago', 'email', 'completed', 200, 180, 60, 15, '2025-09-15'::TIMESTAMP, '2025-09-30'::TIMESTAMP);
        
        -- Insert sample agreements
        INSERT INTO public.agreements (company_id, debtor_id, agreement_type, status, original_amount, agreed_amount, payment_count, completed_payments, start_date, end_date)
        VALUES 
            (empresa_company_id, 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'payment_plan', 'active', 50000.00, 45000.00, 6, 2, '2025-10-01'::TIMESTAMP, '2026-03-01'::TIMESTAMP),
            (empresa_company_id, 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'settlement', 'completed', 30000.00, 24000.00, 1, 1, '2025-09-15'::TIMESTAMP, '2025-09-15'::TIMESTAMP),
            (empresa_company_id, 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'reduction', 'active', 25000.00, 20000.00, 3, 1, '2025-10-10'::TIMESTAMP, '2025-12-10'::TIMESTAMP);
    END IF;
END $$;