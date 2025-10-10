-- ===========================================
-- INSTRUCCIONES PARA CREAR TABLAS EN SUPABASE
-- ===========================================
--
-- Copia y pega este SQL en el SQL Editor de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/[tu-project]/sql
--
-- ===========================================

-- Tabla de campañas de mensajes
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL DEFAULT 'bulk_message',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    recipient_filters JSONB DEFAULT '{}',
    total_recipients INTEGER DEFAULT 0,
    corporate_client_id UUID REFERENCES clients(id),
    subject VARCHAR(255),
    message_content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    offer_config JSONB DEFAULT '{}',
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    responded_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de destinatarios de campañas
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    debtor_id VARCHAR(255) NOT NULL,
    debtor_name VARCHAR(255),
    debtor_email VARCHAR(255),
    debtor_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    debt_reference JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, debtor_id)
);

-- Tabla de respuestas a campañas
CREATE TABLE IF NOT EXISTS campaign_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    response_type VARCHAR(50) NOT NULL,
    response_content TEXT,
    response_metadata JSONB DEFAULT '{}',
    conversion_type VARCHAR(50),
    conversion_value DECIMAL(15,2),
    conversion_reference UUID,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas de analytics avanzadas
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(50),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily',
    dimensions JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, metric_type, period_start, period_end)
);

-- Tabla de historial detallado de comisiones
CREATE TABLE IF NOT EXISTS commission_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    nexupay_commission_rate DECIMAL(5,2),
    nexupay_commission_type VARCHAR(20) DEFAULT 'percentage',
    nexupay_commission_amount DECIMAL(15,2),
    user_incentive_rate DECIMAL(5,2),
    user_incentive_type VARCHAR(20) DEFAULT 'percentage',
    user_incentive_amount DECIMAL(15,2),
    total_commission DECIMAL(15,2),
    operational_costs DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'calculated',
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de intervenciones de IA
CREATE TABLE IF NOT EXISTS ai_interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    intervention_type VARCHAR(100) NOT NULL,
    trigger_event VARCHAR(100),
    context_data JSONB DEFAULT '{}',
    debtor_id UUID,
    campaign_id UUID REFERENCES campaigns(id),
    ai_response JSONB DEFAULT '{}',
    human_override BOOLEAN DEFAULT FALSE,
    human_response JSONB DEFAULT '{}',
    effectiveness_score INTEGER,
    conversion_result VARCHAR(50),
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

-- Políticas RLS
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas automáticamente
CREATE TRIGGER trigger_update_campaign_metrics
    AFTER INSERT OR UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();

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