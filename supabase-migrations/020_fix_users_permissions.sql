-- ===================================
-- Corregir permisos de la tabla users
-- ===================================

-- 1. Habilitar RLS en la tabla users si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas para que los usuarios puedan leer y actualizar su propia información

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid() = id
    );

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() = id
    );

-- Política para que los usuarios puedan insertar su propio perfil (solo para nuevos registros)
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- 3. Política para que las empresas puedan ver información de usuarios relacionados
CREATE POLICY IF NOT EXISTS "Companies can view related users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debts 
            WHERE debts.user_id = users.id
            AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = debts.company_id 
                AND companies.user_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.debtor_id = users.id
            AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = conversations.company_id 
                AND companies.user_id = auth.uid()
            )
        )
    );

-- 4. Verificar que las políticas estén creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- 5. Mostrar mensaje de éxito
SELECT 'Permisos de tabla users actualizados correctamente' as status;