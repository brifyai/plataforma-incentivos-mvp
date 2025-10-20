# Plataforma de Incentivos - Parte 2B: Integraciones Externas

## 🎯 Resumen

La **Parte 2B** extiende la Plataforma de Incentivos con integraciones a servicios externos clave:

- 📱 **WhatsApp Business API** - Notificaciones proactivas por WhatsApp
- 🔗 **CRM** (Salesforce, HubSpot, Zoho) - Sincronización bidireccional de datos
- 💳 **Mercado Pago** - Procesamiento de pagos en línea

## 📦 ¿Qué se ha Desarrollado?

### 1. Servicios de Integración (Backend Logic)

```
src/services/integrations/
├── whatsapp.service.js           # WhatsApp Business API
├── mercadopago.service.js        # Mercado Pago payments
└── crm/
    ├── crm.service.js            # Interfaz unificada CRM
    ├── salesforce.service.js     # Adaptador Salesforce
    ├── hubspot.service.js        # Adaptador HubSpot
    └── zoho.service.js           # Adaptador Zoho
```

**Características**:
- ✅ Manejo robusto de errores
- ✅ Logging detallado
- ✅ Singleton pattern
- ✅ Configuración vía variables de entorno

### 2. Hooks Personalizados (React Logic)

```
src/hooks/integrations/
├── useWhatsApp.js      # Hook para WhatsApp
├── useCRM.js           # Hook para CRM
├── useMercadoPago.js   # Hook para Mercado Pago
└── index.js            # Exportaciones
```

**Beneficios**:
- ✅ Abstrae complejidad de servicios
- ✅ Maneja estado y errores automáticamente
- ✅ Integra con NotificationContext
- ✅ Fácil de usar en componentes

### 3. Componentes UI (React Components)

```
src/components/integrations/
├── IntegrationsPanel.jsx              # Panel admin de integraciones
├── MercadoPagoPayment.jsx            # Componente de pago
├── CRMSyncStatus.jsx                 # Estado de sincronización CRM
├── WhatsAppNotificationSettings.jsx  # Config de notificaciones
└── index.js                          # Exportaciones
```

**Características**:
- ✅ Diseño responsive con Tailwind CSS
- ✅ Feedback visual de operaciones
- ✅ Manejo de estados de carga
- ✅ Integración con hooks personalizados

### 4. Documentación Completa

```
docs/parte2b/
├── INTEGRACIONES_EXTERNAS.md          # Visión general
├── CONFIGURACION_WHATSAPP.md          # Guía WhatsApp
├── CONFIGURACION_CRM.md               # Guía CRM
├── CONFIGURACION_MERCADOPAGO.md       # Guía Mercado Pago
├── MANUAL_TECNICO_INTEGRACIONES.md    # Manual técnico
└── GUIA_DESPLIEGUE.md                 # Guía de despliegue
```

**Contenido**:
- ✅ Guías paso a paso de configuración
- ✅ Diagramas de arquitectura
- ✅ Ejemplos de código
- ✅ Troubleshooting
- ✅ Mejores prácticas

## 🚀 Inicio Rápido

### Paso 1: Instalar Dependencias

```bash
cd plataforma-incentivos-mvp
npm install
```

### Paso 2: Configurar Variables de Entorno

Copia `.env.example` a `.env` y completa las credenciales:

```bash
cp .env.example .env
```

Edita `.env`:
```bash
# WhatsApp
VITE_WHATSAPP_ACCESS_TOKEN=tu-token
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=tu-account-id

# CRM (al menos uno)
VITE_SALESFORCE_ACCESS_TOKEN=tu-token
VITE_SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com
# o
VITE_HUBSPOT_ACCESS_TOKEN=tu-token
# o
VITE_ZOHO_ACCESS_TOKEN=tu-token
VITE_ZOHO_API_DOMAIN=https://www.zohoapis.com

# Mercado Pago
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-xxx (para desarrollo)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
VITE_MERCADOPAGO_SANDBOX=true
```

