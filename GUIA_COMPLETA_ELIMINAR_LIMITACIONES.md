# 🚀 GUÍA COMPLETA PARA ELIMINAR LIMITACIONES DE LA BASE DE DATOS

## 📋 Problemas Identificados

1. **Campo faltante**: `display_category` no existe en `corporate_clients`
2. **Tablas faltantes**: Las tablas de knowledge base no están creadas
3. **Limitaciones de API**: No se pueden crear tablas directamente desde la API REST

## 🛠️ SOLUCIÓN COMPLETA (Paso a Paso)

### Opción 1: Ejecución Manual (Recomendada)

#### Paso 1: Acceder al Panel de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto

#### Paso 2: Abrir el Editor SQL
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**

#### Paso 3: Ejecutar el SQL Completo
Copia y pega el siguiente contenido en el editor:

```sql
-- =====================================================
-- CREAR TABLAS DE KNOWLEDGE BASE COMPLETAS
-- =====================================================

-- 1. Agregar campo display_category si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corporate_clients' 
        AND column_name = 'display_category'
    ) THEN
        ALTER TABLE corporate_clients ADD COLUMN display_category VARCHAR(50) DEFAULT 'financiera';
        RAISE NOTICE 'Campo display_category agregado a corporate_clients';
    END IF;
END $$;

-- 2. Tabla de configuración de IA por cliente corporativo
CREATE TABLE IF NOT EXISTS negotiation_ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Límites de negociación
    max_negotiation_discount INTEGER DEFAULT 15,
    max_negotiation_term INTEGER DEFAULT 12,
    
    -- Configuración de operación
    auto_respond BOOLEAN DEFAULT true,
    working_hours JSONB DEFAULT '{
        "start": "09:00",
        "end": "18:00",
        "timezone": "America/Santiago"
    }'::jsonb,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(corporate_client_id, company_id)
);

-- 3. Tabla de políticas específicas por cliente corporativo
CREATE TABLE IF NOT EXISTS corporate_client_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('discount', 'payment_terms', 'escalation', 'communication', 'other')),
    policy_description TEXT,
    policy_value DECIMAL(10,2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Tabla de respuestas personalizadas por cliente corporativo
CREATE TABLE IF NOT EXISTS corporate_client_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    trigger_keyword TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'intent', 'sentiment', 'condition')),
    response_template TEXT NOT NULL,
    
    use_debtor_name BOOLEAN DEFAULT true,
    use_corporate_name BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. Tabla de base de conocimiento por cliente corporativo
CREATE TABLE IF NOT EXISTS company_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    document_title TEXT NOT NULL,
    document_content TEXT NOT NULL,
    document_category TEXT DEFAULT 'general',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 6. Habilitar RLS
ALTER TABLE negotiation_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_client_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_client_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS
CREATE POLICY IF NOT EXISTS "Users can manage AI config for their companies" ON negotiation_ai_config
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage policies for their companies" ON corporate_client_policies
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage responses for their companies" ON corporate_client_responses
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage knowledge base for their companies" ON company_knowledge_base
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- 8. Insertar datos de ejemplo
INSERT INTO negotiation_ai_config (corporate_client_id, company_id, max_negotiation_discount, max_negotiation_term) 
SELECT 
    cc.id,
    c.id,
    15,
    12
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM negotiation_ai_config nac 
    WHERE nac.corporate_client_id = cc.id AND nac.company_id = c.id
);

INSERT INTO corporate_client_policies (corporate_client_id, company_id, policy_name, policy_type, policy_description, policy_value)
SELECT 
    cc.id,
    c.id,
    'Descuento estándar',
    'discount',
    'Descuento máximo aplicable para negociaciones estándar',
    15.0
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_client_policies ccp 
    WHERE ccp.corporate_client_id = cc.id AND ccp.company_id = c.id
)
LIMIT 3;

INSERT INTO corporate_client_responses (corporate_client_id, company_id, trigger_keyword, trigger_type, response_template, use_debtor_name, use_corporate_name)
SELECT 
    cc.id,
    c.id,
    'descuento',
    'keyword',
    'Hola {nombre_deudor}, como cliente de {nombre_empresa} podemos revisar opciones de descuento para ti.',
    true,
    true
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_client_responses ccr 
    WHERE ccr.corporate_client_id = cc.id AND ccr.company_id = c.id
)
LIMIT 3;

INSERT INTO company_knowledge_base (corporate_client_id, company_id, document_title, document_content, document_category)
SELECT 
    cc.id,
    c.id,
    'Política de descuentos',
    'Nuestra política permite descuentos de hasta 15% para clientes con buen historial.',
    'policy'
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM company_knowledge_base ckb 
    WHERE ckb.corporate_client_id = cc.id AND ckb.company_id = c.id
)
LIMIT 3;

-- 9. Actualizar display_category para clientes existentes
UPDATE corporate_clients 
SET display_category = CASE 
    WHEN name LIKE '%Banco%' THEN 'banco'
    WHEN name LIKE '%Retail%' THEN 'retail'
    WHEN name LIKE '%Telecom%' THEN 'telecomunicaciones'
    ELSE 'financiera'
END
WHERE display_category IS NULL OR display_category = '';

-- 10. Verificación
SELECT 'negotiation_ai_config' as table_name, COUNT(*) as record_count FROM negotiation_ai_config
UNION ALL
SELECT 'corporate_client_policies' as table_name, COUNT(*) as record_count FROM corporate_client_policies
UNION ALL
SELECT 'corporate_client_responses' as table_name, COUNT(*) as record_count FROM corporate_client_responses
UNION ALL
SELECT 'company_knowledge_base' as table_name, COUNT(*) as record_count FROM company_knowledge_base
UNION ALL
SELECT 'corporate_clients' as table_name, COUNT(*) as record_count FROM corporate_clients;
```

