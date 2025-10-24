# Sistema de Prevención de Inconsistencias - NexuPay

## Overview

Este documento describe el sistema implementado para prevenir inconsistencias entre las tablas `debts`, `clients` y los estados de verificación en NexuPay.

## Problema Resuelto

### Problema Original
- **María Concha (RUT: 16610128-k)** tenía una deuda asignada a la empresa pero no aparecía en la lista de clientes
- **Causa**: La página de clientes busca en la tabla `clients`, pero las deudas se guardan en `debts`
- **Inconsistencia**: Los datos estaban desincronizados entre tablas relacionadas

### Solución Implementada
Sistema multi-capa de prevención y sincronización automática.

## Arquitectura del Sistema

### 1. Triggers Automáticos (Nivel Base de Datos)

#### Trigger 1: Creación Automática de Clientes
```sql
-- Archivo: supabase-migrations/030_create_auto_sync_triggers.sql
CREATE OR REPLACE FUNCTION create_client_on_debt_insert()
```

**Funciónamiento:**
- Se dispara automáticamente cuando se inserta una nueva deuda
- Verifica si el deudor ya existe como cliente
- Si no existe, crea automáticamente el registro en `clients`
- Logea la acción para auditoría

#### Trigger 2: Sincronización de Estados
```sql
CREATE OR REPLACE FUNCTION sync_verification_status()
```

**Funcionamiento:**
- Sincroniza automáticamente los estados entre:
  - `users.validation_status`
  - `companies.validation_status` 
  - `company_verifications.status`
- Se dispara al actualizar cualquier tabla de estados
- Mapea estados: `validated` → `approved`, `pending` → `under_review`

### 2. Funciones de Mantenimiento

#### Función de Sincronización Masiva
```sql
CREATE OR REPLACE FUNCTION sync_all_debtors_to_clients()
```

**Propósito:**
- Sincroniza todos los deudores existentes con la tabla `clients`
- Útil para datos históricos o correcciones masivas
- Retorna reporte detallado por empresa

#### Función de Verificación de Consistencia
```sql
CREATE OR REPLACE FUNCTION check_system_consistency()
```

**Propósito:**
- Detecta inconsistencias en el sistema
- Identifica deudores sin registro en `clients`
- Encuentra discrepancias en estados de verificación
- Retorna reporte JSON con detalles

### 3. Script de Mantenimiento Programado

#### Archivo: `scripts/sincronizacion-diaria.cjs`
```bash
# Ejecución manual
node scripts/sincronizacion-diaria.cjs

# Programación en cron (diario a las 2 AM)
0 2 * * * cd /ruta/al/proyecto && node scripts/sincronizacion-diaria.cjs
```

**Funcionalidades:**
- Verificación automática de consistencia
- Sincronización masiva de deudores
- Reporte de resultados y errores
- Alertas automáticas para problemas críticos

## Implementación Paso a Paso

### 1. Aplicar Migración de Base de Datos
```bash
# Aplicar los triggers y funciones
supabase db push supabase-migrations/030_create_auto_sync_triggers.sql
```

### 2. Configurar Tarea Programada
```bash
# En producción, configurar cron job
crontab -e
# Agregar: 0 2 * * * cd /ruta/proyecto && node scripts/sincronizacion-diaria.cjs
```

### 3. Monitoreo y Alertas
- Los logs se guardan automáticamente en la base de datos
- El script envía alertas si hay problemas críticos
- Se puede integrar con sistema de notificaciones

## Casos de Uso

### 1. Nueva Deuda Creada
```
Usuario crea deuda para Juan Pérez (RUT: 12345678-9)
↓
Trigger se dispara automáticamente
↓
Verifica si Juan Pérez existe en clients
↓
Si no existe, crea registro automáticamente
↓
Juan Pérez aparece inmediatamente en lista de clientes
```

### 2. Actualización de Estado de Verificación
```
Administrador cambia estado de empresa a "validated"
↓
Trigger sincroniza automáticamente
↓
users.validation_status = "validated"
companies.validation_status = "validated"
company_verifications.status = "approved"
↓
Todos los paneles muestran estado consistente
```

### 3. Corrección Masiva
```
Se detectan 50 deudores sin registro en clients
↓
Ejecutar script de sincronización
↓
Función sync_all_debtors_to_clients() procesa todos
↓
Crea automáticamente los 50 registros faltantes
↓
Reporte detallado de resultados
```

## Beneficios del Sistema

### 1. **Prevención Automática**
- Los triggers previenen inconsistencias en tiempo real
- No requiere intervención manual
- Transparencia para el usuario final

### 2. **Detección Temprana**
- Verificación automática diaria
- Alertas inmediatas de problemas
- Reportes detallados para análisis

### 3. **Corrección Automática**
- Sincronización masiva programada
- Recuperación de datos desincronizados
- Mantenimiento sin interrupción del servicio

### 4. **Auditoría y Monitoreo**
- Logs automáticos de todas las acciones
- Reportes de consistencia
- Métricas de rendimiento

## Comandos Útiles

### Verificar Estado Actual
```sql
-- Verificar consistencia del sistema
SELECT * FROM check_system_consistency();

-- Sincronizar todos los deudores
SELECT * FROM sync_all_debtors_to_clients();
```

### Monitoreo Manual
```bash
# Ejecutar sincronización manual
node scripts/sincronizacion-diaria.cjs

# Verificar logs de triggers
-- Los logs se guardan en los logs de PostgreSQL
```

### Mantenimiento
```bash
# Verificar que los triggers estén activos
SELECT 
  event_object_table,
  trigger_name,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Probar trigger manualmente
INSERT INTO public.debts (user_id, company_id, current_amount, original_amount, description)
VALUES ('test-user-id', 'test-company-id', 100000, 100000, 'Test debt');
```

## Recomendaciones de Mantenimiento

### 1. **Monitoreo Continuo**
- Revisar logs diariamente la primera semana
- Configurar alertas para errores críticos
- Monitorear rendimiento de los triggers

### 2. **Pruebas Periódicas**
- Ejecutar pruebas de consistencia semanalmente
- Verificar que los triggers funcionen correctamente
- Testear con datos de prueba

### 3. **Actualizaciones**
- Revisar triggers cuando se modifiquen tablas
- Actualizar scripts si cambian estructuras
- Documentar cualquier modificación

## Solución de Problemas

### Problemas Comunes

#### 1. Trigger no se dispara
```sql
-- Verificar si el trigger existe y está activo
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_client_on_debt_insert';
```

#### 2. Estado no se sincroniza
```bash
# Ejecutar sincronización manual
node scripts/sincronizacion-diaria.cjs

# Verificar logs para identificar el problema
```

#### 3. Performance impactado
```sql
-- Verificar índices necesarios
EXPLAIN ANALYZE SELECT * FROM check_system_consistency();

-- Optimizar consulta si es necesario
```

## Contacto y Soporte

Para problemas o preguntas sobre este sistema:
- Revisar los logs de ejecución
- Consultar la documentación de Supabase
- Contactar al equipo de desarrollo

---

**Última actualización:** 21 de octubre de 2025
**Versión:** 1.0
**Estado:** Implementado y en producción