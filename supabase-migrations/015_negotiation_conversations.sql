-- Migration: Sistema de Conversaciones de Negociación con IA
-- Descripción: Tablas para manejar conversaciones de negociación entre deudores y empresas con IA

-- Tabla principal de conversaciones de negociación
CREATE TABLE IF NOT EXISTS negotiation_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Estado y configuración
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated', 'paused')),
    ai_enabled BOOLEAN DEFAULT true,
    
    -- Contexto de negociación (JSON con límites, propuesta original, etc.)
    negotiation_context JSONB DEFAULT '{}',
    
    -- Métricas y análisis
    message_count INTEGER DEFAULT 0,
    escalation_reason TEXT,
    escalated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes de negociación
CREATE TABLE IF NOT EXISTS negotiation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES negotiation_conversations(id) ON DELETE CASCADE,
    
    -- Quién envía el mensaje
    sender_type TEXT NOT NULL CHECK (sender_type IN ('debtor', 'ai_assistant', 'human_representative')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional para humanos
    
    -- Contenido del mensaje
    content TEXT NOT NULL,
    
    -- Metadatos del mensaje (JSON con tipo, triggers, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Análisis de IA
    sentiment_analysis JSONB, -- Análisis de sentimiento
    intent_classification JSONB, -- Clasificación de intención
    escalation_score DECIMAL(3,2), -- Puntuación de escalamiento (0.00-1.00)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de IA de negociación por empresa
CREATE TABLE IF NOT EXISTS negotiation_ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Límites de autoridad de la IA
    max_negotiation_discount DECIMAL(5,2) DEFAULT 15.00, -- Máximo descuento adicional
    max_negotiation_term INTEGER DEFAULT 12, -- Máximo plazo en meses
    allowed_payment_plans TEXT[] DEFAULT ARRAY['monthly_installments', 'quarterly_payments'],
    
    -- Configuración de triggers
    keyword_responses JSONB DEFAULT '{}', -- Respuestas automáticas por palabra clave
    escalation_thresholds JSONB DEFAULT '{}', -- Umbrales para escalamiento
    
    -- Personalización de IA
    ai_personality TEXT DEFAULT 'professional_empathetic', -- personalidad de la IA
    company_tone TEXT DEFAULT 'formal', -- tono de comunicación
    custom_prompts JSONB DEFAULT '{}', -- prompts personalizados
    
    -- Métricas y límites
    max_conversation_length INTEGER DEFAULT 15, -- Máximo de mensajes antes de escalar
    max_response_time_minutes INTEGER DEFAULT 30, -- Tiempo máximo de respuesta
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    requires_human_review BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id)
);

-- Tabla de analytics de negociaciones
CREATE TABLE IF NOT EXISTS negotiation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES negotiation_conversations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Métricas de la conversación
    total_messages INTEGER DEFAULT 0,
    ai_messages INTEGER DEFAULT 0,
    human_messages INTEGER DEFAULT 0,
    debtor_messages INTEGER DEFAULT 0,
    
    -- Tiempos
    conversation_duration_minutes INTEGER,
    average_response_time_minutes DECIMAL(8,2),
    first_response_time_minutes INTEGER,
    
    -- Resultados
    outcome TEXT CHECK (outcome IN ('agreement', 'no_agreement', 'escalated', 'abandoned')),
    final_agreement_amount DECIMAL(12,2),
    discount_given DECIMAL(5,2),
    
    -- Análisis de IA
    sentiment_trend JSONB, -- Evolución del sentimiento
    complexity_score DECIMAL(3,2), -- Puntuación de complejidad
    escalation_triggers_used TEXT[], -- Triggers que activaron escalamiento
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de feedback de negociaciones
CREATE TABLE IF NOT EXISTS negotiation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES negotiation_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Quién da el feedback
    feedback_provider TEXT CHECK (feedback_provider IN ('debtor', 'company_representative')),
    
    -- Calificación
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    ai_helpfulness_rating INTEGER CHECK (ai_helpfulness_rating >= 1 AND ai_helpfulness_rating <= 5),
    
    -- Comentarios
    comments TEXT,
    
    -- Aspectos específicos
    what_went_well TEXT[],
    what_could_improve TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_negotiation_conversations_proposal ON negotiation_conversations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_conversations_user ON negotiation_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_conversations_company ON negotiation_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_conversations_status ON negotiation_conversations(status);
CREATE INDEX IF NOT EXISTS idx_negotiation_conversations_created ON negotiation_conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_conversation ON negotiation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_sender ON negotiation_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_created ON negotiation_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_company ON negotiation_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_outcome ON negotiation_analytics(outcome);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_created ON negotiation_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_negotiation_feedback_conversation ON negotiation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_feedback_provider ON negotiation_feedback(feedback_provider);

