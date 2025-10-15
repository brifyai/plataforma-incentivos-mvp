# 🔑 Obtener SERVICE_ROLE_KEY de Supabase

## 🚨 Problema Actual
Error: `signature verification failed`
Causa: La SERVICE_ROLE_KEY en el archivo .env no es válida

## ✅ Solución: Obtener la SERVICE_ROLE_KEY Real

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a: https://wvluqdldygmgncqqjkow.supabase.co
2. Inicia sesión con tu cuenta de administrador
3. Selecciona tu proyecto

### Paso 2: Obtener la SERVICE_ROLE_KEY
1. En el menú izquierdo, haz clic en **⚙️ Settings**
2. Haz clic en **API**
3. Busca la sección **"Project API keys"**
4. Copia la **"service_role"** key (la que dice "secret")

### Paso 3: Actualizar el Archivo .env
Reemplaza la línea en tu archivo `.env`:

```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=PEGAR_AQUI_LA_SERVICE_ROLE_KEY_REAL
```

### Paso 4: Reiniciar el Servidor
```bash
npm run dev -- --port 3002 --host
```

## 📍 ¿Dónde está exactamente?

### En el Dashboard de Supabase:
1. **Settings** (ícono de engranaje en menú izquierdo)
2. **API** (pestaña en la parte superior)
3. **Project API keys** (sección)
4. **service_role** (la clave que dice "secret")

## 🔍 ¿Cómo identificar la clave correcta?

La SERVICE_ROLE_KEY real:
- ✅ Empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- ✅ Es más larga que la ANON_KEY
- ✅ Dice "service_role" al lado
- ✅ Tiene un botón de "Show" para verla completa

## ⚠️ Importante

- **NUNCA** compartas la SERVICE_ROLE_KEY públicamente
- **NUNCA** la subas a repositorios públicos
- **SOLO** úsala en entorno de desarrollo
- Es como la contraseña de administrador de tu base de datos

## 🚀 Una vez actualizada

1. Guarda el archivo `.env`
2. Reinicia el servidor de desarrollo
3. Intenta subir un documento nuevamente
4. Debería funcionar sin el error "signature verification failed"

## 📋 Checklist

- [ ] Entrar a https://wvluqdldygmgncqqjkow.supabase.co
- [ ] Settings → API
- [ ] Copiar service_role key
- [ ] Pegar en .env
- [ ] Reiniciar servidor
- [ ] Probar subida de documento