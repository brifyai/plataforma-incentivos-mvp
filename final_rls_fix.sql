-- Final RLS fix for OAuth and 2FA functionality
-- This creates proper policies that work with OAuth

-- First, ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow email lookup for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can select" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;

DROP POLICY IF EXISTS "Companies can view their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
DROP POLICY IF EXISTS "Allow company insert for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Companies can select own" ON public.companies;
DROP POLICY IF EXISTS "Companies can insert" ON public.companies;
DROP POLICY IF EXISTS "Companies can update own" ON public.companies;

-- Create proper policies for OAuth and regular operations

-- Users table policies
CREATE POLICY "Enable read access for authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Companies table policies
CREATE POLICY "Enable read access for own company" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own company" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

-- Test the policies work
SELECT COUNT(*) FROM public.users;