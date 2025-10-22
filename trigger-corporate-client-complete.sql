-- =====================================================
-- TRIGGER AUTOMÁTICO PARA CLIENTE CORPORATIVO
-- NexuPay - Sistema de Gestión de Cobranza
-- =====================================================

-- 1. Eliminar trigger y función existentes si existen
DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;
DROP FUNCTION IF EXISTS create_corporate_client_for_new_company();

-- 2. Crear la función para el trigger
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

-- 3. Crear el trigger
CREATE TRIGGER on_company_create_corporate_client
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_corporate_client_for_new_company();

-- 4. Verificar que el trigger esté activo
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgtype as trigger_type,
  tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'on_company_create_corporate_client';

-- 5. Comentarios para documentación
COMMENT ON FUNCTION create_corporate_client_for_new_company() IS 'Crea automáticamente un cliente corporativo cuando se registra una nueva empresa';
COMMENT ON TRIGGER on_company_create_corporate_client ON companies IS 'Trigger automático para mantener consistencia entre companies y corporate_clients';

-- 6. Prueba del trigger (opcional)
-- INSERT INTO companies (user_id, company_name, contact_email, contact_phone, rut, validation_status)
-- VALUES ('test-user-id', 'Empresa Test Trigger', 'test@trigger.com', '+56 9 1234 5678', '99.999.999-9', 'pending');

-- 7. Verificar resultados (opcional)
-- SELECT * FROM corporate_clients WHERE company_id = (SELECT id FROM companies WHERE company_name = 'Empresa Test Trigger');

-- =====================================================
-- INSTRUCCIONES DE APLICACIÓN
-- =====================================================
/*
1. Abre el Supabase Dashboard
2. Ve a la sección "SQL Editor"
3. Copia y pega todo este SQL
4. Ejecuta el query
5. Verifica que no haya errores
6. Confirma que el trigger aparece en los resultados de la consulta

El trigger se ejecutará automáticamente cada vez que se inserte una nueva empresa
en la tabla companies, creando el correspondiente cliente corporativo.
*/