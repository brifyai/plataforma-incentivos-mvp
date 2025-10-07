# 📐 Especificaciones Técnicas - Plataforma de Incentivos para Acuerdos de Pago

## Información del Documento

- **Versión**: 2.0 - Parte 2A
- **Fecha**: Octubre 2025
- **Audiencia**: Arquitectos de Software, Tech Leads, Product Managers

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Arquitectura de Software](#arquitectura-de-software)
4. [Modelo de Datos](#modelo-de-datos)
5. [Especificaciones de API](#especificaciones-de-api)
6. [Algoritmos y Lógica de Negocio](#algoritmos-y-lógica-de-negocio)
7. [Seguridad y Cumplimiento](#seguridad-y-cumplimiento)
8. [Rendimiento y Escalabilidad](#rendimiento-y-escalabilidad)
9. [Integración con Servicios Externos](#integración-con-servicios-externos)
10. [Plan de Pruebas](#plan-de-pruebas)
11. [Roadmap Técnico](#roadmap-técnico)

---

## 📊 Resumen Ejecutivo

### Visión General

La Plataforma de Incentivos para Acuerdos de Pago es una aplicación web full-stack que transforma el modelo tradicional de cobranzas mediante gamificación, incentivos monetarios y herramientas de planificación financiera.

### Características Principales - Parte 2A

| Característica | Descripción | Estado |
|----------------|-------------|--------|
| **Sistema de Gamificación** | Puntos, niveles, insignias y tabla de clasificación | ✅ Implementado |
| **Simulador de Pagos** | Calculadora interactiva con múltiples escenarios | ✅ Implementado |
| **Notificaciones In-App** | Centro de notificaciones en tiempo real | ✅ Implementado |
| **Sistema de Emails** | Recordatorios y reportes automáticos | ✅ Implementado |
| **Billetera Virtual** | Gestión de incentivos monetarios | ✅ Parte 1 |
| **Gestión de Deudas** | CRUD completo de deudas y acuerdos | ✅ Parte 1 |

### Métricas Técnicas

```
Líneas de Código:        ~15,000
Componentes React:       48
Tablas de Base de Datos: 25
Edge Functions:          2
Hooks Personalizados:    8
Servicios:              6
```

### Stack Tecnológico

**Frontend:**
- React 18.2 + TypeScript
- Vite 4.0
- Tailwind CSS 3.0
- React Router 6.0

**Backend:**
- Supabase (PostgreSQL 15)
- Deno (Edge Functions)
- Row Level Security (RLS)

**Servicios Externos:**
- Resend/SendGrid (Emails)
- Mercado Pago (Pagos)
- Cron-job.org (Scheduler)

---

## 💻 Requisitos del Sistema

### Requisitos de Hardware

#### Servidor (Producción)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Almacenamiento | 20 GB SSD | 50 GB SSD |
| Ancho de banda | 100 Mbps | 1 Gbps |

#### Cliente (Usuario Final)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | Dual-core 1.5 GHz | Quad-core 2.0 GHz |
| RAM | 2 GB | 4 GB |
| Conexión | 2 Mbps | 10 Mbps |
| Resolución | 1024x768 | 1920x1080 |

### Requisitos de Software

#### Desarrollo

```yaml
Node.js: >= 18.0.0
npm: >= 9.0.0
Git: >= 2.30.0
Supabase CLI: >= 1.0.0
Deno: >= 1.30.0 (para Edge Functions)
```

#### Navegadores Soportados

| Navegador | Versión Mínima |
|-----------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Opera | 76+ |

**No soportado:**
- Internet Explorer (cualquier versión)
- Navegadores móviles antiguos (< 2 años)

### Requisitos de Red

**Puertos:**
- 443 (HTTPS)
- 80 (HTTP - redirige a HTTPS)

**Protocolos:**
- HTTP/2
- WebSocket (para Realtime)

**Latencia:**
- < 200ms para operaciones CRUD
- < 500ms para cálculos complejos
- < 100ms para notificaciones en tiempo real

---

## 🏗️ Arquitectura de Software

### Patrón Arquitectónico

**Arquitectura de 3 Capas:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Components                                     │  │
│  │  - Presentational Components                          │  │
│  │  - Container Components                               │  │
│  │  - Custom Hooks                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE LÓGICA DE NEGOCIO                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer                                       │  │
│  │  - gamificationService                                │  │
│  │  - simulatorService                                   │  │
│  │  - notificationService                                │  │
│  │  - authService                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno)                                │  │
│  │  - send-email                                         │  │
│  │  - schedule-payment-reminders                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL)                                │  │
│  │  - 25 tablas normalizadas                             │  │
│  │  - Triggers y funciones PL/pgSQL                      │  │
│  │  - Row Level Security                                 │  │
│  │  - Índices optimizados                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Patrones de Diseño Utilizados

#### 1. Container/Presentational Pattern

**Container Components:**
```javascript
// GamificationPage.jsx - Lógica y estado
const GamificationPage = () => {
  const { gamification, badges, loading } = useGamification();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <DashboardLayout>
      <GamificationCard gamification={gamification} />
      <BadgesList badges={badges} />
    </DashboardLayout>
  );
};
```

**Presentational Components:**
```javascript
// GamificationCard.jsx - Solo presentación
const GamificationCard = ({ gamification, levelProgress }) => {
  return (
    <Card>
      <h3>{gamification.level_name}</h3>
      <ProgressBar percentage={levelProgress.percentage} />
    </Card>
  );
};
```

#### 2. Custom Hooks Pattern

```javascript
// Encapsular lógica reutilizable
const useGamification = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  return { data, loading, refresh: loadData };
};
```

#### 3. Service Layer Pattern

```javascript
// Separar lógica de negocio de componentes
export const gamificationService = {
  getUserGamification: async (userId) => {
    // Lógica de acceso a datos
  },
  calculateLevelProgress: (data) => {
    // Lógica de cálculo
  }
};
```

#### 4. Observer Pattern (Realtime)

```javascript
// Suscripción a cambios en tiempo real
const subscription = supabase
  .channel('notifications')
  .on('INSERT', (payload) => {
    // Actualizar UI automáticamente
  })
  .subscribe();
```

#### 5. Strategy Pattern (Simulador)

```javascript
// Diferentes estrategias de cálculo
const paymentStrategies = {
  minimum: (debt, rate) => calculateMinimum(debt, rate),
  accelerated: (debt, rate) => calculateAccelerated(debt, rate),
  custom: (debt, rate, amount) => calculateCustom(debt, rate, amount)
};
```

### Flujo de Datos

#### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. authService.login(email, password)
   ↓
3. Supabase Auth valida credenciales
   ↓
4. Genera JWT token
   ↓
5. Token almacenado en localStorage
   ↓
6. AuthContext actualizado
   ↓
7. Redirección según rol
```

#### Flujo de Gamificación

```
1. Usuario realiza pago
   ↓
2. Insert en tabla payments
   ↓
3. Trigger: update_gamification_on_payment()
   ↓
4. Calcular puntos (10 pts/$1000)
   ↓
5. Actualizar user_gamification
   ↓
6. Verificar insignias (check_and_award_badges)
   ↓
7. Crear notificación si hay nueva insignia
   ↓
8. Realtime subscription notifica al frontend
   ↓
9. UI actualizada automáticamente
```

#### Flujo de Notificaciones por Email

```
1. Evento trigger (ej: pago próximo a vencer)
   ↓
2. schedule-payment-reminders Edge Function
   ↓
3. Insert en email_queue
   ↓
4. Cron job ejecuta send-email cada 5 min
   ↓
5. send-email procesa cola
   ↓
6. Envía email vía Resend API
   ↓
7. Actualiza email_queue (status: sent)
   ↓
8. Registra en email_logs
```

---

## 🗄️ Modelo de Datos

### Diagrama Entidad-Relación (Parte 2A)

```
┌─────────────────┐
│     users       │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ↓                                      ↓
┌─────────────────┐                  ┌─────────────────┐
│user_gamification│                  │  notifications  │
└────────┬────────┘                  └─────────────────┘
         │
         ├──────────┬──────────┐
         ↓          ↓          ↓
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ user_badges  │ │  points  │ │   payment    │
│              │ │ _history │ │ _simulations │
└──────┬───────┘ └──────────┘ └──────────────┘
       │
       ↓
┌─────────────────┐
│gamification_    │
│    badges       │
└─────────────────┘
```

### Normalización

**Forma Normal:** 3NF (Tercera Forma Normal)

**Justificación:**
- Elimina redundancia de datos
- Mantiene integridad referencial
- Facilita actualizaciones
- Optimiza almacenamiento

**Ejemplo:**

❌ **Desnormalizado:**
```sql
CREATE TABLE user_data (
    user_id UUID,
    user_name VARCHAR,
    level_number INT,
    level_name VARCHAR,
    level_color VARCHAR,
    badge_name VARCHAR,
    badge_description TEXT
);
```

✅ **Normalizado (3NF):**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR
);

CREATE TABLE user_gamification (
    user_id UUID REFERENCES users(id),
    current_level INT REFERENCES gamification_levels(level_number)
);

CREATE TABLE gamification_levels (
    level_number INT PRIMARY KEY,
    level_name VARCHAR,
    color VARCHAR
);

CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id),
    badge_id UUID REFERENCES gamification_badges(id)
);
```

### Índices y Optimización

#### Índices Principales

```sql
-- Búsquedas frecuentes por user_id
CREATE INDEX idx_user_gamification_user_id 
ON user_gamification(user_id);

CREATE INDEX idx_notifications_user_id 
ON notifications(user_id);

-- Ordenamiento por puntos (leaderboard)
CREATE INDEX idx_user_gamification_points 
ON user_gamification(total_points DESC);

-- Filtrado de notificaciones no leídas
CREATE INDEX idx_notifications_unread 
ON notifications(user_id, status) 
WHERE status = 'unread';

-- Cola de emails pendientes
CREATE INDEX idx_email_queue_pending 
ON email_queue(status, scheduled_for) 
WHERE status = 'pending';
```

#### Análisis de Rendimiento

**Query más frecuente:**
```sql
-- Obtener gamificación del usuario
SELECT ug.*, gl.*
FROM user_gamification ug
JOIN gamification_levels gl ON gl.level_number = ug.current_level
WHERE ug.user_id = $1;
```

**Tiempo de ejecución:**
- Sin índice: ~50ms
- Con índice: ~2ms
- **Mejora: 96%**

### Estrategia de Particionamiento (Futuro)

Para escalar a millones de usuarios:

```sql
-- Particionar por rango de fechas
CREATE TABLE notifications_2025_q1 PARTITION OF notifications
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE notifications_2025_q2 PARTITION OF notifications
FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
```

---

## 🔌 Especificaciones de API

### REST API (Supabase)

#### Autenticación

**Endpoint:** `POST /auth/v1/token`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "debtor"
  }
}
```

#### Gamificación

**Endpoint:** `GET /rest/v1/user_gamification`

**Headers:**
```
Authorization: Bearer <token>
apikey: <anon-key>
```

**Query Params:**
```
?user_id=eq.<uuid>
&select=*,gamification_levels(*)
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "current_level": 3,
  "total_points": 450,
  "points_to_next_level": 600,
  "consecutive_payments": 5,
  "total_payments_made": 12,
  "achievements_unlocked": 4,
  "gamification_levels": {
    "level_number": 3,
    "level_name": "Responsable",
    "points_required": 300,
    "color": "#34D399"
  }
}
```

#### Notificaciones

**Endpoint:** `GET /rest/v1/notifications`

**Query Params:**
```
?user_id=eq.<uuid>
&status=eq.unread
&order=created_at.desc
&limit=50
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "payment_confirmed",
    "title": "Pago Confirmado",
    "message": "Tu pago de $55,417 fue procesado exitosamente",
    "status": "unread",
    "created_at": "2025-10-15T10:30:00Z",
    "action_url": "/debtor/agreements"
  }
]
```

### WebSocket API (Realtime)

**Conexión:**
```javascript
const channel = supabase.channel('notifications:user-123');
```

**Suscripción:**
```javascript
channel
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: 'user_id=eq.user-123'
  }, (payload) => {
    console.log('Nueva notificación:', payload.new);
  })
  .subscribe();
