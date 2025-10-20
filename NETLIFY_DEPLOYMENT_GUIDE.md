# Guía de Despliegue en Netlify - NexuPay

## Configuración de Variables de Entorno

El archivo `netlify.toml` ya está configurado con la estructura básica, pero necesitas actualizar los valores reales de Supabase.

### 1. Obtener Credenciales de Supabase

Ve a tu dashboard de Supabase y obtén:

1. **Project URL**: `https://your-project-id.supabase.co`
2. **Anon Key**: La clave pública de tu proyecto

### 2. Actualizar netlify.toml

Reemplaza los siguientes valores en el archivo `netlify.toml`:

```toml
# Línea 8 - Reemplazar con tu URL real
VITE_SUPABASE_URL = "https://TU-PROJECT-ID.supabase.co"

# Línea 9 - Reemplazar con tu clave anónima real
VITE_SUPABASE_ANON_KEY = "TU-ANON-KEY-REAL"
```

### 3. Configuración en Dashboard de Netlify (Opcional)

Si prefieres configurar las variables en el dashboard de Netlify:

1. Ve a **Site settings > Build & deploy > Environment variables**
2. Agrega las siguientes variables:

**Para producción:**
- `VITE_SUPABASE_URL`: `https://TU-PROJECT-ID.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `TU-ANON-KEY-REAL`

**Para desarrollo (si usas base de datos separada):**
- `VITE_SUPABASE_URL`: `https://TU-DEV-PROJECT-ID.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `TU-DEV-ANON-KEY`

### 4. Verificar Configuración

Después de configurar las variables:

1. **Sincroniza los cambios:**
   ```bash
   git add netlify.toml
   git commit -m "Configure Netlify environment variables"
   git push origin main
   ```

2. **Verifica el despliegue:**
   - Netlify automáticamente detectará los cambios en `netlify.toml`
   - El sitio se reconstruirá con las nuevas variables de entorno

3. **Prueba la aplicación:**
   - Visita https://nexupay.netlify.app/
   - Verifica que no aparezcan errores de Supabase

## Características Configuradas

### ✅ Seguridad
- Headers de seguridad configurados
- Políticas de permisos restrictivas
- Cache optimizado para assets estáticos

### ✅ Rendimiento
- Compresión gzip habilitada
- Cache inmutable para archivos estáticos
- Bundle analyzer para optimización

### ✅ Funcionalidad
- Redirects para SPA
- Soporte para funciones serverless
- Sitemap automático para SEO

### ✅ Entornos
- Producción: Configuración optimizada
- Preview: Variables de desarrollo
- Desarrollo: Debug habilitado

## Solución de Problemas

### Error: "Supabase no configurado"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que los valores no contengan espacios extra
- Confirma que las claves son válidas en Supabase

### Error: "Build failed"
- Verifica la sintaxis de `netlify.toml`
- Asegúrate de que Node.js 18 esté disponible
- Revisa los logs de build en Netlify

### Variables no funcionan
- Las variables deben comenzar con `VITE_` para ser accesibles en el frontend
- Reinicia el deploy después de cambiar variables
- Verifica que no haya caracteres especiales en los valores

## Comandos Útiles

```bash
# Verificar configuración local
npm run build

# Probar producción localmente
npm run preview

# Ver variables de entorno
npm run build -- --mode production
```

## Contacto

Si tienes problemas con el despliegue:
1. Revisa los logs de build en Netlify
2. Verifica la configuración de Supabase
3. Confirma que las variables de entorno sean correctas