### Paso 3: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Paso 4: Verificar Integraciones

Ve al panel de administración para verificar el estado de las integraciones:

```
http://localhost:5173/admin/integrations
```

## 📖 Documentación Detallada

### Por Integración

- **WhatsApp**: [Ver guía completa](./docs/parte2b/CONFIGURACION_WHATSAPP.md)
- **CRM**: [Ver guía completa](./docs/parte2b/CONFIGURACION_CRM.md)
- **Mercado Pago**: [Ver guía completa](./docs/parte2b/CONFIGURACION_MERCADOPAGO.md)

### Técnica

- **Arquitectura**: [Ver manual técnico](./docs/parte2b/MANUAL_TECNICO_INTEGRACIONES.md)
- **Despliegue**: [Ver guía de despliegue](./docs/parte2b/GUIA_DESPLIEGUE.md)
- **Visión General**: [Ver documentación general](./docs/parte2b/INTEGRACIONES_EXTERNAS.md)

## 💡 Ejemplos de Uso

### Enviar Notificación WhatsApp

```jsx
import { useWhatsApp } from './hooks/integrations';

function MyComponent() {
  const { sendPaymentReminder, loading } = useWhatsApp();
  
  const handleSendReminder = async () => {
    await sendPaymentReminder(
      '56912345678',
      'Juan Pérez',
      {
        amount: 50000,
        companyName: 'Banco Example'
      },
      5 // días hasta vencimiento
    );
  };
  
  return (
    <button onClick={handleSendReminder} disabled={loading}>
      Enviar Recordatorio
    </button>
  );
}
```

### Sincronizar con CRM

```jsx
import { useCRM } from './hooks/integrations';

function SyncButton() {
  const { fullSync, loading } = useCRM();
  
  const handleSync = async () => {
    const result = await fullSync({
      debtorFilters: { hasDebt: true },
      includeHistory: true
    });
    
    console.log(`Sincronizados: ${result.summary.debtors} deudores`);
  };
  
  return (
    <button onClick={handleSync} disabled={loading}>
      Sincronizar CRM
    </button>
  );
}
```

### Procesar Pago con Mercado Pago

```jsx
import { useMercadoPago } from './hooks/integrations';

function PaymentButton({ debt }) {
  const { createDebtPayment, loading } = useMercadoPago();
  
  const handlePay = async () => {
    const result = await createDebtPayment(debt);
    
    if (result.success) {
      // Redirigir al checkout
      window.location.href = result.initPoint;
    }
  };
  
  return (
    <button onClick={handlePay} disabled={loading}>
      Pagar con Mercado Pago
    </button>
  );
}
```

### Usar Componentes Pre-construidos

```jsx
import { 
  IntegrationsPanel, 
  MercadoPagoPayment,
  CRMSyncStatus,
  WhatsAppNotificationSettings 
} from './components/integrations';

// Panel de administración
<IntegrationsPanel />

// Pago
<MercadoPagoPayment 
  debt={debt}
  onPaymentCreated={(result) => console.log(result)}
/>

// Sincronización CRM
<CRMSyncStatus />

// Configuración WhatsApp
<WhatsAppNotificationSettings />
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         Componentes React (UI)          │
│  IntegrationsPanel, MercadoPagoPayment  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Custom Hooks (Logic)           │
│  useWhatsApp, useCRM, useMercadoPago    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Integration Services             │
│  whatsapp.service, crm.service, etc.    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         External APIs / SDKs            │
│  WhatsApp API, Salesforce, MercadoPago  │
└─────────────────────────────────────────┘
```

## 🔐 Seguridad

### Gestión de Credenciales

- ✅ **NUNCA** incluir credenciales en el código
- ✅ Usar variables de entorno (`.env`)
- ✅ `.env` en `.gitignore`
- ✅ Variables encriptadas en plataformas de deploy

