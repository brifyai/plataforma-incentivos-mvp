-- ===========================================
-- MIGRACIÓN: Crear tablas para sistema de campañas y reportes
-- Fecha: 2025-01-09
-- ===========================================

-- Tabla de campañas de mensajes
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL DEFAULT 'bulk_message', -- bulk_message, offer_campaign, reminder_campaign
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Configuración de destinatarios
    recipient_filters JSONB DEFAULT '{}', -- Filtros aplicados para seleccionar destinatarios
    total_recipients INTEGER DEFAULT 0,
    corporate_client_id UUID REFERENCES clients(id), -- Si es para un cliente corporativo específico

    -- Contenido del mensaje
    subject VARCHAR(255),
    message_content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high

    -- Configuración de oferta (si aplica)
    offer_config JSONB DEFAULT '{}', -- { discount: number, installmentPlan: boolean, totalInstallments: number }

    -- Métricas calculadas
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    responded_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,

    -- Metadatos
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de destinatarios de campañas
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL, -- ID del deudor (no FK porque puede ser de diferentes tablas)
    debtor_name VARCHAR(255),
    debtor_email VARCHAR(255),
    debtor_phone VARCHAR(50),

    -- Estado de envío
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, responded, converted, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,

    -- Información adicional
    debt_reference JSONB DEFAULT '[]', -- Array de deudas relacionadas
    metadata JSONB DEFAULT '{}', -- Información adicional del destinatario

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(campaign_id, debtor_id)
);

-- Tabla de respuestas a campañas
CREATE TABLE IF NOT EXISTS campaign_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,

    response_type VARCHAR(50) NOT NULL, -- email_reply, phone_call, payment_made, offer_accepted, etc.
    response_content TEXT,
    response_metadata JSONB DEFAULT '{}',

    -- Si generó conversión
    conversion_type VARCHAR(50), -- payment, agreement, etc.
    conversion_value DECIMAL(15,2), -- Monto de la conversión si aplica
    conversion_reference UUID, -- ID de la transacción/acuerdo generado

    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas de analytics avanzadas
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- recovery_rate, avg_payment_time, client_satisfaction, etc.
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(50), -- percentage, days, currency, count
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly, yearly

    -- Dimensiones para segmentación
    dimensions JSONB DEFAULT '{}', -- { client_type: 'corporate', debt_range: '10000-50000', etc. }

    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, metric_type, period_start, period_end)
);

-- Tabla de historial detallado de comisiones
CREATE TABLE IF NOT EXISTS commission_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id), -- Referencia al pago que generó la comisión

    -- Información del pago
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Cálculo de comisiones
    nexupay_commission_rate DECIMAL(5,2), -- Tasa aplicada (ej: 15.00 para 15%)
    nexupay_commission_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
    nexupay_commission_amount DECIMAL(15,2), -- Monto calculado para NexuPay

    user_incentive_rate DECIMAL(5,2), -- Tasa de incentivo al usuario
    user_incentive_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
    user_incentive_amount DECIMAL(15,2), -- Monto del incentivo

    -- Distribución final
    total_commission DECIMAL(15,2), -- Suma total de comisiones
    operational_costs DECIMAL(15,2) DEFAULT 0, -- Costos operativos deducidos

    -- Estado y procesamiento
    status VARCHAR(50) DEFAULT 'calculated', -- calculated, paid, pending
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de intervenciones de IA
CREATE TABLE IF NOT EXISTS ai_interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    intervention_type VARCHAR(100) NOT NULL, -- message_draft, offer_suggestion, risk_assessment, etc.
    trigger_event VARCHAR(100), -- payment_overdue, high_risk_debtor, campaign_response, etc.

    -- Contexto de la intervención
    context_data JSONB DEFAULT '{}', -- Datos del contexto que activó la intervención
    debtor_id UUID, -- ID del deudor afectado (si aplica)
    campaign_id UUID REFERENCES campaigns(id), -- Campaña relacionada (si aplica)

    -- Resultado de la intervención
    ai_response JSONB DEFAULT '{}', -- Respuesta generada por IA
    human_override BOOLEAN DEFAULT FALSE, -- Si un humano intervino
    human_response JSONB DEFAULT '{}', -- Respuesta del humano si aplicó

    -- Métricas de efectividad
    effectiveness_score INTEGER, -- 1-10, qué tan efectiva fue la intervención
    conversion_result VARCHAR(50), -- none, payment_made, agreement_signed, etc.

    intervened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_debtor_id ON campaign_recipients(debtor_id);

