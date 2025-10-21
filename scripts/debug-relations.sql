-- Script de diagnóstico para verificar por qué las relaciones no se crean

-- Verificar qué datos existen actualmente
SELECT 'DATOS ACTUALES:' as debug;
SELECT
  'Users:' as tabla, COUNT(*) as cantidad FROM public.users
  UNION ALL
  SELECT 'Companies:' as tabla, COUNT(*) as cantidad FROM public.companies
  UNION ALL
  SELECT 'Corporate Clients:' as tabla, COUNT(*) as cantidad FROM public.corporate_clients
  UNION ALL
  SELECT 'Clients:' as tabla, COUNT(*) as cantidad FROM public.clients
  UNION ALL
  SELECT 'Debts:' as tabla, COUNT(*) as cantidad FROM public.debts;

-- Verificar emails y IDs específicos
SELECT 'USERS:' as debug;
SELECT id, email, full_name FROM public.users ORDER BY created_at DESC;

SELECT 'COMPANIES:' as debug;
SELECT id, user_id, contact_email FROM public.companies ORDER BY created_at DESC;

SELECT 'CORPORATE CLIENTS:' as debug;
SELECT id, contact_email FROM public.corporate_clients ORDER BY created_at DESC;

SELECT 'CLIENTS:' as debug;
SELECT id, company_id, corporate_client_id, contact_email FROM public.clients ORDER BY created_at DESC;

-- Probar las consultas CROSS JOIN para ver por qué no funcionan
SELECT 'PRUEBA CROSS JOIN COMPANIES x CORPORATE_CLIENTS:' as debug;
SELECT
  c.id as company_id,
  c.contact_email as company_email,
  cc.id as corp_client_id,
  cc.contact_email as corp_client_email
FROM public.companies c
CROSS JOIN public.corporate_clients cc
WHERE c.contact_email = 'empresa@nexupay.cl'
  AND cc.contact_email = 'contacto@techcorp.cl';

SELECT 'PRUEBA CROSS JOIN USERS x COMPANIES x CLIENTS:' as debug;
SELECT
  u.id as user_id,
  u.email as user_email,
  c.id as company_id,
  c.contact_email as company_email,
  cl.id as client_id,
  cl.contact_email as client_email
FROM public.users u
CROSS JOIN public.companies c
CROSS JOIN public.clients cl
WHERE u.email = 'hola@aintelligence.cl'
  AND c.contact_email = 'empresa@nexupay.cl'
  AND cl.contact_email = 'desarrollo@techcorp.cl';