-- =============================================
-- A/B TESTING TABLES MIGRATION
-- Tablas para experimentos A/B de respuestas IA
-- =============================================

-- Tabla de experimentos A/B
CREATE TABLE IF NOT EXISTS ab_testing_experiments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    intent_type VARCHAR(100) NOT NULL, -- 'discount_request', 'installments_request', etc.
    variant_a TEXT NOT NULL, -- Respuesta A
    variant_b TEXT NOT NULL, -- Respuesta B
    target_metric VARCHAR(50) DEFAULT 'conversion_rate', -- 'conversion_rate', 'satisfaction', 'response_time'
    sample_size INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
    winner_variant VARCHAR(10), -- 'A', 'B', o 'tie'
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Estadísticas
    variant_a_count INTEGER DEFAULT 0,
    variant_b_count INTEGER DEFAULT 0,
    variant_a_conversions INTEGER DEFAULT 0,
    variant_b_conversions INTEGER DEFAULT 0,
    variant_a_satisfaction DECIMAL(3,2) DEFAULT 0,
    variant_b_satisfaction DECIMAL(3,2) DEFAULT 0,
    variant_a_response_time DECIMAL(8,2) DEFAULT 0,
    variant_b_response_time DECIMAL(8,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de participantes en experimentos
CREATE TABLE IF NOT EXISTS ab_testing_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id UUID NOT NULL REFERENCES ab_testing_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(10) NOT NULL, -- 'A' o 'B'
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(experiment_id, user_id)
);

-- Tabla de resultados detallados
CREATE TABLE IF NOT EXISTS ab_testing_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id UUID NOT NULL REFERENCES ab_testing_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(10) NOT NULL, -- 'A' o 'B'
    conversion BOOLEAN DEFAULT FALSE,
    satisfaction DECIMAL(3,2), -- 1.0 a 5.0
    response_time DECIMAL(8,2), -- en segundos
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ab_experiments_company ON ab_testing_experiments(company_id);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_testing_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_participants_experiment ON ab_testing_participants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_experiment ON ab_testing_results(experiment_id);

-- Políticas RLS
ALTER TABLE ab_testing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_testing_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_testing_results ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas (solo pueden ver sus experimentos)
CREATE POLICY "Companies can view their own experiments" ON ab_testing_experiments
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can view participants in their experiments" ON ab_testing_participants
    FOR ALL USING (
        experiment_id IN (
            SELECT id FROM ab_testing_experiments
            WHERE company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Companies can view results in their experiments" ON ab_testing_results
    FOR ALL USING (
        experiment_id IN (
            SELECT id FROM ab_testing_experiments
            WHERE company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        )
    );

-- Políticas para administradores (acceso completo)
CREATE POLICY "Admins have full access to experiments" ON ab_testing_experiments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to participants" ON ab_testing_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

CREATE POLICY "Admins have full access to results" ON ab_testing_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'god_mode'
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ab_experiment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ab_experiment_updated_at
    BEFORE UPDATE ON ab_testing_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_experiment_updated_at();

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================