-- ========================================
-- SOLUCIÓN DEFINITIVA PARA CLIENTES CORPORATIVOS
-- Ejecutar este SQL en: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql/new
-- ========================================

-- Paso 1: Agregar columna client_id a la tabla debts
ALTER TABLE debts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Paso 2: Agregar columna corporate_client_id a la tabla clients  
ALTER TABLE clients ADD COLUMN IF NOT EXISTS corporate_client_id UUID REFERENCES corporate_clients(id);

-- Paso 3: Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Paso 4: Actualizar políticas RLS para incluir las nuevas columnas
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
CREATE POLICY "Users can view their own debts" ON debts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = debts.company_id 
            AND companies.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Companies can view their clients" ON clients;
CREATE POLICY "Companies can view their clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = clients.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- ========================================
-- VERIFICACIÓN: Después de ejecutar este SQL
-- 1. Vuelve a ejecutar: node scripts/check-client-debt-structure.cjs
-- 2. Debería mostrar "✅ SÍ" para ambas columnas
-- 3. Recarga la aplicación y prueba agregar un cliente corporativo
-- ========================================