# Configurar URL de Callback de OAuth para Desarrollo

## Problema Actual

Cuando intentas iniciar sesión con Google OAuth, aparece el error:
```
{"code":400,"error":"Invalid redirect_uri","msg":"https://nexupay.netlify.app/ is not a valid redirect uri"}
```

Esto ocurre porque la configuración de OAuth en Supabase está apuntando a la URL de producción (`https://nexupay.netlify.app/`) en lugar de la URL de desarrollo local.

## Solución: Configurar URL de Callback en Supabase Dashboard

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto

### Paso 2: Configurar Autenticación

1. En el menú lateral izquierdo, haz clic en **Authentication**
2. Ve a la sección **Providers**
3. Busca y haz clic en **Google**

### Paso 3: Configurar URLs de Redirección

En la configuración de Google OAuth, verás un campo llamado **Site URL** y **Redirect URLs**. Debes configurar ambas para desarrollo:

#### Para Desarrollo Local:
```
Site URL: http://localhost:3002
Redirect URLs: 
- http://localhost:3002/auth/callback
- http://127.0.0.1:3002/auth/callback
```

#### Para Producción (cuando necesites desplegar):
```
Site URL: https://nexupay.netlify.app
Redirect URLs: 
- https://nexupay.netlify.app/auth/callback
```

### Paso 4: Configurar múltiples URLs (Recomendado)

Puedes configurar múltiples URLs de redirección para soportar ambos entornos:

```
Site URL: http://localhost:3002
Redirect URLs: 
- http://localhost:3002/auth/callback
- http://127.0.0.1:3002/auth/callback
- https://nexupay.netlify.app/auth/callback
```

### Paso 5: Guardar Configuración

1. Haz clic en **Save** para guardar los cambios
2. Espera unos minutos para que la configuración se propague

## Verificación

Después de configurar las URLs, verifica que todo funcione:

1. Inicia tu aplicación local: `npm run dev -- --port 3002 --host`
2. Ve a la página de login
3. Haz clic en "Iniciar con Google"
4. Debería redirigirte correctamente a Google y luego volver a `http://localhost:3002/auth/callback`

## Configuración Adicional en la Aplicación

La aplicación ya está configurada correctamente para manejar diferentes entornos. En [`src/services/authService.js`](src/services/authService.js:1048-1057), la función `signInWithGoogle()` determina automáticamente la URL correcta:

```javascript
const getRedirectUrl = () => {
  // Si estamos en desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const port = window.location.port || '3002';
    return `http://${window.location.hostname}:${port}/auth/callback`;
  }
  
  // Si estamos en producción o staging
  return `${window.location.origin}/auth/callback`;
};
```

## Problemas Comunes y Soluciones

### Error: "Invalid redirect_uri"

**Causa:** La URL de redirección no está configurada en Supabase.
**Solución:** Agrega la URL exacta que aparece en el error a las Redirect URLs en la configuración de OAuth.

### Error: "Auth session missing!"

**Causa:** La URL de callback no coincide exactamente con la configurada.
**Solución:** Verifica que la URL en tu navegador coincida exactamente con la configurada en Supabase (incluyendo http/https y el puerto).

### Error: "Network request failed"

**Causa:** Problemas de conexión o CORS.
**Solución:** Asegúrate de que tu aplicación esté corriendo en el puerto correcto (3002) y que la URL esté configurada correctamente.

## Configuración de Google Cloud Console (Opcional)

Si tienes acceso al Google Cloud Console del proyecto, también puedes verificar:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Busca tu OAuth 2.0 Client ID
5. En **Authorized redirect URIs**, asegúrate de que estén incluidas:
   - `http://localhost:3002/auth/callback`
   - `http://127.0.0.1:3002/auth/callback`

## Notas Importantes

1. **Tiempo de propagación:** Los cambios en la configuración de OAuth pueden tardar hasta 5 minutos en propagarse.
2. **HTTPS vs HTTP:** Para desarrollo local, usa `http://`. Para producción, siempre usa `https://`.
3. **Puertos:** Asegúrate de incluir el puerto (`:3002`) en las URLs de desarrollo.
4. **Trailing slash:** No agregues `/` al final de las URLs (usa `/auth/callback`, no `/auth/callback/`).

## Flujo Completo de Prueba

1. Configura las URLs en Supabase Dashboard
2. Inicia tu aplicación local
3. Abre `http://localhost:3002/login`
4. Haz clic en "Iniciar con Google"
5. Autoriza en Google
6. Deberías volver a `http://localhost:3002/auth/callback`
7. La aplicación procesará el callback y te redirigirá al dashboard correspondiente

## Configuración para Equipo de Desarrollo

Si trabajas en equipo, cada desarrollador debe:

1. Usar el mismo puerto (3002) o configurar su puerto específico
2. Agregar su URL local a las Redirect URLs en Supabase
3. Ejemplo para puerto diferente: `http://localhost:3001/auth/callback`

## Script de Verificación Automática

Puedes agregar este script a tu proyecto para verificar la configuración:

```javascript
// scripts/check-oauth-config.js
const checkOAuthConfig = () => {
  const currentUrl = window.location.origin;
  const callbackUrl = `${currentUrl}/auth/callback`;
  
  console.log('🔍 Verificando configuración OAuth:');
  console.log('URL actual:', currentUrl);
  console.log('URL de callback:', callbackUrl);
  
  if (window.location.hostname === 'localhost') {
    console.log('✅ Entorno de desarrollo detectado');
    console.log('📋 Asegúrate de que estas URLs estén configuradas en Supabase:');
    console.log(`   - ${callbackUrl}`);
    console.log(`   - http://127.0.0.1:3002/auth/callback`);
  }
};

// Ejecutar en la consola del navegador
checkOAuthConfig();
```

## Resumen Rápido

1. **Dashboard Supabase** → **Authentication** → **Providers** → **Google**
2. **Site URL:** `http://localhost:3002`
3. **Redirect URLs:** `http://localhost:3002/auth/callback`
4. **Guardar** y esperar 5 minutos
5. **Probar** el flujo de OAuth

Una vez configurado correctamente, el flujo de OAuth debería funcionar sin problemas en tu entorno de desarrollo local.