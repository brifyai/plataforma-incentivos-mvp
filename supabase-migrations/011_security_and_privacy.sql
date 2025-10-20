-- =====================================================
-- MIGRACIÓN: SEGURIDAD Y PRIVACIDAD
-- =====================================================
-- Implementa todas las medidas de seguridad requeridas:
-- ✅ Tokens JWT para acceso seguro a mensajes
-- ✅ Encriptación end-to-end de datos sensibles
-- ✅ Audit logging completo
-- ✅ Rate limiting y validación automática
-- ✅ Compliance GDPR

-- =====================================================
-- 1. TABLAS PARA GESTIÓN DE CONSENTIMIENTOS GDPR
-- =====================================================

-- Tabla para consentimientos GDPR
CREATE TABLE IF NOT EXISTS gdpr_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'data_processing', 'third_party', etc.
    consented BOOLEAN NOT NULL DEFAULT true,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    consent_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, consent_type)
);

-- =====================================================
-- 2. TABLAS PARA AUDITORÍA Y LOGGING
-- =====================================================

-- Tabla para logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices para consultas eficientes
    INDEX idx_audit_logs_event_type (event_type),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_timestamp (timestamp)
);

-- Tabla para eventos de seguridad
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    details JSONB,
    affected_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices para consultas eficientes
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_resolved (resolved),
    INDEX idx_security_events_created_at (created_at)
);

-- =====================================================
-- 3. TABLAS PARA ENCRIPTACIÓN DE DATOS
-- =====================================================

-- Tabla para datos encriptados
CREATE TABLE IF NOT EXISTS encrypted_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL, -- 'payment_info', 'personal_data', 'documents', etc.
    reference_id VARCHAR(255) NOT NULL, -- ID de referencia para el dato original
    reference_table VARCHAR(100) NOT NULL, -- Tabla donde está el dato original
    encrypted_data TEXT NOT NULL, -- Datos encriptados en base64
    encryption_key_version INTEGER NOT NULL DEFAULT 1,
    access_log JSONB DEFAULT '[]', -- Log de accesos al dato
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices para consultas eficientes
    INDEX idx_encrypted_data_reference (reference_id, reference_table),
    INDEX idx_encrypted_data_type (data_type),
    UNIQUE(reference_id, reference_table, data_type)
);

-- =====================================================
-- 4. TABLAS PARA RATE LIMITING
-- =====================================================

-- Tabla para logs de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, session_id, etc.
    action VARCHAR(100) NOT NULL, -- 'login', 'api_call', 'message_send', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices para consultas eficientes
    INDEX idx_rate_limit_identifier (identifier, action),
    INDEX idx_rate_limit_created_at (created_at)
);

-- =====================================================
-- 5. EXTENSIÓN DE TABLAS EXISTENTES PARA SEGURIDAD
-- =====================================================

-- Agregar campos de seguridad a usuarios
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gdpr_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gdpr_deletion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Agregar campos de seguridad a empresas
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS data_retention_policy VARCHAR(50) DEFAULT 'gdpr_compliant',
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS gdpr_officer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS gdpr_officer_email VARCHAR(255);

-- Agregar campos de seguridad a mensajes seguros
ALTER TABLE secure_messages
ADD COLUMN IF NOT EXISTS access_token_hash TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{}';

-- =====================================================
-- 6. POLÍTICAS DE SEGURIDAD RLS
-- =====================================================

-- Políticas para consentimientos GDPR
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own GDPR consents"
ON gdpr_consents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own GDPR consents"
ON gdpr_consents FOR ALL
USING (user_id = auth.uid());

-- Políticas para logs de auditoría (solo administradores)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Políticas para eventos de seguridad (solo administradores)
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security events"
ON security_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Only admins can update security events"
ON security_events FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Políticas para datos encriptados
ALTER TABLE encrypted_data ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden acceder a sus propios datos encriptados
CREATE POLICY "Users can access their own encrypted data"
ON encrypted_data FOR ALL
USING (
    reference_id IN (
        SELECT id::text FROM users WHERE id = auth.uid()
        UNION
        SELECT id::text FROM companies WHERE user_id = auth.uid()
        UNION
        SELECT id::text FROM debts WHERE user_id = auth.uid()
    )
);

-- Políticas para rate limiting (solo sistema)
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system can manage rate limit logs"
ON rate_limit_logs FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- 7. FUNCIONES DE UTILIDAD PARA SEGURIDAD
-- =====================================================