### Validación

- ✅ Validar todos los inputs del usuario
- ✅ Sanitizar datos antes de enviar a APIs
- ✅ Verificar webhooks con signatures
- ✅ Rate limiting implementado

### Comunicación

- ✅ HTTPS en todas las comunicaciones
- ✅ Tokens con scopes mínimos necesarios
- ✅ Refresh tokens para sesiones largas

## 🧪 Testing

### Ejecutar Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Testing Manual

1. **WhatsApp**: Enviar mensaje de prueba
2. **CRM**: Sincronizar contacto de prueba
3. **Mercado Pago**: Crear pago con tarjeta de prueba

Ver [Manual Técnico](./docs/parte2b/MANUAL_TECNICO_INTEGRACIONES.md#testing) para más detalles.

## 📊 Monitoreo

### Logs

```javascript
// Los servicios generan logs automáticamente
console.log('✅ WhatsApp enviado a 56912345678');
console.log('📥 Sincronización CRM: 150 deudores');
console.log('💰 Pago procesado: $50,000');
```

### Métricas

- Mensajes WhatsApp enviados
- Sincronizaciones CRM exitosas
- Pagos procesados
- Tasa de error por integración

## 🚨 Troubleshooting

### Problema: Integraciones no funcionan

**Solución**:
1. Verificar variables de entorno están configuradas
2. Reiniciar servidor de desarrollo
3. Ver logs en consola para errores específicos

### Problema: Webhooks no se reciben

**Solución**:
1. Verificar URL de webhook es accesible públicamente
2. Usar ngrok para desarrollo local
3. Verificar endpoint responde 200 OK

### Más ayuda

Ver sección de [Troubleshooting](./docs/parte2b/GUIA_DESPLIEGUE.md#troubleshooting-común) en la Guía de Despliegue.

## 📈 Roadmap Futuro

### Próximas Integraciones

- [ ] Twilio SMS
- [ ] Slack notificaciones
- [ ] Google Calendar para recordatorios
- [ ] Zapier webhooks
- [ ] Microsoft Dynamics CRM

### Mejoras Planificadas

- [ ] Dashboard de métricas de integraciones
- [ ] Sistema de reintentos automático
- [ ] Cache de respuestas CRM
- [ ] Templates personalizables de WhatsApp
- [ ] Testing automatizado completo

## 🤝 Contribuir

### Agregar Nueva Integración

1. Crear servicio en `src/services/integrations/`
2. Crear hook en `src/hooks/integrations/`
3. Crear componente UI en `src/components/integrations/`
4. Agregar documentación en `docs/parte2b/`
5. Actualizar `.env.example`

Ver [Manual Técnico](./docs/parte2b/MANUAL_TECNICO_INTEGRACIONES.md) para guía completa.

## 📝 Changelog

### Versión 2.0.0 - Parte 2B (Octubre 2025)

**Nuevas Integraciones**:
- ✨ WhatsApp Business API
- ✨ Salesforce CRM
- ✨ HubSpot CRM
- ✨ Zoho CRM
- ✨ Mercado Pago

**Componentes**:
- ✨ Panel de administración de integraciones
- ✨ Componente de pago Mercado Pago
- ✨ Estado de sincronización CRM
- ✨ Configuración de notificaciones WhatsApp

**Documentación**:
- 📚 6 guías completas de configuración
- 📚 Manual técnico detallado
- 📚 Guía de despliegue
- 📚 Ejemplos de código

## 📞 Soporte

- **Documentación**: Ver carpeta `/docs/parte2b/`
- **Issues**: Crear issue en el repositorio
- **Email**: soporte@tuempresa.com

## 📄 Licencia

Ver archivo [LICENSE](./LICENSE)

---

**Desarrollado con ❤️ por el equipo de Plataforma de Incentivos**

**Versión**: 2.0.0 (Parte 2B)  
**Última actualización**: Octubre 2025
