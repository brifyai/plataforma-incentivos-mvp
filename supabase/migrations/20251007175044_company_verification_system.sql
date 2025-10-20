-- =============================================
-- SISTEMA DE VERIFICACIÓN DE EMPRESAS
-- Migración: Tablas y funciones para verificación
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS PARA VERIFICACIÓN
-- =============================================

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',           -- Sin documentos
        'submitted',         -- Documentos subidos, esperando revisión
        'under_review',      -- Administrador revisando
        'approved',          -- Verificación exitosa
        'rejected',          -- Verificación fallida
        'needs_corrections'  -- Requiere correcciones
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'certificado_vigencia',
        'informe_equifax'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLA: company_verifications
-- =============================================

CREATE TABLE IF NOT EXISTS public.company_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status verification_status DEFAULT 'pending',

    -- Documentos
    certificado_vigencia_url VARCHAR(500),
    certificado_vigencia_filename VARCHAR(255),
    certificado_vigencia_uploaded_at TIMESTAMP WITH TIME ZONE,

    informe_equifax_url VARCHAR(500),
    informe_equifax_filename VARCHAR(255),
    informe_equifax_uploaded_at TIMESTAMP WITH TIME ZONE,

    -- Metadatos
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,

    -- Asignación
    assigned_to UUID REFERENCES public.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,

    -- Decisiones
    reviewed_by UUID REFERENCES public.users(id),
    decision_notes TEXT,
    rejection_reason TEXT,

    -- Correcciones
    correction_requests JSONB DEFAULT '[]'::jsonb,
    correction_deadline TIMESTAMP WITH TIME ZONE,

    -- Verificación automática
    sii_verification JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id)
);

-- =============================================
-- TABLA: verification_history
-- =============================================

CREATE TABLE IF NOT EXISTS public.verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES public.company_verifications(id) ON DELETE CASCADE,
    previous_status verification_status,
    new_status verification_status,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_company_verifications_company_id ON public.company_verifications(company_id);
CREATE INDEX IF NOT EXISTS idx_company_verifications_status ON public.company_verifications(status);
CREATE INDEX IF NOT EXISTS idx_company_verifications_assigned_to ON public.company_verifications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_company_verifications_submitted_at ON public.company_verifications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_verification_history_verification_id ON public.verification_history(verification_id);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para actualizar estado con historial
CREATE OR REPLACE FUNCTION update_verification_status(
    p_verification_id UUID,
    p_new_status verification_status,
    p_changed_by UUID,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
    v_old_status verification_status;
BEGIN
    -- Obtener estado anterior
    SELECT status INTO v_old_status
    FROM public.company_verifications
    WHERE id = p_verification_id;

    -- Actualizar estado
    UPDATE public.company_verifications
    SET
        status = p_new_status,
        updated_at = NOW(),
        reviewed_at = CASE WHEN p_new_status IN ('approved', 'rejected') THEN NOW() ELSE reviewed_at END,
        approved_at = CASE WHEN p_new_status = 'approved' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN p_new_status = 'rejected' THEN NOW() ELSE rejected_at END,
        reviewed_by = CASE WHEN p_new_status IN ('approved', 'rejected') THEN p_changed_by ELSE reviewed_by END
    WHERE id = p_verification_id;

    -- Registrar en historial
    INSERT INTO public.verification_history (
        verification_id,
        previous_status,
        new_status,
        changed_by,
        change_reason,
        metadata
    ) VALUES (
        p_verification_id,
        v_old_status,
        p_new_status,
        p_changed_by,
        p_reason,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Función para asignar automáticamente verificaciones
CREATE OR REPLACE FUNCTION assign_verification_automatically(p_verification_id UUID) RETURNS void AS $$
DECLARE
    v_analyst_id UUID;
BEGIN
    -- Buscar analista con menos asignaciones activas
    SELECT u.id INTO v_analyst_id
    FROM public.users u
    LEFT JOIN public.company_verifications cv ON cv.assigned_to = u.id AND cv.status IN ('submitted', 'under_review')
    WHERE u.role = 'god_mode' OR u.role = 'admin' -- Asumiendo que administradores hacen revisiones
    GROUP BY u.id
    ORDER BY COUNT(cv.id) ASC
    LIMIT 1;

    IF v_analyst_id IS NOT NULL THEN
        UPDATE public.company_verifications
        SET
            assigned_to = v_analyst_id,
            assigned_at = NOW(),
            status = 'under_review',
            updated_at = NOW()
        WHERE id = p_verification_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para updated_at
CREATE TRIGGER update_company_verifications_updated_at
    BEFORE UPDATE ON public.company_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para asignación automática cuando se envía
CREATE OR REPLACE FUNCTION trigger_auto_assign_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'pending' THEN
        PERFORM assign_verification_automatically(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_on_submit
    AFTER UPDATE ON public.company_verifications
    FOR EACH ROW EXECUTE FUNCTION trigger_auto_assign_verification();

-- =============================================
-- POLÍTICAS RLS
-- =============================================

ALTER TABLE public.company_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- Políticas para company_verifications
CREATE POLICY "Companies can view their own verification" ON public.company_verifications
    FOR SELECT USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can update their own verification" ON public.company_verifications
    FOR UPDATE USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can insert their own verification" ON public.company_verifications
    FOR INSERT WITH CHECK (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can view all verifications" ON public.company_verifications
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('god_mode', 'admin'));

CREATE POLICY "Admins can update all verifications" ON public.company_verifications
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('god_mode', 'admin'));

-- Políticas para verification_history
CREATE POLICY "Companies can view their verification history" ON public.verification_history
    FOR SELECT USING (verification_id IN (
        SELECT cv.id FROM public.company_verifications cv
        JOIN public.companies c ON c.id = cv.company_id
        WHERE c.user_id = auth.uid()
    ));

CREATE POLICY "Admins can view all verification history" ON public.verification_history
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('god_mode', 'admin'));

CREATE POLICY "Admins can insert verification history" ON public.verification_history
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('god_mode', 'admin'));

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Insertar verificación de ejemplo para empresa de prueba
INSERT INTO public.company_verifications (company_id, status)
SELECT
    c.id,
    'pending'::verification_status
FROM public.companies c
WHERE c.rut = '87654321-0'
AND NOT EXISTS (
    SELECT 1 FROM public.company_verifications cv WHERE cv.company_id = c.id
);

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

SELECT
    '✅ SISTEMA DE VERIFICACIÓN DE EMPRESAS INSTALADO' as status,
    NOW() as installed_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'company_verifications') as verification_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'verification_history') as history_table;

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================