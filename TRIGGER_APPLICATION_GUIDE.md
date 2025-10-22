# Guía de Aplicación del Trigger Automático

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
1. Copia todo el contenido del archivo `trigger-corporate-client-complete.sql`
2. Pégalo en el editor SQL
3. Haz clic en "Run" o presiona Ctrl+Enter
4. Espera a que se ejecute completamente

### 4. Verificar Resultados
Deberías ver una tabla con los siguientes datos si el trigger se creó correctamente:
- trigger_name: `on_company_create_corporate_client`
- table_name: `companies`
- function_name: `create_corporate_client_for_new_company`
- is_enabled: `t` (true)

### 5. Probar el Trigger (Opcional)
Descomenta las líneas de prueba al final del SQL y ejecuta:
1. Inserta una empresa de prueba
2. Verifica que se cree automáticamente el cliente corporativo
3. Limpia los datos de prueba

## 🔍 Verificación Post-Aplicación

Para verificar que todo funciona correctamente:

### Verificar trigger activo:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_company_create_corporate_client';
```

### Verificar función:
```sql
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_corporate_client_for_new_company';
```

### Probar con nueva empresa:
```sql
-- Insertar empresa de prueba
INSERT INTO companies (user_id, company_name, contact_email, contact_phone, rut, validation_status)
VALUES ('test-user-id', 'Empresa Test Final', 'test@final.com', '+56 9 9999 9999', '88.888.888-8', 'pending');

-- Verificar cliente corporativo creado
SELECT * FROM corporate_clients WHERE company_id = (
  SELECT id FROM companies WHERE company_name = 'Empresa Test Final'
);
```

## 🚨 Notas Importantes

1. **Permisos**: Asegúrate de tener permisos de administrador en Supabase
2. **Backup**: Considera hacer un backup antes de aplicar cambios
3. **Testing**: Prueba siempre en un entorno de desarrollo primero
4. **Rollback**: Si algo sale mal, puedes eliminar el trigger con:
   ```sql
   DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;
   DROP FUNCTION IF EXISTS create_corporate_client_for_new_company();
   ```

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
