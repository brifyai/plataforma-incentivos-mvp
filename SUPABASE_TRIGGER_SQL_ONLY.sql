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

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar estado actual del sistema
SELECT 
  'Empresas' as tipo,
  COUNT(*) as cantidad
FROM companies
UNION ALL
SELECT 
  'Clientes Corporativos' as tipo,
  COUNT(*) as cantidad
FROM corporate_clients
UNION ALL
SELECT 
  'Clientes Regulares' as tipo,
  COUNT(*) as cantidad
FROM clients;

-- Verificar consistencia de datos
SELECT 
  c.company_name,
  cc.id as corporate_client_id,
  cc.contact_email as corporate_email,
  CASE 
    WHEN cc.id IS NOT NULL THEN '✅ OK'
    ELSE '❌ Sin cliente corporativo'
  END as status
FROM companies c
LEFT JOIN corporate_clients cc ON c.id = cc.company_id
ORDER BY c.created_at DESC;

-- =====================================================
-- PRUEBA DEL TRIGGER (OPCIONAL)
-- =====================================================

-- Descomentar las siguientes líneas para probar el trigger:

/*
-- Insertar empresa de prueba
INSERT INTO companies (
  user_id, 
  company_name, 
  contact_email, 
  contact_phone, 
  rut, 
  validation_status
) VALUES (
  'test-user-id', 
  'Empresa Test Trigger', 
  'test@trigger.com', 
  '+56 9 1234 5678', 
  '99.999.999-9', 
  'pending'
);

-- Verificar que se creó el cliente corporativo
SELECT * FROM corporate_clients 
WHERE company_id = (
  SELECT id FROM companies 
  WHERE company_name = 'Empresa Test Trigger'
);

-- Limpiar datos de prueba
DELETE FROM corporate_clients 
WHERE company_id = (
  SELECT id FROM companies 
  WHERE company_name = 'Empresa Test Trigger'
);

DELETE FROM companies 
WHERE company_name = 'Empresa Test Trigger';
*/

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
/*
1. Copia todo este contenido (sin los comentarios de bloque)
2. Pégalo en el SQL Editor de Supabase Dashboard
3. Ejecuta el query
4. Verifica que no haya errores
5. Confirma que el trigger aparezca en los resultados

El trigger se ejecutará automáticamente cada vez que se inserte una nueva empresa
en la tabla companies, creando el correspondiente cliente corporativo.
*/