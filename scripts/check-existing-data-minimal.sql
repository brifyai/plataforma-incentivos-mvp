-- Script MÍNIMO para verificar qué datos ya existen
-- Solo usa columnas que definitivamente existen

-- Conteos totales primero
SELECT 'RESUMEN TOTAL:' as info;
SELECT
  (SELECT COUNT(*) FROM public.users) as usuarios,
  (SELECT COUNT(*) FROM public.companies) as empresas,
  (SELECT COUNT(*) FROM public.corporate_clients) as corporativos,
  (SELECT COUNT(*) FROM public.clients) as clientes,
  (SELECT COUNT(*) FROM public.debts) as deudas;

-- Verificar usuarios existentes
SELECT 'Usuarios existentes:' as info;
SELECT id, email, role FROM public.users ORDER BY created_at DESC;

-- Verificar empresas existentes
SELECT 'Empresas existentes:' as info;
SELECT id, contact_email FROM public.companies ORDER BY created_at DESC;

-- Verificar clientes corporativos existentes
SELECT 'Clientes corporativos existentes:' as info;
SELECT id, contact_email FROM public.corporate_clients ORDER BY created_at DESC;

-- Verificar clientes específicos existentes
SELECT 'Clientes específicos existentes:' as info;
SELECT id, contact_email FROM public.clients ORDER BY created_at DESC;

-- Verificar deudas existentes
SELECT 'Deudas existentes:' as info;
SELECT id, user_id, company_id, client_id, original_amount, current_amount, status FROM public.debts ORDER BY created_at DESC LIMIT 3;

-- Verificar si las columnas críticas existen
SELECT 'COLUMNAS CRÍTICAS:' as info;
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'corporate_client_id' AND table_schema = 'public')
       THEN '✅ corporate_client_id existe en clients'
       ELSE '❌ corporate_client_id NO existe en clients' END as clients_corporate_client_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debts' AND column_name = 'client_id' AND table_schema = 'public')
       THEN '✅ client_id existe en debts'
       ELSE '❌ client_id NO existe en debts' END as debts_client_id;

-- Verificar relaciones
SELECT 'RELACIONES:' as info;
SELECT
  'Deudas con client_id:' as tipo,
  COUNT(*) as cantidad
FROM public.debts
WHERE client_id IS NOT NULL
UNION ALL
SELECT
  'Clientes con corporate_client_id:' as tipo,
  COUNT(*) as cantidad
FROM public.clients
WHERE corporate_client_id IS NOT NULL;