CREATE INDEX IF NOT EXISTS idx_campaign_responses_campaign_id ON campaign_responses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_responses_recipient_id ON campaign_responses(recipient_id);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_company_id ON analytics_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type_period ON analytics_metrics(metric_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_commission_history_company_id ON commission_history(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_payment_date ON commission_history(payment_date);

CREATE INDEX IF NOT EXISTS idx_ai_interventions_company_id ON ai_interventions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_type ON ai_interventions(intervention_type);

-- Políticas RLS (Row Level Security)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interventions ENABLE ROW LEVEL SECURITY;

-- Políticas para campaigns
CREATE POLICY "Users can view campaigns from their company" ON campaigns
    FOR SELECT USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create campaigns for their company" ON campaigns
    FOR INSERT WITH CHECK (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update campaigns from their company" ON campaigns
    FOR UPDATE USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

-- Políticas para campaign_recipients
CREATE POLICY "Users can view recipients from their company campaigns" ON campaign_recipients
    FOR SELECT USING (campaign_id IN (
        SELECT id FROM campaigns WHERE company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    ));

-- Políticas para analytics_metrics
CREATE POLICY "Users can view analytics from their company" ON analytics_metrics
    FOR SELECT USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

-- Políticas para commission_history
CREATE POLICY "Users can view commission history from their company" ON commission_history
    FOR SELECT USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

-- Políticas para ai_interventions
CREATE POLICY "Users can view AI interventions from their company" ON ai_interventions
    FOR SELECT USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

-- Función para actualizar métricas de campaña automáticamente
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar métricas de la campaña cuando cambian los destinatarios
    IF TG_TABLE_NAME = 'campaign_recipients' THEN
        UPDATE campaigns
        SET
            sent_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered', 'opened', 'clicked', 'responded', 'converted')),
            delivered_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('delivered', 'opened', 'clicked', 'responded', 'converted')),
            opened_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('opened', 'clicked', 'responded', 'converted')),
            clicked_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('clicked', 'responded', 'converted')),
            responded_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('responded', 'converted')),
            converted_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
            updated_at = NOW()
        WHERE id = NEW.campaign_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas automáticamente
CREATE TRIGGER trigger_update_campaign_metrics
    AFTER INSERT OR UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();

-- Función para calcular métricas de analytics automáticamente
CREATE OR REPLACE FUNCTION calculate_analytics_metrics()
RETURNS void AS $$
DECLARE
    company_record RECORD;
    metric_date DATE := CURRENT_DATE;
BEGIN
    -- Para cada empresa activa
    FOR company_record IN SELECT id FROM companies WHERE created_at IS NOT NULL LOOP
        -- Tasa de recuperación (últimos 30 días)
        INSERT INTO analytics_metrics (company_id, metric_type, metric_value, metric_unit, period_start, period_end, period_type)
        SELECT
            company_record.id,
            'recovery_rate',
            CASE
                WHEN SUM(d.current_amount) > 0
                THEN (SUM(p.amount) / SUM(d.current_amount)) * 100
                ELSE 0
            END,
            'percentage',
            metric_date - INTERVAL '30 days',
            metric_date,
            'monthly'
        FROM debts d
        LEFT JOIN payments p ON p.company_id = company_record.id
            AND p.transaction_date >= metric_date - INTERVAL '30 days'
            AND p.status = 'completed'
        WHERE d.company_id = company_record.id
        ON CONFLICT (company_id, metric_type, period_start, period_end)
        DO UPDATE SET
            metric_value = EXCLUDED.metric_value,
            calculated_at = NOW();

        -- Tiempo promedio de pago (últimos 30 días)
        INSERT INTO analytics_metrics (company_id, metric_type, metric_value, metric_unit, period_start, period_end, period_type)
        SELECT
            company_record.id,
            'avg_payment_time',
            AVG(EXTRACT(EPOCH FROM (p.transaction_date - d.created_at))/86400),
            'days',
            metric_date - INTERVAL '30 days',
            metric_date,
            'monthly'
        FROM payments p
        JOIN debts d ON d.id = p.debt_id
        WHERE p.company_id = company_record.id
            AND p.transaction_date >= metric_date - INTERVAL '30 days'
            AND p.status = 'completed'
        ON CONFLICT (company_id, metric_type, period_start, period_end)
        DO UPDATE SET
            metric_value = EXCLUDED.metric_value,
            calculated_at = NOW();

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insertar algunos datos de ejemplo para testing
INSERT INTO campaigns (company_id, title, description, campaign_type, status, total_recipients, subject, message_content, created_by)
SELECT
    c.id,
    'Campaña de Bienvenida',
    'Mensaje de bienvenida para nuevos deudores',
    'bulk_message',
    'completed',
    5,
    'Bienvenido a NexuPay',
    '¡Hola! Te damos la bienvenida a nuestra plataforma de gestión de deudas.',
    c.user_id
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE company_id = c.id)
LIMIT 1;

-- Comentarios finales
COMMENT ON TABLE campaigns IS 'Campañas de mensajes y ofertas enviadas por empresas';
COMMENT ON TABLE campaign_recipients IS 'Destinatarios de cada campaña con métricas individuales';
COMMENT ON TABLE campaign_responses IS 'Respuestas y conversiones generadas por campañas';
COMMENT ON TABLE analytics_metrics IS 'Métricas calculadas de analytics por empresa y período';
COMMENT ON TABLE commission_history IS 'Historial detallado de comisiones calculadas y pagadas';
COMMENT ON TABLE ai_interventions IS 'Registro de intervenciones realizadas por IA y humanos';