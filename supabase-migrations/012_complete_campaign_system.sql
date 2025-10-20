-- =====================================================
-- NEXUPAY COMPLETE CAMPAIGN SYSTEM
-- Sistema Unificado de Campañas con IA y Filtrado Jerárquico
-- =====================================================

-- =====================================================
-- 1. TIPOS ENUMERADOS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE IF NOT EXISTS campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');
    CREATE TYPE IF NOT EXISTS filter_type AS ENUM ('corporate', 'segment', 'debtor_profile', 'debt_characteristics', 'geographic', 'demographic');
    CREATE TYPE IF NOT EXISTS secure_message_status AS ENUM ('sent', 'delivered', 'read', 'replied', 'expired');
    CREATE TYPE IF NOT EXISTS ai_provider AS ENUM ('groq', 'chutes', 'openrouter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABLAS PARA JERARQUÍA CORPORATIVA
-- =====================================================

-- Clientes corporativos
CREATE TABLE IF NOT EXISTS corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_category VARCHAR(50) NOT NULL DEFAULT 'financiera',
  contact_info JSONB DEFAULT '{}',
  segment_count INTEGER DEFAULT 0,
  debtor_count INTEGER DEFAULT 0,
  total_debt_amount DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  trust_level VARCHAR(20) DEFAULT 'verified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Segmentos dentro de clientes corporativos
CREATE TABLE IF NOT EXISTS corporate_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  debtor_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asignación de deudores a segmentos corporativos
CREATE TABLE IF NOT EXISTS debtor_corporate_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES corporate_segments(id) ON DELETE SET NULL,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  risk_score DECIMAL(3,2),
  behavioral_profile JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  UNIQUE(debtor_id, corporate_id)
);

-- =====================================================
-- 3. TABLAS PARA SISTEMA DE CAMPAÑAS UNIFICADO
-- =====================================================

