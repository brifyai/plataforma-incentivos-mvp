# Guía Completa de Configuración de Netlify - NexuPay

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Variables de Entorno](#variables-de-entorno)
4. [Configuración de Build](#configuración-de-build)
5. [Dominios y SSL](#dominios-y-ssl)
6. [Funciones Serverless](#funciones-serverless)
7. [Redirecciones y Headers](#redirecciones-y-headers)
8. [Formularios y Webhooks](#formularios-y-webhooks)
9. [Analytics y Monitoreo](#analytics-y-monitoreo)
10. [Troubleshooting](#troubleshooting)

## 🚀 Requisitos Previos

### Cuentas Necesarias
- [x] Cuenta de Netlify
- [x] Cuenta de GitHub/GitLab/Bitbucket
- [x] Cuenta de Supabase
- [x] Cuenta de MercadoPago (opcional)
- [x] Cuenta de EmailJS (opcional)

### Repositorio
- [x] Repositorio de NexuPay conectado a Git
- [x] Archivos de configuración listos
- [x] `package.json` con scripts de build

## ⚙️ Configuración Inicial

### 1. Conectar Repositorio a Netlify

1. **Iniciar sesión en Netlify**
   ```
   https://app.netlify.com
   ```

2. **Nuevo sitio desde Git**
   - Click en "Add new site" → "Import an existing project"
   - Seleccionar proveedor de Git (GitHub)
   - Autorizar Netlify
   - Seleccionar repositorio `NexuPay`

3. **Configuración básica**
   ```bash
   Build command: npm run build
   Publish directory: dist
   Functions directory: netlify/functions
   ```

4. **Desplegar sitio**
   - Click en "Deploy site"
   - Esperar finalización del build

### 2. Configurar Dominio Personalizado

1. **Ir a Site settings → Domain management**
2. **Agregar dominio personalizado**
   ```
   www.nexupay.cl
   nexupay.cl
   ```
3. **Configurar DNS**
   ```
   Tipo A: 75.2.60.5
   Tipo CNAME: www.nexupay.cl → nexupay.netlify.app
   ```
4. **Verificar SSL**
   - Netlify instalará certificado SSL automáticamente
   - Esperar propagación DNS (24-48 horas)

## 🔐 Variables de Entorno

### 1. Variables Obligatorias

Ir a **Site settings → Environment variables** y agregar:

```bash
# Supabase (CRÍTICO)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs de la Aplicación
VITE_APP_URL=https://nexupay.cl
VITE_API_URL=https://nexupay.cl/api
VITE_NETLIFY_FUNCTIONS_URL=https://nexupay.cl/.netlify/functions

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key
WEBHOOK_SECRET=your-webhook-secret-key
```

### 2. Variables de Integraciones

```bash
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef-1234567890
MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-abcdef-1234567890

# EmailJS
EMAILJS_SERVICE_ID=service_123456
EMAILJS_PUBLIC_KEY=abcdefghijklmnopqrstuvwx
EMAILJS_TEMPLATE_ID=template_123456
EMAILJS_PRIVATE_KEY=abcdefghijklmnopqrstuvwxyz123456

# AI Services
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef
ANTHROPIC_API_KEY=sk-ant-1234567890abcdef1234567890abcdef1234567890abcdef

# CRM Integrations
HUBSPOT_API_KEY=12345678-90ab-cdef-1234-567890abcdef
SALESFORCE_API_KEY=your-salesforce-api-key
PIPEDRIVE_API_KEY=your-pipedrive-api-key
ZOHO_API_KEY=your-zoho-api-key
UPNIFY_API_KEY=your-upnify-api-key
```

### 3. Variables de Analytics

```bash
# Google Analytics
GA_TRACKING_ID=G-XXXXXXXXXX

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn-here

# Netlify Analytics (integrado)
NETLIFY_SITE_ID=your-netlify-site-id
```

### 4. Variables de Storage

```bash
# AWS S3 (para archivos)
AWS_S3_BUCKET=nexupay-files
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

## 🏗️ Configuración de Build

### 1. Build Settings

En **Site settings → Build & deploy → Build settings**:

```bash
# Basic settings
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions

# Environment
Node version: 18
Environment: Production

# Advanced settings
Build status: Active
Deploy context: Production
```

### 2. Optimización de Build

```bash
# Cache settings
Build cache: Enabled
Dependency cache: Enabled

# Timeout
Build timeout: 15 minutes

# Retry
Failed builds: Auto-retry (3 times)
```

## 🌐 Dominios y SSL

### 1. Configuración de Dominios

1. **Dominio principal**
   ```
   nexupay.cl
   ```

2. **Subdominios**
   ```
   app.nexupay.cl (aplicación principal)
   api.nexupay.cl (API endpoints)
   admin.nexupay.cl (panel de administración)
   ```

3. **Configuración DNS**
   ```
   # Dominio principal
   A: 75.2.60.5
   AAAA: 2600:1f14:1fba:5902::1

   # Subdominios
   CNAME: *.nexupay.cl → nexupay.netlify.app
   ```

### 2. Configuración SSL

1. **Certificado SSL**
   - Automático por Netlify
   - Renovación automática
   - Force HTTPS: Activado

2. **Headers de seguridad**
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "geolocation=(), microphone=(), camera=()"
   ```

## ⚡ Funciones Serverless

### 1. Configuración de Functions

En `netlify.toml`:
```toml
[build]
  functions = "netlify/functions"

[functions]
  directory = "netlify/functions"
  node_version = "18"
```

### 2. Funciones Disponibles

```bash
# Webhooks
/.netlify/functions/mercadopago-webhook
/.netlify/functions/send-email
/.netlify/functions/process-payouts

# Utilidades
/.netlify/functions/health
/.netlify/functions/verify-auth
/.netlify/functions/generate-report
```

### 3. Variables de Functions

```bash
# Supabase (para functions)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MercadoPago (webhooks)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef-1234567890

# Email
EMAILJS_SERVICE_ID=service_123456
EMAILJS_PRIVATE_KEY=abcdefghijklmnopqrstuvwxyz123456
EMAILJS_TEMPLATE_ID=template_123456
```

## 🔄 Redirecciones y Headers

### 1. Redirecciones (netlify.toml)

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/admin/*"
  to = "/admin/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Headers de Seguridad

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

## 📝 Formularios y Webhooks

### 1. Configuración de Formularios

```bash
# Contact form
Form name: contact
Form fields: name, email, message
Notifications: admin@nexupay.cl

# Registration form
Form name: registration
Form fields: company_name, email, phone, plan
Notifications: sales@nexupay.cl
```

### 2. Webhooks Configurados

```bash
# MercadoPago
URL: https://nexupay.cl/.netlify/functions/mercadopago-webhook
Events: payment_created, payment_updated, payment_approved

# Supabase Auth
URL: https://nexupay.cl/.netlify/functions/auth-webhook
Events: user.signup, user.login, user.logout

# Custom events
URL: https://nexupay.cl/.netlify/functions/custom-webhook
Events: campaign_created, proposal_sent, payment_processed
```

## 📊 Analytics y Monitoreo

### 1. Netlify Analytics

1. **Activar Analytics**
   - Site settings → Analytics → Netlify Analytics
   - Enable analytics
   - Configurar goals y eventos

2. **Eventos personalizados**
   ```javascript
   // Track page views
   netlifyAnalytics.track('page_view', {
     page: window.location.pathname,
     user_type: 'company'
   });

   // Track conversions
   netlifyAnalytics.track('conversion', {
     event: 'signup_completed',
     value: 99.99
   });
   ```

### 2. Google Analytics

```bash
# Variable de entorno
GA_TRACKING_ID=G-XXXXXXXXXX

# Configuración en index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Error Tracking (Sentry)

```bash
# Variable de entorno
SENTRY_DSN=https://your-sentry-dsn-here

# Configuración
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## 🔧 Troubleshooting

### 1. Problemas Comunes

#### Build Fallido
```bash
# Verificar logs
netlify logs --site=your-site-id

# Debug local
npm run build
npm run preview
```

#### Variables de Entorno
```bash
# Verificar configuración
netlify env:list

# Test local
npm run verify-config
```

#### Problemas de CORS
```bash
# Verificar headers
curl -I https://nexupay.cl/api/health

# Configurar CORS en netlify.toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

### 2. Herramientas de Debug

```bash
# Netlify CLI
npm install -g netlify-cli
netlify login
netlify link
netlify dev

# Verificar configuración
npm run verify-config
npm run test:netlify

# Logs en tiempo real
netlify logs --follow
```

### 3. Checklist de Verificación

#### Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Build funciona localmente
- [ ] Tests pasan
- [ ] Assets optimizados
- [ ] Security headers configurados

#### Post-Deploy
- [ ] Site responde correctamente
- [ ] Forms funcionan
- [ ] API endpoints responden
- [ ] Webhooks reciben eventos
- [ ] Analytics tracking activo
- [ ] SSL certificate válido

## 📞 Soporte y Contacto

### Recursos
- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Netlify Status](https://www.netlifystatus.com/)

### Contacto del Equipo
- **Technical Lead**: [Nombre] - [email]
- **DevOps**: [Nombre] - [email]
- **Support**: [Nombre] - [email]

### Emergency Contacts
- **24/7 Hotline**: [+56 9 XXXX XXXX]
- **Email**: emergency@nexupay.cl
- **Slack**: #emergency-nexupay

---

## 🎉 ¡Listo para Producción!

Una vez completada esta configuración:

1. **Verificar todo el checklist**
2. **Hacer deploy de producción**
3. **Monitorear primeros 24 horas**
4. **Configurar alertas**
5. **Documentar acceso y procesos**

¡Felicidades! NexuPay ahora está completamente configurado en Netlify para producción. 🚀