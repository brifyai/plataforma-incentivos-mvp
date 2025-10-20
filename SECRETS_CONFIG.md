# Configuración de Variables de Entorno y Secrets - NexuPay

## Archivos de Configuración Disponibles

### 1. `.env.production` (Para Producción)
```bash
# Configuración de Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Configuración de MercadoPago
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-mp-public-key-here

# Configuración de EmailJS
VITE_EMAILJS_SERVICE_ID=service_id_here
VITE_EMAILJS_PUBLIC_KEY=public_key_here
VITE_EMAILJS_TEMPLATE_ID=template_id_here

# URLs de la Aplicación
VITE_APP_URL=https://nexupay.netlify.app
VITE_API_URL=https://nexupay.netlify.app/api

# Configuración de Analytics
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Configuración de Funciones
VITE_NETLIFY_FUNCTIONS_URL=https://nexupay.netlify.app/.netlify/functions

# Configuración de AI
VITE_OPENAI_API_KEY=sk-your-openai-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Configuración de CRM
VITE_HUBSPOT_API_KEY=your-hubspot-key
VITE_SALESFORCE_API_KEY=your-salesforce-key
VITE_PIPEDRIVE_API_KEY=your-pipedrive-key
VITE_ZOHO_API_KEY=your-zoho-key
VITE_UPNIFY_API_KEY=your-upnify-key

# Configuración de Seguridad
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
VITE_JWT_SECRET=your-jwt-secret-here
VITE_WEBHOOK_SECRET=your-webhook-secret-here

# Configuración de Storage
VITE_AWS_S3_BUCKET=your-s3-bucket
VITE_AWS_ACCESS_KEY=your-aws-access-key
VITE_AWS_SECRET_KEY=your-aws-secret-key

# Configuración de Redis (si se usa)
VITE_REDIS_URL=redis://your-redis-url
VITE_REDIS_PASSWORD=your-redis-password
```

### 2. Variables para Netlify (Configurar en Dashboard)

#### Variables de Entorno Obligatorias:
```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-mp-access-token-here
MERCADOPAGO_PUBLIC_KEY=TEST-mp-public-key-here

# Email
EMAILJS_SERVICE_ID=service_id_here
EMAILJS_PUBLIC_KEY=public_key_here
EMAILJS_TEMPLATE_ID=template_id_here
EMAILJS_PRIVATE_KEY=private_key_here

# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# CRM Integrations
HUBSPOT_API_KEY=your-hubspot-key
SALESFORCE_API_KEY=your-salesforce-key
PIPEDRIVE_API_KEY=your-pipedrive-key
ZOHO_API_KEY=your-zoho-key
UPNIFY_API_KEY=your-upnify-key

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key
WEBHOOK_SECRET=your-webhook-secret-here

# Storage
AWS_S3_BUCKET=your-s3-bucket
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Analytics
GA_TRACKING_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn-here

# Redis (si se usa)
REDIS_URL=redis://your-redis-url
REDIS_PASSWORD=your-redis-password
```

## Pasos para Configurar en Netlify

### 1. Configurar Variables de Entorno

1. Ir a **Site settings > Environment variables**
2. Agregar todas las variables obligatorias listadas arriba
3. Marcar las variables sensibles como **Secret**
4. Hacer clic en **Save**

### 2. Configurar Build Settings

En **Site settings > Build & deploy > Build settings**:

```bash
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

### 3. Configurar Redirects

El archivo `netlify.toml` ya contiene las redirecciones necesarias.

### 4. Configurar Headers

El archivo `netlify.toml` ya contiene los headers de seguridad necesarios.

## Valores de Ejemplo (Para Desarrollo)

### Supabase
```bash
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### MercadoPago (Test)
```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef-1234567890
MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-abcdef-1234567890
```

### EmailJS
```bash
EMAILJS_SERVICE_ID=service_123456
EMAILJS_PUBLIC_KEY=abcdefghijklmnopqrstuvwx
EMAILJS_TEMPLATE_ID=template_123456
EMAILJS_PRIVATE_KEY=abcdefghijklmnopqrstuvwxyz123456
```

### OpenAI
```bash
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef
```

### HubSpot
```bash
HUBSPOT_API_KEY=12345678-90ab-cdef-1234-567890abcdef
```

## Seguridad de las Variables

### ✅ Buenas Prácticas
- Nunca commitear `.env` files con secrets reales
- Usar variables de entorno de Netlify para producción
- Rotar las claves regularmente
- Usar claves diferentes para desarrollo y producción
- Limitar permisos de las claves al mínimo necesario

### ❌ Malas Prácticas
- Hardcodear secrets en el código
- Commitear archivos `.env` con valores reales
- Usar las mismas claves en todos los ambientes
- Compartir secrets por canales inseguros
- No rotar las claves nunca

## Verificación de Configuración

### 1. Verificar Variables de Entorno
```bash
# En Netlify CLI
netlify env:list

# Verificar script
npm run verify-config
```

### 2. Verificar Conexiones
```bash
# Probar conexión a Supabase
curl -H "apikey: YOUR_ANON_KEY" "https://your-project.supabase.co/rest/v1/"

# Probar funciones de Netlify
curl "https://nexupay.netlify.app/.netlify/functions/health"
```

### 3. Verificar Build
```bash
# Build local con variables de producción
npm run build:prod

# Verificar que no haya errores de configuración
npm run verify-config
```

## Troubleshooting

### Error: "SUPABASE_URL is not defined"
- Verificar que la variable esté configurada en Netlify
- Reiniciar el deploy después de agregar variables

### Error: "Invalid API key"
- Verificar que la clave sea correcta para el ambiente
- Confirmar que la clave tenga los permisos necesarios

### Error: "CORS issues"
- Verificar la configuración de CORS en Supabase
- Confirmar que los redirects estén configurados correctamente

### Error: "Build failed"
- Verificar que todas las variables necesarias estén configuradas
- Revisar los logs de build en Netlify

## Contacto y Soporte

Si tienes problemas con la configuración:

1. Revisa este documento cuidadosamente
2. Ejecuta `npm run verify-config` para diagnóstico
3. Revisa los logs de deploy en Netlify
4. Contacta al equipo de desarrollo con los detalles del error

---

**IMPORTANTE:** Este archivo contiene información sensible. No compartirlo públicamente y asegúrate de que los valores reales estén configurados correctamente en Netlify.