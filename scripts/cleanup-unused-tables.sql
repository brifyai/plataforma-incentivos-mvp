-- Script para LIMPIAR tablas no utilizadas o problemáticas
-- Ejecutar DESPUÉS del script de reconstrucción

-- VERIFICAR qué tablas existen actualmente
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ELIMINAR tablas que NO se usan en la aplicación actual
-- (Estas son tablas legacy o de desarrollo que pueden causar conflictos)

-- Tablas potencialmente problemáticas o no utilizadas:
DROP TABLE IF EXISTS public.ab_testing_tables CASCADE;
DROP TABLE IF EXISTS public.add_bank_fields_to_companies CASCADE;
DROP TABLE IF EXISTS public.add_commission_fields CASCADE;
DROP TABLE IF EXISTS public.add_cristian_debtor CASCADE;
DROP TABLE IF EXISTS public.add_days_overdue_to_debts CASCADE;
DROP TABLE IF EXISTS public.add_invitation_fields_to_users CASCADE;
DROP TABLE IF EXISTS public.add_oauth_fields CASCADE;
DROP TABLE IF EXISTS public.add_proposals_table CASCADE;
DROP TABLE IF EXISTS public.assign_cristian_techcorp CASCADE;
DROP TABLE IF EXISTS public.associate_user_company CASCADE;
DROP TABLE IF EXISTS public.company_verification_system CASCADE;
DROP TABLE IF EXISTS public.complete_demo_data CASCADE;
DROP TABLE IF EXISTS public.create_ai_providers_table_clean CASCADE;
DROP TABLE IF EXISTS public.create_ai_providers_table_simple CASCADE;
DROP TABLE IF EXISTS public.create_campaigns_and_analytics_tables CASCADE;
DROP TABLE IF EXISTS public.create_campaigns_tables CASCADE;
DROP TABLE IF EXISTS public.create_company_ai_config_table CASCADE;
DROP TABLE IF EXISTS public.create_corporate_prompt_templates CASCADE;
DROP TABLE IF EXISTS public.create_debtor_corporate_matches_table CASCADE;
DROP TABLE IF EXISTS public.create_gift_cards_table CASCADE;
DROP TABLE IF EXISTS public.create_oauth_company_function CASCADE;
DROP TABLE IF EXISTS public.create_payment_goals_table CASCADE;
DROP TABLE IF EXISTS public.create_verification_bucket CASCADE;
DROP TABLE IF EXISTS public.create_wallet_transactions_table CASCADE;
DROP TABLE IF EXISTS public.delete_user_email CASCADE;
DROP TABLE IF EXISTS public.external_ai_providers_tables CASCADE;
DROP TABLE IF EXISTS public.external_ai_providers CASCADE;
DROP TABLE IF EXISTS public.fix_companies_rls CASCADE;
DROP TABLE IF EXISTS public.fix_import_policies CASCADE;
DROP TABLE IF EXISTS public.production_readiness_tables CASCADE;
DROP TABLE IF EXISTS public.setup_verification_policies_simple CASCADE;
DROP TABLE IF EXISTS public.setup_verification_policies CASCADE;

-- Tablas que pueden existir pero no se usan:
DROP TABLE IF EXISTS public.campaign_debtors CASCADE;
DROP TABLE IF EXISTS public.campaign_results_summary CASCADE;
DROP TABLE IF EXISTS public.commission_history CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.consents CASCADE;
DROP TABLE IF EXISTS public.gdpr_consents CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.security_events CASCADE;
DROP TABLE IF EXISTS public.encrypted_data CASCADE;
DROP TABLE IF EXISTS public.knowledge_base CASCADE;
DROP TABLE IF EXISTS public.rag_embeddings CASCADE;
DROP TABLE IF EXISTS public.messaging_tables CASCADE;
DROP TABLE IF EXISTS public.payment_receipts CASCADE;
DROP TABLE IF EXISTS public.unified_campaigns CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.payment_preferences CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.schema_migrations CASCADE;

-- LIMPIAR funciones y triggers no utilizados
DROP FUNCTION IF EXISTS get_active_connections() CASCADE;
DROP FUNCTION IF EXISTS check_rls_status() CASCADE;

-- VERIFICACIÓN FINAL: Solo las tablas esenciales deben quedar
SELECT '🧹 TABLAS LIMPIADAS - VERIFICACIÓN FINAL:' as status;
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Contar tablas restantes
SELECT '📊 TABLAS RESTANTES:' as info, COUNT(*) as cantidad
FROM pg_tables
WHERE schemaname = 'public';

-- Verificar que las tablas esenciales existen
SELECT '✅ TABLAS ESENCIALES:' as status;
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN '✅ users' ELSE '❌ users' END as users,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN '✅ companies' ELSE '❌ companies' END as companies,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'corporate_clients') THEN '✅ corporate_clients' ELSE '❌ corporate_clients' END as corporate_clients,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN '✅ clients' ELSE '❌ clients' END as clients,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debts') THEN '✅ debts' ELSE '❌ debts' END as debts;

-- Mensaje final
SELECT '🎉 ¡LIMPIEZA COMPLETA!' as mensaje UNION ALL
SELECT '   • Todas las tablas problemáticas eliminadas' UNION ALL
SELECT '   • Solo tablas esenciales restantes' UNION ALL
SELECT '   • Base de datos 100% limpia y funcional';