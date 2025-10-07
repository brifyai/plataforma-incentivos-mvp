-- Arreglar políticas RLS para companies que están causando errores 406

-- Primero, eliminar todas las políticas existentes para companies
DROP POLICY IF EXISTS "Companies can view their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can insert their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can select own" ON public.companies;
DROP POLICY IF EXISTS "Companies can insert" ON public.companies;
DROP POLICY IF EXISTS "Companies can update own" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for own company" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable update for own company" ON public.companies;
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
DROP POLICY IF EXISTS "companies_admin" ON public.companies;
DROP POLICY IF EXISTS "allow_all_for_authenticated_companies" ON public.companies;

-- Crear nuevas políticas más permisivas para companies
-- Los usuarios autenticados pueden hacer cualquier cosa con sus propias empresas
CREATE POLICY "companies_full_access" ON public.companies
    FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las empresas
CREATE POLICY "companies_admin_read" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Permitir insert para usuarios autenticados (necesario para OAuth)
CREATE POLICY "companies_insert_authenticated" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Asegurar que RLS esté habilitado
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;