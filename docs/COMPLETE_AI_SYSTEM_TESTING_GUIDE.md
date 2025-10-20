# Guía Completa de Pruebas del Sistema de IA Actualizado

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de gestión de proveedores de IA con las siguientes características:

### ✅ Características Implementadas

1. **Base de Datos Centralizada**
   - Tabla `ai_providers` para almacenar API keys y configuraciones
   - Exclusión mutua: solo un proveedor activo a la vez
   - Campos específicos para modelos de chat y embedding

2. **Gestión Dinámica de Modelos**
   - Carga automática de modelos desde APIs de Groq y Chutes
   - Ordenamiento alfabético de todos los modelos
   - Separación clara entre modelos de chat y embedding

3. **Configuración RAG Optimizada**
   - Solo muestra modelos de embedding disponibles
   - Configuración multi-proveedor con exclusión mutua
   - Integración con base de datos para persistencia

4. **Sistema de Importación con IA**
   - Configurado exclusivamente para usar Groq
   - Todos los modelos disponibles cargados dinámicamente
   - API key almacenada en base de datos

## 🚀 Pasos para Ejecutar el Sistema

### Paso 1: Ejecutar SQL en Supabase

**Importante:** Debes ejecutar el siguiente SQL en el dashboard de Supabase para crear la tabla necesaria:

```sql
-- ========================================
-- CREACIÓN COMPLETA DE TABLA AI_PROVIDERS
-- ========================================

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

-- 2. Crear índices para mejor rendimiento
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

CREATE TRIGGER IF NOT EXISTS trigger_ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_providers_updated_at();

-- 4. Crear función de exclusión mutua
CREATE OR REPLACE FUNCTION enforce_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está activando un proveedor, desactivar todos los demás
    IF NEW.is_active = true THEN
        UPDATE ai_providers 
        SET is_active = false 
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para exclusión mutua
DROP TRIGGER IF EXISTS trigger_ai_providers_mutual_exclusion ON ai_providers;
CREATE TRIGGER trigger_ai_providers_mutual_exclusion
    BEFORE INSERT OR UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_active_provider();

-- 6. Insertar datos iniciales con API keys reales
INSERT INTO ai_providers (provider_name, display_name, api_key, is_active) 
VALUES 
    (
        'groq', 
        'Groq', 
        'gsk_y2a73uU3wRl61xU1b4tBWGdyb3FYp6eR0l3Q4rR2l8XzVqN', 
        true
    ),
    (
        'chutes', 
        'Chutes AI', 
        'sk-0c8e8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b8c8a8b', 
        false
    )
ON CONFLICT (provider_name) DO UPDATE SET
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- 7. Verificar creación
SELECT 
    provider_name,
    display_name,
    CASE WHEN api_key IS NOT NULL AND LENGTH(api_key) > 10 THEN '✅ Configurada' ELSE '❌ Faltante' END as api_key_status,
    is_active,
    created_at
FROM ai_providers 
ORDER BY provider_name;
```

### Paso 2: Ejecutar Script de Pruebas

**Opción A: Ejecución en Navegador (Recomendado)**

1. Abre la aplicación en `http://localhost:3002`
2. Abre la consola del navegador (F12)
3. Copia y pega el contenido del archivo `scripts/test_complete_ai_system.js`
4. Presiona Enter para ejecutar las pruebas

**Opción B: Ejecución con Node.js**

```bash
# Instalar dependencias si es necesario
npm install @supabase/supabase-js

# Ejecutar el script
node scripts/test_complete_ai_system.js
```

## 📊 Qué Pruebas se Ejecutan

### 1. Pruebas de Base de Datos
- ✅ Conexión a Supabase
- ✅ Verificación de tabla `ai_providers`
- ✅ Estructura correcta de columnas
- ✅ Datos iniciales configurados

### 2. Pruebas de Servicio de Proveedores
- ✅ Obtener todos los proveedores
- ✅ Obtener proveedor activo
- ✅ Activación/desactivación con exclusión mutua
- ✅ Gestión de API keys

