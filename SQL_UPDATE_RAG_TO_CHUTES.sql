-- Actualizar configuraciones RAG existentes para usar "chutes" como modelo por defecto
-- Este script actualiza los registros que ya tienen rag_config con el modelo anterior

-- Actualizar todas las configuraciones RAG existentes para usar "chutes"
UPDATE company_ai_config 
SET rag_config = rag_config || '{"model": "chutes"}'::jsonb
WHERE rag_config IS NOT NULL 
AND rag_config->>'model' != 'chutes';

-- Verificación: Mostrar cuántos registros fueron actualizados
SELECT 
    COUNT(*) as total_actualizados,
    'Configuraciones RAG actualizadas a chutes' as descripcion
FROM company_ai_config 
WHERE rag_config->>'model' = 'chutes';

-- Verificación: Mostrar configuraciones actuales
SELECT 
    id,
    company_id,
    rag_config->>'model' as modelo_actual,
    rag_config->>'enabled' as rag_enabled
FROM company_ai_config 
WHERE rag_config IS NOT NULL
LIMIT 5;