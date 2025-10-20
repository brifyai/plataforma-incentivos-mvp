-- =============================================
-- EXTERNAL AI PROVIDERS TABLES MIGRATION
-- Tablas para configuración de proveedores IA externos
-- =============================================

-- Tabla de proveedores IA externos por empresa
CREATE TABLE IF NOT EXISTS ai_external_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL, -- 'chutes', 'groq'
    api_key TEXT, -- Encriptado en producción
    api_url VARCHAR(500),
    organization_id VARCHAR(255),
    project_id VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    connection_status VARCHAR(20) DEFAULT 'unknown', -- 'connected', 'failed', 'unknown'
    last_tested TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, provider_name)
);

-- Tabla de uso de proveedores IA
CREATE TABLE IF NOT EXISTS ai_provider_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    response_time DECIMAL(8,2), -- en segundos
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ai_providers_company ON ai_external_providers(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_external_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_usage_company ON ai_provider_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_provider_usage(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_provider_usage(recorded_at);

-- Políticas RLS
ALTER TABLE ai_external_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas (solo pueden ver sus configuraciones)
CREATE POLICY "Companies can manage their AI providers" ON ai_external_providers
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view their AI usage" ON ai_provider_usage
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas para administradores (acceso completo)
CREATE POLICY "Admins have full access to AI providers" ON ai_external_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to AI usage" ON ai_provider_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_provider_updated_at
    BEFORE UPDATE ON ai_external_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_provider_updated_at();

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================