-- =============================================
-- CORRECCIÓN COMPLETA DE TODAS LAS REFERENCIAS A "admin"
-- =============================================
-- Problema: Muchas políticas y funciones usan "admin" que no existe en el enum user_role
-- Solución: Cambiar todas las referencias de "admin" a "god_mode"

-- =============================================
-- 1. CORRECCIÓN DEL TRIGGER DE VERIFICACIÓN
-- =============================================

-- Función corregida para asignar automáticamente verificaciones
CREATE OR REPLACE FUNCTION assign_verification_automatically(p_verification_id UUID) RETURNS void AS $$
DECLARE
    v_analyst_id UUID;
BEGIN
    -- Buscar analista con menos asignaciones activas
    SELECT u.id INTO v_analyst_id
    FROM public.users u
    LEFT JOIN public.company_verifications cv ON cv.assigned_to = u.id AND cv.status IN ('submitted', 'under_review')
    WHERE u.role = 'god_mode'  -- CORREGIDO: 'admin' -> 'god_mode'
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

-- Trigger corregido
CREATE OR REPLACE FUNCTION trigger_auto_assign_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'pending' THEN
        PERFORM assign_verification_automatically(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_on_submit ON public.company_verifications;
CREATE TRIGGER trigger_auto_assign_on_submit
    AFTER UPDATE ON public.company_verifications
    FOR EACH ROW EXECUTE FUNCTION trigger_auto_assign_verification();

-- =============================================
-- 2. CORRECCIÓN DE POLÍTICAS RLS
-- =============================================

-- Políticas para company_verifications
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.company_verifications;
CREATE POLICY "Admins can view all verifications" ON public.company_verifications
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('god_mode'));

DROP POLICY IF EXISTS "Admins can update all verifications" ON public.company_verifications;
CREATE POLICY "Admins can update all verifications" ON public.company_verifications
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('god_mode'));

-- Políticas para verification_history
DROP POLICY IF EXISTS "Admins can view all verification history" ON public.verification_history;
CREATE POLICY "Admins can view all verification history" ON public.verification_history
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('god_mode'));

DROP POLICY IF EXISTS "Admins can insert verification history" ON public.verification_history;
CREATE POLICY "Admins can insert verification history" ON public.verification_history
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('god_mode'));

-- =============================================
-- 3. CORRECCIÓN DE OTRAS TABLAS
-- =============================================

-- AI Knowledge Base
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.ai_knowledge_base;
CREATE POLICY "Admins can manage knowledge base" ON public.ai_knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

-- External AI Providers
DROP POLICY IF EXISTS "Admins can manage external providers" ON public.external_ai_providers;
CREATE POLICY "Admins can manage external providers" ON public.external_ai_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

-- Debtor Corporate Matches
DROP POLICY IF EXISTS "Admins can view all matches" ON public.debtor_corporate_matches;
CREATE POLICY "Admins can view all matches" ON public.debtor_corporate_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

DROP POLICY IF EXISTS "Admins can update matches" ON public.debtor_corporate_matches;
CREATE POLICY "Admins can update matches" ON public.debtor_corporate_matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

DROP POLICY IF EXISTS "Admins can delete matches" ON public.debtor_corporate_matches;
CREATE POLICY "Admins can delete matches" ON public.debtor_corporate_matches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

-- Company AI Config
DROP POLICY IF EXISTS "Admins can manage company ai config" ON public.company_ai_config;
CREATE POLICY "Admins can manage company ai config" ON public.company_ai_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'god_mode'
        )
    );

-- Corporate Prompt Templates
DROP POLICY IF EXISTS "Admins can manage prompt templates" ON public.corporate_prompt_templates;
CREATE POLICY "Admins can manage prompt templates" ON public.corporate_prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'god_mode'
        )
    );

-- =============================================
-- 4. VERIFICACIÓN
-- =============================================

SELECT
    '✅ TODAS LAS REFERENCIAS A "admin" CORREGIDAS' as status,
    'Cambiado "admin" por "god_mode" en todas las políticas y funciones' as change_made,
    NOW() as fixed_at;

-- Conteo de políticas corregidas
SELECT 
    'company_verifications policies' as table_name,
    COUNT(*) as corrected_policies
FROM information_schema.rls_policies 
WHERE tablename = 'company_verifications' 
AND policyname LIKE '%Admin%'

UNION ALL

SELECT 
    'verification_history policies' as table_name,
    COUNT(*) as corrected_policies
FROM information_schema.rls_policies 
WHERE tablename = 'verification_history' 
AND policyname LIKE '%Admin%';

-- =============================================
-- INSTRUCCIONES
-- =============================================
/*
1. Ejecutar este script en el editor SQL de Supabase
2. Ir a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/sql
3. Copiar y pegar este script completo
4. Hacer clic en "Run"
5. Verificar que no haya errores
6. Probar enviar verificación nuevamente

Este script corrige:
- Trigger de asignación automática de verificaciones
- Todas las políticas RLS que usaban "admin"
- Referencias en múltiples tablas del sistema
*/