# 📋 Guía Completa de Configuración - IA y Mensajería NexuPay

## 🎯 ¿Dónde Configurar Todo?

### 1. **Configuración Principal de IA y Mensajería**
**URL:** `http://localhost:3002/empresa/configuracion-ia`

Esta es la página principal donde configurarás todos los aspectos del sistema de IA y mensajería.

---

## 🛠️ Secciones de Configuración

### 📍 **Pestaña 1: Proveedores de IA**

Aquí configuras los servicios de IA que usarás:

#### **Chutes AI**
- **API Key:** Tu clave de API de Chutes AI
- **URL Base:** `https://api.chutes.ai` (por defecto)
- **Modelo:** `gpt-4`, `gpt-3.5-turbo`, `claude-3`
- **Max Tokens:** 2000 (longitud máxima de respuesta)
- **Temperature:** 0.7 (creatividad de respuestas)

#### **Groq AI**
- **API Key:** Tu clave de API de Groq (empieza con `gsk_`)
- **URL Base:** `https://api.groq.com` (por defecto)
- **Modelo:** `llama2-70b`, `mixtral-8x7b`, `gemma-7b`
- **Max Tokens:** 2000
- **Temperature:** 0.7

#### **OpenAI**
- **API Key:** Tu clave de API de OpenAI (empieza con `sk-`)
- **URL Base:** `https://api.openai.com` (por defecto)
- **Modelo:** `gpt-4`, `gpt-3.5-turbo`
- **Max Tokens:** 2000
- **Temperature:** 0.7

#### **Configuración General**
- **Provider Principal:** Elige cuál usar como principal
- **Habilitar Fallback:** Si falla el principal, usa el secundario
- **Reintentar automáticamente:** Vuelve a intentar si hay error
- **Máximo de reintentos:** 3 (por defecto)

---

### 📍 **Pestaña 2: Mensajería**

Configura cómo responde la IA:

#### **Respuesta Automática**
- ✅ **Responder automáticamente:** La IA responde sin intervención humana
- ✅ **Habilitar escalado:** Pasa a humano cuando es necesario

#### **Horario de Trabajo**
- ✅ **Habilitar horario:** La IA solo responde en horario laboral
- **Hora de inicio:** 09:00 (9 AM)
- **Hora de fin:** 18:00 (6 PM)
- **Zona horaria:** America/Santiago (Chile)

#### **Tiempo de Respuesta**
- **Retraso mínimo:** 2 segundos (simula escritura humana)
- **Retraso máximo:** 5 segundos

#### **Umbrales de Escalado**
- **Longitud máxima:** 15 mensajes (si se pasa, escala a humano)
- **Descuento máximo:** 20% (si piden más, escala a humano)
- **Tiempo máximo:** 18 meses (si piden más, escala a humano)
- **Nivel de frustración:** 0.7 (si detecta frustración, escala)

---

### 📍 **Pestaña 3: Personalización**

Configura qué tan personalizadas serán las respuestas:

#### **Nivel de Personalización**
- **🟢 Bajo:** Solo información básica
- **🟡 Medio:** Nombre y empresa
- **🟠 Alto:** Historial y preferencias
- **🔴 Ultra-Alto:** Análisis completo (recomendado)

#### **Elementos de Personalización**
- ✅ **Usar nombre del deudor:** "Hola Juan..."
- ✅ **Usar nombre de empresa:** "...como cliente de Empresa XYZ..."
- ❌ **Usar RUT:** "RUT: 12.345.678-9" (opcional)
- ✅ **Usar historial:** Considera conversaciones previas
- ✅ **Adaptar al riesgo:** Ajusta tono según nivel de riesgo

#### **Estilo de Comunicación**
- **Formal:** "Usted", tratamientos respetuosos
- **Profesional:** Balanceado y claro (recomendado)
- **Informal:** "Tú", lenguaje cercano

#### **Mensajes Personalizados**
- **Saludo personalizado:** "Hola {nombre}, como cliente de {empresa}..."
- **Despedida personalizada:** "Atentamente, el equipo de {empresa}"

---

### 📍 **Pestaña 4: Respuestas**

Configura respuestas automáticas personalizadas:

#### **Respuestas Predefinidas**
1. **Trigger:** `descuento`
   - **Tipo:** Palabra clave
   - **Respuesta:** "Como cliente especial, puedo ofrecerte opciones exclusivas de descuento."

2. **Trigger:** `cuotas`
   - **Tipo:** Palabra clave
   - **Respuesta:** "Tenemos planes flexibles que se adaptan a tu presupuesto."

#### **Agregar Nueva Respuesta**
- **Trigger:** Palabra que activa la respuesta
- **Tipo:** Palabra clave, Intención, o Sentimiento
- **Respuesta:** Mensaje personalizado
- **Activa:** Habilitar/deshabilitar

---

### 📍 **Pestaña 5: Límites**

Configura los límites de negociación:

#### **Límites de Negociación**
- **Descuento máximo:** 15% (máximo descuento que puede ofrecer la IA)
- **Cuotas máximas:** 12 (número máximo de cuotas)
- **Plazo máximo:** 18 meses (plazo máximo de pago)
- **Pago mínimo:** $10.000 (pago mínimo aceptado)

---

## 🎛️ Configuración para Administradores

### **Configuración Global de IA**
**URL:** `http://localhost:3002/admin/ia`

Aquí los administradores pueden:
- Configurar providers a nivel global
- Activar/desactivar módulos de IA
- Monitorear estado del sistema
- Ver métricas globales

---

## 🚀 Flujo de Configuración Recomendado

