-- =============================================
-- PLATAFORMA DE INCENTIVOS - MIGRACIÓN 008
-- Agregar columna wallet_balance a tabla users
-- =============================================

-- Agregar columna wallet_balance a la tabla users
ALTER TABLE public.users ADD COLUMN wallet_balance DECIMAL(15, 2) DEFAULT 0.00;

-- =============================================
-- FIN DE LA MIGRACIÓN 008
-- =============================================