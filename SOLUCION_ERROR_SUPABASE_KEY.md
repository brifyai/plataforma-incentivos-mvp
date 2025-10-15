# Solución Error: "supabaseKey is required"

## Error Identificado

```
Uncaught Error: supabaseKey is required.
    at new N4 (index-BNQiT23f.js:80:32450)
    at cv (index-BNQiT23f.js:80:35630)
    at index-BNQiT23f.js:1659:31957
```

## Causa del Error

Este error ocurre cuando la variable de entorno `VITE_SUPABASE_ANON_KEY` no está disponible en el entorno de ejecución (Netlify).

## ✅ Solución Inmediata

### Paso 1: Verificar Variables en Netlify

1. **Ve a Netlify Dashboard**: https://app.netlify.com
2. **Selecciona tu sitio** de NexuPay
3. **Ve a Site settings** > **Build & deploy** > **Environment**
4. **Verifica que estas variables existan**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Paso 2: Agregar Variables Faltantes

Si las variables no existen, agrégalas exactamente así:

**VITE_SUPABASE_URL:**
```
https://wvluqdldygmgncqqjkow.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
```

### Paso 3: Trigger Nuevo Deploy

1. **Ve a Deploys** en Netlify
2. **Haz clic en "Trigger deploy"** > **Deploy site**
3. **Espera a que termine** el deploy

### Paso 4: Verificar URLs en Supabase (CORS/Redirect)

📍 **Guía actualizada 2024**: [`GUIA_CONFIGURAR_CORS_SUPABASE.md`](GUIA_CONFIGURAR_CORS_SUPABASE.md)

**⚠️ IMPORTANTE:** En Supabase 2024, la configuración ya no aparece como "CORS"

**Ubicaciones más probables:**
1. **Settings > Authentication** > Site URL / Redirect URLs
2. **Settings > General** > Configuration
3. **Settings > API** > Additional URLs

**Pasos rápidos:**
1. **Ve a Supabase Dashboard**: https://app.supabase.com
2. **Selecciona tu proyecto**: `wvluqdldygmgncqqjkow`
3. **Busca estos términos** con Ctrl+F: `URL`, `redirect`, `origin`
4. **Agrega tu dominio Netlify** donde encuentres "Additional URLs" o "Redirect URLs":
   ```
   https://tu-app-netlify.app
   ```

**Para encontrar tu dominio exacto de Netlify:**
- Ve a Netlify Dashboard > Tu sitio > El dominio aparece en la parte superior
- Copia el dominio completo (incluyendo https://)

## 🔍 Diagnóstico Adicional

### Para verificar si las variables están cargadas:

1. **Abre la consola del navegador** en tu sitio de Netlify
2. **Escribe**: `console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)`
3. **Si muestra `undefined`**, las variables no están configuradas correctamente

### Para verificar el error exacto:

1. **Abre Network tab** en DevTools
2. **Busca errores 401/403** hacia Supabase
3. **Verifica las URLs** que se están intentando acceder

## 🚨 Posibles Causas Adicionales

### 1. Variables con nombres incorrectos
- Asegúrate que empiecen con `VITE_`
- Sin espacios al principio o final
- Sin caracteres especiales

### 2. Build sin variables
- Las variables deben configurarse ANTES del deploy
- Si se agregaron después, hacer nuevo deploy

### 3. Problemas de caché
- Limpiar caché del navegador
- Usar modo incógnito para probar

## 📋 Checklist Completo

- [ ] Variables configuradas en Netlify Dashboard
- [ ] Nombres exactos: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] Sin espacios ni caracteres extra
- [ ] CORS configurado en Supabase
- [ ] Nuevo deploy triggered
- [ ] Caché del navegador limpio

## 🆘 Si el Problema Persiste

1. **Verifica el log de deploy** en Netlify
2. **Revisa la consola** del navegador para errores adicionales
3. **Confirma que la URL de Supabase sea correcta**
4. **Verifica que la API key no haya expirado**

## 📞 Referencia Rápida

**Variables requeridas:**
```
VITE_SUPABASE_URL=https://wvluqdldygmgncqqjkow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL de configuración Netlify:**
Site settings > Build & deploy > Environment

**URLs de configuración Supabase (2024):**
- Settings > Authentication > Site URL
- Settings > General > Redirect URLs
- Settings > API > Additional URLs

**Guía actualizada completa:**
[`GUIA_CONFIGURAR_CORS_SUPABASE.md`](GUIA_CONFIGURAR_CORS_SUPABASE.md)