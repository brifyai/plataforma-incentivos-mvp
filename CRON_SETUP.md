# Configuración de Cron Jobs para Transferencias Automáticas

Este documento explica cómo configurar cron jobs para procesar automáticamente las transferencias de Mercado Pago a las cuentas bancarias de las empresas.

## Resumen

El sistema incluye una Edge Function de Supabase (`process-payouts`) que procesa pagos pendientes y los transfiere automáticamente a las cuentas bancarias configuradas. Esta función debe ejecutarse periódicamente usando un servicio de cron jobs externo.

## Requisitos Previos

1. **Base de datos actualizada**: Ejecutar la migración `add_transfer_tracking.sql`
2. **Edge Function desplegada**: La función `process-payouts` debe estar desplegada en Supabase
3. **Credenciales configuradas**: Variables de entorno de Mercado Pago configuradas

## Servicios de Cron Job Recomendados

### 1. Cron-Job.org (Recomendado - Gratuito)
1. Ir a [cron-job.org](https://cron-job.org)
2. Crear cuenta gratuita
3. Crear nuevo cron job:
   - **URL**: `https://tu-proyecto.supabase.co/functions/v1/process-payouts`
   - **Método**: POST
   - **Headers**:
     ```
     Authorization: Bearer tu-anon-key
     Content-Type: application/json
     ```
   - **Programación**: Cada 15 minutos (`*/15 * * * *`)
   - **Activar**: Sí

### 2. GitHub Actions (Para proyectos en GitHub)
Crear `.github/workflows/cron-payouts.yml`:

```yaml
name: Process Payouts Cron

on:
  schedule:
    - cron: '*/15 * * * *'  # Cada 15 minutos
  workflow_dispatch:  # Permitir ejecución manual

jobs:
  process-payouts:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://tu-proyecto.supabase.co/functions/v1/process-payouts \
            -H "Authorization: Bearer tu-anon-key" \
            -H "Content-Type: application/json"
```

### 3. EasyCron
1. Ir a [easycron.com](https://www.easycron.com)
2. Crear cuenta
3. Crear nuevo cron job:
   - **URL**: `https://tu-proyecto.supabase.co/functions/v1/process-payouts`
   - **Método**: POST
   - **Headers**: Authorization y Content-Type
   - **Frecuencia**: Cada 15 minutos

### 4. Railway Cron Jobs (Si usas Railway)
```bash
# En tu aplicación de Railway
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/process-payouts \
  -H "Authorization: Bearer tu-anon-key" \
  -H "Content-Type: application/json"
```

## Configuración de Variables de Entorno

Asegurarse de que las siguientes variables estén configuradas en Supabase:

```bash
# Mercado Pago
VITE_MERCADOPAGO_ACCESS_TOKEN=tu_access_token
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key

# Supabase (para la Edge Function)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Proceso de Transferencia Automática

1. **Webhook de Mercado Pago** → Pago aprobado detectado
2. **Actualización de BD** → Estado de deuda actualizado, incentivo otorgado
3. **Marcado para transferencia** → Pago marcado como pendiente de transferir
4. **Cron Job ejecutado** → Función `process-payouts` llamada cada 15 minutos
5. **Procesamiento** → Transferencias creadas en Mercado Pago
6. **Actualización de estado** → Estados de transferencia actualizados en BD

## Monitoreo

### Logs de Supabase
Los logs de la Edge Function están disponibles en el dashboard de Supabase:
- Ir a Edge Functions → process-payouts → Logs

### Verificación de Transferencias
```sql
-- Ver pagos pendientes de transferir
SELECT * FROM transactions
WHERE status = 'approved' AND transfer_status IS NULL;

-- Ver transferencias en proceso
SELECT * FROM transactions
WHERE transfer_status = 'processing';

-- Ver transferencias completadas
SELECT * FROM transactions
WHERE transfer_status = 'completed';
```

## Frecuencia Recomendada

- **Desarrollo**: Cada 5 minutos
- **Producción**: Cada 15-30 minutos
- **Máximo**: Cada 1 hora (para evitar rate limits)

## Manejo de Errores

La función maneja automáticamente:
- Reintentos de transferencias fallidas
- Logging detallado de errores
- Actualización de estados de error en BD

## Costos

- **Supabase Edge Functions**: Incluido en el plan gratuito (hasta ciertos límites)
- **Servicios de cron**: Generalmente gratuitos o de bajo costo
- **Mercado Pago**: Costos por transferencia (verificar con MP)

## Seguridad

- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en Edge Functions
- Mantener credenciales de Mercado Pago seguras
- Monitorear logs regularmente
- Implementar alertas para fallos consecutivos

## Testing

Para probar manualmente:
```bash
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/process-payouts \
  -H "Authorization: Bearer tu-anon-key" \
  -H "Content-Type: application/json"
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Procesamiento completado: X exitosos, Y fallidos",
  "processedCompanies": 2,
  "totalProcessed": 5,
  "totalFailed": 0,
  "results": [...],
  "timestamp": "2024-01-01T12:00:00.000Z"
}