-- ==========================================
-- ASIGNAR CRISTIAN OLIVARES COMO DEUDOR DE TECHCORP S.A.
-- ==========================================

-- 1. Verificar que existe la empresa TechCorp S.A.
-- Si no existe, crearla
INSERT INTO public.companies (
    id,
    user_id,
    business_name,
    rut,
    contact_email,
    contact_phone,
    company_type,
    address,
    city,
    region,
    country,
    website,
    description,
    nexupay_commission,
    nexupay_commission_type,
    user_incentive_percentage,
    user_incentive_type,
    bank_account_info,
    verification_status,
    created_at,
    updated_at
) VALUES (
    'techcorp-sa',
    'empresa-user-techcorp',
    'TechCorp S.A.',
    '76.543.210-K', -- RUT ficticio, debe ser actualizado con el real
    'contacto@techcorp.cl',
    '+56987654321',
    'collection_agency',
    'Av. Providencia 123, Santiago',
    'Santiago',
    'Metropolitana',
    'Chile',
    'https://techcorp.cl',
    'Empresa de tecnología especializada en soluciones innovadoras',
    15.0,
    'percentage',
    5.0,
    'percentage',
    '{"bank": "Banco Estado", "account_type": "corriente", "account_number": "123456789"}',
    'verified',
    NOW() - INTERVAL '45 days',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear usuario para TechCorp S.A. si no existe
INSERT INTO public.users (
    id,
    email,
    password,
    rut,
    full_name,
    role,
    validation_status,
    wallet_balance,
    created_at,
    updated_at
) VALUES (
    'empresa-user-techcorp',
    'admin@techcorp.cl',
    '$2a$10$hashedpassword', -- Contraseña hasheada
    '11.111.111-K',
    'Administrador TechCorp',
    'company',
    'validated',
    100000,
    NOW() - INTERVAL '45 days',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que existe el usuario deudor Cristian Olivares
-- Si no existe, crearlo
INSERT INTO public.users (
    id,
    email,
    password,
    rut,
    full_name,
    role,
    validation_status,
    wallet_balance,
    phone,
    address,
    city,
    region,
    country,
    date_of_birth,
    occupation,
    monthly_income,
    created_at,
    updated_at
) VALUES (
    'debtor-cristian-olivares',
    'cristianolivares429@gmail.com',
    '$2a$10$hashedpassword', -- Contraseña hasheada
    '16230432-1',
    'Cristian Olivares',
    'debtor',
    'validated',
    50000,
    '+56912345678',
    'Dirección por confirmar',
    'Santiago',
    'Metropolitana',
    'Chile',
    '1990-01-01',
    'Profesional',
    1500000,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 4. Crear cliente para TechCorp S.A. si no existe
INSERT INTO public.clients (
    id,
    company_id,
    business_name,
    rut,
    contact_email,
    contact_phone,
    contact_name,
    industry,
    address,
    status,
    created_at,
    updated_at
) VALUES
    ('techcorp-client-1', 'techcorp-sa', 'Cliente TechCorp A', '12.345.678-9', 'cliente@techcorp.cl', '+56911111111', 'Juan Pérez', 'Tecnología', 'Dirección Cliente A', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Crear deudas de Cristian Olivares con TechCorp S.A.
INSERT INTO public.debts (
    id,
    user_id,
    company_id,
    client_id,
    original_amount,
    current_amount,
    debt_type,
    debt_reference,
    status,
    description,
    due_date,
    created_at,
    updated_at
) VALUES (
    'debt-cristian-techcorp-1',
    'debtor-cristian-olivares',
    'techcorp-sa',
    'techcorp-client-1',
    500000,
    500000,
    'service',
    'DEBT-TECHCORP-001',
    'active',
    'Deuda por servicios tecnológicos con TechCorp S.A.',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.debts (
    id,
    user_id,
    company_id,
    client_id,
    original_amount,
    current_amount,
    debt_type,
    debt_reference,
    status,
    description,
    due_date,
    created_at,
    updated_at
) VALUES (
    'debt-cristian-techcorp-2',
    'debtor-cristian-olivares',
    'techcorp-sa',
    'techcorp-client-1',
    250000,
    250000,
    'credit_card',
    'DEBT-TECHCORP-002',
    'active',
    'Deuda por tarjeta de crédito con TechCorp S.A.',
    NOW() + INTERVAL '60 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Verificar la configuración
-- Este query puede ejecutarse después para confirmar que todo está correcto
-- SELECT
--     u.email, u.full_name, u.rut, u.role,
--     d.id as debt_id, d.original_amount, d.current_amount, d.status, d.debt_reference,
--     c.business_name as company_name
-- FROM public.users u
-- JOIN public.debts d ON u.id = d.user_id
-- JOIN public.companies c ON d.company_id = c.id
-- WHERE u.email = 'cristianolivares429@gmail.com' AND c.business_name = 'TechCorp S.A.';