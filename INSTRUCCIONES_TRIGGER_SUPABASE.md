# 🚀 Instrucciones para Activar el Trigger Automático

## Paso 1: Acceder al Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto NexuPay
4. En el menú lateral, haz clic en **SQL Editor**

## Paso 2: Ejecutar el SQL
1. Abre el archivo `SUPABASE_TRIGGER_SQL_ONLY.sql` creado en el proyecto
2. **Copia TODO el contenido del archivo**
3. **Pega el contenido en el SQL Editor** del Supabase Dashboard
4. Haz clic en **Run** (o presiona Ctrl+Enter)

## Paso 3: Verificar Resultados
El SQL mostrará:
- ✅ Confirmación de que el trigger fue creado
- 📊 Estadísticas actuales del sistema
- 🔍 Verificación de consistencia de datos

## Paso 4: Probar el Sistema (Opcional)
Si quieres probar el trigger:
1. En la aplicación, crea una nueva empresa
2. Verifica que se cree automáticamente un cliente corporativo
3. O ejecuta la sección de prueba del SQL (descomentando las líneas)

## 🔍 Qué hace el Trigger
```sql
-- Cuando se inserta una nueva empresa:
INSERT INTO companies (...);

-- El trigger automáticamente crea:
INSERT INTO corporate_clients (
  company_id,      -- ID de la nueva empresa
  contact_email,   -- Email de la empresa
  contact_phone,   -- Teléfono de la empresa
  rut,            -- RUT de la empresa
  industry,       -- 'Corporativo' por defecto
  created_at,
  updated_at
);
```

## ✅ Verificación de Funcionamiento
Después de ejecutar el SQL, deberías ver:

1. **Trigger Activo:**
   ```
   trigger_name                    | table_name | function_name                      | is_enabled
   on_company_create_corporate_client | companies  | create_corporate_client_for_new_company | true
   ```

2. **Estadísticas del Sistema:**
   ```
   tipo                | cantidad
   ---------------------+----------
   Empresas            | 2
   Clientes Corporativos| 2
   Clientes Regulares  | 2
   ```

3. **Consistencia de Datos:**
   ```
   company_name        | corporate_client_id | status
   --------------------+---------------------+--------
   TechCorp Solutions  | xxxxxxx-xxxx-...    | ✅ OK
   AIntelligence       | xxxxxxx-xxxx-...    | ✅ OK
   ```

## 🚨 Si hay Errores
**Error común:** `syntax error at or near "const"`
- **Solución:** Asegúrate de copiar SOLO el contenido SQL del archivo `SUPABASE_TRIGGER_SQL_ONLY.sql`
- **No copies** código JavaScript ni comentarios de bloque que empiecen con `/*`

**Error común:** `permission denied`
- **Solución:** Asegúrate de tener permisos de administrador en el proyecto Supabase

## 📞 Soporte
Si tienes problemas:
1. Verifica que el SQL se copió completamente
2. Revisa que no haya caracteres extraños
3. Confirma que tienes los permisos necesarios

---

## ✅ Checklist Final
- [ ] Accediste al Supabase Dashboard
- [ ] Abriste el SQL Editor
- [ ] Copiaste el contenido de `SUPABASE_TRIGGER_SQL_ONLY.sql`
- [ ] Ejecutaste el SQL sin errores
- [ ] Verificaste que el trigger esté activo
- [ ] Confirmaste las estadísticas del sistema
- [ ] El sistema está listo para producción

🎉 **¡Sistema automático de cliente corporativo activado!**