### **Paso 1: Configurar Providers de IA**
1. Ve a `/empresa/configuracion-ia`
2. Ve a la pestaña "Proveedores de IA"
3. Configura al menos un provider con tu API Key
4. Prueba la conexión con el botón "Probar Conexión"
5. Selecciona el provider principal

### **Paso 2: Configurar Personalización**
1. Ve a la pestaña "Personalización"
2. Selecciona nivel "Ultra-Alto"
3. Activa todos los elementos de personalización
4. Elige estilo "Profesional"
5. Personaliza saludo y despedida

### **Paso 3: Configurar Respuestas**
1. Ve a la pestaña "Respuestas"
2. Agrega respuestas personalizadas para tu negocio
3. Configura triggers específicos de tu industria
4. Activa las respuestas que necesites

### **Paso 4: Configurar Límites**
1. Ve a la pestaña "Límites"
2. Ajusta los límites según tu política comercial
3. Configura descuentos máximos permitidos
4. Establece plazos y cuotas máximas

### **Paso 5: Probar el Sistema**
1. Ve a `/empresa/mensajes`
2. Abre una conversación de prueba
3. Envía un mensaje de prueba
4. Verifica que la IA responda con personalización
5. Revisa los badges de personalización

---

## 🔍 Verificación de Configuración

### **Indicadores de Personalización Exitosa**
- ✅ Badge "🎯 Ultra-Personalizado" visible
- ✅ Nombre del deudor en la respuesta
- ✅ Nombre de la empresa mencionada
- ✅ RUT incluido (si está activado)
- ✅ Confianza > 80%

### **Mensajes de Éxito**
```
✅ Configuración guardada exitosamente
✅ Conexión con provider establecida
✅ IA respondiendo correctamente
✅ Personalización funcionando
```

### **Mensajes de Error Comunes**
```
❌ Error: API Key no configurada
❌ Error: No se pudo conectar con el provider
❌ Advertencia: Configuración incompleta
```

---

## 📊 Variables del Sistema

### **Variables de Entorno (.env)**
```bash
# API Keys de IA
CHUTES_API_KEY=tu_api_key_aqui
GROQ_API_KEY=gsk_tu_api_key_aqui
OPENAI_API_KEY=sk_tu_api_key_aqui

# URLs de API
CHUTES_API_URL=https://api.chutes.ai
GROQ_API_URL=https://api.groq.com
OPENAI_API_URL=https://api.openai.com

# Configuración de IA
AI_DEFAULT_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### **Variables en Base de Datos**
- `negotiation_ai_config`: Configuración por empresa
- `corporate_client_responses`: Respuestas personalizadas
- `company_knowledge_base`: Base de conocimiento
- `debtor_behavior_profile`: Perfiles de deudores

---

## 🛠️ Herramientas de Diagnóstico

### **Verificar Estado del Sistema**
```javascript
// En consola del navegador
localStorage.getItem('aiConfig');
localStorage.getItem('messagingConfig');
localStorage.getItem('personalizationConfig');
```

### **Verificar Conexión de IA**
1. Ve a `/empresa/configuracion-ia`
2. Haz clic en "Probar Conexión" para cada provider
3. Revisa la consola para errores
4. Verifica las respuestas de la API

### **Verificar Personalización**
1. Ve a `/empresa/mensajes`
2. Abre una conversación
3. Envía un mensaje de prueba
4. Revisa los badges y metadatos

---

## 🎯 Ejemplos de Configuración

### **Configuración para Empresa Pequeña**
- **Provider:** Groq AI (más económico)
- **Personalización:** Alto
- **Límites:** 10% descuento, 6 cuotas
- **Horario:** 09:00 - 18:00

### **Configuración para Empresa Grande**
- **Provider:** Chutes AI + OpenAI (fallback)
- **Personalización:** Ultra-Alto
- **Límites:** 20% descuento, 12 cuotas
- **Horario:** 24/7

### **Configuración para Startup**
- **Provider:** OpenAI (más preciso)
- **Personalización:** Medio
- **Límites:** 15% descuento, 9 cuotas
- **Horario:** 08:00 - 20:00

---

## 🔧 Troubleshooting

### **Problema: IA no responde**
1. Verifica API Keys configuradas
2. Prueba conexión con el provider
3. Revisa horario de trabajo
4. Verifica umbrales de escalado

### **Problema: No hay personalización**
1. Verifica nivel de personalización
2. Activa elementos de personalización
3. Revisa datos del deudor en BD
4. Prueba con diferentes deudores

### **Problema: Errores de conexión**
1. Verifica URL del provider
2. Revisa API Key válida
3. Prueba con curl o Postman
4. Revisa límites de API

---

## 📞 Soporte

### **Logs del Sistema**
- **Frontend:** Consola del navegador
- **Backend:** Logs de Vite/Node.js
- **Base de datos:** Logs de Supabase

### **Contacto**
- **Documentación:** `/docs/`
- **Issues:** GitHub del proyecto
- **Soporte técnico:** Equipo de desarrollo

---

## ✅ Checklist Final

Antes de ir a producción, verifica:

- [ ] Al menos un provider de IA configurado
- [ ] API Keys válidas y probadas
- [ ] Personalización configurada
- [ ] Respuestas personalizadas agregadas
- [ ] Límites de negociación establecidos
- [ ] Horario de trabajo configurado
- [ ] Sistema de escalado activo
- [ ] Pruebas de conversación funcionando
- [ ] Badges de personalización visibles
- [ ] Métricas de confianza > 80%

¡Listo! Tu sistema de IA y mensajería está completamente configurado. 🎉