-- Minimal setup for basic functionality
-- Create essential tables for the application to work

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('debtor', 'company', 'god_mode');

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    rut VARCHAR(12) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    validation_status VARCHAR(20) DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    api_key VARCHAR(255) UNIQUE,
    webhook_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to check if email exists (for OAuth)
CREATE POLICY "Allow email lookup for authenticated users" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Companies can view their own profile" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can update their own profile" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow company insert for authenticated users" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_rut ON public.users(rut);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_rut ON public.companies(rut);

-- Insert test data
INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('test@example.com', '12345678-9', 'Usuario de Prueba', 'debtor', 'validated', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (email, rut, full_name, role, validation_status, email_verified)
VALUES ('company@example.com', '87654321-0', 'Empresa de Prueba', 'company', 'validated', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.companies (user_id, company_name, rut, api_key)
SELECT
    (SELECT id FROM public.users WHERE email = 'company@example.com'),
    'Empresa de Cobranza S.A.',
    '87654321-0',
    'test-api-key-123'
WHERE NOT EXISTS (
    SELECT 1 FROM public.companies WHERE rut = '87654321-0'
);