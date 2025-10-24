-- Script DEFINITIVO que funciona - MINIMAL columns only
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Crear empresa con SOLO las columnas mínimas que existen
INSERT INTO public.companies (
  id, user_id, company_name, rut, contact_email, contact_phone,
  nexupay_commission_type, nexupay_commission,
  user_incentive_type, user_incentive_percentage, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'NexuPay Cobranzas',
  '22222222-2',
  'empresa@nexupay.cl',
  '+56987654321',
  'percentage',
  15,
  'percentage',
  5,
  NOW(),
  NOW()
FROM public.users u
WHERE u.email = 'admin@nexupay.cl'
  AND NOT EXISTS (SELECT 1 FROM public.companies WHERE contact_email = 'empresa@nexupay.cl');

-- 2. Crear cliente corporativo
INSERT INTO public.corporate_clients (id, business_name, contact_email, contact_phone, rut, industry, company_size, credit_limit, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'TechCorp S.A.',
  'contacto@techcorp.cl',
  '+56911223344',
  '33333333-3',
  'Tecnología',
  'medium',
  50000000,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.corporate_clients WHERE contact_email = 'contacto@techcorp.cl');

-- 3. Crear cliente específico
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
  AND NOT EXISTS (SELECT 1 FROM public.clients WHERE contact_email = 'desarrollo@techcorp.cl');

-- 4. Crear usuario deudor
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'María Concha',
  'hola@aintelligence.cl',
  '16610128-k',
  'debtor',
  '+56966871175',
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'hola@aintelligence.cl');

-- 5. Crear deuda
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
  AND NOT EXISTS (
    SELECT 1 FROM public.debts d
    WHERE d.user_id = u.id
      AND d.company_id = c.id
      AND d.description = 'Desarrollo de software - Proyecto NexuPay'
  );

-- Verificar resultado final
SELECT '🎉 DATOS COMPLETADOS EXITOSAMENTE:' as status;
SELECT
  (SELECT COUNT(*) FROM public.users) as usuarios,
  (SELECT COUNT(*) FROM public.companies) as empresas,
  (SELECT COUNT(*) FROM public.corporate_clients) as corporativos,
  (SELECT COUNT(*) FROM public.clients) as clientes,
  (SELECT COUNT(*) FROM public.debts) as deudas;

-- Mostrar usuarios disponibles para login
SELECT '🔐 USUARIOS PARA PROBAR LA APP:' as info;
SELECT
  CASE
    WHEN role = 'god_mode' THEN '👑 ADMIN'
    WHEN role = 'company' THEN '🏢 EMPRESA'
    WHEN role = 'debtor' THEN '👤 PERSONA'
    ELSE role
  END as tipo,
  email,
  full_name as nombre
FROM public.users
ORDER BY
  CASE
    WHEN role = 'god_mode' THEN 1
    WHEN role = 'company' THEN 2
    WHEN role = 'debtor' THEN 3
    ELSE 4
  END,
  email;

-- Mensaje final
SELECT '✅ ¡LISTO! Ahora puedes probar todos los portales:' as mensaje;
SELECT '   • Portal Admin: admin@nexupay.cl' as instrucciones;
SELECT '   • Portal Empresa: empresa@nexupay.cl' as instrucciones;
SELECT '   • Portal Personas: hola@aintelligence.cl' as instrucciones;
SELECT '   • Contraseña: 123456 (o configúrala)' as instrucciones;