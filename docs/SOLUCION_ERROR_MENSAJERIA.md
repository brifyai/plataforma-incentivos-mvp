# 🚨 Solución Error: Column "debtor_id" does not exist

## Problema Detectado

El error `column "debtor_id" does not exist` indica que las tablas de mensajería ya existen en la base de datos pero con una estructura diferente a la esperada por el código.

## 📋 Diagnóstico

- **Error**: `42703: column "debtor_id" does not exist`
- **Causa**: Las tablas `conversations` y `messages` existen pero no tienen las columnas necesarias
- **Impacto**: El sistema de mensajería no puede funcionar correctamente

## 🔧 Solución

### Opción 1: Aplicar Migración Simplificada (Recomendado)

1. **Ir al panel de Supabase**
   - Accede a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Ve a la sección "SQL Editor"

2. **Ejecutar la migración simplificada**
   ```sql
   -- Copiar y pegar el contenido del archivo:
   -- supabase-migrations/019_fix_messaging_tables_simple.sql
   ```

3. **Verificar resultado**
   - La migración agregará las columnas faltantes sin perder datos existentes
   - Creará las tablas si no existen
   - Mantendrá la compatibilidad con datos actuales
   - Sin errores de sintaxis SQL

### Opción 2: Migración Compleja (Si la simplificada falla)

1. **Ejecutar migración completa**
   ```sql
   -- Copiar y pegar el contenido del archivo:
   -- supabase-migrations/018_adapt_messaging_tables.sql
   ```

### Opción 3: Recrear Tablas (Si no hay datos importantes)

1. **Eliminar tablas existentes**
   ```sql
   DROP TABLE IF EXISTS message_attachments CASCADE;
   DROP TABLE IF EXISTS messages CASCADE;
   DROP TABLE IF EXISTS conversations CASCADE;
   ```

2. **Crear tablas con estructura correcta**
   ```sql
   -- Ejecutar el archivo:
   -- supabase-migrations/017_create_messaging_tables.sql
   ```

## 📁 Archivos Relevantes

- `supabase-migrations/019_fix_messaging_tables_simple.sql` - Migración simplificada (Recomendado)
- `supabase-migrations/018_adapt_messaging_tables.sql` - Migración adaptativa
- `supabase-migrations/017_create_messaging_tables.sql` - Creación desde cero
- `src/services/messageService.js` - Servicio de mensajería
- `src/hooks/useCompanyMessages.js` - Hook para empresas

## 🎯 Estructura Esperada

### Tabla: conversations
```sql
- id (UUID, Primary Key)
- debtor_id (UUID, References users)
- debtor_name (TEXT)
- debtor_rut (TEXT)
- company_id (UUID, References companies)
- company_name (TEXT)
- subject (TEXT)
- status (TEXT)
- last_message_at (TIMESTAMP)
- last_message_content (TEXT)
- unread_count (INTEGER)
- unread_count_company (INTEGER)
- priority (TEXT)
- debt_id (UUID, References debts)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla: messages
```sql
- id (UUID, Primary Key)
- conversation_id (UUID, References conversations)
- sender_id (UUID, References users)
- sender_type (TEXT: 'debtor', 'company', 'ai')
- content (TEXT)
- content_type (TEXT: 'text', 'image', 'file', 'proposal')
- metadata (JSONB)
- ai_generated (BOOLEAN)
- ai_confidence (DECIMAL)
- escalation_triggered (BOOLEAN)
- escalation_reason (TEXT)
- read_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## ⚠️ Precauciones

1. **Backup**: Antes de cualquier cambio, haz un backup de los datos existentes
2. **Testing**: Prueba el sistema en un entorno de desarrollo primero
3. **Datos**: Si hay datos importantes en las tablas actuales, usa la Opción 1

## 🔄 Verificación

Después de aplicar la solución:

1. **Verificar tablas creadas/adaptadas**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('conversations', 'messages', 'message_attachments') 
   AND table_schema = 'public';
   ```

2. **Verificar columnas**
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'conversations' AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

3. **Probar la aplicación**
   - Recarga la página de mensajería
   - Verifica que no aparezcan errores
   - Prueba enviar un mensaje de prueba

## 🆘 Soporte

Si el problema persiste después de aplicar la solución:

1. **Verificar logs** en la consola del navegador
2. **Revisar políticas RLS** en Supabase
3. **Comprobar permisos** del usuario autenticado
4. **Contactar al administrador** de la base de datos

## 📊 Estado Actual

- ✅ Sistema de mensajería implementado
- ✅ Código corregido y sincronizado
- ⚠️ Esperando aplicación de migración en base de datos
- 🔄 Listo para testing post-migración

## 🚨 Nuevo Error Detectado

### **Error: Permission denied for table users**

```
Error: No se pudo guardar la configuración: permission denied for table users
```

#### **Causa**
- Las políticas RLS (Row Level Security) no permiten que los usuarios actualicen su propia información en la tabla `users`

#### **Solución**
1. **Ir al panel de Supabase**
   - Accede a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Ve a "SQL Editor"

2. **Ejecutar la migración de permisos**
   ```sql
   -- Copiar y pegar el contenido del archivo:
   -- supabase-migrations/020_fix_users_permissions.sql
   ```

3. **Verificar resultado**
   - Debe mostrar las políticas RLS creadas
   - Los usuarios podrán guardar su configuración

#### **Políticas Creadas**
- `Users can view own profile` - Los usuarios ven su propio perfil
- `Users can update own profile` - Los usuarios actualizan su propio perfil
- `Users can insert own profile` - Los usuarios insertan su propio perfil
- `Companies can view related users` - Las empresas ven usuarios relacionados

---

**Última actualización**: 2025-10-15
**Versión**: 1.1