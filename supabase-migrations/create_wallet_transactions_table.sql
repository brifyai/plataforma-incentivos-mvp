-- Crear tabla para transacciones de billetera
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  concept VARCHAR(100) NOT NULL,
  reference_id VARCHAR(100), -- Para vincular con pagos, gift cards, etc.
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias transacciones
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propias transacciones
CREATE POLICY "Users can insert own wallet transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para administradores (god_mode) puedan ver todas las transacciones
CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'god_mode'
    )
  );

-- Comentarios en la tabla
COMMENT ON TABLE wallet_transactions IS 'Transacciones de billetera virtual de usuarios';
COMMENT ON COLUMN wallet_transactions.amount IS 'Monto de la transacción (positivo para créditos, negativo para débitos)';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Tipo: credit (ingreso) o debit (egreso)';
COMMENT ON COLUMN wallet_transactions.concept IS 'Descripción de la transacción';
COMMENT ON COLUMN wallet_transactions.reference_id IS 'ID de referencia (pago, gift card, etc.)';
COMMENT ON COLUMN wallet_transactions.balance_before IS 'Saldo antes de la transacción';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Saldo después de la transacción';