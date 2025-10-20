# Sistema RAG (Retrieval-Augmented Generation) - Documentación

## 📋 Overview

El sistema RAG permite vectorizar documentos de la base de conocimiento para realizar búsquedas semánticas inteligentes. Esto habilita a la IA a encontrar información relevante basada en el significado y contexto, no solo en palabras clave exactas.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Base de Datos Vectorial (PostgreSQL + pgvector)**
   - Almacena embeddings de documentos en formato vectorial
   - Índices HNSW para búsqueda de similitud de alta performance
   - Tablas optimizadas para consultas semánticas

2. **Servicio RAG (ragService.js)**
   - Chunking inteligente de documentos
   - Generación de embeddings con OpenAI API
   - Búsqueda semántica con caché
   - Gestión de estados de procesamiento

3. **Interfaz de Usuario (AIDashboardPage.jsx)**
   - Visualización de estado de vectorización
   - Reprocesamiento manual de documentos
   - Indicadores de progreso y errores

4. **Sistema de Caché**
   - Almacena resultados de búsquedas frecuentes
   - Reduce carga en API de OpenAI
   - Mejora tiempo de respuesta

## 📁 Estructura de Archivos

```
├── supabase-migrations/
│   └── 015_create_rag_embeddings.sql    # Migración de base de datos
├── src/
│   ├── services/
│   │   └── ragService.js               # Lógica principal RAG
│   └── pages/company/
│       └── AIDashboardPage.jsx         # UI con componentes RAG
├── scripts/
│   └── apply_rag_migration.js          # Script para aplicar migración
└── docs/
    └── RAG_SYSTEM_IMPLEMENTATION.md    # Esta documentación
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### `document_embeddings`
Almacena los vectores embeddings de cada chunk de documento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Referencia al documento original |
| `chunk_index` | INTEGER | Índice del chunk en el documento |
| `chunk_text` | TEXT | Texto del chunk |
| `embedding` | vector(1536) | Vector embedding (OpenAI) |
| `processing_status` | TEXT | Estado del procesamiento |
| `created_at` | timestamptz | Timestamp de creación |

#### `rag_processing_jobs`
Registra los trabajos de procesamiento para auditoría y seguimiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Documento procesado |
| `job_status` | TEXT | Estado del trabajo |
| `total_chunks` | INTEGER | Total de chunks |
| `processed_chunks` | INTEGER | Chunks procesados |
| `processing_time_ms` | INTEGER | Tiempo de procesamiento |

#### `semantic_search_cache`
Caché de búsquedas semánticas para mejorar rendimiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `query_text` | TEXT | Query original |
| `query_embedding` | vector(1536) | Vector del query |
| `cached_results` | JSONB | Resultados cacheados |
| `expires_at` | timestamptz | Fecha de expiración |

### Índices Optimizados

- **HNSW Index**: `idx_document_embeddings_embedding_hnsw`
  - Optimizado para búsqueda de similitud vectorial
  - Configuración: m=16, ef_construction=64
  - Búsqueda por coseno (vector_cosine_ops)

## 🔧 Configuración

### Variables de Entorno

Agregar al archivo `.env`:

```bash
# OpenAI Configuration (RAG System)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Requisitos Previos

1. **Extensión pgvector** en PostgreSQL
2. **API Key de OpenAI** con crédito disponible
3. **Permisos de administrador** para ejecutar migraciones

## 🚀 Instalación y Configuración

### 1. Aplicar Migración de Base de Datos

```bash
# Opción 1: Usar el script automatizado
node scripts/apply_rag_migration.js

# Opción 2: Ejecutar SQL manualmente
# Copia el contenido de supabase-migrations/015_create_rag_embeddings.sql
# Ejecútalo en el panel SQL de Supabase
```

### 2. Configurar API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva API key
5. Agrégala a tu archivo `.env`

### 3. Verificar Instalación

```bash
# Reiniciar el servidor de desarrollo
npm run dev

# Navegar a http://localhost:3002/empresa/ia/conocimiento
# Verificar que la sección de documentos muestre estados de vectorización
```

## 💡 Flujo de Trabajo

### 1. Vectorización de Documentos

```
Documento → Chunking → Embeddings → Almacenamiento
    ↓           ↓          ↓           ↓
  Texto    Trozos de    Vectores    Base de
Completo  1000 chars   OpenAI      Datos
```

#### Proceso Detallado:

1. **Chunking Inteligente**
   - Divide documentos en chunks de 1000 caracteres
   - 200 caracteres de overlap entre chunks
   - Corta en puntos lógicos (puntos, saltos de línea)

2. **Generación de Embeddings**
   - Usa OpenAI `text-embedding-ada-002`
   - 1536 dimensiones por vector
   - Reintentos automáticos para errores temporales

3. **Almacenamiento**
   - Guarda chunks y embeddings en `document_embeddings`
   - Registra trabajo en `rag_processing_jobs`
   - Actualiza estado en tiempo real

### 2. Búsqueda Semántica

```
Query → Embedding → Búsqueda Vectorial → Ranking → Resultados
  ↓        ↓            ↓                ↓          ↓
 Pregunta  Vector    Similitud        Relevancia  Documentos
 Usuario   OpenAI    Coseno          Máxima      Encontrados
```

#### Proceso Detallado:

1. **Generación de Embedding del Query**
   - Convierte la pregunta del usuario a vector
   - Usa el mismo modelo que los documentos