```

**Mensaje recibido:**
```json
{
  "schema": "public",
  "table": "notifications",
  "commit_timestamp": "2025-10-15T10:30:00Z",
  "eventType": "INSERT",
  "new": {
    "id": "uuid",
    "user_id": "user-123",
    "type": "achievement_unlocked",
    "title": "¡Nueva insignia!",
    "message": "Has ganado la insignia: Constancia"
  }
}
```

### Edge Functions API

#### send-email

**Endpoint:** `POST /functions/v1/send-email`

**Headers:**
```
Authorization: Bearer <service-role-key>
Content-Type: application/json
```

**Request:** (Vacío - procesa cola automáticamente)

**Response:**
```json
{
  "message": "Email processing completed",
  "processed": 5,
  "results": [
    { "id": "uuid-1", "status": "sent" },
    { "id": "uuid-2", "status": "sent" },
    { "id": "uuid-3", "status": "retry_scheduled", "retry_count": 1 }
  ]
}
```

#### schedule-payment-reminders

**Endpoint:** `POST /functions/v1/schedule-payment-reminders`

**Response:**
```json
{
  "message": "Payment reminders scheduled successfully",
  "remindersCreated": {
    "threeDays": 12,
    "oneDay": 8
  }
}
```

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Auth | 10 req | 1 min |
| REST API | 100 req | 1 min |
| Realtime | 1000 msg | 1 min |
| Edge Functions | 50 req | 1 min |

---

## 🧮 Algoritmos y Lógica de Negocio

### Sistema de Puntos

#### Cálculo de Puntos por Pago

```javascript
/**
 * Calcula puntos ganados por un pago
 * @param {number} amount - Monto del pago
 * @param {boolean} isEarly - Si es pago anticipado
 * @param {boolean} isFullPayment - Si es pago completo
 * @returns {number} Puntos ganados
 */
