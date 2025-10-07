-- =============================================
-- LIMPIAR DATOS DE PRUEBA
-- =============================================

-- Eliminar pagos de prueba insertados por la migración
DELETE FROM public.payments
WHERE transaction_id LIKE 'MP_%'
   OR transaction_id LIKE 'TX_%'
   OR payment_method = 'admin_created';

-- Eliminar wallets de prueba
DELETE FROM public.wallets
WHERE user_id IN (
    SELECT id FROM public.users
    WHERE email LIKE '%@example.com'
       OR role = 'debtor'
);

-- Nota: Mantener usuarios y empresas de prueba para desarrollo
-- Solo eliminar transacciones/pagos de prueba

-- =============================================
-- DATOS DE PRUEBA ELIMINADOS
-- =============================================