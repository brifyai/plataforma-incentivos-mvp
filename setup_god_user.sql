-- Script completo para configurar usuario god_mode
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Buscar el usuario en auth.users y crear registros automáticamente
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := 'camiloalegriabarra@gmail.com';
    user_name TEXT := 'Camilo Alegria';
BEGIN
    -- Buscar el UUID del usuario en auth.users
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Verificar que el usuario existe
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuario % no encontrado en auth.users', user_email;
    END IF;
    
    -- Insertar en tabla users (si no existe)
    INSERT INTO users (id, email, full_name, role) 
    VALUES (user_uuid, user_email, user_name, 'god_mode')
    ON CONFLICT (id) DO UPDATE SET
        role = 'god_mode',
        full_name = user_name;
    
    -- Insertar en tabla profiles (si no existe)
    INSERT INTO profiles (id, full_name, role, validation_status) 
    VALUES (user_uuid, user_name, 'god_mode', 'validated')
    ON CONFLICT (id) DO UPDATE SET
        role = 'god_mode',
        validation_status = 'validated',
        full_name = user_name;
    
    -- Mostrar resultado
    RAISE NOTICE 'Usuario god_mode configurado exitosamente: % (%)', user_email, user_uuid;
END $$;

-- Paso 2: Verificar que se creó correctamente
SELECT 
    'Usuario configurado:' as status,
    u.email, 
    u.role as user_role, 
    p.role as profile_role,
    p.validation_status
FROM users u 
JOIN profiles p ON u.id = p.id 
WHERE u.email = 'camiloalegriabarra@gmail.com';
