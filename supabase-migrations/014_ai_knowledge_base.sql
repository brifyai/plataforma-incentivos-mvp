-- =============================================
-- AI KNOWLEDGE BASE MIGRATION
-- Tabla para base de conocimiento por empresa para IA conversacional
-- =============================================

-- Crear tabla de base de conocimiento por empresa
CREATE TABLE IF NOT EXISTS company_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'general', 'negotiation', 'policies', 'products', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[], -- Array de palabras clave para búsqueda
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_company_id ON company_knowledge_base(company_id);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_category ON company_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_keywords ON company_knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_base_active ON company_knowledge_base(is_active) WHERE is_active = true;

-- Crear tabla de configuración de límites de autoridad IA por empresa
CREATE TABLE IF NOT EXISTS company_ai_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    max_additional_discount DECIMAL(5,2) DEFAULT 15.00, -- Máximo descuento adicional en %
    max_term_months INTEGER DEFAULT 12, -- Máximo plazo en meses
    min_payment_percentage DECIMAL(5,2) DEFAULT 10.00, -- Mínimo porcentaje de pago inicial
    negotiation_timeout_hours INTEGER DEFAULT 24, -- Horas para timeout de negociación
    escalation_threshold_messages INTEGER DEFAULT 15, -- Mensajes antes de escalar a humano
    escalation_threshold_discount DECIMAL(5,2) DEFAULT 20.00, -- % descuento que activa escalada
    escalation_threshold_time INTEGER DEFAULT 18, -- Meses que activan escalada
    auto_negotiation_enabled BOOLEAN DEFAULT true,
    human_override_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT chk_max_additional_discount CHECK (max_additional_discount >= 0 AND max_additional_discount <= 100),
    CONSTRAINT chk_max_term_months CHECK (max_term_months >= 1 AND max_term_months <= 60),
    CONSTRAINT chk_min_payment_percentage CHECK (min_payment_percentage >= 0 AND min_payment_percentage <= 100),
    CONSTRAINT chk_negotiation_timeout CHECK (negotiation_timeout_hours >= 1 AND negotiation_timeout_hours <= 168),
    CONSTRAINT chk_escalation_messages CHECK (escalation_threshold_messages >= 5 AND escalation_threshold_messages <= 50),
    CONSTRAINT chk_escalation_discount CHECK (escalation_threshold_discount >= 5 AND escalation_threshold_discount <= 50),
    CONSTRAINT chk_escalation_time CHECK (escalation_threshold_time >= 6 AND escalation_threshold_time <= 36)
);

-- Crear índices para configuración de IA
CREATE INDEX IF NOT EXISTS idx_company_ai_limits_company_id ON company_ai_limits(company_id);

-- Insertar configuración por defecto para empresas existentes
INSERT INTO company_ai_limits (company_id, max_additional_discount, max_term_months, min_payment_percentage, negotiation_timeout_hours, escalation_threshold_messages, escalation_threshold_discount, escalation_threshold_time, auto_negotiation_enabled, human_override_required)
SELECT
    c.id,
    15.00, -- max_additional_discount
    12,    -- max_term_months
    10.00, -- min_payment_percentage
    24,    -- negotiation_timeout_hours
    15,    -- escalation_threshold_messages
    20.00, -- escalation_threshold_discount
    18,    -- escalation_threshold_time
    true,  -- auto_negotiation_enabled
    false  -- human_override_required
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_ai_limits cal WHERE cal.company_id = c.id
);

-- Insertar datos de ejemplo en la base de conocimiento
INSERT INTO company_knowledge_base (company_id, category, title, content, keywords, created_by)
SELECT
    c.id,
    'general',
    'Información General de la Empresa',
    'Somos una empresa dedicada al servicio de cobranza especializada, comprometida con soluciones eficientes y transparentes para la recuperación de deudas.',
    ARRAY['empresa', 'cobranza', 'servicios', 'compromiso'],
    NULL
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_knowledge_base ckb
    WHERE ckb.company_id = c.id AND ckb.category = 'general' AND ckb.title = 'Información General de la Empresa'
);

INSERT INTO company_knowledge_base (company_id, category, title, content, keywords, created_by)
SELECT
    c.id,
    'negotiation',
    'Políticas de Negociación',
    'Ofrecemos flexibilidad en los plazos de pago hasta 12 meses adicionales. Podemos considerar descuentos adicionales de hasta 15% sobre la propuesta original, sujeto a evaluación del caso.',
    ARRAY['negociación', 'plazos', 'descuentos', 'flexibilidad'],
    NULL
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_knowledge_base ckb
    WHERE ckb.company_id = c.id AND ckb.category = 'negotiation' AND ckb.title = 'Políticas de Negociación'
);

INSERT INTO company_knowledge_base (company_id, category, title, content, keywords, created_by)
SELECT
    c.id,
    'policies',
    'Proceso de Pago',
    'Aceptamos pagos mediante transferencia bancaria, tarjetas de crédito/débito y otros métodos electrónicos. Todos los pagos son procesados de manera segura y confidencial.',
    ARRAY['pagos', 'transferencia', 'tarjetas', 'seguridad'],
    NULL
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_knowledge_base ckb
    WHERE ckb.company_id = c.id AND ckb.category = 'policies' AND ckb.title = 'Proceso de Pago'
);

-- Configurar RLS (Row Level Security)
ALTER TABLE company_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_ai_limits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para base de conocimiento
CREATE POLICY "Users can view knowledge base of their company" ON company_knowledge_base
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Company users can manage their knowledge base" ON company_knowledge_base
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para límites de IA
CREATE POLICY "Users can view AI limits of their company" ON company_ai_limits
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Company users can manage their AI limits" ON company_ai_limits
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_company_knowledge_base_updated_at
    BEFORE UPDATE ON company_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_ai_limits_updated_at
    BEFORE UPDATE ON company_ai_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================