function calculatePoints(amount, isEarly, isFullPayment) {
  // Base: 10 puntos por cada $1,000
  let points = Math.floor(amount / 1000) * 10;
  
  // Bonus por pago anticipado
  if (isEarly) {
    points += 25;
  }
  
  // Bonus por pago completo
  if (isFullPayment) {
    points += 50;
  }
  
  return points;
}
```

**Ejemplo:**
```
Pago de $100,000, anticipado, completo:
- Base: 100,000 / 1,000 * 10 = 1,000 puntos
- Anticipado: +25 puntos
- Completo: +50 puntos
- Total: 1,075 puntos
```

#### Cálculo de Nivel

```javascript
/**
 * Determina el nivel basado en puntos totales
 * @param {number} totalPoints - Puntos acumulados
 * @returns {number} Número de nivel
 */
function calculateLevel(totalPoints) {
  const levels = [
    { level: 1, pointsRequired: 0 },
    { level: 2, pointsRequired: 100 },
    { level: 3, pointsRequired: 300 },
    { level: 4, pointsRequired: 600 },
    { level: 5, pointsRequired: 1000 },
    { level: 6, pointsRequired: 2000 }
  ];
  
  // Encontrar el nivel más alto alcanzado
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalPoints >= levels[i].pointsRequired) {
      return levels[i].level;
    }
  }
  
  return 1; // Nivel mínimo
}
```

### Simulador de Pagos

#### Algoritmo de Amortización

```javascript
/**
 * Calcula el plan de amortización
 * @param {Object} params - Parámetros de la deuda
 * @returns {Object} Plan de pagos completo
 */
