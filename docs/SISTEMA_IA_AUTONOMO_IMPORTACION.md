# Sistema de IA Autónomo para Importación Masiva

## 📖 Overview

El Sistema de IA Autónomo para Importación Masiva es una solución innovadora que utiliza inteligencia artificial para detectar, corregir y procesar automáticamente datos de importación masiva de deudas. Este sistema puede identificar errores en los datos, corregirlos automáticamente e incluso modificar la estructura de la base de datos dinámicamente si se detectan campos nuevos.

## 🎯 Objetivos Principales

1. **Detección Automática de Errores**: Identificar problemas comunes en los datos de importación
2. **Corrección Inteligente**: Utilizar IA para corregir datos automáticamente
3. **Adaptación Dinámica**: Modificar la base de datos para aceptar nuevos campos
4. **Procesamiento Autónomo**: Realizar todo el proceso sin intervención manual
5. **Mejora Continua**: Aprender de los errores para mejorar futuras importaciones

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Datos de      │    │   Servicio de    │    │   Base de       │
│   Importación   │───▶│   IA Autónoma    │───▶│   Datos         │
│   (Excel/CSV)   │    │   (aiImportService)│    │   (Supabase)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Servicio de    │
                       │   Importación    │
                       │   (bulkImportService)│
                       └──────────────────┘
```

## 🔧 Componentes Principales

### 1. aiImportService.js
Servicio central de IA que coordina todo el procesamiento autónomo.

**Funciones principales:**
- `processImportAutonomously()`: Función principal que orquesta todo el proceso
- `analyzeDatabaseSchema()`: Analiza la estructura actual de la base de datos
- `detectDataErrors()`: Detecta errores en los datos usando IA
- `correctDataAutomatically()`: Corrige datos automáticamente
- `suggestAndCreateFields()`: Crea nuevos campos en la base de datos

### 2. bulkImportService.js
Servicio de importación masiva mejorado con integración de IA.

**Mejoras implementadas:**
- Opción `useAI` para habilitar procesamiento con IA
- Integración con `aiImportService` antes de la importación
- Manejo de reintentos con datos corregidos por IA
- Reporte de resultados del procesamiento con IA

### 3. BulkImportDebts.jsx
Componente de React mejorado para mostrar resultados de IA.

**Características nuevas:**
- Habilitación de IA por defecto (`useAI: true`)
- Visualización de resultados del procesamiento con IA
- Información sobre campos creados dinámicamente
- Indicadores de corrección automática

## 🚀 Flujo de Procesamiento

### 1. Análisis Inicial
```javascript
// 1. Analizar estructura de la base de datos
const schema = await aiImportService.analyzeDatabaseSchema();

// 2. Detectar errores en los datos
const errorAnalysis = await aiImportService.detectDataErrors(data, schema);
```

### 2. Procesamiento con IA
```javascript
// 3. Crear campos faltantes si es necesario
if (errorAnalysis.unknownFields.length > 0) {
  await aiImportService.suggestAndCreateFields(errorAnalysis.unknownFields, 'debts');
}

