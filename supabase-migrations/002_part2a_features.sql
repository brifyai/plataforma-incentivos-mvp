-- =============================================
-- PLATAFORMA DE INCENTIVOS - PARTE 2A
-- Migración: Nuevas Funcionalidades Internas
-- =============================================
-- Este script agrega las tablas y funcionalidades para:
-- 1. Sistema de Gamificación
-- 2. Simulador de Pagos
-- 3. Sistema de Notificaciones Mejorado
-- 4. Sistema de Emails
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS ADICIONALES
-- =============================================

-- Tipo de logro/insignia
CREATE TYPE badge_type AS ENUM (
    'first_payment',           -- Primer pago realizado
    'three_consecutive',       -- 3 pagos consecutivos
    'debt_reduction_25',       -- 25% de reducción de deuda
    'debt_reduction_50',       -- 50% de reducción de deuda
    'debt_reduction_75',       -- 75% de reducción de deuda
    'debt_free',              -- Deuda completamente pagada
    'early_payment',          -- Pago anticipado
    'full_payment',           -- Pago completo de una deuda
    'five_agreements',        -- 5 acuerdos aceptados
    'ten_agreements',         -- 10 acuerdos aceptados
    'wallet_master',          -- Acumuló $50,000 en incentivos
    'negotiator',             -- Negoció exitosamente
    'consistent_payer'        -- 6 meses de pagos consistentes
);

-- Estado de email
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'bounced');

-- Tipo de email
CREATE TYPE email_type AS ENUM (
    'payment_reminder_3days',
    'payment_reminder_1day',
    'payment_confirmation',
    'achievement_unlocked',
    'weekly_report',
    'monthly_report',
    'level_up',
    'new_offer'
);

-- Frecuencia de notificaciones
CREATE TYPE notification_frequency AS ENUM ('realtime', 'daily_digest', 'weekly_digest', 'disabled');

