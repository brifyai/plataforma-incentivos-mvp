-- =============================================
-- CORRECCIÓN DE PROBLEMAS DE IMPORTACIÓN MASIVA
-- =============================================

-- 1. Eliminar políticas restrictivas que impiden inserciones
DROP POLICY IF EXISTS "Companies can view debts from their company" ON public.debts;
DROP POLICY IF EXISTS "Service role can insert debts" ON public.debts;

-- 2. Crear política RLS para permitir inserciones masivas desde empresas autenticadas
CREATE POLICY "Companies can insert debts for import" ON public.debts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 3. Crear política RLS para permitir inserciones con service role (para importación masiva)
CREATE POLICY "Service role can insert debts" ON public.debts
    FOR INSERT USING (
        EXISTS (
            SELECT 1 FROM public.jwt_claims()
            WHERE role() = 'service_role'
        )
    );

-- 4. Política mejorada para que las empresas vean sus deudas
CREATE POLICY "Companies can view their debts" ON public.debts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 5. Política para que las empresas actualicen sus deudas
CREATE POLICY "Companies can update their debts" ON public.debts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 6. Asegurar que la tabla users tenga los campos necesarios
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 7. Crear tabla corporate_clients si no existe
CREATE TABLE IF NOT EXISTS public.corporate_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    industry VARCHAR(100),
    contract_value DECIMAL(15, 2),
    contract_start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Habilitar RLS en corporate_clients
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;

-- 9. Políticas para corporate_clients
CREATE POLICY "Companies can view their corporate clients" ON public.corporate_clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = corporate_clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can manage their corporate clients" ON public.corporate_clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = corporate_clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 10. Trigger para updated_at en corporate_clients
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON public.corporate_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Datos de ejemplo para corporate_clients (solo si no existen)
INSERT INTO public.corporate_clients (company_id, name, rut, contact_name, contact_email, industry, contract_value)
SELECT 
    c.id,
    'Cliente Corporativo Ejemplo',
    '76543210-K',
    'Contacto Ejemplo',
    'contacto@ejemplo.com',
    'Retail',
    5000000.00
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.corporate_clients 
    WHERE company_id = c.id
)
LIMIT 1;

-- 12. Crear función para verificar permisos de importación
CREATE OR REPLACE FUNCTION check_import_permissions(company_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que el usuario autenticado pertenezca a la empresa
    RETURN EXISTS (
        SELECT 1 FROM public.companies
        WHERE companies.id = company_id_param
        AND companies.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Política de inserción usando la función de verificación
DROP POLICY IF EXISTS "Companies can insert debts for import" ON public.debts;

CREATE POLICY "Companies can insert debts for import" ON public.debts
    FOR INSERT WITH CHECK (
        check_import_permissions(company_id)
    );

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('debts', 'corporate_clients')
ORDER BY tablename, policyname;