// 4. Corregir datos automáticamente
const correctedData = await aiImportService.correctDataAutomatically(data, errorAnalysis.errors, schema);
```

### 3. Importación Masiva
```javascript
// 5. Realizar importación con datos corregidos
const result = await bulkImportService.bulkImportDebts(correctedData, {
  companyId,
  clientId,
  useAI: true,
  onProgress,
  onBatchComplete
});
```

## 🤖 Capacidades de la IA

### Detección de Errores

El sistema puede detectar automáticamente:

1. **RUTs inválidos**: Formatos incorrectos, dígitos verificadores erróneos
2. **Emails inválidos**: Sintaxis incorrecta, dominios no válidos
3. **Teléfonos mal formateados**: Sin formato internacional, códigos incorrectos
4. **Montos inválidos**: Valores negativos, formatos incorrectos
5. **Fechas inválidas**: Formatos no reconocidos, fechas pasadas
6. **Campos requeridos faltantes**: Datos obligatorios no proporcionados
7. **Tipos de datos incorrectos**: Texto en campos numéricos, etc.

### Corrección Automática

La IA puede corregir:

1. **Normalización de RUTs**: Formato XX.XXX.XXX-X
2. **Formato de teléfonos**: +569XXXXXXXX
3. **Limpieza de montos**: Eliminación de símbolos y formato
4. **Estandarización de fechas**: YYYY-MM-DD
5. **Generación de datos faltantes**: Valores por defecto inteligentes
6. **Corrección de emails**: Sugerencias de dominios comunes

### Creación Dinámica de Campos

El sistema puede crear automáticamente:

1. **Campos de texto**: Para datos adicionales descriptivos
2. **Campos numéricos**: Para valores cuantitativos nuevos
3. **Campos de fecha**: Para información temporal adicional
4. **Campos booleanos**: Para indicadores de estado
5. **Campos JSON**: Para datos estructurados complejos

## 📊 Tipos de Datos Soportados

### Campos Estándar
```javascript
{
  rut: 'string',           // RUT chileno formateado
  full_name: 'string',     // Nombre completo
  email: 'string',         // Email válido
  phone: 'string',         // Teléfono internacional
  debt_amount: 'number',   // Monto de deuda
  due_date: 'string',      // Fecha de vencimiento
  creditor_name: 'string', // Nombre del acreedor
  debt_reference: 'string', // Referencia de deuda
  debt_type: 'string',     // Tipo de deuda
  interest_rate: 'number', // Tasa de interés
  description: 'string'    // Descripción
}
```

### Campos Dinámicos (creados por IA)
```javascript
{
  segmento_cliente: 'string',        // Segmento del cliente
  riesgo_crediticio: 'string',       // Nivel de riesgo
  antiguedad_cliente: 'string',      // Antigüedad
  canal_origen: 'string',            // Canal de origen
  promocion_aplicada: 'string',      // Promoción
  score_comportamiento: 'number',    // Score de comportamiento
  metadata_adicional: 'json'         // Metadatos extra
}
```

## 🔍 Ejemplos de Uso

### Ejemplo 1: Corrección Automática de Datos

**Datos de entrada (con errores):**
```javascript
[
  {
    rut: '12345678',                    // ❌ Sin formato
    email: 'juan.email',                 // ❌ Dominio inválido
    phone: '912345678',                 // ❌ Sin +56
    debt_amount: '1.500.000',           // ❌ Con formato chileno
    due_date: '31/12/2024'              // ❌ Formato DD/MM/YYYY
  }
]
```

**Datos corregidos por IA:**
```javascript
[
  {
    rut: '12.345.678-9',                 // ✅ Formato corregido
    email: 'juan.email@gmail.com',       // ✅ Dominio sugerido
    phone: '+56912345678',               // ✅ Formato internacional
    debt_amount: 1500000,                // ✅ Valor numérico
    due_date: '2024-12-31'               // ✅ Formato estándar
  }
]
```

### Ejemplo 2: Creación Dinámica de Campos

**Datos con campos nuevos:**
```javascript
[
  {
    rut: '11.222.333-4',
    full_name: 'Ana Martínez',
    segmento_cliente: 'Premium',        // 🆕 Campo nuevo
    riesgo_crediticio: 'Bajo',           // 🆕 Campo nuevo
    score_comportamiento: 850            // 🆕 Campo nuevo
  }
]
```

**Resultado:**
- La IA detecta los campos nuevos
- Crea automáticamente las columnas en la base de datos
- Procesa la importación sin intervención manual

## 🛠️ Configuración

### Variables de Entorno Requeridas

```bash
# Configuración de Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Configuración de IA (al menos una)
VITE_OPENAI_API_KEY=your_openai_key
VITE_GROQ_API_KEY=your_groq_key
VITE_CHUTES_API_KEY=your_chutes_key
```

### Configuración del Servicio de IA

```javascript
// En aiImportService.js
const AI_CONFIG = {
  maxRetries: 3,
  timeout: 30000,
  defaultProvider: 'openai', // o 'groq', 'chutes'
  enableDynamicFields: true,
  enableAutoCorrection: true
};
```

## 📈 Métricas y Monitoreo

### KPIs del Sistema

1. **Tasa de Detección de Errores**: Porcentaje de errores detectados automáticamente
2. **Tasa de Corrección Exitosa**: Porcentaje de errores corregidos correctamente
3. **Campos Creados Dinámicamente**: Número de nuevos campos agregados a la BD
4. **Tiempo de Procesamiento**: Tiempo total del procesamiento con IA
5. **Reducción de Intervención Manual**: Disminución de correcciones manuales requeridas

### Logging y Auditoría

```javascript
// Ejemplo de logging detallado
console.log('🤖 Iniciando procesamiento autónomo con IA...');
console.log('📊 Datos analizados:', data.length, 'registros');
console.log('🔍 Errores detectados:', errorAnalysis.errors.length);
console.log('🏗️ Campos a crear:', errorAnalysis.unknownFields.length);
console.log('✅ Datos corregidos:', correctedData.length);
console.log('⏱️ Tiempo total:', duration, 'ms');
```

## 🧪 Pruebas y Validación

### Script de Prueba Automatizado

El sistema incluye un script completo de pruebas (`scripts/test_ai_autonomous_import.js`) que valida:

1. **Detección y corrección de errores**
2. **Creación dinámica de campos**
3. **Importación masiva completa con IA**
4. **Validación del estado de la base de datos**

### Ejecución de Pruebas

```bash
# Ejecutar todas las pruebas
node scripts/test_ai_autonomous_import.js

