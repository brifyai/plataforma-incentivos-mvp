-- =============================================
-- CORRECCIÓN DEL TRIGGER DE VERIFICACIÓN
-- =============================================
-- Problema: El trigger busca rol 'admin' que no existe
-- Solución: Cambiar 'admin' por 'god_mode' que sí existe

-- Función corregida para asignar automáticamente verificaciones
CREATE OR REPLACE FUNCTION assign_verification_automatically(p_verification_id UUID) RETURNS void AS $$
DECLARE
    v_analyst_id UUID;
BEGIN
    -- Buscar analista con menos asignaciones activas
    -- CORRECCIÓN: Cambiado 'admin' por 'god_mode'
    SELECT u.id INTO v_analyst_id
    FROM public.users u
    LEFT JOIN public.company_verifications cv ON cv.assigned_to = u.id AND cv.status IN ('submitted', 'under_review')
    WHERE u.role = 'god_mode'  -- Solo 'god_mode' existe como rol de administrador
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

-- Trigger corregido para asignación automática cuando se envía
CREATE OR REPLACE FUNCTION trigger_auto_assign_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'pending' THEN
        PERFORM assign_verification_automatically(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_on_submit ON public.company_verifications;
CREATE TRIGGER trigger_auto_assign_on_submit
    AFTER UPDATE ON public.company_verifications
    FOR EACH ROW EXECUTE FUNCTION trigger_auto_assign_verification();

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT
    '✅ TRIGGER DE VERIFICACIÓN CORREGIDO' as status,
    'Cambiado rol "admin" por "god_mode"' as change_made,
    NOW() as fixed_at;

-- =============================================
-- INSTRUCCIONES
-- =============================================
/*
1. Ejecutar este script en el editor SQL de Supabase
2. Ir a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/sql
3. Copiar y pegar este script
4. Hacer clic en "Run"
5. Probar enviar verificación nuevamente
*/