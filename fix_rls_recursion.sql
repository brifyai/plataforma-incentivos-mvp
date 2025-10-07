-- =============================================
-- FIX RLS RECURSION - Solución para recursión infinita
-- =============================================

-- Deshabilitar RLS temporalmente
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Recrear políticas más simples

-- Política para companies - permitir a administradores ver todo
CREATE POLICY "Admin can view all companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Política para companies - usuarios normales solo ven su propia empresa
CREATE POLICY "Companies can view their own profile" ON public.companies
    FOR ALL USING (auth.uid() = user_id);

-- Política para debts - permitir a administradores ver todo
CREATE POLICY "Admin can view all debts" ON public.debts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Política para debts - usuarios normales ven sus propias deudas
CREATE POLICY "Users can view their own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);

-- Política para debts - empresas ven deudas de su compañía
CREATE POLICY "Companies can view debts from their company" ON public.debts
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Política para payments - permitir a administradores ver todo
CREATE POLICY "Admin can view all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Política para payments - usuarios normales ven sus propios pagos
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Política para payments - empresas ven pagos de su compañía
CREATE POLICY "Companies can view payments from their company" ON public.payments
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Política para agreements - permitir a administradores ver todo
CREATE POLICY "Admin can view all agreements" ON public.agreements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Política para agreements - usuarios normales ven sus propios acuerdos
CREATE POLICY "Users can view their own agreements" ON public.agreements
    FOR SELECT USING (auth.uid() = user_id);

-- Política para agreements - empresas ven acuerdos de su compañía
CREATE POLICY "Companies can view agreements from their company" ON public.agreements
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Volver a habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FIN DE LA CORRECCIÓN RLS
-- =============================================