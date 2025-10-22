-- Migration: Auto Corporate Client Trigger
-- Descripción: Trigger automático para crear cliente corporativo cuando se registra una nueva empresa

-- Función para crear cliente corporativo automáticamente
CREATE OR REPLACE FUNCTION create_corporate_client_for_new_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar nuevo cliente corporativo con los datos de la empresa
  INSERT INTO corporate_clients (
    company_id,
    contact_email,
    contact_phone,
    rut,
    industry,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.contact_email,
    NEW.contact_phone,
    NEW.rut,
    'Corporativo', -- Industria por defecto
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar una nueva empresa
DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;
CREATE TRIGGER on_company_create_corporate_client
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_corporate_client_for_new_company();

-- Comentarios para documentación
COMMENT ON FUNCTION create_corporate_client_for_new_company() IS 'Crea automáticamente un cliente corporativo cuando se registra una nueva empresa';
COMMENT ON TRIGGER on_company_create_corporate_client ON companies IS 'Trigger automático para mantener consistencia entre companies y corporate_clients';

-- Política de seguridad para asegurar que el trigger funcione correctamente
-- (el trigger se ejecuta con privilegios de definidor, no necesita política especial)