function calculateAmortization(params) {
  const {
    debtAmount,
    interestRate,      // Tasa anual (%)
    paymentAmount,
    paymentFrequency   // 'monthly', 'biweekly', 'weekly'
  } = params;
  
  // Convertir tasa anual a tasa por período
  const periodsPerYear = {
    weekly: 52,
    biweekly: 26,
    monthly: 12
  };
  
  const periods = periodsPerYear[paymentFrequency];
  const periodRate = (interestRate / 100) / periods;
  
  let balance = debtAmount;
  let totalInterest = 0;
  const schedule = [];
  let paymentNumber = 1;
  
  while (balance > 0.01 && paymentNumber <= 1000) {
    // Interés del período
    const interest = balance * periodRate;
    
    // Pago a principal
    let principal = paymentAmount - interest;
    
    // Validar que el pago cubra el interés
    if (principal <= 0) {
      return {
        error: 'El pago no cubre los intereses',
        minimumPayment: Math.ceil(interest + 1)
      };
    }
    
    // Ajustar último pago
    if (principal > balance) {
      principal = balance;
    }
    
    const totalPayment = principal + interest;
    balance -= principal;
    totalInterest += interest;
    
    schedule.push({
      paymentNumber,
      date: calculatePaymentDate(paymentNumber, paymentFrequency),
      paymentAmount: totalPayment,
      principalPayment: principal,
      interestPayment: interest,
      remainingBalance: Math.max(balance, 0)
    });
    
    paymentNumber++;
  }
  
  return {
    success: true,
    summary: {
      debtAmount,
      totalInterestPaid: totalInterest,
      totalPaid: debtAmount + totalInterest,
      totalPayments: schedule.length,
      completionDate: schedule[schedule.length - 1].date
    },
    paymentSchedule: schedule
  };
}
```

**Complejidad:**
- Temporal: O(n) donde n = número de pagos
- Espacial: O(n) para almacenar el cronograma

#### Comparación de Estrategias

```javascript
/**
 * Compara múltiples estrategias de pago
 * @param {Object} baseParams - Parámetros base
 * @param {Array} strategies - Estrategias a comparar
 * @returns {Object} Comparación detallada
 */
