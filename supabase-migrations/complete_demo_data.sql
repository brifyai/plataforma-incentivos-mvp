
-- ==========================================
-- DATOS DEMO COMPLETOS PARA NEXUPAY
-- ==========================================
-- Este archivo contiene datos ficticios realistas para probar todas las funcionalidades

-- ==========================================
-- 1. USUARIOS (DEUDORES Y EMPRESAS)
-- ==========================================

-- Usuario GOD MODE (ya existe)
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
    'god-mode-user',
    'camiloalegriabarra@gmail.com',
    '$2a$10$hashedpassword', -- Contraseña hasheada
    '12.345.678-9',
    'Administrador GOD',
    'god_mode',
    'validated',
    1000000,
    NOW() - INTERVAL '30 days',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Empresas de cobranza
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
) VALUES
    ('empresa-cobranza-1', 'empresa-user-1', 'CobranzaPro SpA', '76.543.210-1', 'contacto@cobranzapro.cl', '+56987654321', 'collection_agency', 'Av. Providencia 123', 'Santiago', 'Metropolitana', 'Chile', 'https://cobranzapro.cl', 'Empresa líder en cobranzas con 15 años de experiencia', 15.0, 'percentage', 5.0, 'percentage', '{"bank": "Banco Estado", "account_type": "corriente", "account_number": "123456789"}', 'verified', NOW() - INTERVAL '60 days', NOW()),
    ('empresa-cobranza-2', 'empresa-user-2', 'RecuperaChile Ltda', '77.654.321-2', 'info@recuperachile.cl', '+56976543210', 'collection_agency', 'Calle Las Condes 456', 'Santiago', 'Metropolitana', 'Chile', 'https://recuperachile.cl', 'Especialistas en recuperación de deudas comerciales', 12.0, 'percentage', 4.5, 'percentage', '{"bank": "Banco de Chile", "account_type": "corriente", "account_number": "987654321"}', 'verified', NOW() - INTERVAL '45 days', NOW()),
    ('empresa-cobranza-3', 'empresa-user-3', 'DeudaZero SpA', '78.765.432-3', 'ventas@deudazero.cl', '+56965432109', 'collection_agency', 'Av. Apoquindo 789', 'Santiago', 'Metropolitana', 'Chile', 'https://deudazero.cl', 'Innovación en gestión de deudas con IA', 18.0, 'percentage', 6.0, 'percentage', '{"bank": "Banco Santander", "account_type": "corriente", "account_number": "456789123"}', 'verified', NOW() - INTERVAL '30 days', NOW()),
    ('empresa-cobranza-4', 'empresa-user-4', 'FinSoluciones SpA', '79.876.543-4', 'contacto@finsoluciones.cl', '+56954321098', 'collection_agency', 'Calle El Golf 321', 'Santiago', 'Metropolitana', 'Chile', 'https://finsoluciones.cl', 'Soluciones financieras integrales', 10.0, 'percentage', 3.5, 'percentage', '{"bank": "Banco BCI", "account_type": "corriente", "account_number": "789123456"}', 'verified', NOW() - INTERVAL '20 days', NOW()),
    ('empresa-cobranza-5', 'empresa-user-5', 'CreditoPlus Ltda', '80.987.654-5', 'admin@creditoplus.cl', '+56943210987', 'collection_agency', 'Av. Vitacura 654', 'Santiago', 'Metropolitana', 'Chile', 'https://creditoplus.cl', 'Gestión especializada de créditos y cobranzas', 14.0, 'percentage', 5.5, 'percentage', '{"bank": "Banco Itaú", "account_type": "corriente", "account_number": "321654987"}', 'verified', NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Usuarios de empresas
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
) VALUES
    ('empresa-user-1', 'admin@cobranzapro.cl', '$2a$10$hashedpassword', '11.111.111-1', 'Carlos Mendoza', 'company', 'validated', 500000, NOW() - INTERVAL '60 days', NOW()),
    ('empresa-user-2', 'director@recuperachile.cl', '$2a$10$hashedpassword', '22.222.222-2', 'Ana Valeria', 'company', 'validated', 750000, NOW() - INTERVAL '45 days', NOW()),
    ('empresa-user-3', 'ceo@deudazero.cl', '$2a$10$hashedpassword', '33.333.333-3', 'Roberto Silva', 'company', 'validated', 900000, NOW() - INTERVAL '30 days', NOW()),
    ('empresa-user-4', 'gerente@finsoluciones.cl', '$2a$10$hashedpassword', '44.444.444-4', 'María González', 'company', 'validated', 600000, NOW() - INTERVAL '20 days', NOW()),
    ('empresa-user-5', 'owner@creditoplus.cl', '$2a$10$hashedpassword', '55.555.555-5', 'Pedro Ramírez', 'company', 'validated', 800000, NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Deudores
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
) VALUES
    ('debtor-001', 'juan.perez@email.cl', '$2a$10$hashedpassword', '1.234.567-8', 'Juan Pérez González', 'debtor', 'validated', 15000, '+56912345678', 'Calle Los Alerces 123', 'Santiago', 'Metropolitana', 'Chile', '1985-03-15', 'Ingeniero', 1200000, NOW() - INTERVAL '90 days', NOW()),
    ('debtor-002', 'maria.lopez@email.cl', '$2a$10$hashedpassword', '2.345.678-9', 'María López Rodríguez', 'debtor', 'validated', 25000, '+56923456789', 'Av. Las Condes 456', 'Santiago', 'Metropolitana', 'Chile', '1990-07-22', 'Profesora', 800000, NOW() - INTERVAL '75 days', NOW()),
    ('debtor-003', 'carlos.sanchez@email.cl', '$2a$10$hashedpassword', '3.456.789-0', 'Carlos Sánchez Morales', 'debtor', 'validated', 5000, '+56934567890', 'Calle Providencia 789', 'Santiago', 'Metropolitana', 'Chile', '1982-11-08', 'Médico', 2500000, NOW() - INTERVAL '60 days', NOW()),
    ('debtor-004', 'ana.martinez@email.cl', '$2a$10$hashedpassword', '4.567.890-1', 'Ana Martínez Silva', 'debtor', 'validated', 35000, '+56945678901', 'Av. Apoquindo 321', 'Santiago', 'Metropolitana', 'Chile', '1988-05-30', 'Abogada', 1500000,