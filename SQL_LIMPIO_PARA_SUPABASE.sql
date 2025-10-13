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