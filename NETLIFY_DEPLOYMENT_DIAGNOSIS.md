# Diagnóstico de Problemas de Despliegue en Netlify

## Problemas Identificados

### 1. ❌ Variables de Entorno Faltantes en Netlify

**Problema:** Las variables de entorno críticas no están configuradas en Netlify.

**Variables requeridas en Netlify:**
```
VITE_SUPABASE_URL=https://wvluqdldygmgncqqjkow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
VITE_APP_ENV=production
VITE_APP_URL=https://tu-dominio-netlify.com
```

**Solución:**
1. Ve a Netlify Dashboard > Site settings > Build & deploy > Environment
2. Agrega todas las variables de entorno necesarias
3. Las variables DEBEN empezar con `VITE_` para ser accesibles en Vite

### 2. ⚠️ Configuración de Supabase en Producción

**Problema:** El código de Supabase valida las variables de entorno y lanza un error si no están presentes.

**Archivo afectado:** `src/config/supabase.js` (líneas 15-20)

**Solución:** Asegurarse de que las variables de entorno estén configuradas en Netlify.

### 3. ✅ Configuración de Build Correcta

**Estado:** La configuración de Netlify es correcta.
- `netlify.toml` está bien configurado
- `_redirects` está presente y funcionando
- Comando de build: `npm run build`
- Directorio de publicación: `dist`

### 4. ⚠️ Posibles Problemas de CORS

**Problema:** Supabase podría bloquear solicitudes desde el dominio de Netlify.

**Solución:**
1. Ve a Supabase Dashboard > Settings > API
2. Agrega el dominio de Netlify a "Additional URLs"
3. Ejemplo: `https://tu-app.netlify.app`

### 5. ⚠️ Problemas de Rutas en Producción

**Problema:** React Router podría tener problemas con las rutas en producción.

**Solución:** El archivo `_redirects` ya está configurado correctamente.

## Pasos para Solucionar

### Paso 1: Configurar Variables de Entorno en Netlify

1. En Netlify Dashboard, selecciona tu sitio
2. Ve a "Site settings" > "Build & deploy" > "Environment"
3. Agrega estas variables:

```
VITE_SUPABASE_URL=https://wvluqdldygmgncqqjkow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
VITE_APP_ENV=production
VITE_APP_URL=https://tu-app-netlify.app
```

### Paso 2: Configurar CORS en Supabase

1. Ve a Supabase Dashboard
2. Settings > API > "Additional URLs"
3. Agrega: `https://tu-app-netlify.app`

### Paso 3: Redesplegar

1. En Netlify, trigger un nuevo deploy
2. O haz push a Git para trigger automáticamente

## Verificación

### Para verificar si el problema está solucionado:

1. **Abre la consola del navegador** en tu sitio de Netlify
2. **Busca errores de:**
   - `VITE_SUPABASE_URL` no definido
   - Errores de conexión a Supabase
   - Errores de CORS

3. **Verifica el Network tab:**
   - Las solicitudes a Supabase deberían funcionar
   - No debería haber errores 401/403

## Errores Comunes y Soluciones

### Error: "VITE_SUPABASE_URL is not defined"
**Causa:** Variables de entorno no configuradas en Netlify
**Solución:** Configurar variables en Netlify Dashboard

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Causa:** Supabase bloqueando el dominio de Netlify
**Solución:** Agregar dominio a Supabase CORS settings

### Error: "404 Not Found" en rutas
**Causa:** Problemas con SPA routing
**Solución:** `_redirects` ya está configurado correctamente

## Comandos Útiles

```bash
# Para probar localmente con variables de producción
npm run build
npm run preview

# Para verificar el build
ls -la dist/
```

## Contacto

Si después de seguir estos pasos el problema persiste:
1. Revisa los logs de deploy en Netlify
2. Abre la consola del navegador en el sitio desplegado
3. Verifica que todas las variables de entorno estén configuradas correctamente