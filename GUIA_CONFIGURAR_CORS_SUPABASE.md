# Guía Paso a Paso: Configurar CORS en Supabase

## 📍 Ubicación Exacta de la Configuración CORS

### Paso 1: Acceder a Supabase Dashboard

1. **Ve a**: https://app.supabase.com
2. **Inicia sesión** con tu cuenta
3. **Selecciona tu proyecto**: `wvluqdldygmgncqqjkow`

### Paso 2: Navegar a Configuración de API

**Opción A: Desde el Dashboard Principal**
```
Dashboard del Proyecto
├── ⚙️ Settings (ícono de engranaje en la barra lateral izquierda)
└── 📡 API (en el menú de Settings)
```

**Opción B: Ruta Directa**
1. Haz clic en **Settings** (engranaje ⚙️) en la barra lateral izquierda
2. En el menú que aparece, haz clic en **API**

### Paso 3: Encontrar la Sección CORS

Dentro de la página de **API**:

```
API Configuration
├── Project URL
├── API Keys
├── 🌐 CORS (esta es la sección que necesitas)
├── JWT Settings
└── PostgREST
```

### Paso 4: Configurar Additional URLs

En la sección **CORS** encontrarás:

```
🌐 CORS
├── Additional URLs
│   ├── [Input field para agregar URLs]
│   └── [Botón "Add" o "+" para agregar]
└── Current URLs (lista de URLs configuradas)
```

## 🔧 Configuración Exacta

### 1. Agregar tu dominio de Netlify

En el campo **Additional URLs**, agrega:

```
https://tu-app-netlify.app
```

**Reemplaza `tu-app-netlify.app` con tu dominio real de Netlify**

### 2. Ejemplos de dominios Netlify

```
✅ https://nexupay.netlify.app
✅ https://plataforma-incentivos.netlify.app
✅ https://mi-sitio-prod.netlify.app
✅ https://test-nexupay.netlify.app
```

### 3. Si no estás seguro de tu dominio:

1. **Ve a Netlify Dashboard**
2. **Selecciona tu sitio**
3. **El dominio aparece en la parte superior** de la página del sitio
4. **Copia el dominio completo** (incluyendo https://)

## 📸 Referencia Visual

### Ubicación en Supabase:

```
Supabase Dashboard
├── 🏠 Project Overview
├── 📊 Table Editor
├── ⚙️ Settings ← HAZ CLIC AQUÍ
│   ├── 🏢 General
│   ├── 📡 API ← LUEGO HAZ CLIC AQUÍ
│   │   ├── Project URL: https://...
│   │   ├── API Keys
│   │   ├── 🌐 CORS ← AQUÍ CONFIGURAS
│   │   │   ├── Additional URLs: [tu-dominio-netlify]
│   │   │   └── [Botón Add URL]
│   │   └── ...
│   └── ...
└── 🚀 Edge Functions
```

## ⚠️ Notas Importantes

### 1. Formato del Dominio
- ✅ **CORRECTO**: `https://nexupay.netlify.app`
- ❌ **INCORRECTO**: `nexupay.netlify.app` (falta https://)
- ❌ **INCORRECTO**: `www.nexupay.netlify.app` (no usar www)

### 2. Múltiples Dominios
Puedes agregar varios dominios si tienes:
- Sitio de producción
- Sitio de staging/pruebas
- Dominios personalizados

### 3. Tiempo de Propagación
- Los cambios CORS suelen ser **inmediatos**
- Si no funciona, espera **1-2 minutos** y prueba de nuevo

## 🔄 Verificación

### Para verificar que CORS está configurado correctamente:

1. **Abre tu sitio de Netlify**
2. **Abre DevTools** (F12)
3. **Ve a Network tab**
4. **Recarga la página**
5. **Busca solicitudes a Supabase** (deberían tener ✅ verde)

### Si aún hay errores CORS:
- Verifica que el dominio esté escrito exactamente igual
- Asegúrate de incluir `https://`
- Limpia la caché del navegador

## 🆘 Si no encuentras la sección CORS

### Ruta Alternativa:

1. **En el proyecto de Supabase**
2. **Haz clic en el nombre del proyecto** (arriba a la izquierda)
3. **Ve a Project Settings**
4. **Busca "CORS" en el buscador** de la página
5. **O usa el acceso directo**: `https://app.supabase.com/project/[tu-proyecto-id]/settings/api`

## 📞 Contacto si tienes problemas

Si no puedes encontrar la configuración CORS:

1. **Revisa que tengas permisos de administrador** en el proyecto Supabase
2. **Verifica que estés en el proyecto correcto** (`wvluqdldygmgncqqjkow`)
3. **Intenta recargar la página** de Supabase
4. **Usa el buscador** interno de Supabase con "CORS"

---

## 📋 Resumen Rápido

1. **Supabase Dashboard** → **Settings** → **API**
2. **Buscar sección "CORS"**
3. **Agregar dominio Netlify** en "Additional URLs"
4. **Guardar cambios**
5. **Hacer deploy nuevo** en Netlify

¡Listo! Con esto tu aplicación de Netlify podrá comunicarse correctamente con Supabase sin errores de CORS.