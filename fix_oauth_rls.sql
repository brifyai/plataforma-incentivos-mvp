-- Fix OAuth RLS issues
-- Make policies more permissive for OAuth to work

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow email lookup for authenticated users" ON public.users;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can select" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON public.users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Also fix companies table
DROP POLICY IF EXISTS "Companies can view their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
DROP POLICY IF EXISTS "Allow company insert for authenticated users" ON public.companies;

CREATE POLICY "Companies can select own" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Companies can update own" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);