-- ==========================================
-- CORPORATE CLIENT VALIDATION ENFORCEMENT
-- ==========================================
-- Asegurar que todos los clientes estén asociados a una empresa corporativa
-- y prohibir la creación de clientes sin empresa corporativa

-- Primero, crear la función para validar corporate_client_id
CREATE OR REPLACE FUNCTION validate_corporate_client()
RETURNS TRIGGER AS $$
DECLARE
    corporate_exists BOOLEAN;
BEGIN
    -- Verificar que el corporate_client_id exista y esté activo
    SELECT EXISTS(
        SELECT 1 FROM corporate_clients 
        WHERE id = NEW.corporate_client_id 
        AND is_active = true
    ) INTO corporate_exists;
    
    IF NOT corporate_exists THEN
        RAISE EXCEPTION 'El cliente corporativo especificado no existe o no está activo';
    END IF;
    
    -- Verificar que el corporate_client pertenezca a la misma empresa
    IF NOT EXISTS(
        SELECT 1 FROM corporate_clients cc
        WHERE cc.id = NEW.corporate_client_id 
        AND cc.company_id = NEW.company_id
    ) THEN
        RAISE EXCEPTION 'El cliente corporativo no pertenece a esta empresa';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar corporate_client_id al insertar clientes
DROP TRIGGER IF EXISTS validate_client_corporate ON clients;
CREATE TRIGGER validate_client_corporate
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION validate_corporate_client();

-- Trigger para validar corporate_client_id al actualizar clientes
DROP TRIGGER IF EXISTS validate_client_corporate_update ON clients;
CREATE TRIGGER validate_client_corporate_update
    BEFORE UPDATE ON clients
    FOR EACH ROW
    WHEN (NEW.corporate_client_id IS DISTINCT FROM OLD.corporate_client_id)
    EXECUTE FUNCTION validate_corporate_client();

-- Función para asignar automáticamente el corporate_client_id
CREATE OR REPLACE FUNCTION assign_default_corporate_client()
RETURNS TRIGGER AS $$
DECLARE
    default_corporate_id UUID;
BEGIN
    -- Si no se especifica corporate_client_id, asignar el corporativo por defecto de la empresa
    IF NEW.corporate_client_id IS NULL THEN
        SELECT id INTO default_corporate_id
        FROM corporate_clients 
        WHERE company_id = NEW.company_id 
        AND is_active = true
        LIMIT 1;
        
        IF default_corporate_id IS NULL THEN
            RAISE EXCEPTION 'No hay un cliente corporativo disponible para esta empresa';
        END IF;
        
        NEW.corporate_client_id = default_corporate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar corporate_client_id por defecto
DROP TRIGGER IF EXISTS assign_default_corporate_client ON clients;
CREATE TRIGGER assign_default_corporate_client
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_corporate_client();

-- Actualizar clientes existentes para que tengan corporate_client_id
UPDATE clients 
SET corporate_client_id = cc.id
FROM corporate_clients cc
WHERE cc.company_id = clients.company_id 
AND cc.is_active = true
AND clients.corporate_client_id IS NULL;

-- Asegurar que todos los clientes tengan corporate_client_id (fallback por seguridad)
UPDATE clients 
SET corporate_client_id = (
    SELECT id FROM corporate_clients 
    WHERE company_id = clients.company_id 
    AND is_active = true 
    LIMIT 1
)
WHERE corporate_client_id IS NULL;

-- Política RLS actualizada para clients
DROP POLICY IF EXISTS "Users can view clients of their company" ON clients;
CREATE POLICY "Users can view clients of their company"
    ON clients FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Companies can insert clients" ON clients;
CREATE POLICY "Companies can insert clients"
    ON clients FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Companies can update clients" ON clients;
CREATE POLICY "Companies can update clients"
    ON clients FOR UPDATE
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Companies can delete clients" ON clients;
CREATE POLICY "Companies can delete clients"
    ON clients FOR DELETE
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Política para administradores
CREATE POLICY IF NOT EXISTS "Admins can manage all clients"
    ON clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Validación para deudas: asegurar que las deudas con client_id tengan un cliente válido
CREATE OR REPLACE FUNCTION validate_debt_client()
RETURNS TRIGGER AS $$
DECLARE
    client_exists BOOLEAN;
BEGIN
    -- Si hay client_id, verificar que el cliente exista
    IF NEW.client_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM clients 
            WHERE id = NEW.client_id
        ) INTO client_exists;
        
        IF NOT client_exists THEN
            RAISE EXCEPTION 'El cliente especificado no existe';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar client_id en deudas
DROP TRIGGER IF EXISTS validate_debt_client ON debts;
CREATE TRIGGER validate_debt_client
    BEFORE INSERT OR UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION validate_debt_client();

COMMIT;