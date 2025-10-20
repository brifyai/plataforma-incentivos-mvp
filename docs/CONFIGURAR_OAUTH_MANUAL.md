# Configuración Manual de OAuth en Supabase

## ⚠️ Importante
La configuración de OAuth en Supabase **NO se puede modificar con SQL**. Debe hacerse manualmente a través del dashboard.

## 🔧 Pasos para Configurar OAuth Correctamente

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `wvluqdldygmgncqqjkow`

### Paso 2: Configurar Autenticación
1. En el menú lateral izquierdo, haz clic en **Authentication**
2. Ve a la sección **Providers**
3. Busca y haz clic en **Google**

### Paso 3: Configurar URLs de Redirección
En la configuración de Google OAuth, configura los siguientes campos:

#### Site URL:
```
http://localhost:3002
```

#### Redirect URLs (agrega todas estas líneas):
```
http://localhost:3002/auth/callback
http://127.0.0.1:3002/auth/callback
https://nexupay.netlify.app/auth/callback
```

### Paso 4: Guardar Configuración
1. Haz clic en **Save** en la parte inferior
2. Espera 2-3 minutos para que la configuración se propague

## 🧪 Verificación

Después de configurar, verifica que todo funcione:

### 1. Probar ToggleSwitch (Ya funciona)
- Ve a: `http://localhost:3002/empresa/ia/proveedores`
- Haz click en los botones de activar/desactivar
- Deberían cambiar de estado inmediatamente

### 2. Probar OAuth
- Ve a: `http://localhost:3002/login`
- Haz clic en "Iniciar con Google"
- Debería redirigirte a Google y volver a: `http://localhost:3002/auth/callback`

## 🔍 Si tienes problemas

### Error: "Invalid redirect_uri"
**Causa:** Las URLs no están configuradas correctamente en Supabase.
**Solución:** Verifica que las URLs en el dashboard coincidan exactamente con las que estás usando.

### Error: "Auth session missing!"
**Causa:** La URL de callback no coincide exactamente.
**Solución:** Asegúrate de que la URL sea exactamente `http://localhost:3002/auth/callback`

### Error: "Network request failed"
**Causa:** Problemas de conexión o CORS.
**Solución:** Asegúrate de que tu aplicación esté corriendo en el puerto 3002.

## 📋 Resumen de Configuración

**Configuración requerida en Supabase Dashboard:**
- **Provider:** Google
- **Site URL:** `http://localhost:3002`
- **Redirect URLs:** 
  - `http://localhost:3002/auth/callback`
  - `http://127.0.0.1:3002/auth/callback`
  - `https://nexupay.netlify.app/auth/callback`

## ✅ Estado Actual

- **ToggleSwitch:** ✅ Funcionando correctamente
- **OAuth:** ⏳ Requiere configuración manual en dashboard

Una vez que configures OAuth manualmente como se indica arriba, todo debería funcionar perfectamente.