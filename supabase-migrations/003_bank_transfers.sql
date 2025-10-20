-- =============================================
-- PLATAFORMA DE INCENTIVOS - SISTEMA DE TRANSFERENCIAS BANCARIAS
-- Migración: Sistema de Transferencias Automáticas
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS PARA TRANSFERENCIAS
-- =============================================

-- Estado de transferencia bancaria
CREATE TYPE transfer_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Tipo de transferencia
CREATE TYPE transfer_type AS ENUM ('payment_settlement', 'commission_payment', 'bulk_transfer');

-- Método de transferencia
CREATE TYPE transfer_method AS ENUM ('mercadopago_transfer', 'bank_transfer', 'wire_transfer');

-- =============================================
-- TABLA: transfer_batches
-- Lotes de transferencias para procesamiento masivo
-- =============================================
CREATE TABLE public.transfer_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_transfers INTEGER NOT NULL DEFAULT 0,
    status transfer_status DEFAULT 'pending',
    transfer_method transfer_method DEFAULT 'mercadopago_transfer',
    created_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfer_batches_status ON public.transfer_batches(status);
CREATE INDEX idx_transfer_batches_created_at ON public.transfer_batches(created_at DESC);
CREATE INDEX idx_transfer_batches_created_by ON public.transfer_batches(created_by);

-- =============================================
-- TABLA: transfer_batch_items
-- Items individuales dentro de un lote de transferencias
-- =============================================
CREATE TABLE public.transfer_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.transfer_batches(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transfer_status transfer_status DEFAULT 'pending',
    mercadopago_beneficiary_id VARCHAR(255),
    bank_account_info JSONB,
    transfer_reference VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfer_batch_items_batch_id ON public.transfer_batch_items(batch_id);
CREATE INDEX idx_transfer_batch_items_company_id ON public.transfer_batch_items(company_id);
CREATE INDEX idx_transfer_batch_items_status ON public.transfer_batch_items(transfer_status);
CREATE INDEX idx_transfer_batch_items_payment_id ON public.transfer_batch_items(payment_id);

-- =============================================
-- TABLA: payment_receipts
-- Comprobantes de pago subidos por usuarios
-- =============================================
CREATE TABLE public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    validation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES public.users(id),
    validation_notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_receipts_payment_id ON public.payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX idx_payment_receipts_company_id ON public.payment_receipts(company_id);
CREATE INDEX idx_payment_receipts_validation_status ON public.payment_receipts(validation_status);

-- =============================================
-- FUNCIONES PARA AUTOMATIZACIÓN
-- =============================================

-- Función para actualizar el total del lote cuando se agregan items
CREATE OR REPLACE FUNCTION update_batch_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.transfer_batches
        SET
            total_amount = total_amount + NEW.amount,
            total_transfers = total_transfers + 1,
            updated_at = NOW()
        WHERE id = NEW.batch_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.transfer_batches
        SET
            total_amount = total_amount - OLD.amount,
            total_transfers = total_transfers - 1,
            updated_at = NOW()
        WHERE id = OLD.batch_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.amount != NEW.amount THEN
            UPDATE public.transfer_batches
            SET
                total_amount = total_amount - OLD.amount + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.batch_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.transfer_batch_items
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_totals();

-- Función para crear transferencias automáticas después de un pago exitoso
CREATE OR REPLACE FUNCTION create_automatic_transfer()
RETURNS TRIGGER AS $$
DECLARE
    v_company RECORD;
    v_batch_id UUID;
BEGIN
    -- Solo procesar pagos completados
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Obtener información de la empresa
        SELECT * INTO v_company
        FROM public.companies
        WHERE id = NEW.company_id;

        -- Solo crear transferencia si la empresa tiene datos bancarios
        IF v_company.bank_account_info IS NOT NULL OR v_company.mercadopago_beneficiary_id IS NOT NULL THEN
            -- Crear lote de transferencia automática
            INSERT INTO public.transfer_batches (
                batch_name,
                description,
                transfer_method,
                created_by
            ) VALUES (
                'Pago automático - ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
                'Transferencia automática por pago completado',
                CASE
                    WHEN v_company.mercadopago_beneficiary_id IS NOT NULL THEN 'mercadopago_transfer'::transfer_method
                    ELSE 'bank_transfer'::transfer_method
                END,
                NEW.user_id
            ) RETURNING id INTO v_batch_id;

            -- Crear item de transferencia
            INSERT INTO public.transfer_batch_items (
                batch_id,
                company_id,
                payment_id,
                amount,
                mercadopago_beneficiary_id,
                bank_account_info,
                transfer_reference
            ) VALUES (
                v_batch_id,
                NEW.company_id,
                NEW.id,
                NEW.amount,
                v_company.mercadopago_beneficiary_id,
                v_company.bank_account_info,
                'PAY-' || NEW.id::text
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_automatic_transfer
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION create_automatic_transfer();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS
ALTER TABLE public.transfer_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas para transfer_batches
CREATE POLICY "Companies can view their transfer batches" ON public.transfer_batches
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id IN (
                SELECT company_id FROM public.transfer_batch_items
                WHERE batch_id = transfer_batches.id
            ) AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can create transfer batches" ON public.transfer_batches
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Companies can update their transfer batches" ON public.transfer_batches
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id IN (
                SELECT company_id FROM public.transfer_batch_items
                WHERE batch_id = transfer_batches.id
            ) AND companies.user_id = auth.uid()
        )
    );

-- Políticas para transfer_batch_items
CREATE POLICY "Companies can view their transfer items" ON public.transfer_batch_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = transfer_batch_items.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can update their transfer items" ON public.transfer_batch_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = transfer_batch_items.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para payment_receipts
CREATE POLICY "Users can view their payment receipts" ON public.payment_receipts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create payment receipts" ON public.payment_receipts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Companies can view receipts for their payments" ON public.payment_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = payment_receipts.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can update receipt validation" ON public.payment_receipts
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

CREATE TRIGGER update_transfer_batches_updated_at BEFORE UPDATE ON public.transfer_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_batch_items_updated_at BEFORE UPDATE ON public.transfer_batch_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_receipts_updated_at BEFORE UPDATE ON public.payment_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE EJEMPLO (DESCOMENTAR PARA DESARROLLO)
-- =============================================

/*
-- Insertar lote de ejemplo
INSERT INTO public.transfer_batches (batch_name, description, total_amount, total_transfers, status)
VALUES ('Lote de Prueba - Enero 2024', 'Transferencias de prueba', 150000, 3, 'pending');

-- Insertar items de ejemplo (requiere IDs válidos de companies y payments)
-- INSERT INTO public.transfer_batch_items (batch_id, company_id, payment_id, amount, transfer_status)
-- VALUES ('batch-id', 'company-id', 'payment-id', 50000, 'pending');
*/

-- =============================================
-- FIN DE LA MIGRACIÓN DE TRANSFERENCIAS BANCARIAS
-- =============================================