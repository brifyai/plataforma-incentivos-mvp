-- Crear tabla para almacenar configuración de proveedores de IA
-- Esta tabla permitirá gestionar las API keys y configuraciones de forma centralizada

CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL UNIQUE, -- 'groq', 'chutes', 'openai'
    display_name TEXT NOT NULL, -- Nombre amigable para mostrar en UI
    api_key TEXT NOT NULL, -- API key encriptada
    api_key_encrypted TEXT, -- API key encriptada (opcional, para mayor seguridad)
    is_active BOOLEAN DEFAULT true, -- Si el proveedor está activo
    is_default BOOLEAN DEFAULT false, -- Si es el proveedor por defecto
    models_available JSONB DEFAULT '[]'::jsonb, -- Lista de modelos disponibles
    embedding_models JSONB DEFAULT '[]'::jsonb, -- Modelos específicos para embedding
    chat_models JSONB DEFAULT '[]'::jsonb, -- Modelos específicos para chat
    last_models_fetch TIMESTAMP WITH TIME ZONE, -- Última vez que se obtuvieron los modelos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint para asegurar que solo un proveedor esté activo a la vez
    CONSTRAINT single_active_provider CHECK (
        (is_active = true AND (SELECT COUNT(*) FROM ai_providers WHERE is_active = true AND id != ai_providers.id) = 0) 
        OR is_active = false
    )
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_ai_providers_provider_name ON ai_providers(provider_name);
CREATE INDEX idx_ai_providers_is_active ON ai_providers(is_active);
CREATE INDEX idx_ai_providers_is_default ON ai_providers(is_default);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_providers_updated_at 
    BEFORE UPDATE ON ai_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales para Groq y Chutes
-- NOTA: Las API keys deben ser configuradas desde variables de entorno o UI
INSERT INTO ai_providers (provider_name, display_name, api_key, is_active, is_default) VALUES
('groq', 'Groq AI', 'TU_API_KEY_AQUI', true, true),
('chutes', 'Chutes AI', 'TU_API_KEY_AQUI', false, false)
ON CONFLICT (provider_name) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE ai_providers IS 'Tabla para configuración de proveedores de IA con sus API keys y modelos disponibles';
COMMENT ON COLUMN ai_providers.provider_name IS 'Nombre técnico del proveedor (groq, chutes, openai)';
COMMENT ON COLUMN ai_providers.display_name IS 'Nombre amigable para mostrar en la interfaz';
COMMENT ON COLUMN ai_providers.api_key IS 'API key del proveedor (considerar encriptación en producción)';
COMMENT ON COLUMN ai_providers.models_available IS 'Lista de todos los modelos disponibles del proveedor';
COMMENT ON COLUMN ai_providers.embedding_models IS 'Modelos específicos para embeddings/RAG';
COMMENT ON COLUMN ai_providers.chat_models IS 'Modelos específicos para chat/corrección de datos';
COMMENT ON COLUMN ai_providers.is_active IS 'Si el proveedor está actualmente activo (solo uno puede estar activo)';
COMMENT ON COLUMN ai_providers.is_default IS 'Si es el proveedor por defecto cuando se activa';