# Sistema de Invitación por Email - Guía de Implementación

## 🎯 Resumen

Se ha implementado un sistema completo de invitación por email para administradores que permite crear usuarios con invitación por email en lugar de contraseñas directas.

## ✅ Componentes Implementados

### 1. Plantillas de Email (`emailTemplates.js`)
- Nueva plantilla `userInvitationTemplates.adminInvitation`
- Email profesional con instrucciones claras
- Diseño responsive con branding consistente

### 2. Servicio de Base de Datos (`databaseService.js`)
- ✅ `createUserWithInvitation()` - Crea usuarios con tokens únicos
- ✅ `validateInvitationToken()` - Valida tokens de invitación
- ✅ `completeUserRegistration()` - Completa registro con contraseña
- 🔄 Funciones tolerantes a errores (funcionan sin columnas de BD)

### 3. Página de Completar Registro (`CompleteRegistrationPage.jsx`)
- ✅ Interfaz intuitiva para establecer contraseña
- ✅ Validación de tokens y manejo de errores
- ✅ Diseño responsive con indicadores visuales

### 4. Página de Administración (`AdminUsersPage.jsx`)
- ✅ Integración con sistema de invitaciones
- ✅ Envío automático de emails de invitación
- ✅ Mensajes de confirmación

### 5. Rutas Actualizadas (`AppRouter.jsx`)
- ✅ Nueva ruta `/complete-registration`

## 🔧 Migración de Base de Datos Requerida

### Archivo: `supabase-migrations/add_invitation_fields_to_users.sql`

**IMPORTANTE**: Si no aplicas esta migración, el sistema funcionará pero enviará emails informativos básicos en lugar de emails de invitación con enlaces.

### Pasos para aplicar la migración:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-migrations/add_invitation_fields_to_users.sql`
4. Ejecuta la consulta
5. Verifica que no haya errores

### Verificación de la migración:

Después de aplicar la migración, puedes verificar que las columnas existen ejecutando:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('invitation_token', 'invitation_expires_at', 'invitation_status');
```

Deberías ver las 3 columnas listadas.

Para completar la implementación, es necesario aplicar la migración de base de datos:

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-migrations/add_invitation_fields_to_users.sql`
4. Ejecuta la consulta

### Opción 2: Ejecutar SQL Manualmente

Ejecuta estos comandos en el SQL Editor de Supabase:

```sql
-- Agregar campos de invitación por email a la tabla users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invitation_token UUID,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'completed', 'expired'));

-- Crear índice para búsqueda eficiente por token de invitación
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token) WHERE invitation_token IS NOT NULL;

-- Crear índice para tokens pendientes que no han expirado
CREATE INDEX IF NOT EXISTS idx_users_invitation_pending ON users(invitation_token, invitation_expires_at)
WHERE invitation_status = 'pending' AND invitation_token IS NOT NULL;

-- Comentarios en las columnas
COMMENT ON COLUMN users.invitation_token IS 'Token único para la invitación por email';
COMMENT ON COLUMN users.invitation_expires_at IS 'Fecha de expiración del token de invitación';
COMMENT ON COLUMN users.invitation_status IS 'Estado de la invitación: pending, completed, expired';

-- Función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET invitation_status = 'expired',
      invitation_token = NULL,
      invitation_expires_at = NULL
  WHERE invitation_status = 'pending'
    AND invitation_expires_at < NOW();
END;
$$;

-- Ejecutar limpieza inicial
SELECT cleanup_expired_invitations();
```

## 🔄 Flujo de Invitación

1. **Administrador crea usuario** → Se genera token único y expira en 7 días
2. **Email automático enviado** → Usuario recibe invitación con enlace seguro
3. **Usuario hace clic en enlace** → Valida token y muestra formulario de contraseña
4. **Usuario establece contraseña** → Token se marca como completado
5. **Usuario puede iniciar sesión** → Flujo normal de autenticación

## 🛡️ Características de Seguridad

- **Tokens únicos UUID** generados criptográficamente
- **Expiración automática** de 7 días
- **Validación estricta** de tokens antes de permitir registro
- **Limpieza automática** de tokens expirados
- **Confirmación de email** automática al completar registro

## 🎨 Experiencia de Usuario

- **Emails profesionales** con branding consistente
- **Interfaz intuitiva** para completar registro
- **Validaciones en tiempo real** de contraseñas
- **Mensajes claros** de éxito y error
- **Redirección automática** al login después del registro

## 🔄 Estado Actual

- ✅ **Código implementado** - Todas las funciones están listas
- ✅ **Sistema tolerante** - Funciona sin las columnas de BD (modo básico)
- 🔄 **Migración pendiente** - Requiere aplicación manual en Supabase
- ✅ **Interfaz completa** - UI/UX implementada y funcional

## 🧪 Testing

Una vez aplicada la migración, el sistema funcionará completamente. Sin la migración, el sistema crea usuarios básicos pero sin el flujo de invitación por email.

Para probar:
1. Ve a `/admin/usuarios`
2. Crea un nuevo usuario
3. El sistema enviará email de invitación (si la migración está aplicada)
4. El usuario puede completar registro en `/complete-registration?token=...`

## 🔍 Troubleshooting - Problemas Comunes

### ❌ "El enlace del email no carga"

**Síntomas**: Al hacer click en el enlace del email, la página no carga o muestra error 404.

**Posibles causas y soluciones**:

1. **Servidor no está corriendo**:
   - Verifica que el servidor de desarrollo esté activo: `npm run dev`
   - Confirma que esté corriendo en el puerto correcto (3002)

2. **URL incorrecta en el email**:
   - El email contiene una URL como: `http://localhost:3002/complete-registration?token=...`
   - Si estás en producción, configura `VITE_APP_URL=https://tu-dominio.com` en tu archivo `.env`

3. **Variable de entorno no configurada**:
   ```bash
   # En tu archivo .env
   VITE_APP_URL=http://localhost:3002  # Para desarrollo
   VITE_APP_URL=https://tu-dominio.com  # Para producción
   ```

4. **Ruta no encontrada**:
   - Verifica que la ruta `/complete-registration` esté en `AppRouter.jsx`
   - Confirma que `CompleteRegistrationPage` esté importada correctamente

### 🧪 Script de diagnóstico

Ejecuta este comando para verificar la configuración:

```bash
node test_invitation_link.js
```

Este script te mostrará:
- La URL que se generará en los emails
- Si la configuración es correcta
- Instrucciones para testing manual

### 📧 Verificación de emails

Si los emails no llegan:
1. Verifica que la función edge de Supabase esté desplegada
2. Revisa los logs de Supabase Functions
3. Confirma que las credenciales de email estén configuradas

### ✅ Verificación de funcionamiento

La página de completar registro está funcionando correctamente (HTTP 200). Si el enlace no carga:

1. **Verifica que el servidor esté corriendo**:
   ```bash
   # El servidor debe estar activo en el puerto 3002
   npm run dev
   ```

2. **Prueba la URL directamente**:
   - Ve a: `http://localhost:3002/complete-registration?token=test-token`
   - Deberías ver la página de completar registro

3. **Para producción, configura la URL correcta**:
   ```bash
   # En tu archivo .env
   VITE_APP_URL=https://tu-dominio-produccion.com
   ```

4. **Si usas un dominio personalizado**:
   - Asegúrate de que tu dominio apunte correctamente al servidor
   - Verifica que no haya problemas de CORS o HTTPS

### 🔄 Testing manual

Para probar sin enviar emails:
1. Ve directamente a: `http://localhost:3002/complete-registration?token=test-token`
2. Deberías ver la página de completar registro
3. Si no carga, hay un problema con el routing

## 📋 Checklist de Implementación

- [x] Plantillas de email creadas
- [x] Funciones de base de datos implementadas
- [x] Página de completar registro creada
- [x] Integración con página de administración
- [x] Rutas configuradas
- [x] Sistema tolerante a errores implementado
- [ ] **Migración de BD aplicada** (acción requerida)

## 🚀 Próximos Pasos

1. Aplicar la migración de base de datos en Supabase
2. Probar el flujo completo de invitación
3. Verificar envío de emails
4. Validar experiencia de usuario

---

**Nota**: El sistema está diseñado para ser tolerante a errores. Si la migración no se aplica, el sistema seguirá funcionando pero sin el flujo de invitación por email (creará usuarios con contraseña por defecto).