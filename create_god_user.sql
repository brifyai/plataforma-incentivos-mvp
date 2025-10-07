-- Crear usuario god_mode directamente en la base de datos
-- Primero necesitamos el UUID del usuario de Supabase Auth
-- Ejecuta esto en Supabase SQL Editor:

-- 1. Buscar el usuario en auth.users
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com';

-- 2. Una vez que tengas el ID, ejecuta:
-- INSERT INTO users (id, email, full_name, role) 
-- VALUES ('UUID_DEL_USUARIO', 'camiloalegriabarra@gmail.com', 'Camilo Alegria', 'god_mode');

-- 3. Crear perfil
-- INSERT INTO profiles (id, full_name, role, validation_status) 
-- VALUES ('UUID_DEL_USUARIO', 'Camilo Alegria', 'god_mode', 'validated');

-- 4. Verificar que se creó correctamente
-- SELECT u.email, u.role as user_role, p.role as profile_role 
-- FROM users u JOIN profiles p ON u.id = p.id 
-- WHERE u.email = 'camiloalegriabarra@gmail.com';
