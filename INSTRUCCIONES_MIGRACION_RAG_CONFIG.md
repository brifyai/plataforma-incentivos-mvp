# Instrucciones para Aplicar Migración - Columna rag_config

## Problema Solucionado

El error `Could not find the 'rag_config' column of 'company_ai_config'` ocurrió porque el código estaba intentando acceder a una columna que no existía en la base de datos.

## Solución Implementada

He creado la migración `016_add_rag_config_column.sql` que agrega la columna faltante a la tabla `company_ai_config`.

## Pasos para Aplicar la Migración

### 1. Acceder a Supabase Dashboard

1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `wvluqdldygmgncqqjkow`

### 2. Abrir el Editor SQL

1. En el menú lateral, ve a **SQL Editor**
2. Haz clic en **New query**

### 3. Ejecutar la Migración

Copia y pega el siguiente código SQL en el editor:

```sql
-- Migration: Agregar columna rag_config a company_ai_config
-- Descripción: Agregar configuración RAG para Retrieval-Augmented Generation
-- Versión: 1.0

-- Agregar columna rag_config a la tabla company_ai_config
ALTER TABLE company_ai_config 
ADD COLUMN IF NOT EXISTS rag_config JSONB DEFAULT '{
    "enabled": false,
    "model": "text-embedding-ada-002",
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
    "model": "text-embedding-ada-002",
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
```

4. Haz clic en **Run** para ejecutar la migración
5. Espera a que aparezca el mensaje "Success"

### 4. Verificar la Migración

Para verificar que la migración se aplicó correctamente, ejecuta esta consulta:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'company_ai_config' 
AND column_name = 'rag_config';
```

Deberías ver la columna `rag_config` con tipo `jsonb`.

### 5. Verificar Datos

Para verificar que los datos se actualizaron correctamente:

```sql
SELECT id, company_id, rag_config 
FROM company_ai_config 
LIMIT 5;
```

## Configuración RAG

La columna `rag_config` contiene la configuración para el sistema de Retrieval-Augmented Generation:

- **enabled**: Si el sistema RAG está activado
- **model**: Modelo de embeddings a usar
- **maxTokens**: Tokens máximos para generación
- **temperature**: Temperatura para generación
- **chunkSize**: Tamaño de los chunks de texto
- **chunkOverlap**: Superposición entre chunks
- **similarityThreshold**: Umbral de similitud
- **maxResults**: Resultados máximos a recuperar
- **includeMetadata**: Incluir metadatos
- **filterByCompany**: Filtrar por empresa
- **filterByClient**: Filtrar por cliente
- **boostRecentDocuments**: Priorizar documentos recientes
- **recentDaysBoost**: Días para considerar como recientes

## Después de la Migración

1. **Reiniciar la aplicación local** (si está corriendo)
2. **Probar la funcionalidad** que estaba dando el error
3. **Verificar que la configuración de IA** se guarde correctamente

## Si Hay Problemas

Si la migración falla:

1. **Verifica que tengas permisos** de administrador en Supabase
2. **Verifica que la tabla `company_ai_config` exista**
3. **Revisa el log de errores** en Supabase

## Archivos Modificados

- `supabase-migrations/016_add_rag_config_column.sql` - Nueva migración
- `INSTRUCCIONES_MIGRACION_RAG_CONFIG.md` - Este documento

## Siguientes Pasos

Una vez aplicada la migración:

1. El error de `rag_config` debería desaparecer
2. La aplicación debería poder guardar configuración de IA
3. El dashboard de IA debería funcionar correctamente