-- =============================================
-- TABLA: gamification_levels
-- Niveles del sistema de gamificación
-- =============================================
CREATE TABLE public.gamification_levels (
    id SERIAL PRIMARY KEY,
    level_number INTEGER NOT NULL UNIQUE,
    level_name VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL,
    benefits JSONB DEFAULT '{}'::jsonb, -- Beneficios del nivel (descuentos adicionales, etc.)
    icon_url VARCHAR(500),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar niveles predefinidos
INSERT INTO public.gamification_levels (level_number, level_name, points_required, benefits, color) VALUES
(1, 'Principiante', 0, '{"description": "Bienvenido a la plataforma"}', '#94A3B8'),
(2, 'Comprometido', 100, '{"description": "Has dado tus primeros pasos", "bonus_incentive": 0.5}', '#60A5FA'),
(3, 'Responsable', 300, '{"description": "Demuestras compromiso constante", "bonus_incentive": 1.0}', '#34D399'),
(4, 'Ejemplar', 600, '{"description": "Eres un ejemplo a seguir", "bonus_incentive": 1.5}', '#FBBF24'),
(5, 'Maestro', 1000, '{"description": "Has alcanzado la maestría financiera", "bonus_incentive": 2.0}', '#F59E0B'),
(6, 'Leyenda', 2000, '{"description": "Eres una leyenda de la plataforma", "bonus_incentive": 3.0}', '#8B5CF6');

-- =============================================
-- TABLA: gamification_badges
-- Definición de insignias/logros
-- =============================================
CREATE TABLE public.gamification_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_type badge_type NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    points_reward INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar insignias predefinidas
INSERT INTO public.gamification_badges (badge_type, name, description, points_reward, rarity, color) VALUES
('first_payment', 'Primer Paso', 'Realizaste tu primer pago', 50, 'common', '#60A5FA'),
('three_consecutive', 'Constancia', 'Tres pagos consecutivos sin fallar', 100, 'rare', '#34D399'),
('debt_reduction_25', 'Cuarto del Camino', 'Redujiste tu deuda en un 25%', 75, 'common', '#FBBF24'),
('debt_reduction_50', 'A Mitad de Camino', 'Redujiste tu deuda en un 50%', 150, 'rare', '#F59E0B'),
('debt_reduction_75', 'Casi Libre', 'Redujiste tu deuda en un 75%', 200, 'epic', '#8B5CF6'),
('debt_free', 'Libertad Financiera', 'Pagaste completamente una deuda', 300, 'legendary', '#EC4899'),
('early_payment', 'Adelantado', 'Realizaste un pago antes de la fecha', 50, 'common', '#10B981'),
('full_payment', 'Pago Completo', 'Pagaste el monto total de una vez', 100, 'rare', '#3B82F6'),
('five_agreements', 'Negociador', 'Aceptaste 5 acuerdos', 100, 'rare', '#6366F1'),
('ten_agreements', 'Experto Negociador', 'Aceptaste 10 acuerdos', 200, 'epic', '#8B5CF6'),
('wallet_master', 'Maestro del Ahorro', 'Acumulaste $50,000 en incentivos', 150, 'epic', '#F59E0B'),
('negotiator', 'Diplomático', 'Negociaste exitosamente con una empresa', 75, 'rare', '#14B8A6'),
('consistent_payer', 'Pagador Consistente', '6 meses de pagos sin fallar', 250, 'legendary', '#EC4899');

-- =============================================
-- TABLA: user_gamification
-- Datos de gamificación por usuario
-- =============================================
CREATE TABLE public.user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    current_level INTEGER DEFAULT 1 REFERENCES public.gamification_levels(level_number),
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

CREATE INDEX idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX idx_user_gamification_level ON public.user_gamification(current_level);
CREATE INDEX idx_user_gamification_points ON public.user_gamification(total_points DESC);

-- =============================================
-- TABLA: user_badges
-- Insignias desbloqueadas por usuarios
-- =============================================
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_unlocked_at ON public.user_badges(unlocked_at DESC);

-- =============================================
-- TABLA: points_history
-- Historial de puntos ganados/perdidos
-- =============================================
CREATE TABLE public.points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL, -- Positivo para ganancia, negativo para pérdida
    reason VARCHAR(255) NOT NULL,
    related_entity_type VARCHAR(50), -- 'payment', 'badge', 'agreement', etc.
    related_entity_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX idx_points_history_created_at ON public.points_history(created_at DESC);

-- =============================================
-- TABLA: payment_simulations
-- Simulaciones de pago guardadas por usuarios
-- =============================================
CREATE TABLE public.payment_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
    simulation_name VARCHAR(255),
    input_parameters JSONB NOT NULL, -- {debt_amount, interest_rate, payment_amount, frequency, etc.}
    results JSONB NOT NULL, -- {total_interest_saved, months_to_freedom, payment_schedule, etc.}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_simulations_user_id ON public.payment_simulations(user_id);
CREATE INDEX idx_payment_simulations_debt_id ON public.payment_simulations(debt_id);

-- =============================================
-- TABLA: email_preferences
-- Preferencias de email por usuario
-- =============================================
CREATE TABLE public.email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
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

CREATE INDEX idx_email_preferences_user_id ON public.email_preferences(user_id);

-- =============================================
-- TABLA: email_queue
-- Cola de emails pendientes de envío
-- =============================================
CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON public.email_queue(scheduled_for);
CREATE INDEX idx_email_queue_user_id ON public.email_queue(user_id);

-- =============================================
-- TABLA: email_logs
-- Registro de todos los emails enviados
-- =============================================
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- =============================================
-- TABLA: leaderboard_cache
-- Cache de tabla de clasificación para rendimiento
-- =============================================
CREATE TABLE public.leaderboard_cache (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'all_time'
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    level INTEGER NOT NULL,
    badges_count INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, user_id)
);

CREATE INDEX idx_leaderboard_cache_period_rank ON public.leaderboard_cache(period, rank);
CREATE INDEX idx_leaderboard_cache_updated_at ON public.leaderboard_cache(updated_at);

-- =============================================
-- FUNCIONES Y TRIGGERS ADICIONALES
-- =============================================

-- Función para actualizar gamificación al crear un pago
CREATE OR REPLACE FUNCTION update_gamification_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_user_gamification RECORD;
    v_points_earned INTEGER := 0;
    v_new_level INTEGER;
    v_is_early BOOLEAN := FALSE;
    v_is_consecutive BOOLEAN := FALSE;
