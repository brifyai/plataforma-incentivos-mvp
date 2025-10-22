-- Migration: Apply Corporate Client Trigger
-- Descripción: Aplicar el trigger automático para crear clientes corporativos

-- Primero eliminar el trigger si existe para evitar conflictos
DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;
DROP FUNCTION IF EXISTS create_corporate_client_for_new_company();

-- Crear la función para el trigger
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
    'Corporativo',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER on_company_create_corporate_client
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_corporate_client_for_new_company();

-- Confirmar que el trigger está activo
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_company_create_corporate_client';

-- Comentarios
COMMENT ON FUNCTION create_corporate_client_for_new_company() IS 'Crea automáticamente un cliente corporativo cuando se registra una nueva empresa';
COMMENT ON TRIGGER on_company_create_corporate_client ON companies IS 'Trigger automático para mantener consistencia entre companies y corporate_clients';