2. **Búsqueda Vectorial**
   - Calcula similitud de coseno con todos los chunks
   - Filtra por umbral de similitud (default: 0.7)
   - Limita resultados (default: 10)

3. **Agrupación y Ranking**
   - Agrupa chunks por documento
   - Calcula scores agregados (máximo, promedio)
   - Ordena por relevancia

4. **Caché**
   - Almacena resultados frecuentes
   - Expira después de 24 horas
   - Reduce llamadas a OpenAI

## 🎯 Casos de Uso

### 1. Búsqueda en Base de Conocimiento

```javascript
// Buscar documentos sobre "políticas de descuento"
const results = await ragService.semanticSearch(
  corporateClientId,
  "políticas de descuento para clientes",
  {
    similarityThreshold: 0.7,
    maxResults: 5,
    useCache: true
  }
);
```

### 2. Contexto para IA

```javascript
// Obtener contexto relevante para una pregunta de deudor
const context = await ragService.semanticSearch(
  corporateClientId,
  "¿puedo pagar mi deuda en cuotas?",
  { similarityThreshold: 0.6, maxResults: 3 }
);

// Usar contexto en prompt de IA
const prompt = `Usa esta información para responder:
${context.results.map(doc => doc.title).join('\n')}

Pregunta: ${userQuestion}`;
```

### 3. Recomendación de Documentos

```javascript
// Encontrar documentos relacionados
const related = await ragService.semanticSearch(
  corporateClientId,
  documentTitle,
  { similarityThreshold: 0.8, maxResults: 5 }
);
```

## 📊 Monitoreo y Métricas

### Estadísticas Disponibles

```javascript
const stats = await ragService.getRAGStatistics(corporateClientId);

console.log(`
Documentos vectorizados: ${stats.documents_vectorized}
Total chunks: ${stats.total_chunks}
Chunks exitosos: ${stats.completed_chunks}
Chunks fallidos: ${stats.failed_chunks}
Tiempo promedio: ${stats.avg_processing_time_ms}ms
Última vectorización: ${stats.last_vectorization}
`);
```

### Vista SQL de Estadísticas

```sql
-- Consultar estadísticas directamente
SELECT * FROM rag_statistics 
WHERE corporate_client_id = 'uuid';

-- Ver trabajos de procesamiento
SELECT * FROM rag_processing_jobs 
WHERE corporate_client_id = 'uuid'
ORDER BY created_at DESC LIMIT 10;
```

## 🔍 Solución de Problemas

### Problemas Comunes

#### 1. "Extensión pgvector no encontrada"

**Solución:**
```sql
-- Ejecutar en Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. "API Key de OpenAI inválida"

**Solución:**
- Verificar que la API key sea correcta
- Confirmar que tenga crédito disponible
- Revisar que esté en el formato correcto (sk-...)

#### 3. "Error en vectorización de documento"

**Solución:**
- Verificar logs del navegador
- Revisar estado del trabajo en `rag_processing_jobs`
- Usar botón de reprocesamiento en la UI

#### 4. "Búsquedas lentas"

**Solución:**
- Verificar que el índice HNSW esté creado
- Revisar configuración de caché
- Considerar reducir `maxResults`

### Debugging

```javascript
// Verificar estado de un documento
const status = await ragService.getDocumentVectorStatus(documentId);
console.log('Estado:', status);

// Limpiar caché si hay problemas
const cleaned = await ragService.cleanupExpiredCache();
console.log('Caché limpiado:', cleaned);
```

## 🚀 Optimizaciones

### 1. Rendimiento

- **Índices HNSW**: Optimizados para búsquedas de alta dimensionalidad
- **Caché inteligente**: Reduce llamadas a API externa
- **Batch processing**: Procesa múltiples chunks eficientemente
- **Connection pooling**: Reusa conexiones a base de datos

### 2. Costos

- **Caché**: Reduce llamadas a OpenAI (costo por token)
- **Retry logic**: Evita llamadas duplicadas por errores temporales
- **Efficient chunking**: Maximiza información por embedding

### 3. Escalabilidad

- **Horizontal scaling**: La base de datos vectorial escala bien
- **Async processing**: No bloquea la UI durante vectorización
- **Job queue**: Los trabajos se procesan independientemente

## 🔮 Mejoras Futuras

### 1. Features Planeados

- **Hybrid Search**: Combinar búsqueda semántica con keywords
- **Reranking**: Re-rank resultados con modelos más potentes
- **Document updates**: Actualizar embeddings incrementalmente
- **Multi-modal**: Soporte para imágenes y otros formatos

### 2. Optimizaciones

- **Vector quantization**: Reducir tamaño de embeddings
- **Distributed search**: Búsqueda paralela en múltiples nodos
- **Smart caching**: Caché predictivo basado en patrones
- **Compression**: Almacenamiento eficiente de vectores

## 📚 Referencias

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [RAG Paper](https://arxiv.org/abs/2005.11401)

## 🤝 Contribución

Para contribuir al sistema RAG:

1. **Testing**: Crear tests para nuevas funcionalidades
2. **Documentation**: Mantener esta documentación actualizada
3. **Performance**: Medir y optimizar tiempos de respuesta
4. **Monitoring**: Agregar métricas y alertas

---

**Última actualización**: 13 de Octubre, 2025
**Versión**: 1.0.0
**Estado**: ✅ Implementado y en producción