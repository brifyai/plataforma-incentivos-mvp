-- =============================================
-- NEXUPAY: SISTEMA UNIFICADO DE CAMPAÑAS INTELIGENTES
-- Migración: Estructuras para IA, Filtrado Jerárquico y Comunicación Segura
-- =============================================

-- =============================================
-- NUEVOS TIPOS ENUMERADOS
-- =============================================

-- Nivel de confianza de empresas
CREATE TYPE trust_level AS ENUM ('verified', 'regulated', 'certified', 'premium');

-- Estado de campaña
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');

-- Tipo de filtro jerárquico
CREATE TYPE filter_type AS ENUM ('corporate', 'segment', 'debtor_profile', 'debt_characteristics', 'geographic', 'demographic');

-- Estado de mensaje seguro
CREATE TYPE secure_message_status AS ENUM ('sent', 'delivered', 'read', 'replied', 'expired');

-- Proveedores de IA
CREATE TYPE ai_provider AS ENUM ('groq', 'chutes');

-- =============================================
-- TABLA: corporate_clients
-- Clientes corporativos de las empresas de cobranza
-- =============================================
CREATE TABLE public.corporate_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    segment_count INTEGER DEFAULT 0,
    debtor_count INTEGER DEFAULT 0,
    total_debt_amount DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Índices para corporate_clients
CREATE INDEX idx_corporate_clients_company_id ON public.corporate_clients(company_id);
CREATE INDEX idx_corporate_clients_name ON public.corporate_clients(name);
CREATE INDEX idx_corporate_clients_is_active ON public.corporate_clients(is_active);

-- =============================================
-- TABLA: corporate_segments
-- Segmentos dentro de clientes corporativos
-- =============================================
CREATE TABLE public.corporate_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_client_id UUID NOT NULL REFERENCES public.corporate_clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB, -- Criterios de segmentación flexibles
    debtor_count INTEGER DEFAULT 0,
    total_debt_amount DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para corporate_segments
CREATE INDEX idx_corporate_segments_corporate_client_id ON public.corporate_segments(corporate_client_id);
CREATE INDEX idx_corporate_segments_name ON public.corporate_segments(name);
CREATE INDEX idx_corporate_segments_is_active ON public.corporate_segments(is_active);

-- =============================================
-- TABLA: debtor_corporate_assignment
-- Asignación de deudores a clientes corporativos y segmentos
-- =============================================
CREATE TABLE public.debtor_corporate_assignment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    corporate_client_id UUID NOT NULL REFERENCES public.corporate_clients(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.corporate_segments(id) ON DELETE SET NULL,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id), -- Usuario de la empresa que hizo la asignación
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(debtor_id, corporate_client_id)
);

-- Índices para debtor_corporate_assignment
CREATE INDEX idx_debtor_corporate_assignment_debtor_id ON public.debtor_corporate_assignment(debtor_id);
CREATE INDEX idx_debtor_corporate_assignment_corporate_client_id ON public.debtor_corporate_assignment(corporate_client_id);
CREATE INDEX idx_debtor_corporate_assignment_segment_id ON public.debtor_corporate_assignment(segment_id);
CREATE INDEX idx_debtor_corporate_assignment_is_active ON public.debtor_corporate_assignment(is_active);

