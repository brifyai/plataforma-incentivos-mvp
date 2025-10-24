-- Script SQL corregido para poblar la base de datos de producción
-- Ejecutar en Supabase Dashboard > SQL Editor DESPUÉS de las migraciones

-- 1. Crear usuario administrador (solo con columnas que existen)
INSERT INTO public.users (id, full_name, email, rut, role, phone, validation_status, wallet_balance, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Administrador NexuPay', 'admin@nexupay.cl', '11111111-1', 'god_mode', '+56912345678', 'validated', 0, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Crear empresa de cobranza (solo con columnas que existen)
INSERT INTO public.companies (id, user_id, contact_email, contact_phone, rut, nexupay_commission, nexupay_commission_type, user_incentive_percentage, user_incentive_type, validation_status, created_at, updated_at)
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
  'validated',
  NOW(),
  NOW()
FROM public.users u
WHERE u.email = 'admin@nexupay.cl'
ON CONFLICT (contact_email) DO NOTHING;

-- 3. Crear cliente corporativo (solo con columnas que existen)
INSERT INTO public.corporate_clients (id, business_name, contact_email, contact_phone, rut, industry, company_size, credit_limit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'TechCorp S.A.', 'contacto@techcorp.cl', '+56911223344', '33333333-3', 'Tecnología', 'medium', 50000000, NOW(), NOW())
ON CONFLICT (contact_email) DO NOTHING;

-- 4. Crear cliente específico de la empresa (solo con columnas que existen)
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
  AND cc.contact_email = 'contacto@techcorp.cl'
ON CONFLICT (contact_email) DO NOTHING;

-- 5. Crear usuario deudor (solo con columnas que existen)
INSERT INTO public.users (id, full_name, email, rut, role, phone, validation_status, wallet_balance, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'María Concha', 'hola@aintelligence.cl', '16610128-k', 'debtor', '+56966871175', 'validated', 0, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 6. Crear deuda (solo con columnas que existen)
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
  AND cl.contact_email = 'desarrollo@techcorp.cl'
ON CONFLICT DO NOTHING;

-- Verificar que los datos se crearon correctamente
SELECT 'Usuarios creados:' as info, COUNT(*) as count FROM public.users;
SELECT 'Empresas creadas:' as info, COUNT(*) as count FROM public.companies;
SELECT 'Clientes corporativos:' as info, COUNT(*) as count FROM public.corporate_clients;
SELECT 'Clientes específicos:' as info, COUNT(*) as count FROM public.clients;
SELECT 'Deudas creadas:' as info, COUNT(*) as count FROM public.debts;