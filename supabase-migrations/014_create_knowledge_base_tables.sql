-- Migration: Crear tablas para sistema de base de conocimiento de IA
-- Descripción: Tablas para almacenar información personalizada por cliente corporativo
-- Versión: 1.0

-- Extender tabla corporate_clients con información adicional para IA
ALTER TABLE corporate_clients 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Tabla de configuración de IA por cliente corporativo
CREATE TABLE IF NOT EXISTS negotiation_ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Límites de negociación
    max_negotiation_discount INTEGER DEFAULT 15, -- Máximo descuento adicional (%)
    max_negotiation_term INTEGER DEFAULT 12, -- Máximo plazo en meses
    
    -- Umbrales de escalada
    escalation_thresholds JSONB DEFAULT '{
        "conversationLength": 15,
        "discountRequested": 20,
        "timeRequested": 18,
        "frustrationLevel": 0.7
    }'::jsonb,
    
    -- Configuración de operación
    auto_respond BOOLEAN DEFAULT true,
    working_hours JSONB DEFAULT '{
        "start": "09:00",
        "end": "18:00",
        "timezone": "America/Santiago"
    }'::jsonb,
    
    -- Configuración de personalización
    personalization_level TEXT DEFAULT 'high' CHECK (personalization_level IN ('low', 'medium', 'high', 'ultra_high')),
    communication_style TEXT DEFAULT 'professional' CHECK (communication_style IN ('formal', 'professional', 'informal')),
    
    -- Respuestas personalizadas
    custom_welcome_message TEXT,
    custom_goodbye_message TEXT,
    custom_error_message TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraint único por cliente corporativo
    UNIQUE(corporate_client_id, company_id)
);

-- Tabla de políticas específicas por cliente corporativo
CREATE TABLE IF NOT EXISTS corporate_client_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información de la política
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('discount', 'payment_terms', 'escalation', 'communication', 'other')),
    policy_description TEXT,
    
    -- Reglas y condiciones
    policy_rules JSONB DEFAULT '{}'::jsonb,
    conditions JSONB DEFAULT '{}'::jsonb,
    
    -- Prioridad y orden
    priority INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabla de respuestas personalizadas por cliente corporativo
CREATE TABLE IF NOT EXISTS corporate_client_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del trigger y respuesta
    trigger_keyword TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'intent', 'sentiment', 'condition')),
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    
    response_template TEXT NOT NULL,
    response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'template', 'conditional')),
    
    -- Personalización
    use_debtor_name BOOLEAN DEFAULT true,
    use_corporate_name BOOLEAN DEFAULT true,
    use_rut BOOLEAN DEFAULT false,
    
    -- Configuración
    priority INTEGER DEFAULT 0,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabla de base de conocimiento por cliente corporativo
CREATE TABLE IF NOT EXISTS company_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Categorización del conocimiento
    category TEXT NOT NULL,
    subcategory TEXT,
    knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('policy', 'procedure', 'faq', 'template', 'rule', 'other')),
    
    -- Contenido
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_format TEXT DEFAULT 'text' CHECK (content_format IN ('text', 'markdown', 'html', 'json')),
    
    -- Metadatos para IA
    keywords TEXT[] DEFAULT '{}',
    tags JSONB DEFAULT '{}'::jsonb,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Condiciones de uso
    applicable_conditions JSONB DEFAULT '{}'::jsonb,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_reviewed_by UUID REFERENCES auth.users(id),
    last_reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de historial de comportamiento de deudores
CREATE TABLE IF NOT EXISTS debtor_behavior_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Perfil de comportamiento
    communication_style TEXT CHECK (communication_style IN ('formal', 'professional', 'informal')),
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')),
    negotiation_tendency TEXT CHECK (negotiation_tendency IN ('cooperative', 'resistant', 'neutral', 'aggressive')),
    payment_pattern TEXT CHECK (payment_pattern IN ('regular', 'irregular', 'delinquent', 'improving')),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Métricas de comportamiento
    response_time_avg INTEGER, -- Tiempo promedio de respuesta en horas
    negotiation_success_rate DECIMAL(3,2), -- Tasa de éxito en negociaciones
    payment_compliance_rate DECIMAL(3,2), -- Tasa de cumplimiento de pagos
    
    -- Preferencias detectadas
    preferred_terms JSONB DEFAULT '{}'::jsonb,
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadatos
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    data_points_count INTEGER DEFAULT 0,
    confidence_level DECIMAL(3,2) DEFAULT 0.5,
    
    -- Constraint único por usuario y cliente corporativo
    UNIQUE(user_id, corporate_client_id)
);

