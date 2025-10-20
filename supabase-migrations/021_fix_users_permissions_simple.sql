-- ===================================
-- Versión simplificada para corregir permisos de users
-- ===================================

-- 1. Habilitar RLS en la tabla users si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 3. Crear políticas básicas para que los usuarios gestionen su propio perfil

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid() = id
    );

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() = id
    );

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- 4. Verificación simple
SELECT 'Permisos básicos de users actualizados correctamente' as status;