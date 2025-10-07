-- Temporary complete disable of RLS for testing
-- This will allow all operations to work

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT 'RLS disabled - testing OAuth' as status;