-- =============================================
-- TABLA: campaigns
-- Campañas de ofertas masivas con IA
-- =============================================
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status campaign_status DEFAULT 'draft',
    config JSONB NOT NULL, -- Configuración completa de la campaña
    target_filters JSONB, -- Filtros jerárquicos aplicados
    offer_template JSONB NOT NULL, -- Template de oferta base
    ai_config JSONB, -- Configuración de IA
    communication_config JSONB, -- Configuración de comunicación
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_reach INTEGER,
    actual_reach INTEGER DEFAULT 0,
    conversion_goal DECIMAL(5, 2), -- Porcentaje esperado de conversión
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para campaigns
CREATE INDEX idx_campaigns_company_id ON public.campaigns(company_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON public.campaigns(scheduled_at);
CREATE INDEX idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- =============================================
-- TABLA: campaign_filters
-- Filtros aplicados en cada campaña
-- =============================================
CREATE TABLE public.campaign_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    filter_type filter_type NOT NULL,
    filter_config JSONB NOT NULL,
    estimated_count INTEGER,
    actual_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para campaign_filters
CREATE INDEX idx_campaign_filters_campaign_id ON public.campaign_filters(campaign_id);
CREATE INDEX idx_campaign_filters_filter_type ON public.campaign_filters(filter_type);

-- =============================================
-- TABLA: campaign_results
-- Resultados detallados de campañas
-- =============================================
CREATE TABLE public.campaign_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_id UUID, -- Referencia al mensaje enviado
    status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed'
    ai_personalization_score DECIMAL(3, 2), -- 0.00 - 1.00
    risk_level VARCHAR(20),
    segment_name VARCHAR(255),
    offer_amount DECIMAL(15, 2),
    conversion_probability DECIMAL(5, 2),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para campaign_results
CREATE INDEX idx_campaign_results_campaign_id ON public.campaign_results(campaign_id);
CREATE INDEX idx_campaign_results_debtor_id ON public.campaign_results(debtor_id);
CREATE INDEX idx_campaign_results_status ON public.campaign_results(status);
CREATE INDEX idx_campaign_results_sent_at ON public.campaign_results(sent_at);

-- =============================================
-- TABLA: secure_messages
-- Mensajes seguros con tokens temporales
-- =============================================
CREATE TABLE public.secure_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB, -- Información adicional (segmento, riesgo, etc.)
    status secure_message_status DEFAULT 'sent',
    token_hash VARCHAR(255) UNIQUE, -- Hash del token JWT
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para secure_messages
CREATE INDEX idx_secure_messages_campaign_id ON public.secure_messages(campaign_id);
CREATE INDEX idx_secure_messages_company_id ON public.secure_messages(company_id);
CREATE INDEX idx_secure_messages_debtor_id ON public.secure_messages(debtor_id);
CREATE INDEX idx_secure_messages_token_hash ON public.secure_messages(token_hash);
CREATE INDEX idx_secure_messages_status ON public.secure_messages(status);
CREATE INDEX idx_secure_messages_expires_at ON public.secure_messages(expires_at);

-- =============================================
-- TABLA: ai_usage_logs
-- Logs de uso de APIs de IA
-- =============================================
CREATE TABLE public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider ai_provider NOT NULL,
    model VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    tokens_used INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    request_metadata JSONB,
    response_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ai_usage_logs
CREATE INDEX idx_ai_usage_logs_provider ON public.ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_campaign_id ON public.ai_usage_logs(campaign_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);

-- =============================================
-- TABLA: ai_model_performance
-- Métricas de rendimiento de modelos IA
-- =============================================
CREATE TABLE public.ai_model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider ai_provider NOT NULL,
    model VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    accuracy DECIMAL(5, 4), -- 0.0000 - 1.0000
    precision DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    avg_response_time_ms INTEGER,
    cost_per_token_usd DECIMAL(10, 6),
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, model, task_type)
);

-- Índices para ai_model_performance
CREATE INDEX idx_ai_model_performance_provider ON public.ai_model_performance(provider);
CREATE INDEX idx_ai_model_performance_task_type ON public.ai_model_performance(task_type);

-- =============================================
-- TABLA: system_config
-- Configuración del sistema (APIs, límites, etc.)
-- =============================================
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para system_config
CREATE INDEX idx_system_config_config_key ON public.system_config(config_key);

-- =============================================
-- EXTENSIONES A TABLAS EXISTENTES
-- =============================================

-- Agregar campos de IA y jerarquía a companies
ALTER TABLE public.companies
ADD COLUMN trust_level trust_level DEFAULT 'verified',
ADD COLUMN ai_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_config JSONB,
ADD COLUMN corporate_clients_count INTEGER DEFAULT 0,
ADD COLUMN campaigns_count INTEGER DEFAULT 0;

-- Agregar campos de segmentación a debts
ALTER TABLE public.debts
ADD COLUMN risk_level VARCHAR(20) DEFAULT 'medium',
ADD COLUMN segment_tags TEXT[],
ADD COLUMN ai_score DECIMAL(3, 2), -- 0.00 - 1.00
ADD COLUMN last_ai_analysis TIMESTAMP WITH TIME ZONE;

-- Agregar campos de IA a users (debtors)
ALTER TABLE public.users
ADD COLUMN ai_profile JSONB, -- Perfil de comportamiento generado por IA
ADD COLUMN risk_score DECIMAL(3, 2) DEFAULT 0.5,
ADD COLUMN segment_tags TEXT[],
ADD COLUMN last_campaign_contact TIMESTAMP WITH TIME ZONE;

