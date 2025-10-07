-- Recrear usuario God Mode después de eliminación accidental
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el usuario de auth existe
SELECT id, email FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com';

-- 2. Crear registro en tabla users
INSERT INTO users (id, email, full_name, rut, role, validation_status, created_at)
VALUES (
  '19eabe9d-66ab-46ad-af24-a48f356b81a8',
  'camiloalegriabarra@gmail.com',
  'Camilo Alegria (God Mode)',
  'GOD123456',
  'god_mode',
  'validated',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que se creó correctamente
SELECT id, email, full_name, role, validation_status
FROM users
WHERE email = 'camiloalegriabarra@gmail.com';