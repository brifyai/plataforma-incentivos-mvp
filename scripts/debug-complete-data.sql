-- ANÁLISIS COMPLETO DEL ESTADO ACTUAL DE DATOS
-- Este script revisa todas las tablas involucradas en el sistema de clientes

-- 1. Estado actual de la tabla companies
SELECT '=== COMPANIES ===' as section;
SELECT 
    id,
    company_name,
    user_id,
    validation_status,
    rut,
    email,
    created_at
FROM companies 
ORDER BY created_at;

-- 2. Estado actual de la tabla corporate_clients
SELECT '=== CORPORATE_CLIENTS ===' as section;
SELECT 
    id,
    business_name,
    company_id,
    industry,
    contact_email,
    created_at
FROM corporate_clients 
ORDER BY created_at;

-- 3. Estado actual de la tabla clients
SELECT '=== CLIENTS ===' as section;
SELECT 
    id,
    rut,
    name,
    email,
    corporate_client_id,
    status,
    created_at
FROM clients 
ORDER BY created_at;

-- 4. Estado actual de la tabla debts
SELECT '=== DEBTS ===' as section;
SELECT 
    id,
    client_id,
    company_id,
    amount,
    status,
    created_at
FROM debts 
ORDER BY created_at;

-- 5. Estado actual de la tabla users
SELECT '=== USERS ===' as section;
SELECT 
    id,
    email,
    role,
    created_at
FROM users 
WHERE email LIKE '%nexupay%' OR email LIKE '%empresa%'
ORDER BY created_at;

-- 6. Relaciones completas
SELECT '=== RELACIONES COMPLETAS ===' as section;
SELECT 
    c.id as company_id,
    c.company_name,
    u.email as user_email,
    cc.id as corporate_client_id,
    cc.business_name as corporate_name,
    cl.id as client_id,
    cl.rut as client_rut,
    cl.name as client_name,
    d.id as debt_id,
    d.amount as debt_amount
FROM companies c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN corporate_clients cc ON cc.company_id = c.id
LEFT JOIN clients cl ON cl.corporate_client_id = cc.id
LEFT JOIN debts d ON d.client_id = cl.id
WHERE c.email LIKE '%nexupay%' OR u.email LIKE '%nexupay%'
ORDER BY c.id, cc.id, cl.id, d.id;