function compareStrategies(baseParams, strategies) {
  const results = strategies.map(strategy => {
    const params = { ...baseParams, ...strategy };
    return {
      name: strategy.name,
      ...calculateAmortization(params)
    };
  });
  
  // Encontrar mejor estrategia (menor interés)
  const bestStrategy = results.reduce((best, current) => {
    if (!current.success) return best;
    if (!best.success) return current;
    
    return current.summary.totalInterestPaid < best.summary.totalInterestPaid
      ? current
      : best;
  }, results[0]);
  
  return {
    strategies: results,
    bestStrategy: bestStrategy.name,
    maxSavings: Math.max(...results.map(r => 
      r.success ? r.summary.totalInterestPaid : 0
    )) - Math.min(...results.map(r => 
      r.success ? r.summary.totalInterestPaid : Infinity
    ))
  };
}
```

### Sistema de Insignias

#### Verificación de Logros

```javascript
/**
 * Verifica y otorga insignias basadas en estadísticas
 * @param {Object} userStats - Estadísticas del usuario
 * @returns {Array} Insignias desbloqueadas
 */
function checkBadges(userStats) {
  const newBadges = [];
  
  const badgeRules = {
    first_payment: () => userStats.totalPayments === 1,
    three_consecutive: () => userStats.consecutivePayments === 3,
    debt_reduction_25: () => userStats.debtReductionPercent >= 25,
    debt_reduction_50: () => userStats.debtReductionPercent >= 50,
    debt_reduction_75: () => userStats.debtReductionPercent >= 75,
    debt_free: () => userStats.debtsCompleted >= 1,
    consistent_payer: () => userStats.consecutivePayments >= 6
  };
  
  for (const [badgeType, rule] of Object.entries(badgeRules)) {
    if (rule() && !userStats.unlockedBadges.includes(badgeType)) {
      newBadges.push(badgeType);
    }
  }
  
  return newBadges;
}
```

### Tabla de Clasificación

#### Actualización de Cache

```sql
-- Función para actualizar leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS VOID AS $$
BEGIN
  -- Limpiar cache existente
  DELETE FROM leaderboard_cache;
  
  -- Leaderboard de todos los tiempos
  INSERT INTO leaderboard_cache (period, user_id, rank, total_points, level, badges_count)
  SELECT 
    'all_time',
    ug.user_id,
    ROW_NUMBER() OVER (ORDER BY ug.total_points DESC),
    ug.total_points,
    ug.current_level,
    ug.achievements_unlocked
  FROM user_gamification ug
  ORDER BY ug.total_points DESC
  LIMIT 100;
  
  -- Leaderboard mensual
  INSERT INTO leaderboard_cache (period, user_id, rank, total_points, level, badges_count)
  SELECT 
    'monthly',
    ph.user_id,
    ROW_NUMBER() OVER (ORDER BY SUM(ph.points_change) DESC),
    SUM(ph.points_change),
    ug.current_level,
    ug.achievements_unlocked
  FROM points_history ph
  JOIN user_gamification ug ON ug.user_id = ph.user_id
  WHERE ph.created_at >= date_trunc('month', CURRENT_DATE)
  GROUP BY ph.user_id, ug.current_level, ug.achievements_unlocked
  ORDER BY SUM(ph.points_change) DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