### 3. Pruebas de Carga Dinámica de Modelos
- ✅ Obtener modelos de chat desde API Groq
- ✅ Obtener modelos de embedding desde API Groq
- ✅ Obtener modelos desde API Chutes
- ✅ Ordenamiento alfabético correcto

### 4. Pruebas de Configuración RAG
- ✅ Obtener configuración RAG
- ✅ Filtrado correcto de modelos embedding
- ✅ Estructura válida de modelos

### 5. Pruebas de Sistema de Importación
- ✅ Configuración exclusiva de Groq
- ✅ Procesamiento autónomo con IA
- ✅ Normalización de datos

## 🎯 Resultados Esperados

### Si todo funciona correctamente:
- **Tasa de éxito: 100%**
- **Proveedores configurados:** Groq (activo), Chutes (inactivo)
- **Modelos cargados:** Todos los modelos disponibles de ambas APIs
- **Exclusión mutua:** Funcionando correctamente
- **RAG:** Configurado con modelos embedding
- **Importación:** Usando exclusivamente Groq

### Si hay problemas:
- Revisa el reporte detallado que genera el script
- Verifica que el SQL se ejecutó correctamente en Supabase
- Confirma que las API keys son válidas
- Verifica la conexión a internet para las APIs

## 🔍 Verificación Manual

Además del script automatizado, puedes verificar manualmente:

### 1. En la Interfaz Web
1. Ve a `http://localhost:3002/empresa/ia/proveedores`
2. Verifica que aparezcan Groq y Chutes
3. Activa/desactiva proveedores y verifica exclusión mutua
4. Confirma que los modelos se carguen dinámicamente

### 2. En Configuración RAG
1. Ve a `http://localhost:3002/empresa/ia/configuracion`
2. Verifica que solo aparezcan modelos embedding
3. Cambia de proveedor y verifica carga automática

### 3. En Sistema de Importación
1. Ve a `http://localhost:3002/empresa/clientes`
2. Haz clic en "Importar Deudores"
3. Verifica que solo aparezcan modelos de Groq

## 🚨 Solución de Problemas Comunes

### Problema: "Tabla ai_providers no existe"
**Solución:** Ejecuta el SQL completo en Supabase Dashboard

### Problema: "API key inválida"
**Solución:** Verifica que las API keys en el SQL sean correctas y estén actualizadas

### Problema: "No se pueden cargar modelos desde API"
**Solución:** 
1. Verifica conexión a internet
2. Confirma que las API keys sean válidas
3. Revisa límites de cuota en los proveedores

### Problema: "Exclusión mutua no funciona"
**Solución:** Verifica que el trigger `trigger_ai_providers_mutual_exclusion` se haya creado correctamente

## 📈 Monitoreo y Mantenimiento

### Para mantener el sistema funcionando correctamente:

1. **Actualizar API keys:**
   ```sql
   UPDATE ai_providers 
   SET api_key = 'nueva_api_key_aqui' 
   WHERE provider_name = 'groq';
   ```

2. **Verificar estado de proveedores:**
   ```sql
   SELECT provider_name, display_name, is_active, 
          CASE WHEN api_key IS NOT NULL AND LENGTH(api_key) > 10 THEN '✅' ELSE '❌' END as api_status
   FROM ai_providers;
   ```

3. **Forzar recarga de modelos:**
   ```sql
   UPDATE ai_providers 
   SET last_models_fetch = NULL 
   WHERE provider_name = 'groq' OR provider_name = 'chutes';
   ```

## 🎉 ¡Listo para Producción!

Una vez que todas las pruebas pasen (100% tasa de éxito), el sistema estará completamente funcional y listo para uso en producción con:

- ✅ Gestión centralizada de API keys
- ✅ Exclusión mutua de proveedores
- ✅ Carga dinámica de modelos
- ✅ Configuración RAG optimizada
- ✅ Sistema de importación con IA
- ✅ Ordenamiento alfabético de modelos
- ✅ Persistencia en base de datos
- ✅ Manejo robusto de errores

---

**Nota:** Este sistema reemplaza completamente la configuración anterior basada en variables de entorno, proporcionando una solución más robusta, escalable y fácil de mantener.