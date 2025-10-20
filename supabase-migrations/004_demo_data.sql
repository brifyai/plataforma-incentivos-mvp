-- Crear empresa demo para modo administrador
INSERT INTO public.companies (
    id,
    user_id,
    business_name,
    rut,
    contact_email,
    contact_phone,
    company_type,
    address,
    created_at,
    updated_at
) VALUES (
    'demo-company-id',
    'god-mode-user',
    'Empresa Demo Administrador',
    '99.999.999-9',
    'admin@demo.cl',
    '+56912345678',
    'collection_agency',
    'Dirección Demo',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Crear algunos clientes demo
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
    ('demo-client-1', 'demo-company-id', 'Cliente Demo A', '11.111.111-1', 'contacto@clientea.cl', '+56911111111', 'Juan Pérez', 'Tecnología', 'Dirección A', 'active', NOW(), NOW()),
    ('demo-client-2', 'demo-company-id', 'Cliente Demo B', '22.222.222-2', 'contacto@clienteb.cl', '+56922222222', 'María González', 'Retail', 'Dirección B', 'active', NOW(), NOW()),
    ('demo-client-3', 'demo-company-id', 'Cliente Demo C', '33.333.333-3', 'contacto@clientec.cl', '+56933333333', 'Carlos Rodríguez', 'Financiero', 'Dirección C', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crear algunos deudores demo
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
    ('demo-debtor-1', 'deudor1@demo.cl', 'demo123', '44.444.444-4', 'Ana López', 'debtor', 'validated', 50000, NOW(), NOW()),
    ('demo-debtor-2', 'deudor2@demo.cl', 'demo123', '55.555.555-5', 'Pedro Martínez', 'debtor', 'validated', 25000, NOW(), NOW()),
    ('demo-debtor-3', 'deudor3@demo.cl', 'demo123', '66.666.666-6', 'Laura Sánchez', 'debtor', 'validated', 75000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crear algunas deudas demo
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
    created_at,
    updated_at
) VALUES 
    ('demo-debt-1', 'demo-debtor-1', 'demo-company-id', 'demo-client-1', 150000, 150000, 'credit_card', 'DEBT-001', 'active', NOW(), NOW()),
    ('demo-debt-2', 'demo-debtor-2', 'demo-company-id', 'demo-client-2', 250000, 250000, 'loan', 'DEBT-002', 'active', NOW(), NOW()),
    ('demo-debt-3', 'demo-debtor-3', 'demo-company-id', 'demo-client-3', 95000, 95000, 'service', 'DEBT-003', 'active', NOW(), NOW()),
    ('demo-debt-4', 'demo-debtor-1', 'demo-company-id', 'demo-client-1', 200000, 200000, 'credit_card', 'DEBT-004', 'paid', NOW(), NOW()),
    ('demo-debt-5', 'demo-debtor-2', 'demo-company-id', 'demo-client-2', 175000, 175000, 'loan', 'DEBT-005', 'in_negotiation', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crear algunos pagos demo
INSERT INTO public.payments (
    id,
    user_id,
    company_id,
    agreement_id,
    debt_id,
    amount,
    payment_method,
    status,
    transaction_date,
    created_at,
    updated_at
) VALUES 
    ('demo-payment-1', 'demo-debtor-1', 'demo-company-id', NULL, 'demo-debt-4', 200000, 'bank_transfer', 'completed', NOW(), NOW(), NOW()),
    ('demo-payment-2', 'demo-debtor-2', 'demo-company-id', NULL, 'demo-debt-5', 175000, 'mercadopago', 'completed', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crear algunos acuerdos demo
INSERT INTO public.agreements (
    id,
    user_id,
    company_id,
    debt_id,
    offer_id,
    total_agreed_amount,
    status,
    created_at,
    updated_at
) VALUES 
    ('demo-agreement-1', 'demo-debtor-1', 'demo-company-id', 'demo-debt-1', NULL, 135000, 'active', NOW(), NOW()),
    ('demo-agreement-2', 'demo-debtor-2', 'demo-company-id', 'demo-debt-2', NULL, 225000, 'active', NOW(), NOW()),
    ('demo-agreement-3', 'demo-debtor-3', 'demo-company-id', 'demo-debt-3', NULL, 85500, 'completed', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
