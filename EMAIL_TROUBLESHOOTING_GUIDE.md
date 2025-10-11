# 🔧 Guía de Solución de Problemas - Emails de Invitación

## ❌ Problema: "No llega el mail"

### 📋 Diagnóstico Rápido

El test ha detectado un **Error 500 (Internal Server Error)** en la función de Supabase. Esto significa que:

✅ **La función está desplegada** (no es 404)  
❌ **Hay un problema de configuración** (error interno)

### 🎯 Causa Principal: SendGrid No Configurado

El error 500 indica que la función `send-email` está intentando usar SendGrid pero no tiene las credenciales necesarias.

---

## 🛠️ Solución Paso a Paso

### Paso 1: Verificar Estado Actual

```bash
# Ejecuta el test para confirmar el error
node test_email_sending.js
```

Deberías ver: `❌ Error al enviar email: Edge Function returned a non-2xx status code`

### Paso 2: Configurar SendGrid en Supabase

**❌ NO uses el SQL Editor** - Las variables de entorno no se configuran con SQL

**✅ Forma correcta:**

1. **Ve al Dashboard de Supabase**:
   ```
   https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/functions
   ```

2. **Selecciona la función `send-email`**

3. **Configura las variables de entorno**:
   - Ve a **Settings** > **Secrets** (NO al SQL Editor)
   - Agrega las siguientes variables:

   ```
   SENDGRID_API_KEY=SG.YOUR_API_KEY_HERE
   SENDGRID_FROM_EMAIL=hola@aintelligence.cl
   SENDGRID_FROM_NAME=AIntelligence
   ```

4. **Importante**: La API key de SendGrid debe empezar con `SG.`

**🚨 ERROR COMÚN**: No intentes configurar variables de entorno en el SQL Editor. Eso es para consultas SQL, no para configuración de funciones.

### Paso 3: Obtener API Key de SendGrid

Si no tienes una API key de SendGrid:

1. **Ve a SendGrid**: https://app.sendgrid.com/
2. **Inicia sesión** o crea una cuenta
3. **Ve a Settings** > **API Keys**
4. **Create API Key** > **Restricted Access**
5. **Selecciona permisos**: Mail Send > Full Access
6. **Copia la API key** (empieza con `SG.`)

### Paso 4: Verificar Email Remitente

Asegúrate de que el email remitente esté verificado en SendGrid:

1. **Ve a Settings** > **Sender Authentication**
2. **Verifica el dominio** o **email individual**
3. **Usa**: `hola@aintelligence.cl` o tu email verificado

### Paso 5: Redesplegar la Función

Después de configurar las variables:

1. **Ve a Functions** > **send-email**
2. **Haz clic en "Redeploy"**
3. **Espera unos minutos** a que se complete

### Paso 6: Probar Nuevamente

```bash
node test_email_sending.js
```

Deberías ver: `✅ Email enviado exitosamente!`

---

## 🔄 Alternativa: Sistema sin Email

Mientras configuras SendGrid, el sistema funciona con emails informativos básicos:

### ✅ Lo que SÍ funciona:
- Creación de usuarios en el panel de admin
- Usuarios pueden iniciar sesión directamente
- Sistema genera contraseñas temporales
- Página de completar registro funciona

### ❌ Lo que NO funciona:
- Emails de invitación automáticos
- Enlaces de recuperación de contraseña
- Notificaciones por email

---

## 🧪 Testing Manual

### Para probar sin esperar emails:

1. **Crea un usuario** desde `/admin/usuarios`
2. **Anota el email** que usaste
3. **Intenta iniciar sesión** con ese email
4. **Usa la contraseña temporal** generada por el sistema

### Para probar la página de registro:

Visita directamente: `http://localhost:3002/complete-registration?token=test-token`

---

## 📞 Soporte

Si después de seguir estos pasos sigues teniendo problemas:

1. **Verifica los logs de la función** en Supabase Dashboard
2. **Confirma que la API key de SendGrid sea válida**
3. **Verifica que el email remitente esté autenticado**

---

## ✅ Checklist Final

- [ ] API key de SendGrid configurada en Supabase Functions
- [ ] Email remitente verificado en SendGrid
- [ ] Función `send-email` redesplegada
- [ ] Test de email funciona (`node test_email_sending.js`)
- [ ] Usuarios pueden recibir emails de invitación

---

## 🎯 Resumen

**Problema**: Error 500 en función de email  
**Causa**: SendGrid no configurado  
**Solución**: Configurar variables de entorno en Supabase Functions  
**Tiempo estimado**: 10-15 minutos

El sistema está **100% funcional** para crear usuarios y gestionarlos. Solo falta configurar SendGrid para el envío automático de emails.