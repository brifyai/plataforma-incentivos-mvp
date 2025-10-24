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
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name AND table_schema = 'public'
        ) THEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = t.table_name AND table_schema = 'public'
        )
        ELSE 0
    END as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments')
ORDER BY table_name;

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('companies', 'clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 
    'companies' as table_name,
    COUNT(*) as total_companies,
    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_companies
FROM public.companies

UNION ALL

SELECT 
    'clients' as table_name,
    COUNT(*) as total_companies,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as verified_companies
FROM public.clients

UNION ALL

SELECT 
    'debts' as table_name,
    COUNT(*) as total_companies,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as verified_companies
FROM public.debts;

SELECT 
    'Tablas creadas exitosamente' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments');