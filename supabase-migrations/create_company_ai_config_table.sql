-- Migration: Crear tabla de configuración de IA por empresa
-- Descripción: Tabla para almacenar la configuración de IA y mensajería por empresa

-- Crear tabla de configuración de IA por empresa
CREATE TABLE IF NOT EXISTS company_ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Configuración de proveedores de IA
    ai_providers JSONB DEFAULT '{}',
    
    -- Configuración de mensajería
    messaging_config JSONB DEFAULT '{}',
    
    -- Configuración de personalización
    personalization_config JSONB DEFAULT '{}',
    
    -- Respuestas personalizadas
    custom_responses JSONB DEFAULT '[]',
    
    -- Límites de negociación
    negotiation_limits JSONB DEFAULT '{}',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Restricciones
    CONSTRAINT company_ai_config_unique_company UNIQUE(company_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_company_ai_config_company ON company_ai_config(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_config_updated ON company_ai_config(updated_at);

-- RLS (Row Level Security)
ALTER TABLE company_ai_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para company_ai_config
CREATE POLICY "Users can view their own company config" ON company_ai_config
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own company config" ON company_ai_config
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own company config" ON company_ai_config
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage all configs" ON company_ai_config
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Trigger para actualizar updated_at
CREATE TRIGGER set_company_ai_config_timestamp
    BEFORE UPDATE ON company_ai_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto para empresas existentes
INSERT INTO company_ai_config (company_id, ai_providers, messaging_config, personalization_config, custom_responses, negotiation_limits)
SELECT 
    id,
    '{
        "providers": {
            "chutes": {
                "enabled": false,
                "apiKey": "",
                "baseUrl": "https://api.chutes.ai",
                "model": "gpt-4",
                "maxTokens": 2000,
                "temperature": 0.7
            },
            "groq": {
                "enabled": false,
                "apiKey": "",
                "baseUrl": "https://api.groq.com",
                "model": "llama2-70b",
                "maxTokens": 2000,
                "temperature": 0.7
            },
            "openai": {
                "enabled": false,
                "apiKey": "",
                "baseUrl": "https://api.openai.com",
                "model": "gpt-4",
                "maxTokens": 2000,
                "temperature": 0.7
            }
        },
        "selectedProvider": "chutes",
        "fallbackEnabled": true,
        "autoRetry": true,
        "maxRetries": 3
    }'::jsonb,
    '{
        "autoRespond": true,
        "workingHours": {
            "enabled": true,
            "start": "09:00",
            "end": "18:00",
            "timezone": "America/Santiago"
        },
        "responseDelay": {
            "min": 2,
            "max": 5
        },
        "escalation": {
            "enabled": true,
            "thresholds": {
                "conversationLength": 15,
                "discountRequested": 20,
                "timeRequested": 18,
                "frustrationLevel": 0.7
            }
        }
    }'::jsonb,
    '{
        "level": "high",
        "useDebtorName": true,
        "useCorporateName": true,
        "useRUT": false,
        "useHistory": true,
        "communicationStyle": "professional",
        "riskAdaptation": true,
        "customGreeting": "",
        "customSignature": ""
    }'::jsonb,
    '[
        {
            "id": 1,
            "trigger": "descuento",
            "type": "keyword",
            "response": "Como cliente especial, puedo ofrecerte opciones exclusivas de descuento.",
            "enabled": true
        },
        {
            "id": 2,
            "trigger": "cuotas",
            "type": "keyword",
            "response": "Tenemos planes flexibles que se adaptan a tu presupuesto.",
            "enabled": true
        }
    ]'::jsonb,
    '{
        "maxDiscount": 15,
        "maxInstallments": 12,
        "maxTerm": 18,
        "minPayment": 10000,
        "customRules": []
    }'::jsonb
FROM companies
WHERE id NOT IN (SELECT company_id FROM company_ai_config);

-- Comentarios para documentación
COMMENT ON TABLE company_ai_config IS 'Configuración de IA y mensajería específica por empresa';
COMMENT ON COLUMN company_ai_config.ai_providers IS 'Configuración de proveedores de IA (API keys, modelos, etc.)';
COMMENT ON COLUMN company_ai_config.messaging_config IS 'Configuración de mensajería (horarios, respuestas automáticas, etc.)';
COMMENT ON COLUMN company_ai_config.personalization_config IS 'Configuración de personalización (nivel, elementos, estilo, etc.)';
COMMENT ON COLUMN company_ai_config.custom_responses IS 'Respuestas personalizadas automáticas';
COMMENT ON COLUMN company_ai_config.negotiation_limits IS 'Límites de negociación (descuentos, cuotas, plazos, etc.)';