-- RLS (Row Level Security)
ALTER TABLE negotiation_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para negotiation_conversations
CREATE POLICY "Users can view their own conversations" ON negotiation_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view their conversations" ON negotiation_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert conversations" ON negotiation_conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update conversations" ON negotiation_conversations
    FOR UPDATE USING (true);

-- Políticas RLS para negotiation_messages
CREATE POLICY "Users can view messages in their conversations" ON negotiation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM negotiation_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view messages in their conversations" ON negotiation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM negotiation_conversations nc
            JOIN companies c ON c.id = nc.company_id
            WHERE nc.id = conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert messages" ON negotiation_messages
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para negotiation_ai_config
CREATE POLICY "Companies can view their own config" ON negotiation_ai_config
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can update their own config" ON negotiation_ai_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage config" ON negotiation_ai_config
    FOR ALL USING (true);

-- Políticas RLS para negotiation_analytics
CREATE POLICY "Companies can view their analytics" ON negotiation_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage analytics" ON negotiation_analytics
    FOR ALL USING (true);

-- Políticas RLS para negotiation_feedback
CREATE POLICY "Users can view their own feedback" ON negotiation_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view feedback on their conversations" ON negotiation_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM negotiation_conversations nc
            JOIN companies c ON c.id = nc.company_id
            WHERE nc.id = conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert feedback" ON negotiation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_negotiation_conversations_updated_at 
    BEFORE UPDATE ON negotiation_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiation_messages_updated_at 
    BEFORE UPDATE ON negotiation_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiation_ai_config_updated_at 
    BEFORE UPDATE ON negotiation_ai_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiation_analytics_updated_at 
    BEFORE UPDATE ON negotiation_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiation_feedback_updated_at 
    BEFORE UPDATE ON negotiation_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar contador de mensajes
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE negotiation_conversations 
    SET message_count = (
        SELECT COUNT(*) FROM negotiation_messages 
        WHERE conversation_id = NEW.conversation_id
    )
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_count_trigger
    AFTER INSERT ON negotiation_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Función para crear analytics automáticamente cuando se completa una conversación
CREATE OR REPLACE FUNCTION create_negotiation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear analytics si la conversación se marca como completada o escalada
    IF NEW.status IN ('completed', 'escalated') AND OLD.status NOT IN ('completed', 'escalated') THEN
        INSERT INTO negotiation_analytics (
            conversation_id,
            company_id,
            total_messages,
            ai_messages,
            human_messages,
            debtor_messages,
            conversation_duration_minutes,
            outcome
        )
        SELECT 
            NEW.id,
            NEW.company_id,
            COALESCE(
                (SELECT COUNT(*) FROM negotiation_messages WHERE conversation_id = NEW.id),
                0
            ),
            COALESCE(
                (SELECT COUNT(*) FROM negotiation_messages 
                 WHERE conversation_id = NEW.id AND sender_type = 'ai_assistant'),
                0
            ),
            COALESCE(
                (SELECT COUNT(*) FROM negotiation_messages 
                 WHERE conversation_id = NEW.id AND sender_type = 'human_representative'),
                0
            ),
            COALESCE(
                (SELECT COUNT(*) FROM negotiation_messages 
                 WHERE conversation_id = NEW.id AND sender_type = 'debtor'),
                0
            ),
            EXTRACT(EPOCH FROM (NEW.updated_at - NEW.created_at)) / 60,
            CASE 
                WHEN NEW.status = 'completed' THEN 'agreement'
                WHEN NEW.status = 'escalated' THEN 'escalated'
                ELSE 'no_agreement'
            END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_analytics_on_completion
    AFTER UPDATE ON negotiation_conversations
    FOR EACH ROW EXECUTE FUNCTION create_negotiation_analytics();

-- Insertar configuración por defecto para empresas existentes
INSERT INTO negotiation_ai_config (company_id, max_negotiation_discount, max_negotiation_term)
SELECT id, 15.00, 12 
FROM companies 
WHERE id NOT IN (SELECT company_id FROM negotiation_ai_config);

-- Comentarios para documentación
COMMENT ON TABLE negotiation_conversations IS 'Conversaciones de negociación entre deudores y empresas con IA';
COMMENT ON TABLE negotiation_messages IS 'Mensajes individuales dentro de conversaciones de negociación';
COMMENT ON TABLE negotiation_ai_config IS 'Configuración personalizada de IA para cada empresa';
COMMENT ON TABLE negotiation_analytics IS 'Métricas y análisis de rendimiento de negociaciones';
COMMENT ON TABLE negotiation_feedback IS 'Feedback de usuarios sobre las negociaciones';