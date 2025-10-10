-- =============================================
-- AI CONFIGURATION KEYS MIGRATION
-- Agregar claves individuales para configuración de APIs de IA
-- =============================================

-- Insertar configuraciones individuales para APIs de IA
-- Estas claves serán usadas por la página de configuración de IA

INSERT INTO system_config (config_key, config_value, description)
SELECT 'chutes_api_key', 'null', 'API Key para Chutes AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'chutes_api_key');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'chutes_api_url', '"https://chutes.ai"', 'URL base para Chutes AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'chutes_api_url');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'chutes_api_active', 'false', 'Estado activo de Chutes AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'chutes_api_active');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'groq_api_key', 'null', 'API Key para Groq AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'groq_api_key');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'groq_api_url', '"https://api.groq.com"', 'URL base para Groq AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'groq_api_url');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'groq_api_active', 'false', 'Estado activo de Groq AI'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'groq_api_active');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'ai_selected_provider', '"chutes"', 'Proveedor de IA seleccionado por defecto'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'ai_selected_provider');

INSERT INTO system_config (config_key, config_value, description)
SELECT 'ai_selected_model', '"gpt-4"', 'Modelo de IA seleccionado por defecto'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE config_key = 'ai_selected_model');

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================