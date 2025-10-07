-- =============================================
-- CORREGIR POLÍTICAS RLS PARA SYSTEM_CONFIG
-- =============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Only authenticated users can view system config" ON public.system_config;
DROP POLICY IF EXISTS "Only service role can modify system config" ON public.system_config;

-- Crear nuevas políticas que permitan a usuarios autenticados gestionar configuración
CREATE POLICY "Authenticated users can view system config" ON public.system_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage system config" ON public.system_config
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- FIN DE LA CORRECCIÓN
-- =============================================