BEGIN
    -- Solo procesar si el pago fue exitoso
    IF NEW.status = 'completed' THEN
        -- Obtener datos actuales de gamificación
        SELECT * INTO v_user_gamification
        FROM public.user_gamification
        WHERE user_id = NEW.user_id;
        
        -- Si no existe registro, crear uno
        IF NOT FOUND THEN
            INSERT INTO public.user_gamification (user_id)
            VALUES (NEW.user_id)
            RETURNING * INTO v_user_gamification;
        END IF;
        
        -- Calcular puntos base (10 puntos por cada $1000 pagados)
        v_points_earned := FLOOR(NEW.amount / 1000) * 10;
        
        -- Bonus por pago completo (si es la última cuota)
        IF NEW.installment_number IS NOT NULL THEN
            DECLARE
                v_total_installments INTEGER;
            BEGIN
                SELECT jsonb_array_length(payment_plan) INTO v_total_installments
                FROM public.agreements
                WHERE id = NEW.agreement_id;
                
                IF NEW.installment_number = v_total_installments THEN
                    v_points_earned := v_points_earned + 50;
                END IF;
            END;
        END IF;
        
        -- Verificar si es pago anticipado
        -- (lógica simplificada - en producción comparar con fecha de vencimiento)
        v_is_early := TRUE; -- Placeholder
        IF v_is_early THEN
            v_points_earned := v_points_earned + 25;
        END IF;
        
        -- Verificar pagos consecutivos
        IF v_user_gamification.last_payment_date IS NOT NULL THEN
            IF NEW.transaction_date::date - v_user_gamification.last_payment_date <= 35 THEN
                v_is_consecutive := TRUE;
            END IF;
        END IF;
        
        -- Actualizar estadísticas de gamificación
        UPDATE public.user_gamification
        SET 
            total_points = total_points + v_points_earned,
            total_payments_made = total_payments_made + 1,
            consecutive_payments = CASE 
                WHEN v_is_consecutive THEN consecutive_payments + 1 
                ELSE 1 
            END,
            last_payment_date = NEW.transaction_date::date,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Registrar en historial de puntos
        INSERT INTO public.points_history (
            user_id, 
            points_change, 
            reason, 
            related_entity_type, 
            related_entity_id,
            balance_after
        ) VALUES (
            NEW.user_id,
            v_points_earned,
            'Pago realizado',
            'payment',
            NEW.id,
            v_user_gamification.total_points + v_points_earned
        );
        
        -- Verificar si subió de nivel
        SELECT level_number INTO v_new_level
        FROM public.gamification_levels
        WHERE points_required <= (v_user_gamification.total_points + v_points_earned)
        ORDER BY points_required DESC
        LIMIT 1;
        
        IF v_new_level > v_user_gamification.current_level THEN
            UPDATE public.user_gamification
            SET current_level = v_new_level
            WHERE user_id = NEW.user_id;
            
            -- Crear notificación de subida de nivel
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                related_entity_id,
                related_entity_type
            ) VALUES (
                NEW.user_id,
                'achievement_unlocked',
                '¡Subiste de nivel!',
                'Has alcanzado el nivel ' || v_new_level || '. ¡Felicitaciones!',
                NEW.user_id,
                'level_up'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gamification_on_payment
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_on_payment();

-- Función para verificar y otorgar insignias
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_badge_record RECORD;
    v_user_stats RECORD;
BEGIN
    -- Obtener estadísticas del usuario
    SELECT * INTO v_user_stats
    FROM public.user_gamification
    WHERE user_id = NEW.user_id;
    
    -- Verificar insignia de primer pago
    IF v_user_stats.total_payments_made = 1 THEN
        PERFORM award_badge(NEW.user_id, 'first_payment');
    END IF;
    
    -- Verificar insignia de 3 pagos consecutivos
    IF v_user_stats.consecutive_payments = 3 THEN
        PERFORM award_badge(NEW.user_id, 'three_consecutive');
    END IF;
    
    -- Verificar insignia de 6 meses consistente
    IF v_user_stats.consecutive_payments >= 6 THEN
        PERFORM award_badge(NEW.user_id, 'consistent_payer');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_badges_on_gamification_update
    AFTER UPDATE ON public.user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- Función auxiliar para otorgar insignia
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_type badge_type)
RETURNS VOID AS $$
DECLARE
    v_badge_id UUID;
    v_points_reward INTEGER;