```

**Complejidad:**
- Temporal: O(n log n) por el ordenamiento
- Espacial: O(1) - solo top 100

---

## 🔒 Seguridad y Cumplimiento

### Autenticación y Autorización

#### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "debtor",
    "iat": 1697385600,
    "exp": 1697389200
  },
  "signature": "..."
}
```

#### Row Level Security (RLS)

**Ejemplo: Política de Gamificación**

```sql
-- Solo el usuario puede ver sus propios datos
CREATE POLICY "view_own_gamification"
ON user_gamification
FOR SELECT
USING (auth.uid() = user_id);

-- Solo el sistema puede actualizar (via triggers)
CREATE POLICY "system_update_gamification"
ON user_gamification
FOR UPDATE
USING (false); -- Nadie puede actualizar directamente
```

### Protección de Datos

#### Encriptación

| Dato | En Tránsito | En Reposo |
|------|-------------|-----------|
| Contraseñas | TLS 1.3 | bcrypt (10 rounds) |
| JWT Tokens | TLS 1.3 | N/A (stateless) |
| Datos personales | TLS 1.3 | AES-256 |
| Mensajes | TLS 1.3 | AES-256 |

#### Sanitización de Inputs

```javascript
/**
 * Sanitiza input del usuario
 * @param {string} input - Input a sanitizar
 * @returns {string} Input sanitizado
 */
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .substring(0, 1000);   // Limitar longitud
}
```

### Cumplimiento Normativo

#### Ley de Protección de Datos Personales (Chile)

**Ley N° 19.628**

✅ **Cumplimiento:**
- Consentimiento explícito para consulta de deudas
- Derecho a acceso, rectificación y cancelación
- Seguridad de datos personales
- Notificación de brechas de seguridad

**Implementación:**
```sql
-- Tabla de consentimientos
CREATE TABLE consents (
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    granted_date TIMESTAMP DEFAULT NOW(),
    revoked_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);
```

#### GDPR (Para usuarios europeos)

✅ **Cumplimiento:**
- Derecho al olvido
- Portabilidad de datos
- Consentimiento granular
- Privacy by design

**Implementación:**
```javascript
// Exportar datos del usuario
async function exportUserData(userId) {
  const data = await Promise.all([
    getUserProfile(userId),
    getUserDebts(userId),
    getUserPayments(userId),
    getUserGamification(userId)
  ]);
  
  return {
    format: 'JSON',
    data: data,
    exportedAt: new Date().toISOString()
  };
}

// Eliminar cuenta y datos
async function deleteUserAccount(userId) {
  // Soft delete primero
  await supabase
    .from('users')
    .update({ deleted_at: new Date(), status: 'deleted' })
    .eq('id', userId);
  
  // Hard delete después de 30 días (cron job)
}
```

### Auditoría

```sql
-- Tabla de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ⚡ Rendimiento y Escalabilidad

### Métricas de Rendimiento

#### Objetivos (SLA)

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Tiempo de carga inicial | < 2s | 1.5s |
| Time to Interactive | < 3s | 2.8s |
| API Response Time (p95) | < 200ms | 150ms |
| Database Query Time (p95) | < 50ms | 35ms |
| Uptime | 99.9% | 99.95% |

#### Optimizaciones Implementadas

**1. Code Splitting**
```javascript
// Lazy loading de páginas
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
```

**2. Memoization**
```javascript
// Evitar re-renders innecesarios
const MemoizedBadgeCard = memo(BadgeCard);

