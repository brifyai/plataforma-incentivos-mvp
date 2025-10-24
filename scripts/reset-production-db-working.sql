-- Script FINAL que FUNCIONA - MINIMAL columns only
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: Limpiar datos existentes
DELETE FROM public.debts;
DELETE FROM public.clients;
DELETE FROM public.corporate_clients;
DELETE FROM public.companies;
DELETE FROM public.users WHERE email != 'admin@nexupay.cl';

-- PASO 2: Crear empresa de producción (solo columnas mínimas)
INSERT INTO public.companies (
  id, user_id, company_name, rut, contact_email, contact_phone,
  nexupay_commission_type, nexupay_commission,
  user_incentive_type, user_incentive_percentage, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'NexuPay Producción',
  '12345678-9',
  'empresa@nexupay.cl',
  '+56987654321',
  'percentage',
  15,
  'percentage',
  5,
  NOW(),
  NOW()
FROM public.users u
WHERE u.email = 'admin@nexupay.cl';

-- PASO 3: Crear cliente corporativo (solo columnas mínimas que existen)
INSERT INTO public.corporate_clients (
  id, contact_email, contact_phone, rut, industry, created_at, updated_at
)
VALUES
  (gen_random_uuid(), 'cliente@empresa.cl', '+56911223344', '98765432-1', 'Tecnología', NOW(), NOW());

-- PASO 4: Crear cliente específico
INSERT INTO public.clients (id, company_id, business_name, contact_email, contact_phone, rut, corporate_client_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  c.id,
  'Cliente Principal',
  'cliente@empresa.cl',
  '+56911223344',
  '98765432-1',
  cc.id,
  NOW(),
  NOW()
FROM public.companies c
CROSS JOIN public.corporate_clients cc
WHERE c.contact_email = 'empresa@nexupay.cl'
  AND cc.contact_email = 'cliente@empresa.cl';

-- PASO 5: Crear deudor de producción
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Juan Pérez', 'juan.perez@email.cl', '11111111-1', 'debtor', '+56912345678', 0, NOW(), NOW());

-- PASO 6: Crear deuda de producción
INSERT INTO public.debts (id, user_id, company_id, client_id, original_amount, current_amount, description, status, due_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  c.id,
  cl.id,
  5000000,
  5000000,
  'Servicio de consultoría tecnológica',
  'active',
  NOW() + INTERVAL '60 days',
  NOW(),
  NOW()
FROM public.users u
CROSS JOIN public.companies c
CROSS JOIN public.clients cl
WHERE u.email = 'juan.perez@email.cl'
  AND c.contact_email = 'empresa@nexupay.cl'
  AND cl.contact_email = 'cliente@empresa.cl';

-- Verificar resultado final
SELECT '🎉 PRODUCCIÓN CONFIGURADA:' as status;
SELECT
  (SELECT COUNT(*) FROM public.users) as usuarios,
  (SELECT COUNT(*) FROM public.companies) as empresas,
  (SELECT COUNT(*) FROM public.corporate_clients) as corporativos,
  (SELECT COUNT(*) FROM public.clients) as clientes,
  (SELECT COUNT(*) FROM public.debts) as deudas;

-- Mostrar usuarios disponibles
SELECT '🔐 USUARIOS PARA PROBAR:' as info;
SELECT
  CASE
    WHEN role = 'god_mode' THEN '👑 ADMIN'
    WHEN role = 'company' THEN '🏢 EMPRESA'
    WHEN role = 'debtor' THEN '👤 DEUDOR'
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
  END;

-- Instrucciones finales
SELECT '✅ ¡LISTO PARA PROBAR!' as mensaje UNION ALL
SELECT '   • Admin: admin@nexupay.cl' UNION ALL
SELECT '   • Empresa: empresa@nexupay.cl' UNION ALL
SELECT '   • Deudor: juan.perez@email.cl' UNION ALL
SELECT '   • Contraseña: 123456';