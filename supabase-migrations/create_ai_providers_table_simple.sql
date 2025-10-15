-- ========================================
-- CREACIÓN SIMPLIFICADA DE TABLA AI_PROVIDERS
-- ========================================
-- Ejecutar este script directamente en el dashboard de Supabase
-- SQL Editor -> Paste this entire script -> Run

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    models_available JSONB DEFAULT '[]'::jsonb,
    embedding_models JSONB DEFAULT '[]'::jsonb,
    chat_models JSONB DEFAULT '[]'::jsonb,
    last_models_fetch TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_name ON ai_providers(provider_name);

-- 3. Crear trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_ai_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crearlo nuevo
DROP TRIGGER IF EXISTS trigger_ai_providers_updated_at ON ai_providers;
CREATE TRIGGER trigger_ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_providers_updated_at();

-- 4. Crear función y trigger de exclusión mutua
CREATE OR REPLACE FUNCTION enforce_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE ai_providers 
        SET is_active = false 
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crearlo nuevo
DROP TRIGGER IF EXISTS trigger_ai_providers_mutual_exclusion ON ai_providers;
CREATE TRIGGER trigger_ai_providers_mutual_exclusion
    BEFORE INSERT OR UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_active_provider();

-- 5. Insertar datos iniciales con API keys reales
INSERT INTO ai_providers (provider_name, display_name, api_key, is_active) 
VALUES 
    ('groq', 'Groq', 'gsk_y2a73uU3wRl61xU1b4tBWGdyb3FYp6eR0l3Q4rR2l8XzVqN', true),
    ('chutes', 'Chutes AI', 'sk-0c8e8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b', false)
ON CONFLICT (provider_name) DO UPDATE SET
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- 6. Verificación final
SELECT 
    provider_name,
    display_name,
    CASE WHEN api_key IS NOT NULL AND LENGTH(api_key) > 10 THEN '✅ Configurada' ELSE '❌ Faltante' END as api_key_status,
    is_active,
    created_at
FROM ai_providers 
ORDER BY provider_name;

-- Mensaje de éxito
SELECT '✅ Tabla ai_providers creada exitosamente con datos iniciales' as status;