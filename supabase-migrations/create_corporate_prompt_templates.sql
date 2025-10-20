-- Migration: Crear tabla de plantillas de prompts por cliente corporativo
-- Descripción: Tabla para almacenar plantillas de prompts personalizadas por cliente corporativo

-- Crear tabla de plantillas de prompts corporativos
CREATE TABLE IF NOT EXISTS corporate_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del prompt
    prompt_type VARCHAR(50) NOT NULL DEFAULT 'negotiation',
    prompt_name VARCHAR(255) NOT NULL,
    prompt_template TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    
    -- Configuración
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Restricciones
    CONSTRAINT corporate_prompt_templates_check_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT corporate_prompt_templates_check_type CHECK (prompt_type IN ('negotiation', 'welcome', 'escalation', 'closing', 'general'))
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_corporate_prompt_templates_corporate_client ON corporate_prompt_templates(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_corporate_prompt_templates_company ON corporate_prompt_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_prompt_templates_type ON corporate_prompt_templates(prompt_type);
CREATE INDEX IF NOT EXISTS idx_corporate_prompt_templates_active ON corporate_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_corporate_prompt_templates_priority ON corporate_prompt_templates(priority);

-- RLS (Row Level Security)
ALTER TABLE corporate_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para corporate_prompt_templates
CREATE POLICY "Users can view prompts for their companies" ON corporate_prompt_templates
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert prompts for their companies" ON corporate_prompt_templates
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update prompts for their companies" ON corporate_prompt_templates
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete prompts for their companies" ON corporate_prompt_templates
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage all prompts" ON corporate_prompt_templates
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Trigger para actualizar updated_at
CREATE TRIGGER set_corporate_prompt_templates_timestamp
    BEFORE UPDATE ON corporate_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener el prompt activo más prioritario
CREATE OR REPLACE FUNCTION get_active_corporate_prompt(
    p_corporate_client_id UUID,
    p_prompt_type VARCHAR(50) DEFAULT 'negotiation'
)
RETURNS TABLE (
    id UUID,
    prompt_template TEXT,
    variables TEXT[],
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cpt.id,
        cpt.prompt_template,
        cpt.variables,
        cpt.priority
    FROM corporate_prompt_templates cpt
    WHERE cpt.corporate_client_id = p_corporate_client_id
        AND cpt.prompt_type = p_prompt_type
        AND cpt.is_active = true
    ORDER BY cpt.priority ASC, cpt.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reemplazar variables en prompts
CREATE OR REPLACE FUNCTION replace_prompt_variables(
    p_template TEXT,
    p_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS TEXT AS $$
DECLARE
    result TEXT := p_template;
    variable_key TEXT;
    variable_value TEXT;
BEGIN
    -- Reemplazar variables comunes
    FOR variable_key IN SELECT jsonb_object_keys(p_variables)
    LOOP
        variable_value := COALESCE((p_variables->>variable_key)::TEXT, '');
        result := REPLACE(result, '{' || variable_key || '}', variable_value);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insertar plantillas de ejemplo para clientes corporativos existentes
INSERT INTO corporate_prompt_templates (corporate_client_id, company_id, prompt_type, prompt_name, prompt_template, variables, priority)
SELECT
    cc.id,
    cc.company_id,
    'negotiation',
    'Respuesta inicial de negociación',
    'Eres un asistente de negociación especializado para {nombre_empresa}. 

El deudor {nombre_deudor} ({rut_deudor}) tiene una deuda de {monto_deuda} con {dias_mora} días de mora.

INSTRUCCIONES:
1. Sé profesional pero empático
2. Menciona el nombre del deudor y la empresa
3. Ofrece opciones dentro de las políticas permitidas
4. Mantén un tono colaborativo
5. Siempre incluye llamada a la acción clara

POLÍTICAS:
- Descuento máximo: {descuento_maximo}%
- Plazo máximo: {plazo_maximo} meses
- Nivel de riesgo: {nivel_riesgo}

Responde al mensaje del deudor de manera personalizada.',
    ARRAY['{nombre_deudor}', '{rut_deudor}', '{nombre_empresa}', '{monto_deuda}', '{dias_mora}', '{descuento_maximo}', '{plazo_maximo}', '{nivel_riesgo}'],
    1
FROM corporate_clients cc
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_prompt_templates cpt 
    WHERE cpt.corporate_client_id = cc.id 
    AND cpt.prompt_type = 'negotiation'
);

-- Insertar plantilla de bienvenida
INSERT INTO corporate_prompt_templates (corporate_client_id, company_id, prompt_type, prompt_name, prompt_template, variables, priority)
SELECT
    cc.id,
    cc.company_id,
    'welcome',
    'Mensaje de bienvenida',
    '¡Hola {nombre_deudor}! Bienvenido/a al sistema de negociación de {nombre_empresa}.

Soy tu asistente personalizado y estoy aquí para ayudarte a encontrar la mejor solución para tu deuda.

Información de tu caso:
- Empresa: {nombre_empresa} ({rut_empresa})
- Deuda actual: {monto_deuda}
- Fecha de vencimiento: {fecha_vencimiento}
- Días en mora: {dias_mora}

¿En qué puedo ayudarte hoy? Puedes preguntarme sobre:
• Opciones de pago
• Descuentos disponibles
• Planes de cuotas
• Extensión de plazos

Estoy para asistirte.',
    ARRAY['{nombre_deudor}', '{nombre_empresa}', '{rut_empresa}', '{monto_deuda}', '{fecha_vencimiento}', '{dias_mora}'],
    2
FROM corporate_clients cc
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_prompt_templates cpt 
    WHERE cpt.corporate_client_id = cc.id 
    AND cpt.prompt_type = 'welcome'
);

-- Insertar plantilla de escalada
INSERT INTO corporate_prompt_templates (corporate_client_id, company_id, prompt_type, prompt_name, prompt_template, variables, priority)
SELECT
    cc.id,
    cc.company_id,
    'escalation',
    'Mensaje de escalada a humano',
    'Estimado/a {nombre_deudor},

He analizado tu solicitud y considero que tu caso requiere atención personalizada de uno de nuestros representantes especializados.

Motivo de escalada:
- Complejidad de la negociación
- Necesidad de autorización especial
- Caso requiere evaluación detallada

Un representante de {nombre_empresa} te contactará a la brevedad a través de:
• Email: {email_deudor}
• Teléfono: {telefono_deudor}

Tiempo estimado de respuesta: 24-48 horas hábiles

Mientras tanto, si tienes alguna urgencia, puedes contactarnos directamente:
• Teléfono emergencia: [Número de contacto]
• Email: [Email de soporte]

Agradezco tu paciencia y comprensión.',
    ARRAY['{nombre_deudor}', '{nombre_empresa}', '{email_deudor}', '{telefono_deudor}'],
    3
FROM corporate_clients cc
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_prompt_templates cpt 
    WHERE cpt.corporate_client_id = cc.id 
    AND cpt.prompt_type = 'escalation'
);