-- Tabla de interacciones con IA para aprendizaje
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES negotiation_conversations(id) ON DELETE CASCADE,
    message_id UUID,
    
    -- Información de la interacción
    user_id UUID REFERENCES auth.users(id),
    corporate_client_id UUID REFERENCES corporate_clients(id),
    company_id UUID REFERENCES companies(id),
    
    -- Mensajes
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    
    -- Metadatos de IA
    confidence_score DECIMAL(3,2),
    response_type TEXT,
    personalization_level TEXT,
    keywords_detected TEXT[] DEFAULT '{}',
    
    -- Resultados
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    escalation_triggered BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    
    -- Tiempos
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_negotiation_ai_config_corporate_client ON negotiation_ai_config(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_ai_config_company ON negotiation_ai_config(company_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_ai_config_active ON negotiation_ai_config(is_active);

CREATE INDEX IF NOT EXISTS idx_corporate_client_policies_corporate_client ON corporate_client_policies(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_corporate_client_policies_type ON corporate_client_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_corporate_client_policies_active ON corporate_client_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_corporate_client_responses_corporate_client ON corporate_client_responses(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_corporate_client_responses_trigger ON corporate_client_responses(trigger_keyword);
CREATE INDEX IF NOT EXISTS idx_corporate_client_responses_active ON corporate_client_responses(is_active);

CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_corporate_client ON company_knowledge_base(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_category ON company_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_active ON company_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_keywords ON company_knowledge_base USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_debtor_behavior_profile_user ON debtor_behavior_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_debtor_behavior_profile_corporate_client ON debtor_behavior_profile(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_debtor_behavior_profile_risk_level ON debtor_behavior_profile(risk_level);

CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_conversation ON ai_interaction_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_user ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_corporate_client ON ai_interaction_logs(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_created_at ON ai_interaction_logs(created_at);

-- RLS (Row Level Security)
ALTER TABLE negotiation_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_client_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_client_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtor_behavior_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para negotiation_ai_config
CREATE POLICY "Users can view AI config for their companies" ON negotiation_ai_config
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert AI config for their companies" ON negotiation_ai_config
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update AI config for their companies" ON negotiation_ai_config
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para corporate_client_policies
CREATE POLICY "Users can view policies for their companies" ON corporate_client_policies
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage policies for their companies" ON corporate_client_policies
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para corporate_client_responses
CREATE POLICY "Users can view responses for their companies" ON corporate_client_responses
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage responses for their companies" ON corporate_client_responses
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para company_knowledge_base
CREATE POLICY "Users can view knowledge base for their companies" ON company_knowledge_base
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage knowledge base for their companies" ON company_knowledge_base
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para debtor_behavior_profile
CREATE POLICY "Users can view behavior profiles for their companies" ON debtor_behavior_profile
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage behavior profiles" ON debtor_behavior_profile
    FOR ALL USING (
        auth.uid() IS NULL OR -- Para procesos automáticos
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para ai_interaction_logs
CREATE POLICY "Users can view AI logs for their companies" ON ai_interaction_logs
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert AI logs" ON ai_interaction_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL OR -- Para procesos automáticos
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_negotiation_ai_config_timestamp
    BEFORE UPDATE ON negotiation_ai_config
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_corporate_client_policies_timestamp
    BEFORE UPDATE ON corporate_client_policies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_corporate_client_responses_timestamp
    BEFORE UPDATE ON corporate_client_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_company_knowledge_base_timestamp
    BEFORE UPDATE ON company_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Datos iniciales de ejemplo
INSERT INTO negotiation_ai_config (corporate_client_id, company_id, max_negotiation_discount, max_negotiation_term) 
SELECT 
    cc.id,
    c.id,
    CASE WHEN cc.business_name LIKE '%XYZ%' THEN 20 ELSE 15 END,
    CASE WHEN cc.business_name LIKE '%ABC%' THEN 18 ELSE 12 END
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE cc.business_name IN ('Empresa XYZ S.A.', 'Corporación ABC Ltda.')
ON CONFLICT (corporate_client_id, company_id) DO NOTHING;

-- Respuestas personalizadas de ejemplo
INSERT INTO corporate_client_responses (corporate_client_id, company_id, trigger_keyword, trigger_type, response_template, use_debtor_name, use_corporate_name)
SELECT 
    cc.id,
    c.id,
    CASE 
        WHEN cc.business_name LIKE '%XYZ%' THEN 'descuento'
        ELSE 'cuotas'
    END,
    'keyword',
    CASE 
        WHEN cc.business_name LIKE '%XYZ%' THEN 'Como cliente especial de {corporate_name}, {debtor_name}, podemos ofrecerte condiciones preferenciales.'
        ELSE '{debtor_name}, en {corporate_name} tenemos opciones flexibles de pago para ti.'
    END,
    true,
    true
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE cc.business_name IN ('Empresa XYZ S.A.', 'Corporación ABC Ltda.')
ON CONFLICT DO NOTHING;

-- Comentarios
COMMENT ON TABLE negotiation_ai_config IS 'Configuración de IA específica por cliente corporativo';
COMMENT ON TABLE corporate_client_policies IS 'Políticas de negociación específicas por cliente corporativo';
COMMENT ON TABLE corporate_client_responses IS 'Respuestas personalizadas por cliente corporativo';
COMMENT ON TABLE company_knowledge_base IS 'Base de conocimiento específica por cliente corporativo';
COMMENT ON TABLE debtor_behavior_profile IS 'Perfil de comportamiento de deudores para personalización';
COMMENT ON TABLE ai_interaction_logs IS 'Registro de interacciones con IA para aprendizaje y análisis';