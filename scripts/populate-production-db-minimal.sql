-- Script SQL MÍNIMO para poblar la base de datos de producción
-- Solo usa las columnas que realmente existen en las tablas

-- PRIMERO: Limpiar datos existentes para evitar conflictos
DELETE FROM public.debts;
DELETE FROM public.clients;
DELETE FROM public.corporate_clients;
DELETE FROM public.companies;
DELETE FROM public.users WHERE email != 'admin@nexupay.cl';

-- 1. Crear usuario administrador (si no existe)
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Administrador NexuPay',
  'admin@nexupay.cl',
  '11111111-1',
  'god_mode',
  '+56912345678',
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@nexupay.cl');

-- 2. Crear empresa de cobranza
INSERT INTO public.companies (id, user_id, company_name, contact_email, contact_phone, rut, nexupay_commission, nexupay_commission_type, user_incentive_percentage, user_incentive_type, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  'NexuPay Cobranzas',
  'empresa@nexupay.cl',
  '+56987654321',
  '22222222-2',
  15,
  'percentage',
  5,
  'percentage',
  NOW(),
  NOW()
FROM public.users u
WHERE u.email = 'admin@nexupay.cl';

-- 3. Crear cliente corporativo
INSERT INTO public.corporate_clients (id, contact_email, contact_phone, rut, industry, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'contacto@techcorp.cl', '+56911223344', '33333333-3', 'Tecnología', NOW(), NOW());

-- 4. Crear cliente específico de la empresa
INSERT INTO public.clients (id, company_id, business_name, contact_email, contact_phone, rut, corporate_client_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  c.id,
  'TechCorp - División Desarrollo',
  'desarrollo@techcorp.cl',
  '+56955667788',
  '44444444-4',
  cc.id,
  NOW(),
  NOW()
FROM public.companies c
CROSS JOIN public.corporate_clients cc
WHERE c.contact_email = 'empresa@nexupay.cl'
  AND cc.contact_email = 'contacto@techcorp.cl';

-- 5. Crear usuario deudor
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'María Concha', 'hola@aintelligence.cl', '16610128-k', 'debtor', '+56966871175', 0, NOW(), NOW());

-- 6. Crear deuda (con client_id) - Usando IDs directamente
INSERT INTO public.debts (id, user_id, company_id, client_id, original_amount, current_amount, description, status, due_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = 'hola@aintelligence.cl'),
  (SELECT id FROM public.companies WHERE contact_email = 'empresa@nexupay.cl'),
  (SELECT id FROM public.clients WHERE contact_email = 'desarrollo@techcorp.cl'),
  2500000,
  2500000,
  'Desarrollo de software - Proyecto NexuPay',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);

-- Verificar resultados
SELECT 'Usuarios:' as tabla, COUNT(*) as cantidad FROM public.users
UNION ALL
SELECT 'Empresas:' as tabla, COUNT(*) as cantidad FROM public.companies
UNION ALL
SELECT 'Clientes corporativos:' as tabla, COUNT(*) as cantidad FROM public.corporate_clients
UNION ALL
SELECT 'Clientes específicos:' as tabla, COUNT(*) as cantidad FROM public.clients
UNION ALL
SELECT 'Deudas:' as tabla, COUNT(*) as cantidad FROM public.debts;