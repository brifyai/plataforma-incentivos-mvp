# Servicios de NexuPay - Estructura Organizada ✅

Esta carpeta contiene todos los servicios de la aplicación organizados por categorías funcionales.

## 🎉 Refactorización Completada

La FASE 1 de la refactorización segura ha sido completada exitosamente:
- ✅ Estructura de carpetas organizada creada
- ✅ Convenciones de nomenclatura estandarizadas
- ✅ Archivos de re-exportación implementados
- ✅ Compatibilidad hacia atrás mantenida

## 📁 Estructura de Carpetas

### 🔐 `/auth/`
Servicios de autenticación y seguridad
- `authService.js` - Gestión de autenticación principal
- `securityService.js` - Seguridad y encriptación

### 💾 `/database/`
Servicios de acceso a datos
- `databaseService.js` - Acceso principal a base de datos
- `supabaseInstances.js` - Gestión de instancias de Supabase

### 💳 `/payments/`
Servicios de pagos y transacciones
- `paymentService.js` - Procesamiento de pagos
- `bankTransferService.js` - Transferencias bancarias
- `transferService.js` - Gestión de transferencias

### 🤖 `/ai/`
Servicios de Inteligencia Artificial
- `aiService.js` - Gestión principal de IA
- `aiProvidersService.js` - Proveedores de IA
- `aiImportService.js` - Importación con IA
- `advancedAIService.js` - IA avanzada
- `ragService.js` - Retrieval Augmented Generation

### 📊 `/analytics/`
Servicios de analítica y reportes
- `analyticsService.js` - Analítica principal
- `predictiveAnalyticsService.js` - Análisis predictivo
- `realTimeAnalyticsService.js` - Analítica en tiempo real
- `streamingAnalyticsService.js` - Analítica de streaming
- `reportExportService.js` - Exportación de reportes

### 📧 `/communication/`
Servicios de comunicación
- `emailService.js` - Envío de emails
- `emailTemplates.js` - Plantillas de email
- `messageService.js` - Gestión de mensajes

### 🎯 `/campaigns/`
Servicios de campañas y marketing
- `campaignService.js` - Gestión de campañas
- `bulkImportService.js` - Importación masiva
- `bulkImportServiceFixed.js` - Importación mejorada

### 👥 `/crm/`
Servicios de CRM y gestión de clientes
- `companyCRMService.js` - CRM para empresas
- `crmMatchingService.js` - Matching de CRM
- `debtorMatchingService.js` - Matching de deudores
- `debtorCorporateMatchingService.js` - Matching corporativo

### 👤 `/user/`
Servicios para usuarios y deudores
- `debtorAIAssistantService.js` - Asistente IA para deudores
- `debtorAnalyticsService.js` - Analítica de deudores
- `debtorGamificationService.js` - Gamificación
- `adaptiveProfileService.js` - Perfiles adaptativos

### 🏢 `/company/`
Servicios para empresas
- `knowledgeBaseService.js` - Base de conocimiento

### ⚙️ `/system/`
Servicios del sistema
- `loggerService.js` - Sistema de logs
- `verificationService.js` - Verificación de documentos
- `transparentMessageGenerator.js` - Generador de mensajes

### 🔧 `/core/`
Servicios core y utilidades
- `contextualExperienceService.js` - Experiencia contextual
- `continuousLearningService.js` - Aprendizaje continuo
- `ecosystemSyncService.js` - Sincronización del ecosistema
- `gamificationService.js` - Gamificación principal
- `hierarchicalFilterEngine.js` - Motor de filtros jerárquicos
- `realtimeService.js` - Servicio de tiempo real

## 📝 Convenciones

### Nomenclatura de Archivos
- `kebab-case.js` para nombres de archivos
- Nombres descriptivos que indiquen su función

### Nomenclatura de Funciones
- `camelCase()` para funciones
- Nombres verbales que indiquen la acción

### Nomenclatura de Clases
- `PascalCase` para clases
- Nombres descriptivos del servicio

### Estructura de Exportación
```javascript
// Exportaciones nombradas para funciones específicas
export const functionName = async () => {};

// Exportación por defecto para el servicio principal
export default ServiceClass;
```

## 🔄 Migración

Durante la refactorización, los servicios se moverán a sus carpetas correspondientes manteniendo la compatibilidad hacia atrás mediante exports de re-exportación en los archivos originales.

## 📋 Documentación

Cada servicio debe incluir:
1. JSDoc con descripción de la clase/función
2. Parámetros y tipos
3. Valores de retorno
4. Ejemplos de uso
5. Manejo de errores

---

**Última actualización:** 2025-10-22  
**Versión:** 1.0.0