# Ejecutar prueba específica
import { testErrorDetectionAndCorrection } from './scripts/test_ai_autonomous_import.js';
await testErrorDetectionAndCorrection();
```

## 🔒 Seguridad y Validaciones

### Validaciones Implementadas

1. **Sanitización de Datos**: Limpieza de datos maliciosos
2. **Validación de Tipos**: Verificación estricta de tipos de datos
3. **Límites de Creación**: Restricciones en la creación de campos nuevos
4. **Permisos de Base de Datos**: Uso de service role con permisos controlados
5. **Auditoría Completa**: Registro de todas las operaciones

### Consideraciones de Seguridad

- Los campos nuevos se crean con tipos de datos seguros
- Se limita el número de campos que pueden crearse dinámicamente
- Todas las operaciones son registradas para auditoría
- Se utilizan prepared statements para prevenir SQL injection

## 🚨 Manejo de Errores

### Estrategia de Recuperación

1. **Reintentos Automáticos**: Hasta 3 intentos con estrategias diferentes
2. **Fallback a Modo Manual**: Si la IA falla, permite procesamiento manual
3. **Logging Detallado**: Información completa para depuración
4. **Notificaciones**: Alertas automáticas cuando falla el procesamiento

### Tipos de Errores Manejados

```javascript
// Errores de IA
AI_PROCESSING_ERROR = 'Error en procesamiento con IA';
AI_TIMEOUT = 'Timeout en procesamiento con IA';
AI_QUOTA_EXCEEDED = 'Cuota de IA excedida';

// Errores de Base de Datos
DB_CONNECTION_ERROR = 'Error de conexión a BD';
DB_SCHEMA_ERROR = 'Error en esquema de BD';
DB_PERMISSION_ERROR = 'Error de permisos en BD';

// Errores de Datos
DATA_VALIDATION_ERROR = 'Error de validación de datos';
DATA_FORMAT_ERROR = 'Error de formato de datos';
DATA_INTEGRITY_ERROR = 'Error de integridad de datos';
```

## 📚 Mejores Prácticas

### Para Desarrolladores

1. **Siempre habilitar IA**: Usar `useAI: true` por defecto
2. **Validar resultados**: Revisar siempre los resultados del procesamiento
3. **Monitorear rendimiento**: Observar tiempos de respuesta y cuotas
4. **Mantener logs**: Conservar registros para auditoría y mejora

### Para Usuarios

1. **Revisar correcciones**: Verificar las correcciones automáticas
2. **Validar datos finales**: Confirmar que los datos importados son correctos
3. **Reportar problemas**: Comunicar errores o comportamientos inesperados
4. **Documentar casos especiales**: Registrar casos que requieran atención manual

## 🔮 Futuras Mejoras

### Roadmap del Sistema

1. **Aprendizaje Continuo**: La IA aprende de correcciones pasadas
2. **Integración con Múltiples Fuentes**: Soporte para más formatos de datos
3. **Validación Avanzada**: Reglas de negocio personalizables
4. **Interfaz de Configuración**: UI para configurar reglas de IA
5. **Exportación de Resultados**: Reportes detallados del procesamiento

### Características en Desarrollo

- **Procesamiento en Tiempo Real**: Corrección de datos mientras se escriben
- **Integración con APIs Externas**: Validación de datos con servicios externos
- **Machine Learning Personalizado**: Modelos entrenados con datos específicos
- **Asistente Virtual**: Chatbot para ayuda en la importación

## 📞 Soporte y Contacto

Para problemas, preguntas o sugerencias sobre el Sistema de IA Autónomo:

- **Documentación técnica**: `docs/SISTEMA_IA_AUTONOMO_IMPORTACION.md`
- **Script de pruebas**: `scripts/test_ai_autonomous_import.js`
- **Código fuente**: `src/services/aiImportService.js`
- **Componente UI**: `src/components/company/BulkImportDebts.jsx`

---

**Versión**: 1.0.0  
**Última actualización**: 2025-10-14  
**Autor**: AI Assistant  
**Estado**: ✅ Activo y funcional