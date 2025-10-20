# Configuración de Emails SMTP

## 📧 Sistema de Envío de Emails

La plataforma NexuPay utiliza un sistema SMTP personalizado para el envío de emails transaccionales, incluyendo confirmaciones de registro y recuperación de contraseña.

## 🏗️ Arquitectura

### Componentes del Sistema

1. **Función Edge de Supabase** (`supabase/functions/send-email/`)
   - Maneja el envío real de emails usando SMTP
   - Utiliza credenciales SMTP seguras
   - Procesa templates HTML modernos

2. **Servicio de Email Frontend** (`src/services/emailService.js`)
   - Interfaz para el envío de emails desde el frontend
   - Genera templates HTML responsivos
   - Maneja diferentes tipos de emails

3. **Integración con Auth** (`src/services/authService.js`)
   - Envío automático de emails de confirmación al registrar usuarios
   - Envío de emails de recuperación de contraseña

## ⚙️ Configuración SMTP

### Credenciales SMTP (ya configuradas)

```javascript
SMTP Server: mail.nexupay.cl
Port: 587 (TLS)
Username: info@nexupay.cl
Password: Aintelligence2025$
```

### Función Edge de Supabase

La función edge está ubicada en `supabase/functions/send-email/index.ts` y contiene:

- Configuración SMTP segura
- Manejo de CORS
- Validación de parámetros
- Envío usando Nodemailer

## 📧 Templates de Email

### Tipos de Emails Soportados

#### 1. Confirmación de Registro - Deudor
- **Asunto:** "Confirma tu cuenta en NexuPay"
- **Contenido:** Bienvenida personalizada para deudores
- **Template:** Moderno con gradientes azules

#### 2. Confirmación de Registro - Empresa
- **Asunto:** "Confirma tu cuenta en NexuPay"
- **Contenido:** Bienvenida para empresas de cobranza
- **Template:** Diseño profesional corporativo

#### 3. Confirmación de Registro - Administrador
- **Asunto:** "Confirma tu cuenta en NexuPay"
- **Contenido:** Configuración de cuenta GOD MODE
- **Template:** Diseño administrativo

#### 4. Recuperación de Contraseña
- **Asunto:** "Recupera tu contraseña - NexuPay"
- **Contenido:** Instrucciones para reset de contraseña
- **Template:** Diseño de seguridad con colores naranjas

### Características de los Templates

- ✅ **Responsive:** Se adapta a móviles y desktop
- ✅ **Moderno:** Gradientes, sombras y animaciones sutiles
- ✅ **Accesible:** Contraste adecuado y fuentes legibles
- ✅ **Multilingüe:** Soporte para español
- ✅ **Branding:** Logo e identidad visual de NexuPay

## 🚀 Despliegue

### 1. Desplegar Función Edge

```bash
# Desde el directorio raíz del proyecto
supabase functions deploy send-email
```

### 2. Verificar Configuración

```bash
# Ver estado de las funciones
supabase functions list

# Ver logs de la función
supabase functions logs send-email
```

## 🧪 Testing

### Script de Prueba

Ejecuta el script de prueba para verificar el funcionamiento:

```bash
node test-email.js
```

Este script probará:
- Envío de email de confirmación para deudor
- Envío de email de confirmación para empresa
- Envío de email de confirmación para administrador
- Envío de email de recuperación de contraseña

### Testing Manual

1. **Registro de Usuario:**
   - Regístrate como deudor en `/registro/persona`
   - Verifica que llegue el email de confirmación

2. **Registro de Empresa:**
   - Regístrate como empresa en `/registro/empresa`
   - Verifica que llegue el email de confirmación

3. **Recuperación de Contraseña:**
   - Solicita reset de contraseña en login
   - Verifica que llegue el email de recuperación

## 🔧 Configuración de Variables de Entorno

Aunque las credenciales SMTP están hardcodeadas en la función edge por seguridad, en producción se recomienda usar variables de entorno:

```bash
# En Supabase Dashboard > Edge Functions > Environment Variables
SMTP_HOST=mail.nexupay.cl
SMTP_PORT=587
SMTP_USER=info@nexupay.cl
SMTP_PASS=Aintelligence2025$
```

## 📊 Monitoreo

### Logs de Supabase

```bash
# Ver logs en tiempo real
supabase functions logs send-email --follow

# Ver logs de errores específicos
supabase functions logs send-email --filter error
```

### Métricas de Envío

- **Tasa de Entrega:** Monitorear bounces y quejas
- **Tasa de Apertura:** Medir engagement
- **Tasa de Rebote:** Identificar problemas de deliverability

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Emails no llegan
- Verificar configuración SMTP
- Revisar logs de la función edge
- Verificar que el dominio esté autorizado

#### 2. Error de autenticación SMTP
- Verificar credenciales
- Confirmar que el puerto 587 esté abierto
- Revisar configuración de TLS

#### 3. Emails van a spam
- Configurar SPF, DKIM y DMARC
- Usar dominio consistente
- Evitar palabras trigger en el contenido

### Comandos Útiles

```bash
# Verificar conectividad SMTP
telnet mail.nexupay.cl 587

# Probar envío manual
swaks --to test@example.com --server mail.nexupay.cl:587 --auth-user info@nexupay.cl --auth-password Aintelligence2025$ --tls
```

## 📝 Notas de Seguridad

- ✅ **Credenciales encriptadas** en función edge
- ✅ **TLS obligatorio** para conexiones SMTP
- ✅ **Rate limiting** implementado en frontend
- ✅ **Validación de emails** antes del envío
- ✅ **Logs seguros** sin exponer información sensible

## 🎯 Próximos Pasos

1. **Configurar SPF/DKIM** para mejor deliverability
2. **Implementar tracking** de aperturas y clicks
3. **Agregar templates** para notificaciones adicionales
4. **Sistema de colas** para envíos masivos
5. **Dashboard de analytics** de emails

---

**Desarrollado por AIntelligence** - Sistema de emails transaccionales para NexuPay