-- Insertar plantilla de cierre
INSERT INTO corporate_prompt_templates (corporate_client_id, company_id, prompt_type, prompt_name, prompt_template, variables, priority)
SELECT
    cc.id,
    cc.company_id,
    'closing',
    'Mensaje de cierre exitoso',
    '¡Excelente noticia {nombre_deudor}!

Hemos llegado a un acuerdo exitoso para tu deuda con {nombre_empresa}.

RESUMEN DEL ACUERDO:
• Empresa: {nombre_empresa} ({rut_empresa})
• Deudor: {nombre_deudor} ({rut_deudor})
• Monto original: {monto_original}
• Monto acordado: {monto_acordado}
• Descuento aplicado: {descuento_aplicado}%
• Forma de pago: {forma_pago}
• Número de cuotas: {numero_cuotas}
• Valor cuota mensual: {valor_cuota}

PRÓXIMOS PASOS:
1. Recibirás un email con el detalle del acuerdo
2. El primer pago se debitará el {fecha_primer_pago}
3. Podrás monitorear tu progreso en nuestro portal

¡Gracias por tu compromiso! Tu acuerdo ha sido registrado y está activo.

Para cualquier consulta, contacta a {nombre_empresa}:
• Email: [Email de contacto]
• Teléfono: [Teléfono de contacto]

¡Estamos para ayudarte!',
    ARRAY['{nombre_deudor}', '{nombre_empresa}', '{rut_empresa}', '{rut_deudor}', '{monto_original}', '{monto_acordado}', '{descuento_aplicado}', '{forma_pago}', '{numero_cuotas}', '{valor_cuota}', '{fecha_primer_pago}'],
    4
FROM corporate_clients cc
WHERE NOT EXISTS (
    SELECT 1 FROM corporate_prompt_templates cpt 
    WHERE cpt.corporate_client_id = cc.id 
    AND cpt.prompt_type = 'closing'
);

-- Comentarios para documentación
COMMENT ON TABLE corporate_prompt_templates IS 'Plantillas de prompts personalizadas por cliente corporativo para IA';
COMMENT ON COLUMN corporate_prompt_templates.prompt_type IS 'Tipo de prompt: negotiation, welcome, escalation, closing, general';
COMMENT ON COLUMN corporate_prompt_templates.variables IS 'Array de variables que se pueden usar en el template';
COMMENT ON COLUMN corporate_prompt_templates.priority IS 'Prioridad del prompt (1-10, menor es más prioritario)';
COMMENT ON FUNCTION get_active_corporate_prompt IS 'Obtiene el prompt activo más prioritario para un cliente corporativo';
COMMENT ON FUNCTION replace_prompt_variables IS 'Reemplaza variables en un template con valores proporcionados';