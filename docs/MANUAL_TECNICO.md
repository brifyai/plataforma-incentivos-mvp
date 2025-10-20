# 🔧 Manual Técnico - Plataforma de Incentivos para Acuerdos de Pago

## Información del Documento

- **Versión**: 2.1 - Parte 2B (Actualizado con mejoras de seguridad)
- **Fecha**: Octubre 2025
- **Audiencia**: Desarrolladores, Administradores de Sistema, DevOps

## 🚨 **IMPORTANTE - Cambios Críticos de Seguridad**

Esta versión incluye **correcciones críticas de seguridad** implementadas en Parte 2B:

- ✅ **Protección de rutas por roles** - Acceso controlado según permisos
- ✅ **Sesión real de Supabase** - Autenticación JWT completa
- ✅ **Row Level Security habilitado** - Seguridad a nivel de base de datos
- ✅ **Sistema de logging implementado** - Monitoreo de errores y eventos
- ✅ **Error Boundary mejorado** - Captura automática de errores

**Antes de desplegar, revise la sección [Seguridad](#seguridad) para entender los cambios implementados.**

---

## 📑 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Componentes Frontend](#componentes-frontend)
6. [Servicios Backend](#servicios-backend)
7. [Sistema de Gamificación](#sistema-de-gamificación)
8. [Sistema de Notificaciones](#sistema-de-notificaciones)
9. [Simulador de Pagos](#simulador-de-pagos)
10. [Edge Functions](#edge-functions)
11. [Seguridad](#seguridad)
12. [APIs y Endpoints](#apis-y-endpoints)
13. [Deployment](#deployment)
14. [Monitoreo y Logs](#monitoreo-y-logs)
15. [Mantenimiento](#mantenimiento)

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Vite                        │  │
│  │  - Components (Gamification, Simulator, Notifications)│  │
│  │  - Context API (Auth, Notifications)                 │  │
│  │  - React Router v6                                    │  │
│  │  - Tailwind CSS                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (BaaS)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  - 20+ tablas con RLS                                │  │
│  │  - Triggers y funciones PL/pgSQL                     │  │
│  │  - Índices optimizados                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication                                       │  │
│  │  - JWT tokens                                        │  │
│  │  - Row Level Security                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Realtime                                            │  │
│  │  - WebSocket subscriptions                           │  │
│  │  - Live updates                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno)                               │  │
│  │  - send-email                                        │  │
│  │  - schedule-payment-reminders                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                          │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Resend/      │ Mercado Pago │ Cron-job.org │            │
│  │ SendGrid     │ (Pagos)      │ (Scheduler)  │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

#### 1. Autenticación
```
Usuario → Login Form → Supabase Auth → JWT Token → Context API → Protected Routes
```

#### 2. Gamificación
```
Pago Realizado → Trigger DB → update_gamification_on_payment() 
→ Actualizar puntos → Verificar insignias → Crear notificación
```

#### 3. Notificaciones
```
Evento → Insert en notifications → Realtime Subscription 
→ useNotifications Hook → NotificationCenter Component → UI Update
```

#### 4. Emails
```
Evento → Insert en email_queue → Cron Job → Edge Function send-email 
→ Resend API → Email enviado → Log en email_logs
```

---

## 💻 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.2+ | Framework UI |
| TypeScript | 5.0+ | Type safety |
| Vite | 4.0+ | Build tool |
| React Router | 6.0+ | Routing |
| Tailwind CSS | 3.0+ | Styling |
| Lucide React | Latest | Iconos |
| date-fns | 2.0+ | Manejo de fechas |

### Backend (Supabase)

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Database | PostgreSQL 15 | Base de datos principal |
| Auth | Supabase Auth | Autenticación JWT |
| Storage | Supabase Storage | Archivos (futuro) |
| Realtime | WebSockets | Actualizaciones en tiempo real |
| Edge Functions | Deno | Serverless functions |

### Servicios Externos

| Servicio | Propósito | Alternativas |
|----------|-----------|--------------|
| Resend | Envío de emails | SendGrid, Mailgun |
| Mercado Pago | Procesamiento de pagos | Transbank, Flow |
| Cron-job.org | Tareas programadas | Supabase Cron (pg_cron) |

---

## 📁 Estructura del Proyecto

```
plataforma-incentivos-mvp/
├── public/                          # Archivos estáticos
├── src/
│   ├── assets/                      # Imágenes, iconos
│   ├── components/
│   │   ├── common/                  # Componentes reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── index.js
│   │   ├── layout/                  # Layouts
│   │   │   └── DashboardLayout.jsx
│   │   ├── auth/                    # Componentes de auth
│   │   ├── debtor/                  # Componentes de deudor
│   │   ├── company/                 # Componentes de empresa
│   │   ├── gamification/            # NUEVO: Gamificación
│   │   │   ├── GamificationCard.jsx
│   │   │   ├── BadgeCard.jsx
│   │   │   ├── LeaderboardTable.jsx
│   │   │   └── index.js
│   │   ├── simulator/               # NUEVO: Simulador
│   │   │   ├── PaymentSimulator.jsx
│   │   │   ├── SimulationResults.jsx
│   │   │   └── index.js
│   │   └── notifications/           # NUEVO: Notificaciones
│   │       ├── NotificationCenter.jsx
│   │       └── index.js
│   ├── pages/
│   │   ├── auth/                    # Páginas de autenticación
│   │   ├── debtor/                  # Páginas de deudor
│   │   │   ├── DebtorDashboard.jsx
│   │   │   ├── GamificationPage.jsx  # NUEVO
│   │   │   └── SimulatorPage.jsx     # NUEVO
│   │   └── company/                 # Páginas de empresa
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDebts.js
│   │   ├── useWallet.js
│   │   └── gamification/            # NUEVO
│   │       ├── useGamification.js
│   │       ├── useNotifications.js
│   │       ├── useSimulator.js
│   │       └── index.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── databaseService.js
│   │   ├── paymentService.js
│   │   └── gamification/            # NUEVO
│   │       ├── gamificationService.js
│   │       ├── simulatorService.js
│   │       ├── notificationService.js
│   │       └── index.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── config/
│   │   ├── supabase.js
│   │   └── constants.js
│   ├── routes/
│   │   └── AppRouter.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── functions/                   # NUEVO: Edge Functions
│       ├── send-email/
│       │   └── index.ts
│       └── schedule-payment-reminders/
│           └── index.ts
├── supabase-migrations/             # NUEVO
│   ├── 001_initial_schema.sql
│   └── 002_part2a_features.sql
├── docs/                            # NUEVO: Documentación
│   ├── MANUAL_USUARIO.md
│   ├── GUIA_USO.md
│   ├── MANUAL_TECNICO.md
│   └── ESPECIFICACIONES_TECNICAS.md
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── SETUP_PART2A.md                  # NUEVO
└── README.md
```

---

## 🗄️ Base de Datos

### Esquema de Tablas - Parte 2A

#### Gamificación

**gamification_levels**
```sql
CREATE TABLE gamification_levels (
    id SERIAL PRIMARY KEY,
    level_number INTEGER UNIQUE NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL,
    benefits JSONB DEFAULT '{}'::jsonb,
    icon_url VARCHAR(500),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**gamification_badges**
```sql
CREATE TABLE gamification_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_type badge_type NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    points_reward INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common',
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_gamification**
```sql
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    points_to_next_level INTEGER DEFAULT 100,
    consecutive_payments INTEGER DEFAULT 0,
    total_payments_made INTEGER DEFAULT 0,
    total_agreements_accepted INTEGER DEFAULT 0,
    total_debt_reduced DECIMAL(15, 2) DEFAULT 0.00,
    achievements_unlocked INTEGER DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_badges**
```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    badge_id UUID NOT NULL REFERENCES gamification_badges(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);
```

**points_history**
```sql
CREATE TABLE points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    points_change INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Simulador

**payment_simulations**
```sql
CREATE TABLE payment_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    debt_id UUID REFERENCES debts(id),
    simulation_name VARCHAR(255),
    input_parameters JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Notificaciones

**email_preferences**
```sql
CREATE TABLE email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    payment_reminders BOOLEAN DEFAULT TRUE,
    payment_confirmations BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    monthly_reports BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT TRUE,
    frequency notification_frequency DEFAULT 'realtime',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**email_queue**
```sql
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    email_type email_type NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    status email_status DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**email_logs**
```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    email_type email_type NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status email_status NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**leaderboard_cache**
```sql
CREATE TABLE leaderboard_cache (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    rank INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    level INTEGER NOT NULL,
    badges_count INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, user_id)
);
```

### Triggers y Funciones Importantes

#### update_gamification_on_payment()
```sql
CREATE OR REPLACE FUNCTION update_gamification_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_points_earned INTEGER := 0;
BEGIN
    IF NEW.status = 'completed' THEN
        -- Calcular puntos (10 puntos por cada $1000)
        v_points_earned := FLOOR(NEW.amount / 1000) * 10;
        
        -- Actualizar gamificación
        UPDATE user_gamification
        SET 
            total_points = total_points + v_points_earned,
            total_payments_made = total_payments_made + 1,
            last_payment_date = NEW.transaction_date::date
        WHERE user_id = NEW.user_id;
        
        -- Registrar en historial
        INSERT INTO points_history (
            user_id, points_change, reason, 
            related_entity_type, related_entity_id, balance_after
        ) VALUES (
            NEW.user_id, v_points_earned, 'Pago realizado',
            'payment', NEW.id, 
            (SELECT total_points FROM user_gamification WHERE user_id = NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### award_badge()
```sql
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_type badge_type)
RETURNS VOID AS $$
DECLARE
    v_badge_id UUID;
    v_points_reward INTEGER;
BEGIN
    SELECT id, points_reward INTO v_badge_id, v_points_reward
    FROM gamification_badges
    WHERE badge_type = p_badge_type;
    
    IF NOT EXISTS (
        SELECT 1 FROM user_badges
        WHERE user_id = p_user_id AND badge_id = v_badge_id
    ) THEN
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (p_user_id, v_badge_id);
        
        UPDATE user_gamification
        SET 
            total_points = total_points + v_points_reward,
            achievements_unlocked = achievements_unlocked + 1
        WHERE user_id = p_user_id;
        
        -- Crear notificación
        INSERT INTO notifications (user_id, type, title, message)
        SELECT p_user_id, 'achievement_unlocked', 
               '¡Nueva insignia!', 'Has ganado: ' || name
        FROM gamification_badges WHERE id = v_badge_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Índices Importantes

```sql
-- Gamificación
CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_user_gamification_points ON user_gamification(total_points DESC);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);

-- Notificaciones
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_unread ON notifications(user_id, status) 
    WHERE status = 'unread';
CREATE INDEX idx_email_queue_pending ON email_queue(status, scheduled_for) 
    WHERE status = 'pending';

-- Leaderboard
CREATE INDEX idx_leaderboard_period_rank ON leaderboard_cache(period, rank);
```

---

## ⚛️ Componentes Frontend

### Arquitectura de Componentes

```
App.jsx
├── AuthProvider
│   └── NotificationProvider
│       └── AppRouter
│           ├── Public Routes
│           │   ├── LoginPage
│           │   └── RegisterPage
│           └── Protected Routes
│               ├── DebtorRoutes
│               │   ├── DebtorDashboard
│               │   ├── GamificationPage
│               │   └── SimulatorPage
│               └── CompanyRoutes
│                   └── CompanyDashboard
```

### Componentes Clave - Parte 2A

#### GamificationCard
```jsx
// Muestra nivel, puntos y progreso del usuario
<GamificationCard 
  gamification={gamificationData}
  levelProgress={progressData}
/>
```

**Props:**
- `gamification`: Objeto con datos de gamificación del usuario
- `levelProgress`: Objeto con porcentaje y puntos necesarios

**Estado interno:**
- Ninguno (componente presentacional)

**Hooks utilizados:**
- Ninguno

#### BadgeCard
```jsx
// Muestra una insignia individual
<BadgeCard
  badge={badgeData}
  unlocked={true}
  unlockedAt="2025-10-15T10:30:00Z"
/>
```

**Props:**
- `badge`: Datos de la insignia
- `unlocked`: Boolean si está desbloqueada
- `unlockedAt`: Fecha de desbloqueo

#### NotificationCenter
```jsx
// Centro de notificaciones desplegable
<NotificationCenter
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
/>
```

**Props:**
- `isOpen`: Boolean para mostrar/ocultar
- `onClose`: Callback al cerrar

**Hooks utilizados:**
- `useNotifications()`: Gestión de notificaciones

#### PaymentSimulator
```jsx
// Simulador interactivo de pagos
<PaymentSimulator debt={debtData} />
```

**Props:**
- `debt`: (Opcional) Datos de deuda para pre-llenar

**Hooks utilizados:**
- `useSimulator()`: Cálculos de simulación
- `useAuth()`: Usuario actual

### Custom Hooks

#### useGamification
```javascript
const {
  gamification,      // Datos de gamificación
  badges,            // Insignias del usuario
  pointsHistory,     // Historial de puntos
  levelProgress,     // Progreso al siguiente nivel
  loading,           // Estado de carga
  error,             // Errores
  refresh            // Función para recargar
} = useGamification();
```

**Funcionalidad:**
- Carga datos de gamificación del usuario
- Suscripción a actualizaciones en tiempo real
- Calcula progreso de nivel automáticamente

#### useNotifications
```javascript
const {
  notifications,         // Array de notificaciones
  unreadCount,          // Contador de no leídas
  loading,              // Estado de carga
  markAsRead,           // Marcar como leída
  markAllAsRead,        // Marcar todas
  archiveNotification,  // Archivar
  deleteNotification,   // Eliminar
  refresh               // Recargar
} = useNotifications();
```

**Funcionalidad:**
- Gestión completa de notificaciones
- Suscripción a nuevas notificaciones en tiempo real
- Actualización automática del contador

#### useSimulator
```javascript
const {
  simulation,                    // Resultado de simulación
  loading,                       // Estado de carga
  error,                         // Errores
  calculatePlan,                 // Calcular plan de pagos
  compareStrategies,             // Comparar estrategias
  calculateExtraPaymentImpact,   // Impacto de pagos extra
  saveSimulation,                // Guardar simulación
  clearSimulation                // Limpiar resultados
} = useSimulator();
```

**Funcionalidad:**
- Cálculos de amortización
- Comparación de escenarios
- Persistencia de simulaciones

---

## 🔧 Servicios Backend

### gamificationService.js

**Funciones principales:**

```javascript
// Obtener datos de gamificación del usuario
getUserGamification(userId)

// Obtener todas las insignias disponibles
getAllBadges()

// Obtener insignias del usuario
getUserBadges(userId)

// Obtener historial de puntos
getPointsHistory(userId, limit)

// Obtener todos los niveles
getAllLevels()

// Obtener tabla de clasificación
getLeaderboard(period, limit)

// Obtener posición del usuario
getUserLeaderboardPosition(userId, period)

// Calcular progreso de nivel
calculateLevelProgress(gamificationData)

// Suscribirse a actualizaciones
subscribeToGamificationUpdates(userId, callback)

// Suscribirse a nuevas insignias
subscribeToBadgeUnlocks(userId, callback)
```

### simulatorService.js

**Funciones principales:**

```javascript
// Calcular plan de pagos
calculatePaymentPlan(params)
// params: { debtAmount, interestRate, paymentAmount, paymentFrequency }

// Comparar estrategias
comparePaymentStrategies(baseParams, strategies)

// Calcular impacto de pagos extra
calculateExtraPaymentImpact(params)

// Guardar simulación
saveSimulation(userId, simulation)

// Obtener simulaciones guardadas
getUserSimulations(userId)

// Eliminar simulación
deleteSimulation(simulationId)

// Calcular pago mínimo
calculateMinimumPayment(debtAmount, interestRate, frequency)

// Generar datos para gráficos
generateAmortizationChartData(paymentSchedule)
```

**Algoritmo de Cálculo:**

```javascript
// Fórmula de amortización
while (remainingBalance > 0) {
  interestForPeriod = remainingBalance * periodInterestRate;
  principalPayment = paymentAmount - interestForPeriod;
  
  if (principalPayment <= 0) {
    return { error: 'Pago insuficiente' };
  }
  
  remainingBalance -= principalPayment;
  totalInterestPaid += interestForPeriod;
  
  paymentSchedule.push({
    paymentNumber,
    date,
    paymentAmount,
    principalPayment,
    interestPayment: interestForPeriod,
    remainingBalance
  });
}
```

### notificationService.js

**Funciones principales:**

```javascript
// Obtener notificaciones del usuario
getUserNotifications(userId, options)

// Obtener contador de no leídas
getUnreadCount(userId)

// Marcar como leída
markAsRead(notificationId)

// Marcar todas como leídas
markAllAsRead(userId)

// Archivar notificación
archiveNotification(notificationId)

// Eliminar notificación
deleteNotification(notificationId)

// Crear notificación
createNotification(notification)

// Suscribirse a notificaciones
subscribeToNotifications(userId, callback)

// Obtener preferencias de email
getEmailPreferences(userId)

// Actualizar preferencias de email
updateEmailPreferences(userId, preferences)

// Programar email
scheduleEmail(emailData)

// Obtener historial de emails
getEmailHistory(userId, limit)

// Generar template de email
generateEmailTemplate(type, data)
```

**Templates de Email:**

```javascript
const templates = {
  payment_reminder_3days: (data) => `HTML template`,
  payment_confirmation: (data) => `HTML template`,
  achievement_unlocked: (data) => `HTML template`,
  weekly_report: (data) => `HTML template`
};
```

---

## 🚀 Edge Functions

### send-email

**Ubicación:** `supabase/functions/send-email/index.ts`

**Propósito:** Procesar la cola de emails y enviarlos

**Flujo:**
1. Obtener emails pendientes de `email_queue`
2. Para cada email:
   - Enviar usando Resend/SendGrid
   - Actualizar estado en `email_queue`
   - Registrar en `email_logs`
   - Manejar reintentos si falla

**Invocación:**
```bash
# Manual
curl -X POST https://tu-proyecto.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer tu-service-role-key"

# Automática (cron)
Cada 5 minutos
```

**Variables de entorno requeridas:**
- `RESEND_API_KEY` o `SENDGRID_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### schedule-payment-reminders

**Ubicación:** `supabase/functions/schedule-payment-reminders/index.ts`

**Propósito:** Crear recordatorios de pago automáticos

**Flujo:**
1. Obtener acuerdos activos
2. Para cada acuerdo:
   - Buscar próximo pago pendiente
   - Si vence en 3 días: crear recordatorio
   - Si vence en 1 día: crear recordatorio urgente
3. Crear notificación in-app
4. Programar email en `email_queue`

**Invocación:**
```bash
# Cron diario a las 9 AM
0 9 * * *
```

**Lógica de recordatorios:**
```typescript
const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

if (dueDate.toDateString() === threeDaysFromNow.toDateString()) {
  createPaymentReminder(user, payment, 'payment_reminder_3days');
}

if (dueDate.toDateString() === oneDayFromNow.toDateString()) {
  createPaymentReminder(user, payment, 'payment_reminder_1day');
}
```

---

## 🔒 Seguridad

### ✅ **Cambios de Seguridad Implementados - Parte 2B**

#### **1. Protección de Rutas por Roles**
- **Implementado:** `ProtectedRoute` component con validación de roles
- **Ubicación:** `src/routes/AppRouter.jsx`
- **Funcionalidad:** Bloquea acceso a rutas según rol del usuario (debtor/company/admin)
- **Ejemplo:**
```jsx
<ProtectedRoute
  path="/debtor/offers"
  element={<OffersPage />}
  allowedRoles={['debtor']}
/>
```

#### **2. Sesión Real de Supabase**
- **Implementado:** Autenticación completa con JWT tokens
- **Ubicación:** `src/context/AuthContext.jsx`
- **Funcionalidad:** Sesiones persistentes, refresh tokens, logout seguro
- **Beneficios:** Seguridad real vs simulación anterior

#### **3. Row Level Security (RLS) Habilitado**
- **Implementado:** RLS activado en todas las tablas críticas
- **Ubicación:** `supabase-schema.sql`
- **Tablas protegidas:** users, debts, offers, agreements, payments, notifications
- **Políticas:** Usuarios solo acceden a sus propios datos

#### **4. Sistema de Logging y Monitoreo**
- **Implementado:** Servicio de logging centralizado
- **Ubicación:** `src/services/loggerService.js`
- **Funcionalidad:**
  - Logging de errores con contexto
  - Tracking de eventos de usuario
  - Compatible con Sentry/LogRocket
  - Error Boundary integrado

#### **5. Error Boundary Mejorado**
- **Implementado:** Captura y logging automático de errores
- **Ubicación:** `src/components/common/ErrorBoundary.jsx`
- **Funcionalidad:** UI de error amigable + logging automático

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

```sql
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propios datos
CREATE POLICY "Users can view their own gamification data"
ON user_gamification
FOR SELECT
USING (auth.uid() = user_id);
```

### Políticas Importantes

**Gamificación:**
```sql
-- Ver datos propios
CREATE POLICY "view_own_gamification" ON user_gamification
FOR SELECT USING (auth.uid() = user_id);

-- Ver insignias propias
CREATE POLICY "view_own_badges" ON user_badges
FOR SELECT USING (auth.uid() = user_id);

-- Leaderboard público (solo lectura)
CREATE POLICY "view_leaderboard" ON leaderboard_cache
FOR SELECT USING (true);
```

**Notificaciones:**
```sql
-- Ver notificaciones propias
CREATE POLICY "view_own_notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- Actualizar notificaciones propias
CREATE POLICY "update_own_notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);
```

**Simulaciones:**
```sql
-- CRUD completo de simulaciones propias
CREATE POLICY "manage_own_simulations" ON payment_simulations
FOR ALL USING (auth.uid() = user_id);
```

### Validación de Datos

**Frontend:**
```javascript
// Validación de RUT
export const validateRut = (rut) => {
  const cleanRut = rut.replace(/[.-]/g, '');
  // Algoritmo de validación de RUT chileno
  // ...
};

// Validación de email
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**Backend (Triggers):**
```sql
-- Validar que los puntos no sean negativos
CREATE OR REPLACE FUNCTION validate_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_points < 0 THEN
        RAISE EXCEPTION 'Los puntos no pueden ser negativos';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Autenticación JWT

**Flujo:**
1. Usuario hace login
2. Supabase genera JWT token
3. Token se almacena en localStorage
4. Cada request incluye: `Authorization: Bearer <token>`
5. Supabase valida token y aplica RLS

**Expiración:**
- Access token: 1 hora
- Refresh token: 30 días

---

## 📡 APIs y Endpoints

### Supabase Client

**Configuración:**
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

### Endpoints Principales

#### Gamificación

```javascript
// GET - Obtener gamificación del usuario
const { data, error } = await supabase
  .from('user_gamification')
  .select('*, gamification_levels(*)')
  .eq('user_id', userId)
  .single();

// GET - Obtener insignias del usuario
const { data, error } = await supabase
  .from('user_badges')
  .select('*, gamification_badges(*)')
  .eq('user_id', userId);

// GET - Obtener leaderboard
const { data, error } = await supabase
  .from('leaderboard_cache')
  .select('*, users(full_name)')
  .eq('period', 'all_time')
  .order('rank', { ascending: true })
  .limit(100);
```

#### Notificaciones

```javascript
// GET - Obtener notificaciones
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);

// PATCH - Marcar como leída
const { data, error } = await supabase
  .from('notifications')
  .update({ status: 'read', read_at: new Date().toISOString() })
  .eq('id', notificationId);

// DELETE - Eliminar notificación
const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', notificationId);
```

#### Simulador

```javascript
// POST - Guardar simulación
const { data, error } = await supabase
  .from('payment_simulations')
  .insert({
    user_id: userId,
    simulation_name: name,
    input_parameters: params,
    results: results
  });

// GET - Obtener simulaciones
const { data, error } = await supabase
  .from('payment_simulations')
  .select('*, debts(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Realtime Subscriptions

```javascript
// Suscribirse a cambios en gamificación
const subscription = supabase
  .channel(`gamification:${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_gamification',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Gamification updated:', payload);
      // Actualizar UI
    }
  )
  .subscribe();

// Desuscribirse
subscription.unsubscribe();
```

---

## 🚢 Deployment

### Preparación

1. **Build de producción:**
```bash
npm run build
```

2. **Verificar variables de entorno:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_APP_URL=https://tu-dominio.com
```

### Opciones de Deployment

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en dashboard
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Edge Functions Deployment

```bash
# Deploy todas las funciones
supabase functions deploy

# Deploy función específica
supabase functions deploy send-email

# Ver logs
supabase functions logs send-email
```

### Configurar Cron Jobs

**Opción 1: Supabase pg_cron**
```sql
SELECT cron.schedule(
  'payment-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/schedule-payment-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**Opción 2: Cron-job.org**
1. Crear cuenta en cron-job.org
2. Crear nuevo cron job:
   - URL: `https://tu-proyecto.supabase.co/functions/v1/schedule-payment-reminders`
   - Método: POST
   - Headers: `Authorization: Bearer tu-service-role-key`
   - Frecuencia: Diaria a las 9 AM

---

## 📊 Monitoreo y Logs

### Supabase Dashboard

**Métricas disponibles:**
- Database size
- API requests
- Active connections
- Query performance

**Logs:**
```bash
# Ver logs de Edge Functions
supabase functions logs send-email --tail

# Ver logs de base de datos
# Disponible en Dashboard > Logs
```

### Application Monitoring

#### **✅ Servicio de Logging Implementado**

**Ubicación:** `src/services/loggerService.js`

**Funcionalidades:**
```javascript
import logger, { logError, logEvent, logPerformance } from '../services/loggerService';

// Logging de errores
logger.error('Error en componente', error, { component: 'DebtsPage' });

// Tracking de eventos
logger.event('user_login', { userId: '123', role: 'debtor' });

// Logging de performance
logger.performance('api_call_duration', 150, { endpoint: '/api/debts' });
```

**Configuración de Variables de Entorno:**
```env
VITE_LOGGING_SERVICE_URL=https://tu-logging-service.com/api/logs
VITE_LOGGING_API_KEY=tu-api-key
```

**Integración con Servicios Externos:**
- **Sentry:** Compatible con Sentry para error tracking
- **LogRocket:** Compatible con LogRocket para session replay
- **Custom API:** Endpoint configurable para logging personalizado

**Sentry (Recomendado):**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "tu-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Custom Logging (Legacy):**
```javascript
// services/logger.js
export const logError = (error, context) => {
  console.error('[ERROR]', context, error);
  // Enviar a servicio de logging
};

export const logEvent = (event, data) => {
  console.log('[EVENT]', event, data);
  // Analytics
};
```

### Performance Monitoring

**Métricas clave:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

**Herramientas:**
- Lighthouse
- Web Vitals
- Vercel Analytics

---

## 🔧 Mantenimiento

### Tareas Regulares

**Diarias:**
- Verificar logs de Edge Functions
- Monitorear cola de emails
- Revisar errores en Sentry

**Semanales:**
- Actualizar cache de leaderboard manualmente si es necesario
- Revisar métricas de uso
- Backup de base de datos

**Mensuales:**
- Actualizar dependencias
- Revisar y optimizar queries lentas
- Limpiar datos antiguos

### Limpieza de Datos

```sql
-- Limpiar notificaciones antiguas (más de 90 días)
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '90 days'
AND status = 'archived';

-- Limpiar emails enviados antiguos (más de 180 días)
DELETE FROM email_logs
WHERE created_at < NOW() - INTERVAL '180 days';

-- Limpiar simulaciones antiguas sin nombre (más de 30 días)
DELETE FROM payment_simulations
WHERE created_at < NOW() - INTERVAL '30 days'
AND simulation_name IS NULL;
```

### Optimización de Base de Datos

```sql
-- Analizar tablas
ANALYZE user_gamification;
ANALYZE notifications;
ANALYZE email_queue;

-- Vacuum
VACUUM ANALYZE;

-- Reindexar si es necesario
REINDEX TABLE user_gamification;
```

### Actualización de Dependencias

```bash
# Verificar actualizaciones
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar dependencias mayores (con cuidado)
npm install react@latest react-dom@latest

# Verificar que todo funciona
npm run build
npm run preview
```

### Troubleshooting Común

**Problema: Edge Function no responde**
```bash
# Ver logs
supabase functions logs send-email

# Verificar secrets
supabase secrets list

# Re-deploy
supabase functions deploy send-email
```

**Problema: Notificaciones no llegan**
```sql
-- Verificar cola de emails
SELECT * FROM email_queue WHERE status = 'pending';

-- Verificar logs de errores
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

**Problema: Leaderboard desactualizado**
```sql
-- Actualizar manualmente
SELECT update_leaderboard_cache();
```

---

## 📚 Referencias

### Documentación Oficial

- [React](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/)
- [Resend](https://resend.com/docs)

### Recursos Adicionales

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 🔍 **Auditoría de Seguridad Externa - Recomendación**

Para garantizar la máxima seguridad antes del despliegue a producción, se recomienda realizar una **auditoría de seguridad externa** por parte de especialistas certificados.

### **Proveedores Recomendados:**
- **OWASP ZAP** - Escaneo automatizado de vulnerabilidades web
- **Burp Suite** - Testing manual de seguridad
- **Snyk** - Análisis de dependencias y vulnerabilidades
- **Auditorías especializadas** - Firmas de ciberseguridad chilenas

### **Aspectos a Revisar:**
- ✅ Autenticación y autorización
- ✅ Validación de datos de entrada
- ✅ Protección contra XSS/CSRF
- ✅ Configuración de CORS
- ✅ Exposición de información sensible
- ✅ Manejo seguro de JWT tokens

### **Checklist de Seguridad Pre-Despliegue:**
- [ ] Variables de entorno configuradas correctamente
- [ ] RLS habilitado en todas las tablas
- [ ] Logging configurado y funcionando
- [ ] HTTPS obligatorio
- [ ] Headers de seguridad implementados
- [ ] Rate limiting configurado
- [ ] Backup de base de datos funcionando

---

**Fin del Manual Técnico**

*Versión: 2.1 - Parte 2B (Con mejoras de seguridad implementadas)*
*Última actualización: Octubre 2025*
