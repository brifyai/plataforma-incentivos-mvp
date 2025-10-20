# Configuración Manual del Sistema RAG

## 📋 Instrucciones para Aplicar la Migración RAG

Dado que el script automatizado requiere credenciales de administrador, aquí están las instrucciones manuales para configurar el sistema RAG.

## 🔧 Paso 1: Habilitar Extensión pgvector

Ejecuta este SQL en el panel de Supabase (SQL Editor):

```sql
-- Habilitar extensión pgvector para vectores
CREATE EXTENSION IF NOT EXISTS vector;
```

## 🔧 Paso 2: Crear Tablas RAG

Copia y ejecuta este SQL completo en el panel de Supabase:

```sql
-- ========================================
-- Migración: Sistema RAG para Base de Conocimiento
-- ========================================

-- 1. Tabla de embeddings para documentos
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES company_knowledge_base(id) ON DELETE CASCADE,
  corporate_client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información del chunk
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_tokens INTEGER NOT NULL,
  
  -- Vector embedding (1536 dimensiones para OpenAI text-embedding-ada-002)
  embedding vector(1536) NOT NULL,
  
  -- Metadatos
  metadata JSONB DEFAULT '{}',
  
  -- Control de proceso
  processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint único para evitar duplicados
  UNIQUE(document_id, chunk_index)
);

-- 2. Tabla para tracking de trabajos de procesamiento RAG
CREATE TABLE IF NOT EXISTS rag_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES company_knowledge_base(id) ON DELETE CASCADE,
  corporate_client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Estado del trabajo
  job_status TEXT NOT NULL DEFAULT 'pending' CHECK (job_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  job_type TEXT NOT NULL DEFAULT 'process' CHECK (job_type IN ('process', 'reprocess', 'delete')),
  
  -- Contadores y métricas
  total_chunks INTEGER DEFAULT 0,
  processed_chunks INTEGER DEFAULT 0,
  failed_chunks INTEGER DEFAULT 0,
  
  -- Tiempos
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER,
  
  -- Configuración usada
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  
  -- Errores
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Tabla de caché para búsquedas semánticas
CREATE TABLE IF NOT EXISTS semantic_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- Query original
  query_text TEXT NOT NULL,
  query_embedding vector(1536) NOT NULL,
  
  -- Resultados cacheados
  cached_results JSONB NOT NULL DEFAULT '[]',
  
  -- Configuración de búsqueda
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10,
  
  -- Control de caché
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  UNIQUE(corporate_client_id, query_text, similarity_threshold, max_results)
);

-- 4. Índices optimizados para rendimiento

-- Índice HNSW para búsqueda de similitud vectorial
CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding_hnsw 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índices para filtrado y consultas comunes
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_corporate_client_id ON document_embeddings(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_company_id ON document_embeddings(company_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_status ON document_embeddings(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_created_at ON document_embeddings(created_at);

-- Índices para trabajos de procesamiento
CREATE INDEX IF NOT EXISTS idx_rag_jobs_document_id ON rag_processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_jobs_corporate_client_id ON rag_processing_jobs(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_rag_jobs_status ON rag_processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_rag_jobs_created_at ON rag_processing_jobs(created_at);

-- Índices para caché
CREATE INDEX IF NOT EXISTS idx_semantic_cache_corporate_client_id ON semantic_search_cache(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires_at ON semantic_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_last_accessed ON semantic_search_cache(last_accessed_at);

-- 5. Políticas de Row Level Security (RLS)

-- Habilitar RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_search_cache ENABLE ROW LEVEL SECURITY;

-- Políticas para document_embeddings
CREATE POLICY "Users can view embeddings for their corporate clients"
ON document_embeddings FOR SELECT
USING (
  corporate_client_id IN (
    SELECT id FROM corporate_clients 
    WHERE company_id = (
      SELECT company_id FROM auth.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Service role can manage all embeddings"
ON document_embeddings FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Políticas para rag_processing_jobs
CREATE POLICY "Users can view jobs for their corporate clients"
ON rag_processing_jobs FOR SELECT
USING (
  corporate_client_id IN (
    SELECT id FROM corporate_clients 
    WHERE company_id = (
      SELECT company_id FROM auth.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Service role can manage all jobs"
ON rag_processing_jobs FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Políticas para semantic_search_cache
CREATE POLICY "Users can access cache for their corporate clients"
ON semantic_search_cache FOR ALL
USING (
  corporate_client_id IN (
    SELECT id FROM corporate_clients 
    WHERE company_id = (
      SELECT company_id FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- 6. Triggers para actualización automática de timestamps

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
CREATE TRIGGER update_document_embeddings_updated_at 
    BEFORE UPDATE ON document_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_processing_jobs_updated_at 
    BEFORE UPDATE ON rag_processing_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar last_accessed_at en caché
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_semantic_search_cache_access 
    BEFORE UPDATE ON semantic_search_cache 
    FOR EACH ROW EXECUTE FUNCTION update_last_accessed_at();

-- 7. Funciones de utilidad para operaciones RAG

-- Función para buscar documentos similares
CREATE OR REPLACE FUNCTION search_similar_documents(
  p_corporate_client_id UUID,
  p_query_embedding vector(1536),
  p_similarity_threshold FLOAT DEFAULT 0.7,
  p_max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  document_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  similarity FLOAT,
  document_title TEXT,
  document_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_chunks AS (
      SELECT 
        de.document_id,
        de.chunk_index,
        de.chunk_text,
        1 - (de.embedding <=> p_query_embedding) as similarity,
        kb.title as document_title,
        kb.category as document_category
      FROM document_embeddings de
      JOIN company_knowledge_base kb ON de.document_id = kb.id
      WHERE de.corporate_client_id = p_corporate_client_id
        AND de.processing_status = 'completed'
        AND 1 - (de.embedding <=> p_query_embedding) >= p_similarity_threshold
      ORDER BY similarity DESC
      LIMIT p_max_results
    )
    SELECT * FROM ranked_chunks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar caché expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM semantic_search_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Vista para estadísticas RAG
CREATE OR REPLACE VIEW rag_statistics AS
SELECT 
    cc.id as corporate_client_id,
    cc.name as corporate_client_name,
    COUNT(DISTINCT de.document_id) as documents_vectorized,
    COUNT(de.id) as total_chunks,
    AVG(de.chunk_tokens) as avg_chunk_tokens,
    COUNT(CASE WHEN de.processing_status = 'completed' THEN 1 END) as completed_chunks,
    COUNT(CASE WHEN de.processing_status = 'failed' THEN 1 END) as failed_chunks,
    MAX(de.created_at) as last_vectorization,
    COUNT(DISTINCT rj.id) as total_processing_jobs,
    COUNT(CASE WHEN rj.job_status = 'completed' THEN 1 END) as completed_jobs,
    AVG(rj.processing_time_ms) as avg_processing_time_ms
FROM corporate_clients cc
LEFT JOIN document_embeddings de ON cc.id = de.corporate_client_id
LEFT JOIN rag_processing_jobs rj ON cc.id = rj.corporate_client_id
GROUP BY cc.id, cc.name;
```

