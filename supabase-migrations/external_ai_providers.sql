-- =============================================
-- EXTERNAL AI PROVIDERS MIGRATION
-- Tablas para integración con APIs de IA externas
-- =============================================

-- Tabla de proveedores de IA externos
CREATE TABLE IF NOT EXISTS ai_external_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name VARCHAR(50) UNIQUE NOT NULL, -- 'openai', 'anthropic', 'google', 'groq'
  api_key TEXT, -- Encriptado en producción
  api_url VARCHAR(500),
  organization_id VARCHAR(100),
  project_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  connection_status VARCHAR(20) DEFAULT 'unknown', -- 'connected', 'failed', 'unknown'
  last_tested TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de uso de APIs externas
CREATE TABLE IF NOT EXISTS ai_external_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider_name VARCHAR(50) NOT NULL,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  response_time DECIMAL(5,2), -- en segundos
  success BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de métricas en tiempo real
CREATE TABLE IF NOT EXISTS ai_realtime_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'active_conversations', 'messages_today', etc.
  value DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de health checks del sistema
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'critical'
  services_status JSONB, -- Estado detallado de cada servicio
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de backups del sistema
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_timestamp TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'complete', 'partial', 'failed'
  tables_backed_up JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de errores del sistema
CREATE TABLE IF NOT EXISTS system_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  metadata JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de notificaciones para administradores
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'security_alert', 'system_warning', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'unread', -- 'read', 'unread', 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ai_external_providers_active
ON ai_external_providers(is_active, connection_status);

CREATE INDEX IF NOT EXISTS idx_ai_external_usage_company_provider
ON ai_external_usage(company_id, provider_name);

CREATE INDEX IF NOT EXISTS idx_ai_external_usage_date
ON ai_external_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_realtime_metrics_company_type
ON ai_realtime_metrics(company_id, metric_type);

CREATE INDEX IF NOT EXISTS idx_ai_realtime_metrics_timestamp
ON ai_realtime_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_timestamp
ON system_health_checks(check_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_errors_severity_created
ON system_errors(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status_priority
ON admin_notifications(status, priority, created_at DESC);

-- Políticas RLS
ALTER TABLE ai_external_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_external_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para proveedores externos (solo admins)
CREATE POLICY "Admins can manage external providers"
ON ai_external_providers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para uso de APIs (empresas ven su propio uso)
CREATE POLICY "Companies can view their API usage"
ON ai_external_usage FOR SELECT
USING (company_id IN (
  SELECT id FROM companies WHERE user_id = auth.uid()
));

-- Políticas para métricas en tiempo real (empresas ven sus métricas)
CREATE POLICY "Companies can view their realtime metrics"
ON ai_realtime_metrics FOR SELECT
USING (company_id IN (
  SELECT id FROM companies WHERE user_id = auth.uid()
));

-- Políticas para health checks (solo admins)
CREATE POLICY "Admins can view health checks"
ON system_health_checks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para backups (solo admins)
CREATE POLICY "Admins can view backups"
ON system_backups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para errores del sistema (solo admins)
CREATE POLICY "Admins can view system errors"
ON system_errors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para notificaciones de admin (solo admins)
CREATE POLICY "Admins can manage their notifications"
ON admin_notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_external_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_external_providers_updated_at
  BEFORE UPDATE ON ai_external_providers
  FOR EACH ROW EXECUTE FUNCTION update_external_providers_updated_at();

-- =============================================
-- DATOS DE EJEMPLO PARA TESTING
-- =============================================

-- Proveedor Groq (por defecto, más económico)
INSERT INTO ai_external_providers (provider_name, api_url, is_active, connection_status)
VALUES ('groq', 'https://api.groq.com/openai/v1', true, 'connected')
ON CONFLICT (provider_name) DO NOTHING;

-- Proveedor OpenAI (premium)
INSERT INTO ai_external_providers (provider_name, api_url, is_active, connection_status)
VALUES ('openai', 'https://api.openai.com/v1', false, 'unknown')
ON CONFLICT (provider_name) DO NOTHING;

-- Métricas de ejemplo para testing
INSERT INTO ai_realtime_metrics (company_id, metric_type, value)
SELECT
  c.id,
  'active_conversations',
  floor(random() * 20 + 5)::int
FROM companies c
WHERE c.business_name IS NOT NULL
LIMIT 1;

INSERT INTO ai_realtime_metrics (company_id, metric_type, value)
SELECT
  c.id,
  'messages_today',
  floor(random() * 300 + 100)::int
FROM companies c
WHERE c.business_name IS NOT NULL
LIMIT 1;

-- Health check de ejemplo
INSERT INTO system_health_checks (overall_status, services_status)
VALUES ('healthy', '{
  "database": {"status": "healthy", "responseTime": 45},
  "ai_providers": {"status": "healthy", "healthyProviders": 2, "totalProviders": 2},
  "internal_services": {"status": "healthy", "services": []},
  "file_system": {"status": "healthy"}
}');

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================