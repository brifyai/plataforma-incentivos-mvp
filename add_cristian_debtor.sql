-- ==========================================
-- AGREGAR CRISTIAN OLIVARES COMO DEUDOR DE AINTELLIGENCE SPA
-- ==========================================

-- 1. Crear usuario deudor para Cristian Olivares
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
    '$2a$10$hashedpassword', -- Contraseña hasheada (deberá ser cambiada por el usuario)
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
    '1990-01-01', -- Fecha aproximada, debe ser actualizada
    'Profesional',
    1500000,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Crear deuda para Cristian Olivares con AIntelligence SPA
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
    'debt-cristian-aintelligence-1',
    'debtor-cristian-olivares',
    'aintelligence-spa',
    'demo-client-1', -- Usando cliente demo existente
    500000,
    500000,
    'service',
    'DEBT-CRISTIAN-001',
    'active',
    'Deuda por servicios profesionales con AIntelligence SPA',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Crear una segunda deuda más pequeña
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
    'debt-cristian-aintelligence-2',
    'debtor-cristian-olivares',
    'aintelligence-spa',
    'demo-client-1',
    250000,
    250000,
    'credit_card',
    'DEBT-CRISTIAN-002',
    'active',
    'Deuda por tarjeta de crédito con AIntelligence SPA',
    NOW() + INTERVAL '60 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Verificar la configuración
-- Este query puede ejecutarse después para confirmar que todo está correcto
-- SELECT
--     u.email, u.full_name, u.rut, u.role,
--     d.id as debt_id, d.original_amount, d.current_amount, d.status, d.debt_reference,
--     c.business_name as company_name
-- FROM public.users u
-- JOIN public.debts d ON u.id = d.user_id
-- JOIN public.companies c ON d.company_id = c.id
-- WHERE u.email = 'cristianolivares429@gmail.com';