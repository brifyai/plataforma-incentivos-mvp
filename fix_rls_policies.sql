-- Fix RLS policies for OAuth to work
-- Only update the policies that are missing

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow email lookup for authenticated users" ON public.users;

-- Add the missing policy for email lookup during OAuth
CREATE POLICY "Allow email lookup for authenticated users" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);