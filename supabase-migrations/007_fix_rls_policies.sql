-- =============================================
-- PLATAFORMA DE INCENTIVOS - MIGRACIÓN 007
-- Funciones RPC para verificación de unicidad
-- =============================================

-- Función para verificar si un email ya existe
CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE email = check_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un RUT ya existe
CREATE OR REPLACE FUNCTION check_rut_exists(check_rut TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE rut = check_rut);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un teléfono ya existe
CREATE OR REPLACE FUNCTION check_phone_exists(check_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE phone = check_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para permitir INSERT durante registro (sin autenticación)
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Mantener la política existente para usuarios autenticados
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- FIN DE LA MIGRACIÓN 007
-- =============================================