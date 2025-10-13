-- ==========================================
-- ELIMINAR USUARIO CON EMAIL cristianolivares429@gmail.com
-- ==========================================

-- 1. Eliminar empresa asociada (si existe)
DELETE FROM public.companies
WHERE contact_email = 'cristianolivares429@gmail.com'
   OR user_id IN (
       SELECT id FROM public.users WHERE email = 'cristianolivares429@gmail.com'
   );

-- 2. Eliminar usuario
DELETE FROM public.users
WHERE email = 'cristianolivares429@gmail.com';

-- 3. Verificar eliminación
-- Este query puede ejecutarse después para confirmar que se eliminó
-- SELECT 'Usuario eliminado' as resultado
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.users WHERE email = 'cristianolivares429@gmail.com'
-- );