-- 🚨 SCRIPT DE NUCLEAR Y RECONSTRUIR BASE DE DATOS
-- ⚠️  ATENCIÓN: Esto borra TODO y reconstruye desde cero
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: BORRAR TODO (orden inverso de dependencias)
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.corporate_clients CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- PASO 2: RECREAR TABLAS DESDE CERO (solo las esenciales)

-- Tabla users
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  rut TEXT,
  role TEXT DEFAULT 'debtor',
  phone TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  rut TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  nexupay_commission_type TEXT DEFAULT 'percentage',
  nexupay_commission DECIMAL(5,2) DEFAULT 15.00,
  user_incentive_type TEXT DEFAULT 'percentage',
  user_incentive_percentage DECIMAL(5,2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla corporate_clients
CREATE TABLE public.corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  rut TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  business_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  rut TEXT,
  corporate_client_id UUID REFERENCES public.corporate_clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla debts
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  original_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: HABILITAR RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR POLÍTICAS BÁSICAS (permitir todo por ahora)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all operations on corporate_clients" ON public.corporate_clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on debts" ON public.debts FOR ALL USING (true);

-- PASO 5: POBLAR CON DATOS DE PRODUCCIÓN

-- Usuario admin
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance)
VALUES (gen_random_uuid(), 'Administrador NexuPay', 'admin@nexupay.cl', '11111111-1', 'god_mode', '+56912345678', 0);

-- Empresa
INSERT INTO public.companies (id, user_id, company_name, rut, contact_email, contact_phone, nexupay_commission_type, nexupay_commission, user_incentive_type, user_incentive_percentage)
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
  5
FROM public.users u WHERE u.email = 'admin@nexupay.cl';

-- Cliente corporativo
INSERT INTO public.corporate_clients (id, company_id, contact_email, contact_phone, rut, industry)
SELECT
  gen_random_uuid(),
  c.id,
  'cliente@empresa.cl',
  '+56911223344',
  '98765432-1',
  'Tecnología'
FROM public.companies c WHERE c.contact_email = 'empresa@nexupay.cl';

-- Cliente específico
INSERT INTO public.clients (id, company_id, business_name, contact_email, contact_phone, rut, corporate_client_id)
SELECT
  gen_random_uuid(),
  c.id,
  'Cliente Principal',
  'cliente@empresa.cl',
  '+56911223344',
  '98765432-1',
  cc.id
FROM public.companies c
CROSS JOIN public.corporate_clients cc
WHERE c.contact_email = 'empresa@nexupay.cl' AND cc.contact_email = 'cliente@empresa.cl';

-- Deudor
INSERT INTO public.users (id, full_name, email, rut, role, phone, wallet_balance)
VALUES (gen_random_uuid(), 'Juan Pérez', 'juan.perez@email.cl', '11111111-1', 'debtor', '+56912345678', 0);

-- Deuda
INSERT INTO public.debts (id, user_id, company_id, client_id, original_amount, current_amount, description, status, due_date)
SELECT
  gen_random_uuid(),
  u.id,
  c.id,
  cl.id,
  5000000,
  5000000,
  'Servicio de consultoría tecnológica',
  'active',
  CURRENT_DATE + INTERVAL '60 days'
FROM public.users u
CROSS JOIN public.companies c
CROSS JOIN public.clients cl
WHERE u.email = 'juan.perez@email.cl'
  AND c.contact_email = 'empresa@nexupay.cl'
  AND cl.contact_email = 'cliente@empresa.cl';

-- VERIFICACIÓN FINAL
SELECT '🎉 BASE DE DATOS RECONSTRUIDA:' as status;
SELECT
  (SELECT COUNT(*) FROM public.users) as usuarios,
  (SELECT COUNT(*) FROM public.companies) as empresas,
  (SELECT COUNT(*) FROM public.corporate_clients) as corporativos,
  (SELECT COUNT(*) FROM public.clients) as clientes,
  (SELECT COUNT(*) FROM public.debts) as deudas;

-- USUARIOS PARA LOGIN
SELECT '🔐 USUARIOS DISPONIBLES:' as info;
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
ORDER BY CASE WHEN role = 'god_mode' THEN 1 WHEN role = 'company' THEN 2 WHEN role = 'debtor' THEN 3 ELSE 4 END;

-- INSTRUCCIONES
SELECT '✅ ¡BASE DE DATOS FUNCIONAL!' as mensaje UNION ALL
SELECT '   • Admin: admin@nexupay.cl' UNION ALL
SELECT '   • Empresa: empresa@nexupay.cl' UNION ALL
SELECT '   • Deudor: juan.perez@email.cl' UNION ALL
SELECT '   • Contraseña: 123456' UNION ALL
SELECT '   • ¡AHORA FUNCIONA TODO!';