-- =============================================
-- FUNCIONES DE UTILIDAD PARA IA
-- =============================================

-- Función para calcular estadísticas de campaña
CREATE OR REPLACE FUNCTION calculate_campaign_stats(campaign_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_sent', COUNT(*),
        'delivered', COUNT(*) FILTER (WHERE status IN ('delivered', 'read', 'replied')),
        'opened', COUNT(*) FILTER (WHERE status IN ('read', 'replied')),
        'converted', COUNT(*) FILTER (WHERE status = 'converted'),
        'conversion_rate', ROUND(
            (COUNT(*) FILTER (WHERE status = 'converted'))::DECIMAL /
            NULLIF(COUNT(*), 0) * 100, 2
        )
    )
    INTO result
    FROM public.campaign_results
    WHERE campaign_id = campaign_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas de IA
CREATE OR REPLACE FUNCTION get_ai_metrics(provider_name ai_provider, days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'successful_requests', COUNT(*) FILTER (WHERE success = TRUE),
        'total_tokens', SUM(tokens_used),
        'total_cost', SUM(cost_usd),
        'avg_response_time', ROUND(AVG(response_time_ms)),
        'success_rate', ROUND(
            (COUNT(*) FILTER (WHERE success = TRUE))::DECIMAL /
            NULLIF(COUNT(*), 0) * 100, 2
        )
    )
    INTO result
    FROM public.ai_usage_logs
    WHERE provider = provider_name
    AND created_at >= NOW() - INTERVAL '1 day' * days;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY PARA NUEVAS TABLAS
-- =============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtor_corporate_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Políticas para corporate_clients
CREATE POLICY "Companies can manage their corporate clients" ON public.corporate_clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = corporate_clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para campaigns
CREATE POLICY "Companies can manage their campaigns" ON public.campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = campaigns.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para secure_messages
CREATE POLICY "Companies can view messages from their campaigns" ON public.secure_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = secure_messages.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Debtors can view their secure messages" ON public.secure_messages
    FOR SELECT USING (auth.uid() = debtor_id);

-- Políticas para ai_usage_logs (solo admins)
CREATE POLICY "Only admins can view AI usage logs" ON public.ai_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Políticas para system_config (solo admins)
CREATE POLICY "Only admins can manage system config" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON public.corporate_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_segments_updated_at BEFORE UPDATE ON public.corporate_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Configuración inicial de APIs de IA
INSERT INTO public.system_config (config_key, config_value, description) VALUES
('ai_providers', '{
  "groq": {
    "enabled": true,
    "api_key": null,
    "models": ["llama-3.1-70b", "llama-3.1-8b", "mixtral-8x7b"],
    "limits": {"daily_cost": 50, "monthly_cost": 1000}
  },
  "chutes": {
    "enabled": false,
    "api_key": null,
    "models": ["chutes-dobby", "chutes-elf"],
    "limits": {"daily_cost": 50, "monthly_cost": 1000}
  }
}', 'Configuración de proveedores de IA disponibles'),

('ai_task_mapping', '{
  "segmentation": "groq.llama-3.1-70b",
  "personalization": "chutes.chutes-dobby",
  "optimization": "groq.llama-3.1-70b",
  "content_generation": "chutes.chutes-dobby"
}', 'Mapeo de tareas a modelos de IA óptimos'),

('campaign_limits', '{
  "max_debtors_per_campaign": 50000,
  "max_emails_per_hour": 1000,
  "min_campaign_interval_hours": 24,
  "max_active_campaigns_per_company": 5
}', 'Límites de seguridad para campañas');

-- Datos iniciales de performance de modelos IA
INSERT INTO public.ai_model_performance (provider, model, task_type, accuracy, precision, recall, f1_score, avg_response_time_ms, cost_per_token_usd) VALUES
('groq', 'llama-3.1-70b', 'segmentation', 0.89, 0.87, 0.91, 0.89, 1200, 0.001),
('groq', 'llama-3.1-8b', 'classification', 0.82, 0.80, 0.84, 0.82, 800, 0.0005),
('chutes', 'chutes-dobby', 'content_generation', 0.88, 0.86, 0.90, 0.88, 1000, 0.0008);

-- =============================================
-- FIN DE LA MIGRACIÓN UNIFICADA
-- =============================================