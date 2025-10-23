SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    company_name,
    rut,
    legal_representative_name,
    legal_representative_rut,
    legal_representative_email,
    legal_representative_phone,
    company_address,
    company_region,
    business_type,
    verification_status,
    is_verified,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments')
ORDER BY table_name;

SELECT 
    'Tablas creadas exitosamente' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments');

SELECT 
    'Tablas con RLS habilitado' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
    AND tablename IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments');

SELECT 
    'Total de índices creados' as status,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments');