# Configuración de Google OAuth para Autenticación con Gmail

Esta guía te ayudará a configurar la autenticación con Google (Gmail) para que los usuarios puedan registrarse e iniciar sesión usando sus cuentas de Google.

## 📋 Requisitos Previos

- Una cuenta de Google
- Un proyecto de Supabase configurado
- La aplicación corriendo localmente o en producción

## 🔧 Paso 1: Configurar Google Cloud Console

### 1.1 Crear o seleccionar un proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Asegúrate de tener habilitada la facturación (gratuita para OAuth básico)

### 1.2 Habilitar la Google+ API
1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google+ API" y habilítala
3. También habilita "Google People API" si no está habilitada

### 1.3 Crear credenciales OAuth
1. Ve a "APIs y servicios" > "Credenciales"
2. Haz click en "Crear credenciales" > "ID de cliente OAuth"
3. Selecciona "Aplicación web" como tipo de aplicación
4. Configura la pantalla de consentimiento OAuth:
   - **Tipo de usuario:** Externo
   - **Nombre de la app:** NexuPay o tu nombre de aplicación
   - **Email de soporte:** Tu email
   - **Dominios autorizados:** Agrega tu dominio (localhost para desarrollo)
   - **Enlaces de política de privacidad y términos:** Opcional por ahora

### 1.4 Configurar orígenes y redirecciones autorizados
En la configuración del cliente OAuth, agrega:

**Orígenes autorizados de JavaScript:**
- `http://localhost:3007` (desarrollo - ajusta el puerto si es diferente)
- `https://tu-dominio.com` (producción)

**URI de redireccionamiento autorizados:**
- `http://localhost:3007/auth/callback` (desarrollo)
- `https://tu-dominio.com/auth/callback` (producción)

### 1.5 Obtener las credenciales
Después de crear el cliente OAuth, copia:
- **Client ID**
- **Client Secret**

## 🔧 Paso 2: Configurar Supabase

### 2.1 Habilitar Google OAuth en Supabase
1. Ve a tu proyecto de Supabase: [supabase.com](https://supabase.com)
2. Ve a "Authentication" > "Providers"
3. Encuentra "Google" y haz click en "Enable"
4. Pega tu **Client ID** y **Client Secret** de Google
5. Haz click en "Save"

### 2.2 Configurar URL de redireccionamiento en Supabase
En la configuración de Google en Supabase, asegúrate de que el "Redirect URL" sea:
- Desarrollo: `http://localhost:3007/auth/callback`
- Producción: `https://tu-dominio.com/auth/callback`

## 🔧 Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env
Crea un archivo `.env` en la raíz de tu proyecto (copia de `.env.example`):

```bash
cp .env.example .env
```

### 3.2 Configurar variables de Google
Agrega estas variables a tu archivo `.env`:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=tu-google-client-id-aqui
VITE_GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui
```

> **Nota:** Estas variables no son estrictamente necesarias para el funcionamiento básico ya que Supabase maneja la autenticación OAuth internamente. Pero es buena práctica documentarlas.

## 🚀 Paso 4: Probar la Configuración

### 4.1 Reiniciar la aplicación
```bash
npm run dev
```

### 4.2 Probar el login con Google
1. Ve a `http://localhost:3007/login`
2. Haz click en "Continuar con Google"
3. Deberías ser redirigido a Google para autenticación
4. Después de autenticarte, serás redirigido de vuelta a la aplicación
5. Si es tu primera vez, se creará automáticamente una cuenta de usuario

### 4.3 Probar el registro con Google
1. Ve a `http://localhost:3007/register`
2. Haz click en "Continuar con Google"
3. El proceso es el mismo que para login

## 🔍 Solución de Problemas

### Error: "Invalid OAuth access token"
- Verifica que las credenciales de Google estén correctas en Supabase
- Asegúrate de que la Google+ API esté habilitada

### Error: "Redirect URI mismatch"
- Verifica que los URI de redireccionamiento en Google Cloud Console coincidan exactamente
- Incluye el puerto correcto (ej: `:3007`)

### Error: "OAuth callback failed"
- Verifica que la ruta `/auth/callback` esté configurada correctamente en el router
- Asegúrate de que el AuthCallbackPage esté importado y configurado

### Usuario no se crea automáticamente
- Verifica que la tabla `users` exista en Supabase
- Revisa los logs de la consola del navegador para errores
- Asegúrate de que el usuario tenga permisos para insertar en la tabla users

## 📝 Notas Importantes

### Seguridad
- **Nunca** compartas tus Client ID y Client Secret
- Mantén el archivo `.env` fuera del control de versiones
- Usa HTTPS en producción

### Flujo de OAuth
1. Usuario hace click en "Continuar con Google"
2. Se redirige a Google para autenticación
3. Google redirige de vuelta con un código de autorización
4. Supabase intercambia el código por tokens de acceso
5. La aplicación procesa la información del usuario
6. Se crea o actualiza el registro en la tabla `users`
7. Usuario es redirigido al dashboard correspondiente

### Datos del usuario
Cuando un usuario se autentica con Google, obtenemos:
- Email (verificado por Google)
- Nombre completo
- Avatar (opcional)

El sistema crea automáticamente una cuenta con rol "debtor" por defecto.

## 🎯 Próximos Pasos

Una vez configurado Google OAuth, puedes:

1. **Personalizar el flujo**: Modificar qué información se solicita de Google
2. **Agregar más proveedores**: Facebook, GitHub, etc.
3. **Mejorar UX**: Mostrar avatar del usuario, nombre personalizado
4. **Configurar roles**: Permitir que los usuarios elijan su rol durante el registro con Google

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs de la consola del navegador
2. Verifica la configuración en Google Cloud Console
3. Confirma la configuración en Supabase
4. Revisa que todas las variables de entorno estén correctas

¡La autenticación con Google está lista para usar! 🎉