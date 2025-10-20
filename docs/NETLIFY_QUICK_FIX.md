# 🚀 Fix Rápido para NexuPay en Netlify

## Problema
La aplicación muestra pantalla en blanco en https://nexupay.netlify.app/

## Solución Inmediata (2 minutos)

### 1. Configurar Variables de Entorno en Netlify

1. Ir a [Netlify Dashboard](https://app.netlify.com/)
2. Seleccionar sitio: `nexupay.netlify.app`
3. Ir a **Site settings** → **Build & deploy** → **Environment variables**
4. Hacer clic en **Edit variables**
5. Agregar:

```
VITE_SUPABASE_URL=https://[TU-PROYECTO].supabase.co
VITE_SUPABASE_ANON_KEY=[TU-ANON-KEY]
```

### 2. Configurar Supabase para Producción (CRÍTICO)

1. Ir a [Supabase Dashboard](https://app.supabase.com/)
2. Seleccionar el proyecto
3. **Authentication** → **Settings**:
   - **Site URL**: Cambiar a `https://nexupay.netlify.app`
   - **Redirect URLs**: Agregar `https://nexupay.netlify.app` (ya tienes las otras)
4. **Settings** → **API**:
   - Copiar **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - Copiar **anon/public key** (empieza con `eyJ...`)

### 3. Configurar Variables de Entorno en Netlify

1. En Netlify: **Site settings** → **Build & deploy** → **Environment variables**
2. Agregar:
   ```
   VITE_SUPABASE_URL=https://[TU-PROYECTO].supabase.co
   VITE_SUPABASE_ANON_KEY=[TU-ANON-KEY]
   ```

### 4. Redesplegar

1. En Netlify, ir a **Deploys**
2. Hacer clic en **Trigger deploy** → **Deploy site**
3. Esperar 2-3 minutos

## Resultado Esperado

✅ **Antes**: Pantalla en blanco  
✅ **Después**: Aplicación funcional completa

## Verificación

- Abrir https://nexupay.netlify.app/
- Debería mostrar la landing page de NexuPay
- Los botones de "Iniciar sesión" y "Comenzar" deberían funcionar

## Si el problema persiste

1. **Verificar las variables**: Asegurarse que no hay espacios extras
2. **Limpiar caché**: Ctrl+F5 o Cmd+Shift+R
3. **Verificar logs**: En Netlify → Functions → _logs

## Soporte

- **Email**: soporte@nexupay.cl
- **Documentación**: Ver `docs/DIAGNOSTICO_PRODUCCION_NETLIFY.md`

---

**IMPORTANTE**: Este fix es urgente para restaurar la funcionalidad completa de la aplicación.