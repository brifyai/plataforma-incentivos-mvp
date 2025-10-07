-- =============================================
-- PLATAFORMA DE INCENTIVOS - MIGRACIÓN 006
-- Agregar columna password a tabla users
-- =============================================

-- Agregar columna password a la tabla users
ALTER TABLE public.users ADD COLUMN password VARCHAR(255);

-- =============================================
-- FIN DE LA MIGRACIÓN 006
-- =============================================