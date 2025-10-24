-- Migration 040: Create Missing Tables Final
-- Crear tablas faltantes identificadas en el análisis UI-BD completo
-- Tablas necesarias para funcionalidades avanzadas del sistema

-- ==========================================
-- CREAR TABLA ANALYTICS
-- ==========================================

CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'page_view', 'user_action', 'system_event', etc.
    event_name TEXT NOT NULL, -- nombre específico del evento
    event_data JSONB, -- datos adicionales del evento
    metadata JSONB, -- metadatos adicionales
    ip_address INET, -- dirección IP para análisis
    user_agent TEXT, -- user agent del navegador
    session_id TEXT, -- identificador de sesión
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_company_id ON analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);

-- ==========================================
-- CREAR TABLA KNOWLEDGE_BASE
-- ==========================================

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'faq', 'tutorial', 'policy', 'technical', etc.
    tags TEXT[], -- array de etiquetas para búsqueda
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    search_vector TSVECTOR, -- para búsqueda de texto completo
    metadata JSONB, -- metadatos adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para knowledge_base
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_id ON knowledge_base(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_public ON knowledge_base(is_public);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search_vector ON knowledge_base USING GIN(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION update_knowledge_base_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_search_vector_trigger
    BEFORE INSERT OR UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_search_vector();

-- ==========================================
-- CREAR TABLA GAMIFICATION (BÁSICA)
-- ==========================================

CREATE TABLE IF NOT EXISTS gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]', -- array de logros desbloqueados
    badges JSONB DEFAULT '[]', -- array de insignias obtenidas
    streak_days INTEGER DEFAULT 0, -- días consecutivos de actividad
    last_activity DATE, -- última fecha de actividad
    preferences JSONB DEFAULT '{}', -- preferencias de gamificación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gamification
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON gamification(level);
CREATE INDEX IF NOT EXISTS idx_gamification_experience_points ON gamification(experience_points);

-- ==========================================
-- CREAR TABLA GAMIFICATION_REWARDS
-- ==========================================

CREATE TABLE IF NOT EXISTS gamification_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'badge', 'points', 'discount', 'feature'
    value INTEGER, -- valor en puntos o porcentaje
    requirements JSONB, -- requisitos para desbloquear
    is_active BOOLEAN DEFAULT TRUE,
    icon TEXT, -- icono para mostrar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gamification_rewards
CREATE INDEX IF NOT EXISTS idx_gamification_rewards_type ON gamification_rewards(type);
CREATE INDEX IF NOT EXISTS idx_gamification_rewards_is_active ON gamification_rewards(is_active);

-- ==========================================
-- CREAR TABLA USER_ACHIEVEMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES gamification_rewards(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- datos adicionales del logro
);

-- Índices para user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_reward_id ON user_achievements(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

-- Habilitar RLS para todas las tablas nuevas
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics
CREATE POLICY "Users can view own analytics" ON analytics
    FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert own analytics" ON analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Companies can view their analytics" ON analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id 
            AND user_id = auth.uid()::text
        )
    );

-- Políticas para knowledge_base
CREATE POLICY "Public knowledge base is viewable by all" ON knowledge_base
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view company knowledge base" ON knowledge_base
    FOR SELECT USING (
        is_public = false AND 
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id 
            AND user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage company knowledge base" ON knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE id = company_id 
            AND user_id = auth.uid()::text
        )
    );

-- Políticas para gamification
CREATE POLICY "Users can view own gamification" ON gamification
    FOR ALL USING (auth.uid() = user_id::text);

-- Políticas para gamification_rewards
CREATE POLICY "Everyone can view active rewards" ON gamification_rewards
    FOR SELECT USING (is_active = true);

-- Políticas para user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id::text);

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- Insertar recompensas básicas de gamificación
INSERT INTO gamification_rewards (name, description, type, value, requirements, icon) VALUES
('Primer Paso', 'Completa tu primer perfil', 'badge', 10, '{"profile_completed": true}', '🎯'),
('Explorador', 'Visita todas las páginas principales', 'badge', 25, '{"pages_visited": 5}', '🔍'),
('Negociador Experto', 'Completa tu primer acuerdo', 'badge', 50, '{"agreements_completed": 1}', '🤝'),
('Coleccionista', 'Acumula 100 puntos', 'badge', 100, '{"total_points": 100}', '⭐'),
('Leal', 'Mantén actividad por 7 días consecutivos', 'badge', 75, '{"streak_days": 7}', '🔥')
ON CONFLICT DO NOTHING;

-- ==========================================
-- FUNCIONES ÚTILES
-- ==========================================

-- Función para actualizar puntos de experiencia
CREATE OR REPLACE FUNCTION update_user_experience_points(
    p_user_id UUID,
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE gamification 
    SET 
        experience_points = experience_points + p_points,
        total_points = total_points + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Actualizar nivel basado en puntos de experiencia
    UPDATE gamification 
    SET level = FLOOR((experience_points + 100) / 100)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Verificar que las tablas se hayan creado correctamente
SELECT 
    'analytics' as table_name,
    COUNT(*) as row_count
FROM analytics
UNION ALL
SELECT 
    'knowledge_base' as table_name,
    COUNT(*) as row_count
FROM knowledge_base
UNION ALL
SELECT 
    'gamification' as table_name,
    COUNT(*) as row_count
FROM gamification
UNION ALL
SELECT 
    'gamification_rewards' as table_name,
    COUNT(*) as row_count
FROM gamification_rewards
UNION ALL
SELECT 
    'user_achievements' as table_name,
    COUNT(*) as row_count
FROM user_achievements;

-- ==========================================
-- LOG DE MIGRACIÓN
-- ==========================================

-- Nota: Las tablas analytics, knowledge_base y gamification han sido creadas exitosamente
-- Esta migración completa la estructura de base de datos para NexuPay