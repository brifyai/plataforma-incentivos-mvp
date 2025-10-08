-- Crear tabla para historial de matching CRM
CREATE TABLE IF NOT EXISTS crm_matching_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crm_contact_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('auto_assigned', 'needs_review', 'rejected', 'manual_assigned')),
    confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
    criteria JSONB DEFAULT '[]',
    crm_provider TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_crm_matching_history_user_id ON crm_matching_history(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_matching_history_company_id ON crm_matching_history(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_matching_history_decision ON crm_matching_history(decision);
CREATE INDEX IF NOT EXISTS idx_crm_matching_history_created_at ON crm_matching_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_matching_history_confidence ON crm_matching_history(confidence);

-- Políticas RLS
ALTER TABLE crm_matching_history ENABLE ROW LEVEL SECURITY;

-- Política para que las empresas solo vean sus propios matchings
CREATE POLICY "Companies can view their own matching history" ON crm_matching_history
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Política para que los admins puedan ver todo
CREATE POLICY "Admins can view all matching history" ON crm_matching_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode'
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_crm_matching_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crm_matching_history_updated_at
    BEFORE UPDATE ON crm_matching_history
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_matching_history_updated_at();