# Configuración de WhatsApp Business API

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Crear Cuenta de Meta for Developers](#paso-1-crear-cuenta-de-meta-for-developers)
3. [Paso 2: Crear Aplicación de Business](#paso-2-crear-aplicación-de-business)
4. [Paso 3: Agregar Producto WhatsApp](#paso-3-agregar-producto-whatsapp)
5. [Paso 4: Configurar Número de Teléfono](#paso-4-configurar-número-de-teléfono)
6. [Paso 5: Obtener Credenciales](#paso-5-obtener-credenciales)
7. [Paso 6: Configurar en la Plataforma](#paso-6-configurar-en-la-plataforma)
8. [Paso 7: Probar Integración](#paso-7-probar-integración)
9. [Templates de Mensajes](#templates-de-mensajes)
10. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Una cuenta de Facebook Business
- ✅ Una cuenta de Meta for Developers
- ✅ Un número de teléfono que no esté registrado en WhatsApp personal
- ✅ Acceso a la plataforma de incentivos

---

## Paso 1: Crear Cuenta de Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en **"Get Started"** o **"Comenzar"**
3. Inicia sesión con tu cuenta de Facebook
4. Acepta los términos y condiciones
5. Verifica tu cuenta (puede requerir verificación por SMS)

---

## Paso 2: Crear Aplicación de Business

1. En el panel de Meta for Developers, haz clic en **"My Apps"** > **"Create App"**
2. Selecciona el tipo de aplicación: **"Business"**
3. Completa la información:
   - **App Name**: "Plataforma de Incentivos" (o el nombre que prefieras)
   - **App Contact Email**: Tu email de contacto
   - **Business Account**: Selecciona tu cuenta de negocio o crea una nueva
4. Haz clic en **"Create App"**

---

## Paso 3: Agregar Producto WhatsApp

1. En el dashboard de tu aplicación, busca **"WhatsApp"** en la lista de productos
2. Haz clic en **"Set up"** o **"Configurar"**
3. Selecciona **"WhatsApp Business API"** (no la versión cloud API si estás empezando)
4. Acepta los términos de servicio de WhatsApp

---

## Paso 4: Configurar Número de Teléfono

### Opción A: Usar Número de Prueba de Meta (Recomendado para Testing)

1. Meta proporciona un número de prueba automáticamente
2. Este número te permite enviar mensajes a hasta 5 números verificados
3. **Limitaciones**:
   - Solo para pruebas
   - Máximo 250 mensajes por día
   - Solo puedes enviar a números que hayas agregado manualmente

### Opción B: Agregar Tu Propio Número

1. En la sección **"Phone Numbers"**, haz clic en **"Add Phone Number"**
2. Ingresa tu número de teléfono (debe ser un número que NO esté en WhatsApp personal)
3. Verifica el número mediante:
   - **SMS**: Recibirás un código por mensaje de texto
   - **Llamada de voz**: Recibirás el código por teléfono
4. Ingresa el código de verificación
5. Completa el perfil de WhatsApp Business:
   - Nombre del negocio
   - Categoría
   - Descripción
   - Dirección (opcional)

---

## Paso 5: Obtener Credenciales

### Access Token

1. En el panel de WhatsApp, ve a **"Getting Started"** o **"Comenzar"**
2. Encontrarás un **"Temporary Access Token"** (válido por 24 horas)
3. Para obtener un token permanente:
   - Ve a **"System Users"** en Business Settings
   - Crea un nuevo System User
   - Asigna el rol de **"Admin"**
   - Genera un token y guárdalo de forma segura

### Phone Number ID

1. En la sección **"API Setup"** o **"Configuración de API"**
2. Verás tu **"Phone Number ID"** listado
3. Cópialo (es un número largo como `109876543210987`)

### Business Account ID

1. Ve a **"WhatsApp"** > **"Settings"** o **"Configuración"**
2. Encontrarás el **"WhatsApp Business Account ID"**
3. Cópialo (también es un número largo)

---

## Paso 6: Configurar en la Plataforma

### 1. Editar archivo `.env`

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
# WhatsApp Business API Configuration
VITE_WHATSAPP_ACCESS_TOKEN=tu-access-token-aqui
VITE_WHATSAPP_PHONE_NUMBER_ID=109876543210987
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

### 2. Verificar Configuración

Abre la consola del navegador y ejecuta:

```javascript
import whatsappService from './services/integrations/whatsapp.service';
console.log(whatsappService.isConfigured());
```

Deberías ver:
```
{ configured: true, message: "WhatsApp Business API configurado correctamente" }
```

---

## Paso 7: Probar Integración

### Prueba Básica desde el Código

```javascript
import { useWhatsApp } from './hooks/integrations';

function TestComponent() {
  const { sendMessage } = useWhatsApp();
  
  const handleTest = async () => {
    const result = await sendMessage(
      '56912345678', // Número de prueba (debe estar verificado)
      '¡Hola! Este es un mensaje de prueba.'
    );
    
    console.log('Resultado:', result);
  };
  
  return <button onClick={handleTest}>Enviar Prueba</button>;
}
```

### Prueba desde Componente UI

1. Ve al panel de configuración de notificaciones WhatsApp
2. Ingresa tu número de teléfono verificado
3. Haz clic en **"Probar"**
4. Revisa tu WhatsApp para confirmar la recepción del mensaje

---

## Templates de Mensajes

La plataforma incluye templates predefinidos para diferentes eventos:

### 1. Bienvenida
```javascript
const { sendWelcome } = useWhatsApp();
await sendWelcome('56912345678', 'Juan Pérez');
```

### 2. Recordatorio de Pago
```javascript
const { sendPaymentReminder } = useWhatsApp();
await sendPaymentReminder('56912345678', 'Juan', {
  amount: 50000,
  companyName: 'Banco Example'
}, 5); // 5 días hasta vencimiento
```

### 3. Confirmación de Acuerdo
```javascript
const { sendAgreementConfirmation } = useWhatsApp();
await sendAgreementConfirmation('56912345678', 'Juan', {
  totalAmount: 200000,
  installments: 4,
  incentive: 10000
});
```

### 4. Pago Confirmado
```javascript
const { sendPaymentConfirmation } = useWhatsApp();
await sendPaymentConfirmation('56912345678', 'Juan', {
  amount: 50000,
  debtName: 'Deuda Banco Example',
  incentiveEarned: 2500
});
```

### 5. Incentivo Disponible
```javascript
const { sendIncentiveAlert } = useWhatsApp();
await sendIncentiveAlert('56912345678', 'Juan', 15000);
```

### 6. Nueva Oferta
```javascript
const { sendNewOfferNotification } = useWhatsApp();
await sendNewOfferNotification('56912345678', 'Juan', {
  type: 'Descuento especial',
  discount: 20,
  incentive: 5000,
  expiryDate: '30/11/2025'
});
```

---

## Troubleshooting

### Error: "Invalid phone number"

**Problema**: El número no es válido o no está en formato correcto

**Solución**:
```javascript
// Formato correcto: código de país + número sin espacios ni guiones
// ✅ Correcto: 56912345678
// ❌ Incorrecto: +56 9 1234 5678, 912345678
```

### Error: "Access token expired"

**Problema**: El token temporal ha expirado (duran 24 horas)

**Solución**:
1. Genera un token permanente siguiendo el Paso 5
2. Actualiza la variable `VITE_WHATSAPP_ACCESS_TOKEN`
3. Reinicia el servidor de desarrollo

### Error: "Unable to send message to this recipient"

**Problema**: El número destinatario no está verificado

**Solución**:
- En modo de prueba, solo puedes enviar a números verificados
- Ve a WhatsApp Dashboard > Settings > Recipients
- Agrega el número del destinatario y veríficalo

### Error: "Rate limit exceeded"

**Problema**: Has excedido el límite de mensajes

**Solución**:
- Número de prueba: Máximo 250 mensajes/día
- Número de producción: Límite mayor (varía según tu cuenta)
- Espera o actualiza tu cuenta

### Los mensajes no llegan

**Checklist**:
1. ✅ Verifica que el Access Token sea válido
2. ✅ Confirma que el Phone Number ID sea correcto
3. ✅ El número destinatario está en formato correcto
4. ✅ El destinatario está en la lista de verificados (modo prueba)
5. ✅ Revisa los logs de la consola para ver errores

---

## Límites y Restricciones

### Modo de Prueba (Test Number)
- ⚠️ Máximo 5 destinatarios verificados
- ⚠️ 250 mensajes por día
- ⚠️ Solo mensajes de texto simple

### Modo de Producción
- ✅ Destinatarios ilimitados
- ✅ Mayor límite de mensajes diarios (según tier de cuenta)
- ✅ Acceso a templates aprobados
- ✅ Mensajes con imágenes y botones (requiere templates)

### Pasar de Prueba a Producción

1. Completa la verificación de negocio en Facebook Business Manager
2. Solicita aprobación para templates de mensajes
3. Actualiza las credenciales en `.env`
4. Cambia `VITE_WHATSAPP_SANDBOX=false`

---

## Mejores Prácticas

### 1. Respetar la Privacidad

- ✅ Solo envía mensajes a usuarios que han dado consentimiento
- ✅ Proporciona opción para desactivar notificaciones
- ✅ No envíes contenido promocional sin permiso

### 2. Personalización

```javascript
// ✅ Mensajes personalizados
`Hola ${userName}, tu pago de $${amount} fue recibido`

// ❌ Mensajes genéricos
`Hola, tu pago fue recibido`
```

### 3. Timing

```javascript
// ✅ Envía en horarios razonables
const now = new Date().getHours();
if (now >= 9 && now <= 21) { // Entre 9 AM y 9 PM
  await sendMessage(...);
}
```

### 4. Manejo de Errores

```javascript
try {
  const result = await sendMessage(...);
  if (!result.success) {
    console.error('Error:', result.error);
    // Guardar en cola de reintentos
  }
} catch (error) {
  // Log del error
  // Notificar al equipo técnico
}
```

---

## Recursos Adicionales

- [Documentación Oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [WhatsApp Business API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Políticas de WhatsApp Business](https://www.whatsapp.com/legal/business-policy)

---

## Soporte

¿Necesitas ayuda?
- Revisa los logs de la consola
- Consulta la sección de [Troubleshooting](#troubleshooting)
- Contacta al equipo de soporte técnico

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