BEGIN
    -- Obtener ID y puntos de la insignia
    SELECT id, points_reward INTO v_badge_id, v_points_reward
    FROM public.gamification_badges
    WHERE badge_type = p_badge_type;
    
    -- Verificar si el usuario ya tiene esta insignia
    IF NOT EXISTS (
        SELECT 1 FROM public.user_badges
        WHERE user_id = p_user_id AND badge_id = v_badge_id
    ) THEN
        -- Otorgar insignia
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (p_user_id, v_badge_id);
        
        -- Otorgar puntos
        UPDATE public.user_gamification
        SET 
            total_points = total_points + v_points_reward,
            achievements_unlocked = achievements_unlocked + 1
        WHERE user_id = p_user_id;
        
        -- Registrar en historial
        INSERT INTO public.points_history (
            user_id,
            points_change,
            reason,
            related_entity_type,
            related_entity_id,
            balance_after
        ) SELECT
            p_user_id,
            v_points_reward,
            'Insignia desbloqueada: ' || gb.name,
            'badge',
            v_badge_id,
            ug.total_points
        FROM public.user_gamification ug, public.gamification_badges gb
        WHERE ug.user_id = p_user_id AND gb.id = v_badge_id;
        
        -- Crear notificación
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            related_entity_id,
            related_entity_type
        ) SELECT
            p_user_id,
            'achievement_unlocked',
            '¡Nueva insignia desbloqueada!',
            'Has ganado la insignia: ' || name,
            v_badge_id,
            'badge'
        FROM public.gamification_badges
        WHERE id = v_badge_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para crear preferencias de email por defecto
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_email_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_email_preferences();

-- Función para crear registro de gamificación por defecto
CREATE OR REPLACE FUNCTION create_default_gamification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'debtor' THEN
        INSERT INTO public.user_gamification (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_gamification
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_gamification();

-- Función para actualizar cache de leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS VOID AS $$
BEGIN
    -- Limpiar cache existente
    DELETE FROM public.leaderboard_cache;
    
    -- Actualizar leaderboard de todos los tiempos
    INSERT INTO public.leaderboard_cache (period, user_id, rank, total_points, level, badges_count)
    SELECT 
        'all_time',
        ug.user_id,
        ROW_NUMBER() OVER (ORDER BY ug.total_points DESC),
        ug.total_points,
        ug.current_level,
        ug.achievements_unlocked
    FROM public.user_gamification ug
    ORDER BY ug.total_points DESC
    LIMIT 100;
    
    -- Actualizar leaderboard mensual (basado en puntos ganados este mes)
    INSERT INTO public.leaderboard_cache (period, user_id, rank, total_points, level, badges_count)
    SELECT 
        'monthly',
        ph.user_id,
        ROW_NUMBER() OVER (ORDER BY SUM(ph.points_change) DESC),
        SUM(ph.points_change),
        ug.current_level,
        ug.achievements_unlocked
    FROM public.points_history ph
    JOIN public.user_gamification ug ON ug.user_id = ph.user_id
    WHERE ph.created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY ph.user_id, ug.current_level, ug.achievements_unlocked
    ORDER BY SUM(ph.points_change) DESC
    LIMIT 100;
    
    -- Actualizar leaderboard semanal
    INSERT INTO public.leaderboard_cache (period, user_id, rank, total_points, level, badges_count)
    SELECT 
        'weekly',
        ph.user_id,
        ROW_NUMBER() OVER (ORDER BY SUM(ph.points_change) DESC),
        SUM(ph.points_change),
        ug.current_level,
        ug.achievements_unlocked
    FROM public.points_history ph
    JOIN public.user_gamification ug ON ug.user_id = ph.user_id
    WHERE ph.created_at >= date_trunc('week', CURRENT_DATE)
    GROUP BY ph.user_id, ug.current_level, ug.achievements_unlocked
    ORDER BY SUM(ph.points_change) DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY PARA NUEVAS TABLAS
-- =============================================

-- Habilitar RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Políticas para user_gamification
CREATE POLICY "Users can view their own gamification data" ON public.user_gamification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data" ON public.user_gamification
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para points_history
CREATE POLICY "Users can view their own points history" ON public.points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para payment_simulations
CREATE POLICY "Users can manage their own simulations" ON public.payment_simulations
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para email_preferences
CREATE POLICY "Users can manage their own email preferences" ON public.email_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para email_logs
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para leaderboard_cache (todos pueden ver)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache
    FOR SELECT USING (true);

-- Las tablas gamification_levels y gamification_badges son públicas (solo lectura)
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view levels" ON public.gamification_levels
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view badges" ON public.gamification_badges
    FOR SELECT USING (true);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON public.user_gamification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =============================================

-- Índice para búsquedas de emails pendientes
CREATE INDEX idx_email_queue_pending ON public.email_queue(status, scheduled_for) 
    WHERE status = 'pending';

-- Índice para notificaciones no leídas
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, status) 
    WHERE status = 'unread';

-- =============================================
-- FIN DE LA MIGRACIÓN PARTE 2A
-- =============================================
