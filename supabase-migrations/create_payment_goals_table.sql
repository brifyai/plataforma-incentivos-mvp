-- Crear tabla para objetivos de pago mensuales
CREATE TABLE IF NOT EXISTS payment_goals (
    id SERIAL PRIMARY KEY,
    monthly_commission_goal INTEGER NOT NULL DEFAULT 2500000,
    monthly_nexupay_goal INTEGER NOT NULL DEFAULT 2500000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar valores por defecto
INSERT INTO payment_goals (monthly_commission_goal, monthly_nexupay_goal)
VALUES (2500000, 2500000)
ON CONFLICT DO NOTHING;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_goals_updated_at_trigger
    BEFORE UPDATE ON payment_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_goals_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE payment_goals ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden acceder a esta tabla
CREATE POLICY "Allow admin access to payment_goals" ON payment_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'god_mode'
        )
    );

-- Comentarios en la tabla
COMMENT ON TABLE payment_goals IS 'Objetivos mensuales de pago para comisiones e ingresos de NexusPay';
COMMENT ON COLUMN payment_goals.monthly_commission_goal IS 'Objetivo mensual en comisiones a personas (CLP)';
COMMENT ON COLUMN payment_goals.monthly_nexupay_goal IS 'Objetivo mensual en comisiones a NexusPay (CLP)';