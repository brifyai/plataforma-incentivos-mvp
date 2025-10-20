# 🚨 Diagnóstico Rápido: Error "supabaseKey is required"

## ✅ Verificación Inmediata

### Paso 1: Verificar Variables en Netlify AHORA

1. **Ve a**: https://app.netlify.com
2. **Selecciona tu sitio de NexuPay**
3. **Ve a**: Site settings > Build & deploy > Environment
4. **BUSCA ESTAS VARIABLES EXACTAS**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Paso 2: Si NO existen, agrégalas así:

**VITE_SUPABASE_URL:**
```
https://wvluqdldygmgncqqjkow.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
```

### Paso 3: VERIFICACIÓN CRÍTICA

**COPIA Y PEGA EXACTAMENTE** - Sin espacios, sin cambios:

```
VITE_SUPABASE_URL=https://wvluqdldygmgncqqjkow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
```

## 🔍 Diagnóstico en el Navegador

### Para verificar si las variables están cargadas:

1. **Abre tu sitio de Netlify**
2. **Abre DevTools** (F12)
3. **Ve a Console**
4. **Escribe**: `console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)`

**Si muestra `undefined`**: Las variables NO están configuradas en Netlify

## ⚡ Solución Inmediata

### Opción A: Variables de Entorno (Recomendado)

1. **Netlify Dashboard** > **Tu sitio** > **Site settings**
2. **Build & deploy** > **Environment variables**
3. **Add new variable**:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: `https://wvluqdldygmgncqqjkow.supabase.co`
4. **Add new variable**:
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Opción B: Netlify TOML (Alternativa)

Crea/edita el archivo `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_SUPABASE_URL = "https://wvluqdldygmgncqqjkow.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4"
  NODE_OPTIONS = "--no-warnings"
  CI = "false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔄 Después de Configurar

1. **TRIGGER NUEVO DEPLOY** en Netlify
2. **ESPERA a que termine** el deploy
3. **LIMPIA CACHE del navegador** (Ctrl+Shift+R)
4. **VERIFICA el error desapareció**

## 🚨 Si aún no funciona

### Verificar Build Logs:

1. **Netlify** > **Deploys** > **Tu último deploy**
2. **Revisa si hay errores** en el log
3. **Busca "VITE_SUPABASE"** en los logs

### Verificar Variables en el Build:

1. **Netlify** > **Site settings** > **Build & deploy**
2. **Environment** > **Edit variables**
3. **Verifica que sean visibles** y estén correctas

## 📞 Checklist Final

- [ ] Variables configuradas en Netlify Dashboard
- [ ] Nombres EXACTOS: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] Valores copiados SIN modificar
- [ ] Nuevo deploy triggered
- [ ] Cache del navegador limpio
- [ ] Verificado en consola: `import.meta.env.VITE_SUPABASE_ANON_KEY`

## 🔧 Si nada funciona

**Contacta a soporte de Netlify** o verifica:
- Permisos del sitio en Netlify
- Límite de variables de entorno
- Plan de Netlify (algunos planes limitan variables)

---

## ⚡ ACCIÓN INMEDIATA

**VE A NETLIFY AHORA Y CONFIGURA LAS VARIABLES**:
1. Site settings > Build & deploy > Environment
2. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Trigger deploy
4. El error desaparecerá

**Este error SOLO se resuelve configurando las variables en Netlify.**