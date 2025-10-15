# Guía Actualizada: Configurar CORS en Supabase (2024)

## ⚠️ IMPORTANTE: La ubicación de CORS ha cambiado

En versiones recientes de Supabase, la configuración CORS ha sido movida. Aquí están todas las posibles ubicaciones:

## 📍 Ubicación Principal (2024)

### Método 1: Authentication Settings

```
Supabase Dashboard
├── ⚙️ Settings
├── 🔐 Authentication
└── 🌐 URL Configuration (o Site URL)
```

**Pasos:**
1. **Ve a**: https://app.supabase.com
2. **Selecciona tu proyecto**: `wvluqdldygmgncqqjkow`
3. **Ve a Settings** (⚙️) > **Authentication** (🔐)
4. **Busca "Site URL"** o "Additional URLs"
5. **Agrega tu dominio Netlify**

### Método 2: Project Settings > General

```
Supabase Dashboard
├── ⚙️ Settings
├── 🏢 General
└── 🌐 Site URL / Redirect URLs
```

**Pasos:**
1. **Ve a Settings** > **General**
2. **Busca la sección "Configuration"**
3. **Encuentra "Site URL"** o "Redirect URLs"**
4. **Agrega tu dominio Netlify**

## 🔍 Si no encuentras CORS, busca estos términos:

### En la página de API Settings:
- **Additional URLs**
- **Redirect URLs** 
- **Allowed Origins**
- **Site URL**
- **Callback URLs**

### En Authentication Settings:
- **Site URL**
- **Redirect URLs**
- **Authorized URLs**

## 🚀 Método Rápido (Buscador Interno)

1. **En tu proyecto Supabase**
2. **Usa Ctrl+F o Cmd+F** para buscar
3. **Busca estos términos**:
   ```
   URL
   redirect
   origin
   cors
   additional
   ```

## 📸 Guía Visual Actualizada

### Paso 1: Entra a tu proyecto
https://app.supabase.com → Selecciona `wvluqdldygmgncqqjkow`

### Paso 2: Ve a Settings
Haz clic en **Settings** (engranaje ⚙️) en la barra lateral

### Paso 3: Busca en estas secciones:

#### Opción A: Authentication
```
Settings
├── Authentication
│   ├── Site URL: [tu-dominio-aquí]
│   └── Redirect URLs: [agregar-dominios]
```

#### Opción B: API
```
Settings
├── API
│   ├── Project URL
│   └── Additional URLs: [buscar aquí]
```

#### Opción C: General
```
Settings
├── General
│   └── Configuration
│       ├── Site URL
│       └── Redirect URLs
```

## 🔧 Configuración Exacta

### Lo que debes agregar:

**Para producción:**
```
https://tu-dominio-netlify.app
```

**Para desarrollo (opcional):**
```
http://localhost:3002
http://localhost:3000
```

### Formatos correctos:
```
✅ https://nexupay.netlify.app
✅ https://plataforma-incentivos.netlify.app
❌ nexupay.netlify.app (falta https://)
❌ https://www.nexupay.netlify.app (evitar www)
```

## 🆘 Si aún no lo encuentras

### Opción 1: URL Directa
Intenta acceder directamente:
```
https://app.supabase.com/project/wvluqdldygmgncqqjkow/settings/auth
```

### Opción 2: Configuración por código
Si no encuentras la opción visual, puedes configurarlo por SQL:

```sql
-- Ejecutar en SQL Editor de Supabase
ALTER TABLE auth.users 
SET ROW LEVEL SECURITY;

-- O insertar en configuración
INSERT INTO auth.config (key, value) 
VALUES ('additional_redirect_urls', '["https://tu-dominio.netlify.app"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Opción 3: Soporte de Supabase
Si nada funciona:
1. **Ve a Help** (ícono de ?) en Supabase
2. **Busca "CORS configuration"**
3. **O contacta a soporte de Supabase**

## 📋 Checklist Final

- [ ] Encontré la sección de URLs/Redirect en Supabase
- [ ] Agregué mi dominio Netlify con https://
- [ ] Guardé los cambios
- [ ] Hice deploy nuevo en Netlify
- [ ] Probé la aplicación sin errores CORS

## 🎯 Resumen Ejecutivo

**Ubicación más probable (2024):**
`Settings > Authentication > Site URL / Redirect URLs`

**Si no está ahí:**
Busca en `Settings > API` o usa el buscador interno con "URL"

**Formato del dominio:**
`https://tu-dominio-exacto.netlify.app`

---

## 📞 Referencias Rápidas

**Tu proyecto:** `wvluqdldygmgncqqjkow`
**Dashboard:** https://app.supabase.com
**Settings direct:** https://app.supabase.com/project/wvluqdldygmgncqqjkow/settings

Si después de esta guía aún no lo encuentras, es posible que Supabase haya movido nuevamente la configuración. En ese caso, recomiendo usar el buscador interno de Supabase con los términos proporcionados.