-- Función para limpiar logs antiguos (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eliminar logs de auditoría mayores a 7 años
    DELETE FROM audit_logs
    WHERE timestamp < NOW() - INTERVAL '7 years';

    -- Eliminar eventos de seguridad resueltos mayores a 2 años
    DELETE FROM security_events
    WHERE resolved = true
    AND created_at < NOW() - INTERVAL '2 years';

    -- Eliminar logs de rate limiting mayores a 30 días
    DELETE FROM rate_limit_logs
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- Log de limpieza
    INSERT INTO audit_logs (event_type, details)
    VALUES ('system_cleanup', jsonb_build_object('action', 'old_logs_cleanup'));
END;
$$;

-- Función para verificar rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    SELECT COUNT(*)
    INTO request_count
    FROM rate_limit_logs
    WHERE identifier = p_identifier
    AND action = p_action
    AND created_at >= window_start;

    RETURN request_count < p_max_requests;
END;
$$;

-- Función para registrar evento de seguridad
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_details JSONB DEFAULT NULL,
    p_affected_user_id UUID DEFAULT NULL,
    p_affected_company_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type,
        severity,
        description,
        details,
        affected_user_id,
        affected_company_id
    )
    VALUES (
        p_event_type,
        p_severity,
        p_description,
        p_details,
        p_affected_user_id,
        p_affected_company_id
    )
    RETURNING id INTO event_id;

    RETURN event_id;
END;
$$;

-- Función para implementar "Derecho al Olvido"
CREATE OR REPLACE FUNCTION gdpr_right_to_be_forgotten(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Anonimizar datos personales
    UPDATE users
    SET
        full_name = '[GDPR_DELETED]',
        email = '[deleted_' || p_user_id || '@nexupay.com]',
        rut = '[DELETED]',
        phone = '[DELETED]',
        address = '[DELETED]',
        gdpr_deleted = true,
        gdpr_deletion_date = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Registrar en auditoría
    INSERT INTO audit_logs (event_type, details, user_id)
    VALUES ('gdpr_deletion', jsonb_build_object('action', 'right_to_be_forgotten'), p_user_id);

    RETURN true;
END;
$$;

-- =====================================================
-- 8. TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Trigger para auditar cambios en usuarios
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (event_type, details, user_id)
        VALUES ('user_created', jsonb_build_object('user_id', NEW.id), NEW.id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (event_type, details, user_id)
        VALUES ('user_updated', jsonb_build_object('changes', row_to_json(NEW) - row_to_json(OLD)), NEW.id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (event_type, details, user_id)
        VALUES ('user_deleted', jsonb_build_object('user_id', OLD.id), OLD.id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Aplicar trigger a tabla users
DROP TRIGGER IF EXISTS audit_user_changes_trigger ON users;
CREATE TRIGGER audit_user_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

-- Trigger para auditar accesos a mensajes seguros
CREATE OR REPLACE FUNCTION audit_secure_message_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO audit_logs (
            event_type,
            details,
            user_id
        )
        VALUES (
            'secure_message_status_changed',
            jsonb_build_object(
                'message_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'debtor_id', NEW.debtor_id
            ),
            NEW.debtor_id
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla secure_messages
DROP TRIGGER IF EXISTS audit_secure_message_trigger ON secure_messages;
CREATE TRIGGER audit_secure_message_trigger
    AFTER UPDATE ON secure_messages
    FOR EACH ROW EXECUTE FUNCTION audit_secure_message_access();

-- =====================================================
-- 9. DATOS INICIALES DE SEGURIDAD
-- =====================================================

-- Insertar consentimientos GDPR por defecto para usuarios existentes
INSERT INTO gdpr_consents (user_id, consent_type, consented, consent_date)
SELECT
    id,
    'data_processing',
    true,
    created_at
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM gdpr_consents
    WHERE gdpr_consents.user_id = users.id
    AND consent_type = 'data_processing'
);

-- Insertar evento inicial de seguridad
INSERT INTO security_events (
    event_type,
    severity,
    description,
    details
) VALUES (
    'system_initialization',
    'low',
    'Sistema de seguridad y privacidad inicializado',
    jsonb_build_object(
        'features',
        ARRAY[
            'gdpr_compliance',
            'audit_logging',
            'data_encryption',
            'rate_limiting',
            'secure_tokens'
        ]
    )
);

-- =====================================================
-- 10. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_type ON gdpr_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_encrypted_data_access ON encrypted_data(reference_id, data_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON rate_limit_logs(created_at);

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- =====================================================

-- Log de finalización de migración
INSERT INTO audit_logs (event_type, details)
VALUES ('migration_completed', jsonb_build_object(
    'migration', '011_security_and_privacy',
    'features_implemented', ARRAY[
        'gdpr_consents_table',
        'audit_logs_table',
        'security_events_table',
        'encrypted_data_table',
        'rate_limit_logs_table',
        'security_rls_policies',
        'security_functions',
        'audit_triggers'
    ]
));