#### Paso 4: Ejecutar el SQL
1. Haz clic en el botón **"Run"** (▶️)
2. Espera a que se complete la ejecución
3. Verifica que no haya errores

#### Paso 5: Verificar los Resultados
Deberías ver un resultado similar a:
```
table_name                    | record_count
----------------------------+-------------
negotiation_ai_config        | 3
corporate_client_policies    | 3
corporate_client_responses   | 3
company_knowledge_base       | 3
corporate_clients            | 3
```

### Opción 2: Usar Archivo SQL Preparado

1. Abre el archivo `create_missing_knowledge_tables.sql`
2. Copia todo el contenido
3. Pégalo en el Editor SQL de Supabase
4. Ejecútalo

## 🔧 Verificación Post-Ejecución

### Paso 1: Verificar en la Aplicación
1. Inicia sesión en la aplicación
2. Ve a **"Base de Conocimiento"** en el menú
3. Deberías ver los clientes corporativos cargados

### Paso 2: Probar Funcionalidad
1. Selecciona un cliente corporativo
2. Intenta agregar un documento, política o respuesta
3. Verifica que todo funcione correctamente

### Paso 3: Verificar con Script
Ejecuta el script de verificación:
```bash
node check_corporate_clients.cjs
```

## 🚨 Solución de Problemas Comunes

### Problema: "Permission denied"
**Solución**: Asegúrate de tener permisos de administrador en Supabase

### Problema: "Table already exists"
**Solución**: El SQL usa `IF NOT EXISTS`, así que debería funcionar. Si no, elimina las tablas manualmente primero.

### Problema: "Foreign key constraint"
**Solución**: Asegúrate de que la tabla `corporate_clients` tenga datos antes de ejecutar las inserciones.

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de Supabase
2. Verifica que las variables de entorno estén correctas
3. Ejecuta el script de verificación para diagnosticar

## ✅ Resultado Esperado

Después de seguir esta guía:
- ✅ Todas las tablas de knowledge base estarán creadas
- ✅ Los clientes corporativos tendrán el campo `display_category`
- ✅ Habrá datos de ejemplo para probar
- ✅ La aplicación funcionará sin limitaciones
- ✅ Podrás agregar documentos, políticas y respuestas personalizadas

¡Listo! Has eliminado todas las limitaciones de la base de datos. 🎉