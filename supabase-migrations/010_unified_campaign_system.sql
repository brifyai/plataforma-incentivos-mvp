-- =====================================================
-- NEXUPAY UNIFIED CAMPAIGN SYSTEM
-- Sistema Unificado de Campañas con IA y Filtrado Jerárquico
-- =====================================================

-- =====================================================
-- 1. TABLAS PARA JERARQUÍA CORPORATIVA
-- =====================================================

-- Clientes corporativos (Banco Estado, Falabella, etc.)
CREATE TABLE IF NOT EXISTS corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Nombre real: "Banco Estado"
  display_category VARCHAR(50) NOT NULL, -- 'banco', 'retail', 'servicios', etc.
  contact_info JSONB DEFAULT '{}', -- Información interna (NO se comparte)
  segment_count INTEGER DEFAULT 0,
  debtor_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  trust_level VARCHAR(20) DEFAULT 'verified' CHECK (trust_level IN ('verified', 'regulated', 'certified', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segmentos dentro de clientes corporativos
CREATE TABLE IF NOT EXISTS corporate_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- "Jóvenes 18-25", "Familias", "Profesionales"
  criteria JSONB NOT NULL DEFAULT '{}', -- Criterios de segmentación
  debtor_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asignación de deudores a segmentos corporativos
CREATE TABLE IF NOT EXISTS debtor_corporate_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES corporate_segments(id) ON DELETE SET NULL,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  risk_score DECIMAL(3,2), -- Score calculado por IA
  behavioral_profile JSONB DEFAULT '{}', -- Perfil de comportamiento
  UNIQUE(debtor_id, corporate_id)
);

-- =====================================================
-- 2. TABLAS PARA SISTEMA DE CAMPAÑAS UNIFICADO
-- =====================================================

-- Campañas principales
CREATE TABLE IF NOT EXISTS unified_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  campaign_type VARCHAR(20) DEFAULT 'mass_offers' CHECK (campaign_type IN ('mass_offers', 'segmented', 'personalized', 'ab_test')),

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
  filter_type VARCHAR(50) NOT NULL, -- 'corporate', 'segment', 'debtor_risk', etc.
  filter_config JSONB NOT NULL,
  applied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resultados detallados de campañas
CREATE TABLE IF NOT EXISTS campaign_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES unified_campaigns(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
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
-- 3. TABLAS PARA COMUNICACIÓN SEGURA
-- =====================================================

-- Mensajes seguros con tokens
CREATE TABLE IF NOT EXISTS secure_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  corporate_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,

  -- Contenido del mensaje
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  offer_details JSONB DEFAULT '{}',

  -- Información visible al deudor
  company_name_visible VARCHAR(255), -- Nombre real que ve el deudor
  debt_reference_visible VARCHAR(50), -- Referencia que ve el deudor
  trust_badges TEXT[] DEFAULT ARRAY['verified'],

  -- Estado y seguridad
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'converted', 'expired')),
  access_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Metadata
  sent_via VARCHAR(20) DEFAULT 'email' CHECK (sent_via IN ('email', 'sms', 'push')),
  ai_generated BOOLEAN DEFAULT false,
  personalization_score DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens de acceso a mensajes
CREATE TABLE IF NOT EXISTS message_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES secure_messages(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de emails enviados
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES secure_messages(id) ON DELETE CASCADE,
  debtor_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  spam_complaint BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false
);

-- =====================================================
-- 4. TABLAS PARA IA Y ANALYTICS
-- =====================================================

-- Logs de uso de IA
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('GROQ', 'OPENROUTER', 'CHUTES')),
  model VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- 'segmentation', 'personalization', 'optimization'
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
  provider VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5,2), -- 0.00 - 1.00
  speed_ms INTEGER, -- tiempo promedio de respuesta
  cost_per_token DECIMAL(8,6),
  success_rate DECIMAL(5,2), -- 0.00 - 1.00
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model, task_type)
);

-- Eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  campaign_id UUID REFERENCES unified_campaigns(id) ON DELETE SET NULL,
  debtor_id UUID REFERENCES debtors(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para campañas
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_company_status ON unified_campaigns(company_id, status);
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_scheduled ON unified_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_unified_campaigns_type ON unified_campaigns(campaign_type);

-- Índices para mensajes seguros
CREATE INDEX IF NOT EXISTS idx_secure_messages_campaign ON secure_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_secure_messages_debtor ON secure_messages(debtor_id);
CREATE INDEX IF NOT EXISTS idx_secure_messages_token ON secure_messages(access_token);
CREATE INDEX IF NOT EXISTS idx_secure_messages_status ON secure_messages(status);

-- Índices para jerarquía corporativa
CREATE INDEX IF NOT EXISTS idx_corporate_clients_company ON corporate_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_segments_corporate ON corporate_segments(corporate_id);
CREATE INDEX IF NOT EXISTS idx_debtor_assignment_debtor ON debtor_corporate_assignment(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debtor_assignment_corporate ON debtor_corporate_assignment(corporate_id);

-- Índices para IA
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_model ON ai_usage_logs(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_campaign ON ai_usage_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(created_at);

-- =====================================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Campañas: Solo la empresa creadora puede ver/modificar
ALTER TABLE unified_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_company_access" ON unified_campaigns
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Mensajes seguros: Solo el deudor puede ver sus mensajes
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secure_messages_debtor_access" ON secure_messages
  FOR SELECT USING (debtor_id IN (
    SELECT id FROM debtors WHERE user_id = auth.uid()
  ));

-- Clientes corporativos: Solo la empresa puede ver sus corporativos
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corporate_clients_company_access" ON corporate_clients
  FOR ALL USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 7. FUNCIONES ÚTILES
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
  FROM campaign_results
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
    WHERE segment_id = corporate_segments.id
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
CREATE TRIGGER update_segment_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON debtor_corporate_assignment
  FOR EACH ROW EXECUTE FUNCTION update_segment_counts();

-- =====================================================
-- 8. DATOS INICIALES DE EJEMPLO
-- =====================================================

-- Insertar algunos clientes corporativos de ejemplo
INSERT INTO corporate_clients (company_id, name, display_category, trust_level)
SELECT
  c.id,
  CASE
    WHEN c.name ILIKE '%banco%' THEN 'Banco Estado'
    WHEN c.name ILIKE '%fala%' THEN 'Falabella'
    WHEN c.name ILIKE '%cenco%' THEN 'Cencosud'
    WHEN c.name ILIKE '%enel%' THEN 'Enel'
    ELSE c.name
  END,
  CASE
    WHEN c.name ILIKE '%banco%' THEN 'banco'
    WHEN c.name ILIKE '%fala%' OR c.name ILIKE '%cenco%' THEN 'retail'
    WHEN c.name ILIKE '%enel%' OR c.name ILIKE '%metro%' THEN 'servicios'
    ELSE 'financiera'
  END,
  'verified'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_clients cc WHERE cc.company_id = c.id
)
LIMIT 10;

-- Insertar segmentos de ejemplo
INSERT INTO corporate_segments (corporate_id, name, criteria)
SELECT
  cc.id,
  segment_name,
  segment_criteria
FROM corporate_clients cc
CROSS JOIN (
  VALUES
    ('Jóvenes 18-25', '{"ageRange": {"min": 18, "max": 25}}'),
    ('Adultos Jóvenes 26-35', '{"ageRange": {"min": 26, "max": 35}}'),
    ('Adultos 36-50', '{"ageRange": {"min": 36, "max": 50}}'),
    ('Mayores 51+', '{"ageRange": {"min": 51, "max": 100}}'),
    ('Familias', '{"familyStatus": ["married", "family"]}'),
    ('Profesionales', '{"incomeLevel": ["high"], "occupation": ["professional"]}'),
    ('Bajo Riesgo', '{"riskLevel": "low"}'),
    ('Riesgo Medio', '{"riskLevel": "medium"}')
) AS segments(segment_name, segment_criteria)
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_segments cs
  WHERE cs.corporate_id = cc.id AND cs.name = segment_name
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Actualizar contadores iniciales
UPDATE corporate_clients
SET segment_count = (
  SELECT COUNT(*) FROM corporate_segments
  WHERE corporate_id = corporate_clients.id AND is_active = true
);

UPDATE corporate_segments
SET debtor_count = (
  SELECT COUNT(*) FROM debtor_corporate_assignment
  WHERE segment_id = corporate_segments.id
);

COMMENT ON TABLE unified_campaigns IS 'Sistema unificado de campañas con IA y filtrado jerárquico';
COMMENT ON TABLE corporate_clients IS 'Clientes corporativos con información de confianza';
COMMENT ON TABLE secure_messages IS 'Mensajes seguros con tokens temporales';
COMMENT ON TABLE ai_usage_logs IS 'Logs de uso de APIs de IA para costos y monitoreo';