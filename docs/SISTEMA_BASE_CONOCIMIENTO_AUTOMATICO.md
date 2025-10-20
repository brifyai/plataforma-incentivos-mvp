# 🧠 Sistema de Base de Conocimiento Automático

## 📋 Overview

El sistema implementa una solución completa para la creación automática de base de conocimiento IA para nuevas empresas corporativas, asegurando que cada empresa tenga configurada su IA conversacional desde el momento de su registro.

## 🎯 Objetivo Principal

**Responder a la pregunta**: ¿Cuándo se crea la base de conocimiento?

✅ **Respuesta**: La base de conocimiento se crea **automáticamente** cuando se registra una nueva empresa corporativa, tanto por registro tradicional como por OAuth (Google).

## 🔄 Flujo Automático

### 1. Registro de Nueva Empresa

```
EMPRESA SE REGISTRA
        ↓
VERIFICACIÓN DE DATOS
        ↓
CREACIÓN DE USUARIO EN TABLA users
        ↓
CREACIÓN DE EMPRESA EN TABLA companies
        ↓
🧠 CREACIÓN AUTOMÁTICA DE BASE DE CONOCIMIENTO
        ↓
✅ EMPRESA LISTA PARA USAR IA CONVERSACIONAL
```

### 2. Componentes Creados Automáticamente

#### 🏢 Corporate Client
- Registro en `corporate_clients`
- Información básica de la empresa
- Categoría de visualización

#### ⚙️ Configuración IA
- Registro en `company_ai_config`
- Prompt system personalizado con nombre de la empresa
- Configuración de modelo Claude por defecto
- Parámetros de temperatura y tokens

#### 📋 Políticas por Defecto
- Descuentos: Hasta 15% automático
- Plazos: 3-12 meses según monto
- Cuotas: 3-12 cuotas según deuda

#### 💬 Respuestas Rápidas
- Trigger para "descuento"
- Trigger para "cuotas"
- Trigger para "tiempo"
- Trigger para "hablar persona" (escalada)
- Trigger para "no puedo pagar" (empatía)

#### 📚 Base de Conocimiento
- Información general de la empresa
- Políticas de negociación
- Proceso estándar
- Objetivos del sistema

## 🛠️ Implementación Técnica

### Servicio Principal: `knowledgeBaseService.js`

```javascript
// Función principal
export const createKnowledgeBaseForNewCompany = async (companyData) => {
  // 1. Crear corporate_client
  // 2. Crear configuración IA
  // 3. Crear políticas por defecto
  // 4. Crear respuestas rápidas
  // 5. Crear entrada en knowledge base
}
```

### Integración en Registro: `authService.js`

```javascript
// En función signUp() - Registro tradicional
if (role === USER_ROLES.COMPANY && companyData) {
  // ... crear empresa
  const kbResult = await createKnowledgeBaseForNewCompany({
    userId: userDataResult.id,
    companyName: companyData.businessName,
    // ... otros datos
  });
}

// En handleAuthCallback() - OAuth
if (userRole === USER_ROLES.COMPANY && registrationData) {
  // ... crear empresa OAuth
  const kbResult = await createKnowledgeBaseForNewCompany({
    userId: user.id,
    companyName: registrationData.businessName,
    // ... otros datos
  });
}
```

## 📊 Panel de Administración

### Ruta: `/admin/base-conocimiento`

#### Funcionalidades:
- 📈 Estadísticas en tiempo real
  - Total empresas
  - Con base de conocimiento
  - Sin base de conocimiento
  - Última sincronización

- 🔄 Sincronización Masiva
  - Inicializar empresas existentes
  - Procesamiento por lotes
  - Reporte de errores

- 📋 Listado de Empresas
  - Estado por empresa
  - Información de contacto
  - Fechas de creación

## 🚀 Script de Inicialización

### Archivo: `scripts/initialize_knowledge_base.js`

```bash
# Ejecutar para inicializar empresas existentes
node scripts/initialize_knowledge_base.js
```

#### Funcionalidades:
- Detectar empresas sin base de conocimiento
- Crear configuración automática
- Reporte de resultados
- Manejo de errores

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── knowledgeBaseService.js          # Servicio principal
├── pages/
│   ├── admin/
│   │   └── KnowledgeBaseManagementPage.jsx  # Panel admin
│   └── company/
│       ├── KnowledgeBasePage.jsx       # Gestión por empresa
│       └── CorporatePromptConfigPage.jsx # Configuración prompts
├── routes/
│   └── AppRouter.jsx                    # Rutas del sistema
└── services/
    └── authService.js                   # Integración en registro

