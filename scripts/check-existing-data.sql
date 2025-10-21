-- Script para verificar qué datos ya existen en la base de datos
-- Ejecutar antes de poblar para evitar duplicados

-- Verificar usuarios existentes
SELECT 'Usuarios existentes:' as info;
SELECT id, email, role, full_name FROM public.users ORDER BY created_at DESC;

-- Verificar empresas existentes
SELECT 'Empresas existentes:' as info;
SELECT id, contact_email, business_name FROM public.companies ORDER BY created_at DESC;

-- Verificar clientes corporativos existentes
SELECT 'Clientes corporativos existentes:' as info;
SELECT id, contact_email, business_name FROM public.corporate_clients ORDER BY created_at DESC;

-- Verificar clientes específicos existentes
SELECT 'Clientes específicos existentes:' as info;
SELECT id, contact_email, business_name FROM public.clients ORDER BY created_at DESC;

-- Verificar deudas existentes
SELECT 'Deudas existentes:' as info;
SELECT id, user_id, company_id, client_id, original_amount FROM public.debts ORDER BY created_at DESC LIMIT 5;