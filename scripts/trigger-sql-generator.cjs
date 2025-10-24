const fs = require('fs');
require('dotenv').config({ path: '.env' });

function generateTriggerSQL() {
  console.log('🔧 Generando SQL para trigger automático de cliente corporativo...\n');

  // SQL completo para aplicar el trigger
  const completeSQL = `-- =====================================================
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
*/`;

  // Guardar el SQL en un archivo
  const sqlFileName = 'trigger-corporate-client-complete.sql';
  fs.writeFileSync(sqlFileName, completeSQL, 'utf8');

  console.log(`✅ SQL generado y guardado en: ${sqlFileName}`);
  console.log(`📏 Tamaño: ${completeSQL.length} caracteres`);
  
  // Crear guía de aplicación
  const guide = `# Guía de Aplicación del Trigger Automático

## 🎯 Objetivo
Activar el trigger automático que crea clientes corporativos cuando se registra una nueva empresa.

## 📋 Pasos a Seguir

### 1. Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto NexuPay

### 2. Abrir SQL Editor
1. En el menú lateral, haz clic en "SQL Editor"
2. Se abrirá una nueva ventana para ejecutar queries SQL

### 3. Ejecutar el SQL
1. Copia todo el contenido del archivo \`${sqlFileName}\`
2. Pégalo en el editor SQL
3. Haz clic en "Run" o presiona Ctrl+Enter
4. Espera a que se ejecute completamente

### 4. Verificar Resultados
Deberías ver una tabla con los siguientes datos si el trigger se creó correctamente:
- trigger_name: \`on_company_create_corporate_client\`
- table_name: \`companies\`
- function_name: \`create_corporate_client_for_new_company\`
- is_enabled: \`t\` (true)

### 5. Probar el Trigger (Opcional)
Descomenta las líneas de prueba al final del SQL y ejecuta:
1. Inserta una empresa de prueba
2. Verifica que se cree automáticamente el cliente corporativo
3. Limpia los datos de prueba

## 🔍 Verificación Post-Aplicación

Para verificar que todo funciona correctamente:

### Verificar trigger activo:
\`\`\`sql
SELECT * FROM pg_trigger WHERE tgname = 'on_company_create_corporate_client';
\`\`\`

### Verificar función:
\`\`\`sql
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_corporate_client_for_new_company';
\`\`\`

### Probar con nueva empresa:
\`\`\`sql
-- Insertar empresa de prueba
INSERT INTO companies (user_id, company_name, contact_email, contact_phone, rut, validation_status)
VALUES ('test-user-id', 'Empresa Test Final', 'test@final.com', '+56 9 9999 9999', '88.888.888-8', 'pending');

-- Verificar cliente corporativo creado
SELECT * FROM corporate_clients WHERE company_id = (
  SELECT id FROM companies WHERE company_name = 'Empresa Test Final'
);
\`\`\`

## 🚨 Notas Importantes

1. **Permisos**: Asegúrate de tener permisos de administrador en Supabase
2. **Backup**: Considera hacer un backup antes de aplicar cambios
3. **Testing**: Prueba siempre en un entorno de desarrollo primero
4. **Rollback**: Si algo sale mal, puedes eliminar el trigger con:
   \`\`\`sql
   DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;
   DROP FUNCTION IF EXISTS create_corporate_client_for_new_company();
   \`\`\`

## ✅ Confirmación de Funcionamiento

Una vez aplicado el trigger:
- ✅ Cada nueva empresa generará automáticamente un cliente corporativo
- ✅ Los clientes creados manualmente asignarán el corporate_client_id correcto
- ✅ El sistema mantendrá consistencia entre empresas y clientes corporativos
- ✅ No se podrán crear clientes sin empresa corporativa asociada

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de Supabase
2. Verifica que las tablas existan
3. Confirma que los permisos sean correctos
4. Contacta al administrador del sistema
`;

  // Guardar la guía
  const guideFileName = 'TRIGGER_APPLICATION_GUIDE.md';
  fs.writeFileSync(guideFileName, guide, 'utf8');

  console.log(`✅ Guía generada y guardada en: ${guideFileName}`);
  console.log('\n📋 Resumen:');
  console.log('   - SQL completo: trigger-corporate-client-complete.sql');
  console.log('   - Guía de aplicación: TRIGGER_APPLICATION_GUIDE.md');
  console.log('   - Listo para aplicar en Supabase Dashboard');

  console.log('\n🎯 Siguientes pasos:');
  console.log('1. Abre Supabase Dashboard');
  console.log('2. Ve a SQL Editor');
  console.log('3. Ejecuta el SQL del archivo generado');
  console.log('4. Verifica que el trigger esté activo');
  console.log('5. Prueba con nueva empresa');

  return {
    sqlFile: sqlFileName,
    guideFile: guideFileName,
    sql: completeSQL
  };
}

// Ejecutar generación
const result = generateTriggerSQL();
console.log('\n🎉 Generación completada exitosamente');