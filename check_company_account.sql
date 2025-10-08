-- Verificar estado de la cuenta empresa brifyaimaster@gmail.com
SELECT
    '=== USUARIO ===' as section,
    u.id,
    u.email,
    u.full_name,
    u.rut,
    u.role,
    u.validation_status,
    u.created_at
FROM public.users u
WHERE u.email = 'brifyaimaster@gmail.com'

UNION ALL

SELECT
    '=== EMPRESA ===' as section,
    c.id::text,
    c.company_name,
    c.rut,
    c.contact_email,
    c.is_active::text,
    c.created_at::text
FROM public.companies c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'brifyaimaster@gmail.com'

UNION ALL

SELECT
    '=== DATOS BANCARIOS ===' as section,
    CASE WHEN c.bank_account_info IS NOT NULL THEN 'TIENE_DATOS_BANCARIOS' ELSE 'SIN_DATOS_BANCARIOS' END,
    CASE WHEN c.mercadopago_beneficiary_id IS NOT NULL THEN 'REGISTRADO_EN_MP' ELSE 'NO_REGISTRADO_EN_MP' END,
    c.bank_account_info::text,
    c.mercadopago_beneficiary_id,
    c.updated_at::text
FROM public.companies c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'brifyaimaster@gmail.com';