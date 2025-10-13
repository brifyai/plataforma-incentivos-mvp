# 🧪 Checklist de Prueba Manual - Página de Mensajes

## 📋 Instrucciones
Navega a `http://localhost:3002/empresa/mensajes` y verifica cada elemento:

## ✅ Secciones Principales

### 1. Header y Navegación
- [ ] Título "Centro de Mensajes y Campañas" visible
- [ ] Subtítulo "Gestiona comunicaciones masivas y campañas con IA" visible
- [ ] Badge "X Mensajes" funciona y muestra número correcto
- [ ] Botón "Nuevo Mensaje" abre modal correctamente
- [ ] Botón "Actualizar" refresca la página sin errores

### 2. Filtros de Fecha
- [ ] Campo "Desde" acepta fechas
- [ ] Campo "Hasta" acepta fechas
- [ ] Botón "Hoy" establece rango correcto
- [ ] Botón "Últimos 7 días" establece rango correcto
- [ ] Botón "Este mes" establece rango correcto

### 3. Métricas y Estadísticas
- [ ] Tarjeta "Campañas Enviadas" muestra datos
- [ ] Tarjeta "Mensajes Vistos" muestra datos
- [ ] Tarjeta "Respuestas Recibidas" muestra datos
- [ ] Tarjeta "Intervenciones IA" muestra datos

### 4. Conversaciones Activas con IA
- [ ] Sección "Conversaciones Activas con IA" visible
- [ ] Conversaciones de ejemplo aparecen (Juan Pérez, María González)
- [ ] Indicador "IA Activa" con puntos animados verdes
- [ ] Badge "Automático" visible
- [ ] Botón "Ver Conversación" abre modal
- [ ] Botón "Escalar a Humano" visible y funcional

### 5. Modal de Conversación
- [ ] Título "Conversación con [Nombre]" aparece
- [ ] RUT del deudor visible
- [ ] Asunto de conversación visible
- [ ] Sección "IA Activa" con estado verde
- [ ] Componente "Asistente IA de Negociación" visible
- [ ] Badge de confianza (ej: "Confianza: 90%")
- [ ] Badge de personalización (ej: "👤 Personalizado")
- [ ] Badge con nombre del deudor
- [ ] Botón "Responder con IA" funciona
- [ ] Botón "Escalar a Humano" funciona
- [ ] Historial de mensajes visible
- [ ] Mensajes de empresa y deudor diferenciados

### 6. Funcionalidad de IA
- [ ] Al hacer clic en "Responder con IA", aparece "Escribiendo..."
- [ ] Respuesta de IA se genera y muestra
- [ ] Información de personalización visible:
  - [ ] "🎯 Personalizado para: [Nombre] ([RUT])"
  - [ ] "• Cliente de: [Empresa]"
- [ ] Metadatos de respuesta visibles:
  - [ ] Tipo de respuesta (ej: "discount_offer")
  - [ ] Keywords detectadas (ej: "#descuento")
  - [ ] Nivel de personalización

### 7. Mensajes Enviados
- [ ] Sección "Mensajes Enviados" visible
- [ ] Lista de mensajes aparece
- [ ] Iconos de estado funcionan
- [ ] Badges de estado y prioridad visibles

### 8. Reportes de Campañas
- [ ] Sección "Reportes de Campañas" visible
- [ ] Filtro por empresa corporativo funciona
- [ ] Lista de campañas aparece
- [ ] Estadísticas por campaña visibles
- [ ] Botón "Limpiar Filtro" funciona

## 🤖 Pruebas de Personalización de IA

### Escenario 1: Solicitud de Descuento
1. [ ] Abrir conversación con Juan Pérez
2. [ ] Hacer clic en "Responder con IA"
3. [ ] Verificar que respuesta mencione:
   - [ ] Nombre "Juan Pérez"
   - [ ] Empresa "Empresa XYZ S.A."
   - [ ] RUT "12.345.678-9"
   - [ ] Oferta de descuento personalizada

### Escenario 2: Solicitud de Cuotas
1. [ ] Abrir conversación con María González
2. [ ] Hacer clic en "Responder con IA"
3. [ ] Verificar que respuesta mencione:
   - [ ] Nombre "María González"
   - [ ] Empresa "Corporación ABC Ltda."
   - [ ] RUT "15.234.567-8"
   - [ ] Opciones de cuotas flexibles

### Escenario 3: Escalada a Humano
1. [ ] En cualquier conversación, hacer clic en "Escalar a Humano"
2. [ ] Verificar que aparezca mensaje de escalada personalizado
3. [ ] Verificar que mencione nombre y empresa del deudor

## 🔍 Verificación Técnica

### Console y Errores
- [ ] No hay errores en la consola del navegador
- [ ] Todos los recursos cargan correctamente
- [ ] Las llamadas a la API (simuladas) funcionan

### Responsive Design
- [ ] Layout funciona en pantalla completa
- [ ] Layout se adapta a pantalla móvil
- [ ] Botones y elementos son clickeables en móvil

### Performance
- [ ] La página carga en menos de 3 segundos
- [ ] Las respuestas de IA se generan en menos de 2 segundos
- [ ] Los modales abren y cierran sin delay excesivo

## 📊 Resultados Esperados

### Personalización de Nivel Ultra-Alto
La IA debe mostrar:
- ✅ Nombre completo del deudor
- ✅ RUT del deudor
- ✅ Empresa corporativa
- ✅ Historial relevante
- ✅ Estilo de comunicación adaptado
- ✅ Nivel de riesgo considerado

### Indicadores Visuales
- ✅ Badge "🎯 Ultra-Personalizado" cuando hay datos completos
- ✅ Badge "👤 Personalizado" cuando hay datos básicos
- ✅ Badge con nombre del deudor
- ✅ Confianza > 80% para respuestas personalizadas

## 🐛 Problemas Comunes a Verificar

### Errores de Carga
- [ ] Componentes no cargan (blank screen)
- [ ] Error "Cannot read property of undefined"
- [ ] Error de importación de módulos

### Funcionalidad Rota
- [ ] Botones no responden al clic
- [ ] Modales no abren
- [ ] IA no genera respuestas
- [ ] Filtros no aplican

### Datos Incorrectos
- [ ] Nombres de deudores incorrectos
- [ ] Empresas corporativas incorrectas
- [ ] RUTs mal formateados
- [ ] Métricas en cero o incorrectas

---

## 📝 Notas Adicionales

### Datos de Prueba
- **Juan Pérez**: RUT 12.345.678-9, Empresa XYZ S.A.
- **María González**: RUT 15.234.567-8, Corporación ABC Ltda.

### Comandos Útiles
```bash
# Verificar que la app está corriendo
curl http://localhost:3002

# Revisar logs de la aplicación
npm run dev

# Probar con diferentes usuarios
# (Navegar a login y usar diferentes credenciales)
```

### Archivos Clave
- `src/pages/company/CompanyMessagesPage.jsx` - Página principal
- `src/components/messaging/AIMessageHandler.jsx` - Componente de IA
- `src/services/ai/knowledgeBaseService.js` - Servicio de conocimiento
- `src/modules/ai-negotiation/services/negotiationAIService.js` - Servicio de IA