-- Campañas principales
CREATE TABLE IF NOT EXISTS unified_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',
  campaign_type VARCHAR(20) DEFAULT 'mass_offers',

  -- Configuración de alcance jerárquico
  scope_config JSONB NOT NULL DEFAULT '{
    "allCorporateClients": false,
    "selectedCorporateClients": [],
    "excludeCorporateClients": []
  }',

  -- Configuración de filtros jerárquicos
  filter_config JSONB NOT NULL DEFAULT '{
    "corporateFilters": {},
    "debtorFilters": {
      "riskLevel": {"min": "low", "max": "high"},
      "debtAmount": {"min": 0, "max": 10000000},
      "debtAge": {"min": 0, "max": 365},
      "paymentBehavior": [],
      "geographicLocation": [],
      "demographicProfile": {}
    }
  }',

  -- Configuración de oferta
  offer_config JSONB NOT NULL DEFAULT '{
    "discountPercentage": 15,
    "paymentPlan": "monthly_6",
    "validityDays": 30,
    "specialConditions": ""
  }',

  -- Configuración de IA
  ai_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "segmentation": true,
    "personalization": true,
    "optimization": true,
    "abTesting": false
  }',

  -- Configuración de comunicación
  communication_config JSONB NOT NULL DEFAULT '{
    "showCompanyName": true,
    "hideContactData": true,
    "channel": "email_to_platform",
    "aiPersonalization": true
  }',

  -- Métricas calculadas
  metrics JSONB DEFAULT '{
    "estimatedReach": 0,
    "estimatedConversion": 0,
    "actualSent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "converted": 0,
    "conversionRate": 0,
    "cost": 0,
    "roi": 0
  }',

  -- Programación
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filtros aplicados en campañas
CREATE TABLE IF NOT EXISTS campaign_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES unified_campaigns(id) ON DELETE CASCADE,
  filter_type filter_type NOT NULL,
  filter_config JSONB NOT NULL,
  applied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinatarios de campañas
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES unified_campaigns(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
  corporate_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES corporate_segments(id) ON DELETE SET NULL,

  -- Estados de la campaña
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Información de personalización IA
  ai_personalization JSONB DEFAULT '{}',
  risk_score DECIMAL(3,2),
  segment_used VARCHAR(255),

  -- Métricas de engagement
  time_to_open INTERVAL,
  time_to_click INTERVAL,
  conversion_value DECIMAL(12,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resultados detallados de campañas
CREATE TABLE IF NOT EXISTS campaign_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES unified_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  corporate_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES corporate_segments(id) ON DELETE SET NULL,

  -- Estados de la campaña
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Información de personalización IA
  ai_personalization JSONB DEFAULT '{}',
  risk_score DECIMAL(3,2),
  segment_used VARCHAR(255),

  -- Métricas de engagement
  time_to_open INTERVAL,
  time_to_click INTERVAL,
  conversion_value DECIMAL(12,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLAS PARA COMUNICACIÓN SEGURA
-- =====================================================

-- Mensajes seguros con tokens
CREATE TABLE IF NOT EXISTS secure_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  corporate_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,

  -- Contenido del mensaje
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  offer_details JSONB DEFAULT '{}',

  -- Información visible al deudor
  company_name_visible VARCHAR(255),
  debt_reference_visible VARCHAR(50),
  trust_badges TEXT[] DEFAULT ARRAY['verified'],

  -- Estado y seguridad
  status secure_message_status DEFAULT 'sent',
  access_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Metadata
  sent_via VARCHAR(20) DEFAULT 'email',
  ai_generated BOOLEAN DEFAULT false,
  personalization_score DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens de acceso a mensajes
CREATE TABLE IF NOT EXISTS message_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES secure_messages(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLAS PARA IA Y ANALYTICS
-- =====================================================

-- Logs de uso de IA
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider ai_provider NOT NULL,
  model VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd DECIMAL(8,4) NOT NULL,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance de modelos IA
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider ai_provider NOT NULL,
  model VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5,2),
  speed_ms INTEGER,
  cost_per_token DECIMAL(8,6),
  success_rate DECIMAL(5,2),
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model, task_type)
);

-- Eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE SET NULL,
  debtor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics diarios de campañas
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_viewed INTEGER DEFAULT 0,
  responses_received INTEGER DEFAULT 0,
  conversions_generated INTEGER DEFAULT 0,
  ai_interventions INTEGER DEFAULT 0,
  view_rate DECIMAL(5,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cost_usd DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para campañas
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_company_status ON unified_campaigns(company_id, status);
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_scheduled ON unified_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_type ON unified_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_created_at ON unified_campaigns(created_at DESC);

-- Índices para mensajes seguros
CREATE INDEX IF NOT EXISTS idx_secure_messages_campaign ON secure_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_secure_messages_debtor ON secure_messages(debtor_id);
CREATE INDEX IF NOT EXISTS idx_secure_messages_token ON secure_messages(access_token);
CREATE INDEX IF NOT EXISTS idx_secure_messages_status ON secure_messages(status);
CREATE INDEX IF NOT EXISTS idx_secure_messages_expires_at ON secure_messages(token_expires_at);

-- Índices para jerarquía corporativa
CREATE INDEX IF NOT EXISTS idx_corporate_clients_company ON corporate_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_segments_corporate ON corporate_segments(corporate_id);
CREATE INDEX IF NOT EXISTS idx_debtor_assignment_debtor ON debtor_corporate_assignment(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debtor_assignment_corporate ON debtor_corporate_assignment(corporate_id);

-- Índices para destinatarios de campaña
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_debtor ON campaign_recipients(debtor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- Índices para IA
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_model ON ai_usage_logs(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_campaign ON ai_usage_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(created_at);

-- =====================================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtor_corporate_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para campañas
CREATE POLICY "campaigns_company_access" ON unified_campaigns
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Políticas para mensajes seguros
CREATE POLICY "secure_messages_debtor_access" ON secure_messages
  FOR SELECT USING (debtor_id IN (
    SELECT id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "secure_messages_company_access" ON secure_messages
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Políticas para clientes corporativos
CREATE POLICY "corporate_clients_company_access" ON corporate_clients
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Políticas para destinatarios de campaña
CREATE POLICY "campaign_recipients_company_access" ON campaign_recipients
  FOR ALL USING (campaign_id IN (
    SELECT id FROM unified_campaigns WHERE company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  ));

-- Políticas para analytics (solo lectura para compañías)
CREATE POLICY "campaign_analytics_company_access" ON campaign_analytics
  FOR SELECT USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 8. FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular métricas de campaña
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(campaign_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  sent_count INTEGER;
  delivered_count INTEGER;
  opened_count INTEGER;
  clicked_count INTEGER;
  converted_count INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE sent_at IS NOT NULL),
    COUNT(*) FILTER (WHERE delivered_at IS NOT NULL),
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL)
  INTO sent_count, delivered_count, opened_count, clicked_count, converted_count
  FROM campaign_recipients
  WHERE campaign_id = campaign_uuid;

  result := jsonb_build_object(
    'sent', sent_count,
    'delivered', delivered_count,
    'opened', opened_count,
    'clicked', clicked_count,
    'converted', converted_count,
    'conversionRate', CASE WHEN sent_count > 0 THEN (converted_count::DECIMAL / sent_count) * 100 ELSE 0 END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para validar tokens de mensaje
CREATE OR REPLACE FUNCTION validate_message_token(token_uuid UUID, debtor_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  token_record RECORD;
BEGIN
  SELECT * INTO token_record
  FROM message_tokens
  WHERE token = token_uuid AND debtor_id = debtor_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF token_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Marcar como usado
  UPDATE message_tokens
  SET used_at = NOW()
  WHERE token = token_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar contadores de segmentos
CREATE OR REPLACE FUNCTION update_segment_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar contador de deudores en segmento
  UPDATE corporate_segments
  SET debtor_count = (
    SELECT COUNT(*) FROM debtor_corporate_assignment
    WHERE segment_id = corporate_segments.id AND is_active = true
  )
  WHERE id = COALESCE(NEW.segment_id, OLD.segment_id);

  -- Actualizar contador de segmentos en corporativo
  UPDATE corporate_clients
  SET segment_count = (
    SELECT COUNT(*) FROM corporate_segments
    WHERE corporate_id = corporate_clients.id AND is_active = true
  )
  WHERE id = (
    SELECT corporate_id FROM corporate_segments
    WHERE id = COALESCE(NEW.segment_id, OLD.segment_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores
DROP TRIGGER IF EXISTS update_segment_counts_trigger ON debtor_corporate_assignment;
CREATE TRIGGER update_segment_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON debtor_corporate_assignment
  FOR EACH ROW EXECUTE FUNCTION update_segment_counts();

-- =====================================================
-- 9. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON corporate_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_segments_updated_at BEFORE UPDATE ON corporate_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_campaigns_updated_at BEFORE UPDATE ON unified_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secure_messages_updated_at BEFORE UPDATE ON secure_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_analytics_updated_at BEFORE UPDATE ON campaign_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. DATOS INICIALES
-- =====================================================

-- Configuración inicial de APIs de IA (si no existe system_config)
INSERT INTO system_config (config_key, config_value, description)
SELECT 'ai_providers', '{
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
  },
  "openrouter": {
    "enabled": false,
    "api_key": null,
    "models": ["gpt-4", "claude-3"],
    "limits": {"daily_cost": 50, "monthly_cost": 1000}
  }
}', 'Configuración de proveedores de IA disponibles'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'ai_providers');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'campaign_limits', '{
  "max_debtors_per_campaign": 50000,
  "max_emails_per_hour": 1000,
  "min_campaign_interval_hours": 24,
  "max_active_campaigns_per_company": 5
}', 'Límites de seguridad para campañas'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'campaign_limits');

-- Datos iniciales de performance de modelos IA
INSERT INTO ai_model_performance (provider, model, task_type, accuracy, precision, recall, f1_score, avg_response_time_ms, cost_per_token_usd, success_rate, sample_size) VALUES
('groq', 'llama-3.1-70b', 'segmentation', 0.89, 0.87, 0.91, 0.89, 1200, 0.001, 0.95, 1000),
('groq', 'llama-3.1-8b', 'classification', 0.82, 0.80, 0.84, 0.82, 800, 0.0005, 0.92, 1500),
('chutes', 'chutes-dobby', 'content_generation', 0.88, 0.86, 0.90, 0.88, 1000, 0.0008, 0.94, 800),
('groq', 'llama-3.1-70b', 'personalization', 0.85, 0.83, 0.87, 0.85, 1500, 0.0012, 0.90, 600)
ON CONFLICT (provider, model, task_type) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE - SISTEMA DE CAMPAÑAS UNIFICADO
-- =====================================================

COMMENT ON TABLE unified_campaigns IS 'Sistema unificado de campañas con IA y filtrado jerárquico';
COMMENT ON TABLE corporate_clients IS 'Clientes corporativos con información de confianza';
COMMENT ON TABLE secure_messages IS 'Mensajes seguros con tokens temporales para campañas';
COMMENT ON TABLE campaign_recipients IS 'Destinatarios de campañas con métricas detalladas';
COMMENT ON TABLE ai_usage_logs IS 'Logs de uso de APIs de IA para costos y monitoreo';