scripts/
└── initialize_knowledge_base.js         # Script inicialización

docs/
└── SISTEMA_BASE_CONOCIMIENTO_AUTOMATICO.md  # Esta documentación
```

## 🗄️ Base de Datos

### Tablas Involucradas:

1. **corporate_clients**
   - Información del cliente corporativo
   - Relación con empresa

2. **company_ai_config**
   - Configuración IA por empresa
   - Prompts personalizados

3. **corporate_client_policies**
   - Políticas de negociación
   - Reglas de descuentos y plazos

4. **corporate_client_responses**
   - Respuestas rápidas automáticas
   - Triggers por palabras clave

5. **company_knowledge_base**
   - Base de conocimiento estructurada
   - Documentación por categorías

## 🎨 Personalización por Empresa

### Prompt System Personalizado

Cada empresa recibe un prompt personalizado:

```
Eres un asistente de negociación profesional para [NOMBRE_EMPRESA].

INFORMACIÓN DE LA EMPRESA:
- Nombre: [NOMBRE_EMPRESA]
- RUT: [RUT_EMPRESA]
- Contacto: [EMAIL]
- Teléfono: [TELÉFONO]

DIRECTRICES DE NEGOCIACIÓN:
[... políticas específicas ...]
```

### Configuración IA por Defecto

- **Provider**: Claude
- **Model**: claude-3-sonnet-20240229
- **Max Tokens**: 4000
- **Temperature**: 0.7
- **System Prompt**: Personalizado por empresa

## 🔧 Configuración y Mantenimiento

### Para Administradores:

1. **Verificar estado** en `/admin/base-conocimiento`
2. **Inicializar empresas** existentes con el botón "Inicializar"
3. **Monitorear errores** en el reporte de sincronización
4. **Ejecutar script** para inicialización masiva

### Para Empresas:

1. **Acceder a configuración** en `/empresa/configuracion-ia`
2. **Personalizar prompts** en `/empresa/configuracion-prompts`
3. **Gestionar knowledge base** en `/empresa/base-conocimiento`
4. **Probar configuración** con el botón de prueba

## 🚨 Manejo de Errores

### Estrategia de Fallback:

1. **Error en creación KB** → No falla registro de empresa
2. **Tablas faltantes** → Uso de localStorage temporal
3. **Conexión caída** → Reintento automático
4. **Datos inválidos** → Valores por defecto seguros

### Logs y Monitoreo:

```javascript
console.log('🧠 Creando base de conocimiento para nueva empresa...');
console.log('✅ Base de conocimiento creada automáticamente');
console.warn('⚠️ No se pudo crear base de conocimiento:', error);
```

## 📈 Métricas y KPIs

### Métricas Disponibles:

- **Tasa de creación automática**: % de empresas con KB
- **Tiempo de creación**: ms por empresa
- **Errores por tipo**: Categorización de problemas
- **Adopción**: Empresas que personalizan configuración

## 🔮 Futuras Mejoras

### Planeado:

1. **Templates por industria**
   - Configuración específica por sector
   - Prompts especializados

2. **Aprendizaje automático**
   - Mejora de prompts basada en uso
   - Optimización de respuestas

3. **Integración con CRM**
   - Sincronización de datos cliente
   - Historial de conversaciones

4. **Analytics avanzado**
   - Métricas de efectividad
   - Análisis de sentimientos

## ✅ Checklist de Implementación

- [x] Servicio de creación automática
- [x] Integración en registro tradicional
- [x] Integración en OAuth Google
- [x] Panel de administración
- [x] Script de inicialización
- [x] Manejo de errores
- [x] Documentación completa
- [x] Pruebas de integración
- [x] Configuración por defecto
- [x] Personalización por empresa

## 🎯 Conclusión

El sistema garantiza que **TODA** nueva empresa corporativa tenga su base de conocimiento IA configurada automáticamente desde el momento del registro, eliminando la necesidad de configuración manual y asegurando una experiencia IA consistente desde el primer día.

### Flujo Final:

```
🏢 EMPRESA SE REGISTRA
        ↓
🤖 SISTEMA DETECTA NUEVO REGISTRO
        ↓
🧠 CREA AUTOMÁTICAMENTE:
   • Configuración IA personalizada
   • Políticas de negociación
   • Respuestas rápidas
   • Base de conocimiento
        ↓
✅ EMPRESA LISTA PARA USAR IA INMEDIATAMENTE
```

**Resultado**: Cero configuración manual, experiencia instantánea, consistencia garantizada.