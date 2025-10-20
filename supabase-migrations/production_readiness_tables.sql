-- =============================================
-- PRODUCTION READINESS TABLES MIGRATION
-- Tablas para funcionalidades de preparación para producción
-- =============================================

-- Tabla de health checks del sistema
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    overall_status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'critical'
    services_status JSONB, -- Estado detallado de cada servicio
    checks_results JSONB, -- Resultados de cada check
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de backups del sistema
CREATE TABLE IF NOT EXISTS system_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    type VARCHAR(20) DEFAULT 'full', -- 'full', 'incremental'
    size_mb INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos de seguridad
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    description TEXT,
    details JSONB,
    affected_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas en tiempo real
CREATE TABLE IF NOT EXISTS ai_realtime_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- 'active_conversations', 'messages_today', etc.
    value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones de admin
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    read_status BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON system_health_checks(check_timestamp);
CREATE INDEX IF NOT EXISTS idx_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_company ON rate_limit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON rate_limit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_company ON ai_realtime_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_type ON ai_realtime_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);

-- Políticas RLS
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores (acceso completo a tablas de sistema)
CREATE POLICY "Admins have full access to health checks" ON system_health_checks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to backups" ON system_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to rate limits" ON rate_limit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to security events" ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to realtime metrics" ON ai_realtime_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

-- Políticas para empresas (solo métricas de su empresa)
CREATE POLICY "Companies can view their realtime metrics" ON ai_realtime_metrics
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Trigger para actualizar updated_at en backups
CREATE OR REPLACE FUNCTION update_system_backup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_backup_updated_at
    BEFORE UPDATE ON system_backups
    FOR EACH ROW
    EXECUTE FUNCTION update_system_backup_updated_at();

-- Función para limpiar logs antiguos (útil para mantenimiento)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpiar rate limit logs antiguos
    DELETE FROM rate_limit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Limpiar métricas antiguas (mantener solo últimos 7 días)
    DELETE FROM ai_realtime_metrics
    WHERE recorded_at < NOW() - INTERVAL '7 days';

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================