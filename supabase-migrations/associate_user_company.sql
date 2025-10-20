-- ==========================================
-- ASOCIAR USUARIO CON EMPRESA AINTELLIGENCE SPA
-- ==========================================

-- 1. Crear usuario si no existe
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
    created_at,
    updated_at
) VALUES (
    'user-cristian-olivares',
    'cristianolivares429@gmail.com',
    '$2a$10$hashedpassword', -- Contraseña hasheada (deberá ser cambiada por el usuario)
    '12.345.678-9', -- RUT ficticio, debe ser actualizado
    'Cristian Olivares',
    'company',
    'validated',
    0,
    '+56912345678', -- Teléfono ficticio, debe ser actualizado
    'Dirección por confirmar',
    'Santiago',
    'Metropolitana',
    'Chile',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Crear empresa AIntelligence SPA si no existe
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
    'aintelligence-spa',
    'user-cristian-olivares',
    'AIntelligence SPA',
    '77.123.456-7', -- RUT ficticio, debe ser actualizado con el real
    'cristianolivares429@gmail.com',
    '+56912345678', -- Teléfono ficticio, debe ser actualizado
    'collection_agency',
    'Dirección por confirmar',
    'Santiago',
    'Metropolitana',
    'Chile',
    'https://aintelligence.cl',
    'Empresa especializada en soluciones de inteligencia artificial para cobranzas',
    15.0,
    'percentage',
    5.0,
    'percentage',
    '{"bank": "Por confirmar", "account_type": "corriente", "account_number": "Por confirmar"}',
    'pending',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar la asociación
-- Este query puede ejecutarse después para confirmar que todo está correcto
-- SELECT u.email, u.full_name, c.business_name, c.rut
-- FROM public.users u
-- JOIN public.companies c ON u.id = c.user_id
-- WHERE u.email = 'cristianolivares429@gmail.com';