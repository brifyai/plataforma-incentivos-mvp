-- Script SQL FINAL para poblar la base de datos de producción
-- Sin ON CONFLICT para evitar errores de restricciones

-- 1. Crear usuario administrador
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Administrador NexuPay', 'admin@nexupay.cl', '11111111-1', 'god_mode', '+56912345678', 0, NOW(), NOW());

-- 2. Crear empresa de cobranza
INSERT INTO public.companies (id, user_id, contact_email, contact_phone, rut, nexupay_commission, nexupay_commission_type, user_incentive_percentage, user_incentive_type, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
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
INSERT INTO public.corporate_clients (id, business_name, contact_email, contact_phone, rut, industry, company_size, credit_limit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'TechCorp S.A.', 'contacto@techcorp.cl', '+56911223344', '33333333-3', 'Tecnología', 'medium', 50000000, NOW(), NOW());

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

-- 6. Crear deuda
INSERT INTO public.debts (id, user_id, company_id, client_id, original_amount, current_amount, description, status, due_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  c.id,
  cl.id,
  2500000,
  2500000,
  'Desarrollo de software - Proyecto NexuPay',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
FROM public.users u
CROSS JOIN public.companies c
CROSS JOIN public.clients cl
WHERE u.email = 'hola@aintelligence.cl'
  AND c.contact_email = 'empresa@nexupay.cl'
  AND cl.contact_email = 'desarrollo@techcorp.cl';

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