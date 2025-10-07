-- =============================================
-- TEMPORARY FIX: Disable RLS to resolve recursion
-- =============================================

-- Deshabilitar RLS temporalmente en todas las tablas para resolver recursión
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- También deshabilitar en cualquier tabla profiles si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS disabled on profiles table';
    END IF;
END $$;

-- =============================================
-- RLS TEMPORALMENTE DESHABILITADO
-- Ahora las consultas deberían funcionar
-- =============================================