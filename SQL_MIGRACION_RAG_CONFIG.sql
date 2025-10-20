-- Migration: Agregar columna rag_config a company_ai_config
-- Descripción: Agregar configuración RAG para Retrieval-Augmented Generation
-- Versión: 1.0

-- Agregar columna rag_config a la tabla company_ai_config
ALTER TABLE company_ai_config
ADD COLUMN IF NOT EXISTS rag_config JSONB DEFAULT '{
    "enabled": false,
    "model": "chutes",
    "maxTokens": 2000,
    "temperature": 0.7,
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "similarityThreshold": 0.7,
    "maxResults": 5,
    "includeMetadata": true,
    "filterByCompany": true,
    "filterByClient": true,
    "boostRecentDocuments": true,
    "recentDaysBoost": 30
}'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN company_ai_config.rag_config IS 'Configuración para sistema RAG (Retrieval-Augmented Generation) de IA';

-- Actualizar configuraciones existentes con valores por defecto para RAG
UPDATE company_ai_config
SET rag_config = '{
    "enabled": false,
    "model": "chutes",
    "maxTokens": 2000,
    "temperature": 0.7,
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "similarityThreshold": 0.7,
    "maxResults": 5,
    "includeMetadata": true,
    "filterByCompany": true,
    "filterByClient": true,
    "boostRecentDocuments": true,
    "recentDaysBoost": 30
}'::jsonb
WHERE rag_config IS NULL;