## 🔧 Paso 3: Configurar API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva API key
5. Agrégala a tu archivo `.env`:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🔧 Paso 4: Verificar Instalación

1. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

2. Navega a: http://localhost:3002/empresa/ia/conocimiento

3. Intenta agregar un nuevo documento y verifica que:
   - El documento se guarde correctamente
   - Aparezca el indicador de vectorización
   - El estado cambie a "Vectorizado" después de unos segundos

## 🔧 Paso 5: Probar Búsqueda Semántica

Una vez que tengas documentos vectorizados, puedes probar la búsqueda semántica desde la consola del navegador:

```javascript
// Abre la consola en http://localhost:3002/empresa/ia/conocimiento
import { ragService } from './src/services/ragService.js';

// Reemplaza con un ID real de cliente corporativo
const clientId = 'tu-client-id-aqui';

// Buscar documentos sobre "políticas de descuento"
ragService.semanticSearch(clientId, "políticas de descuento")
  .then(results => console.log('Resultados:', results))
  .catch(error => console.error('Error:', error));
```

## ✅ Verificación Final

Para verificar que todo funciona correctamente:

1. **Tablas creadas**: Deberías ver las tablas `document_embeddings`, `rag_processing_jobs` y `semantic_search_cache` en el panel de Supabase
2. **Extensión pgvector**: Debería estar habilitada en tu base de datos
3. **Vectorización**: Los documentos nuevos deberían vectorizarse automáticamente
4. **Búsqueda**: La búsqueda semántica debería devolver resultados relevantes

## 🚨 Solución de Problemas

### Error "extensión pgvector no encontrada"
```sql
-- Ejecutar en Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error "API Key de OpenAI inválida"
- Verifica que la API key sea correcta
- Confirma que tenga crédito disponible
- Revisa que esté en el formato correcto (sk-...)

### Error "Tablas no encontradas"
- Verifica que hayas ejecutado todo el SQL
- Revisa que no haya errores en la consola de Supabase
- Confirma que las tablas aparezcan en el listado

---

**Una vez completados estos pasos, el sistema RAG estará completamente funcional.**