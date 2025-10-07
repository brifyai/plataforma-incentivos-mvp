# Configuración de Mercado Pago y Webhooks

## 📋 **PASOS PARA CONFIGURAR MERCADO PAGO**

### 1. **Crear cuenta en Mercado Pago**
- Ve a [https://www.mercadopago.cl](https://www.mercadopago.cl)
- Regístrate como vendedor
- Completa la verificación de identidad

### 2. **Obtener credenciales de API**
- Ve a [https://www.mercadopago.cl/developers/panel](https://www.mercadopago.cl/developers/panel)
- Crea una nueva aplicación
- Obtén las credenciales:
  - **ACCESS_TOKEN** (producción)
  - **PUBLIC_KEY** (para el frontend)

### 3. **Configurar variables de entorno**
Agrega estas variables a tu archivo `.env`:

```env
VITE_MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_MERCADOPAGO_SANDBOX=false
```

### 4. **Configurar URL de webhook**
En el panel de Mercado Pago:
- Ve a **Configuración > Notificaciones**
- URL de webhook: `https://tu-dominio.com/api/webhooks/mercadopago`
- Eventos a notificar: **Pago aprobado**

## 🔧 **CONFIGURACIÓN DE LA BASE DE DATOS**

### Ejecutar la migración
Ve al dashboard de Supabase y ejecuta el SQL de la migración `005_fix_database_issues.sql`:

1. **Dashboard de Supabase** > **SQL Editor**
2. **Copia y pega** todo el contenido del archivo `supabase-migrations/005_fix_database_issues.sql`
3. **Ejecuta** la migración

### Verificar tablas creadas
Después de ejecutar la migración, verifica que existan estas tablas:
- ✅ `payments`
- ✅ `wallets`
- ✅ `payment_preferences`
- ✅ `transactions`
- ✅ `payment_history`

## 🚀 **FLUJO COMPLETO DE PAGOS**

### 1. **Usuario inicia pago**
- Desde el dashboard del deudor
- Selecciona deuda y método de pago
- Mercado Pago genera preferencia de pago

### 2. **Procesamiento del pago**
- Usuario paga en Mercado Pago
- Mercado Pago envía webhook a tu aplicación
- Webhook actualiza estado del pago

### 3. **Pago aprobado**
- Se marca la deuda como pagada
- Se calcula incentivo (5% del monto)
- Se acredita incentivo a la billetera del usuario
- Se registra en historial de pagos

### 4. **Empresa recibe pago**
- El monto completo va a la empresa
- Sistema registra transacción completa

## 📊 **MONITOREO Y TESTING**

### Verificar webhooks
- Revisa los logs de Supabase Functions
- Monitorea la tabla `transactions`
- Verifica actualizaciones en `wallets`

### Testing en sandbox
Para testing sin dinero real:
```env
VITE_MERCADOPAGO_SANDBOX=true
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔍 **TROUBLESHOOTING**

### Error: "Could not find the table"
- ✅ Ejecuta la migración `005_fix_database_issues.sql`

### Error: "Webhook no funciona"
- ✅ Verifica URL del webhook en Mercado Pago
- ✅ Confirma que la función esté desplegada
- ✅ Revisa logs de Supabase

### Error: "Credenciales inválidas"
- ✅ Verifica ACCESS_TOKEN y PUBLIC_KEY
- ✅ Confirma que no estén expiradas

## 📞 **SOPORTE**

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica configuración en Mercado Pago
3. Confirma variables de entorno
4. Contacta soporte de Mercado Pago si es necesario

---

**✅ Una vez configurado, el sistema de pagos estará completamente funcional.**