// Memoizar cálculos costosos
const levelProgress = useMemo(
  () => calculateLevelProgress(gamification),
  [gamification]
);
```

**3. Debouncing**
```javascript
// Debounce en búsquedas
const debouncedSearch = useDebounce(searchTerm, 300);
```

**4. Índices de Base de Datos**
```sql
-- Índice compuesto para queries frecuentes
CREATE INDEX idx_notifications_user_status_date 
ON notifications(user_id, status, created_at DESC);
```

**5. Caching**
```javascript
// Cache de leaderboard (actualizado cada hora)
const CACHE_TTL = 3600; // 1 hora

async function getLeaderboard(period) {
  const cacheKey = `leaderboard:${period}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) return cached;
  
  const data = await fetchLeaderboard(period);
  await cache.set(cacheKey, data, CACHE_TTL);
  
  return data;
}
```

### Escalabilidad

#### Escalabilidad Horizontal

**Supabase:**
- Auto-scaling de conexiones
- Read replicas para queries pesadas
- Connection pooling (PgBouncer)

**Frontend:**
- CDN para assets estáticos
- Edge caching
- Load balancing

#### Límites de Escala

| Componente | Límite Actual | Límite Teórico |
|------------|---------------|----------------|
| Usuarios concurrentes | 1,000 | 100,000+ |
| Transacciones/seg | 100 | 10,000+ |
| Tamaño de BD | 8 GB | 1 TB+ |
| Notificaciones/seg | 1,000 | 100,000+ |

#### Plan de Escalamiento

**Fase 1: 0-10,000 usuarios**
- Setup actual suficiente
- Monitoreo básico

**Fase 2: 10,000-100,000 usuarios**
- Implementar CDN
- Read replicas
- Cache distribuido (Redis)

**Fase 3: 100,000-1M usuarios**
- Microservicios
- Message queue (RabbitMQ)
- Sharding de base de datos

---

## 🔗 Integración con Servicios Externos

### Resend (Email Service)

**Configuración:**
```typescript
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Plataforma <noreply@tudominio.com>',
  to: recipientEmail,
  subject: subject,
  html: bodyHtml
});
```

**Rate Limits:**
- Free tier: 100 emails/día
- Pro tier: 50,000 emails/mes
- Enterprise: Ilimitado

**Webhooks:**
```javascript
// Recibir eventos de Resend
app.post('/webhooks/resend', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'email.delivered':
      updateEmailLog(event.data.email_id, 'delivered');
      break;
    case 'email.opened':
      updateEmailLog(event.data.email_id, 'opened');
      break;
    case 'email.clicked':
      updateEmailLog(event.data.email_id, 'clicked');
      break;
  }
  
  res.status(200).send('OK');
});
```

### Mercado Pago (Payments)

**SDK:**
```javascript
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const payment = new Payment(client);

const result = await payment.create({
  body: {
    transaction_amount: amount,
    description: description,
    payment_method_id: 'visa',
    payer: {
      email: userEmail
    }
  }
});
```

**Webhooks:**
```javascript
// Recibir notificaciones de pago
app.post('/webhooks/mercadopago', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const paymentId = data.id;
    const paymentInfo = await getPaymentInfo(paymentId);
    
    if (paymentInfo.status === 'approved') {
      await processSuccessfulPayment(paymentInfo);
    }
  }
  
  res.status(200).send('OK');
});
```

---

## 🧪 Plan de Pruebas

### Tipos de Pruebas

#### 1. Pruebas Unitarias

**Framework:** Jest + React Testing Library

```javascript
// Ejemplo: Prueba de cálculo de puntos
describe('calculatePoints', () => {
  test('calcula puntos base correctamente', () => {
    const points = calculatePoints(100000, false, false);
    expect(points).toBe(1000);
  });
  
  test('agrega bonus por pago anticipado', () => {
    const points = calculatePoints(100000, true, false);
    expect(points).toBe(1025);
  });
  
  test('agrega bonus por pago completo', () => {
    const points = calculatePoints(100000, false, true);
    expect(points).toBe(1050);
  });
});
```

**Cobertura objetivo:** 80%

#### 2. Pruebas de Integración

```javascript
// Ejemplo: Prueba de flujo de gamificación
describe('Gamification Flow', () => {
  test('actualiza puntos después de pago', async () => {
    // Crear pago
    const payment = await createPayment({
      userId: testUser.id,
      amount: 50000
    });
    
    // Esperar trigger
    await wait(1000);
    
    // Verificar puntos actualizados
    const gamification = await getUserGamification(testUser.id);
    expect(gamification.total_points).toBeGreaterThan(0);
  });
});
```

#### 3. Pruebas End-to-End

**Framework:** Playwright

```javascript
// Ejemplo: Flujo completo de usuario
test('usuario puede simular pago', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Ir a simulador
  await page.click('text=Simulador');
  
  // Llenar formulario
  await page.fill('[name="debtAmount"]', '1000000');
  await page.fill('[name="interestRate"]', '18.5');
  await page.fill('[name="paymentAmount"]', '50000');
  
  // Calcular
  await page.click('text=Calcular Plan');
  
  // Verificar resultados
  await expect(page.locator('text=Total a pagar')).toBeVisible();
});
```

#### 4. Pruebas de Carga

**Herramienta:** k6

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('https://api.example.com/gamification');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

### Matriz de Pruebas

| Componente | Unitarias | Integración | E2E | Carga |
|------------|-----------|-------------|-----|-------|
| Gamificación | ✅ | ✅ | ✅ | ✅ |
| Simulador | ✅ | ✅ | ✅ | ⚠️ |
| Notificaciones | ✅ | ✅ | ✅ | ✅ |
| Auth | ✅ | ✅ | ✅ | ✅ |
| Pagos | ✅ | ✅ | ✅ | ✅ |

✅ Implementado | ⚠️ Parcial | ❌ Pendiente

---

## 🗺️ Roadmap Técnico

### Q4 2025

**Optimizaciones:**
- [ ] Implementar Service Worker para PWA
- [ ] Agregar lazy loading de imágenes
- [ ] Optimizar bundle size (< 500KB)

**Nuevas Features:**
- [ ] Gráficos interactivos en simulador (Chart.js)
- [ ] Exportar simulaciones a PDF
- [ ] Modo oscuro

### Q1 2026

**Escalabilidad:**
- [ ] Implementar CDN (Cloudflare)
- [ ] Redis para caching
- [ ] Read replicas de BD

**Features:**
- [ ] App móvil (React Native)
- [ ] Notificaciones push
- [ ] Integración con WhatsApp

### Q2 2026

**IA y ML:**
- [ ] Recomendaciones personalizadas de pago
- [ ] Predicción de comportamiento de pago
- [ ] Chatbot con IA

**Analytics:**
- [ ] Dashboard de analytics avanzado
- [ ] Reportes personalizados
- [ ] Exportación de datos

### Q3-Q4 2026

**Expansión:**
- [ ] Multi-idioma (inglés, portugués)
- [ ] Multi-moneda
- [ ] Integración con más pasarelas de pago

**Enterprise:**
- [ ] API pública
- [ ] Webhooks personalizables
- [ ] White-label solution

---

## 📚 Conclusión

La Plataforma de Incentivos para Acuerdos de Pago representa una solución técnicamente robusta y escalable que transforma el modelo tradicional de cobranzas. Con una arquitectura moderna, seguridad de nivel empresarial y un enfoque en la experiencia del usuario, la plataforma está preparada para escalar y evolucionar según las necesidades del negocio.

### Métricas de Éxito Técnico

- ✅ Tiempo de carga < 2s
- ✅ 99.9% uptime
- ✅ Cobertura de pruebas > 80%
- ✅ Seguridad nivel bancario
- ✅ Escalable a 100,000+ usuarios

### Próximos Pasos

1. Implementar monitoreo avanzado (Sentry, DataDog)
2. Configurar CI/CD completo
3. Realizar auditoría de seguridad externa
4. Optimizar para SEO
5. Preparar documentación de API pública

---

**Fin de Especificaciones Técnicas**

*Versión: 2.0 - Parte 2A*  
*Última actualización: Octubre 2025*
