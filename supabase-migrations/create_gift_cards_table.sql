-- Crear tabla para gift cards
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  created_by UUID REFERENCES users(id),
  used_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_gift_cards_used_by ON gift_cards(used_by);

-- Políticas RLS (Row Level Security)
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan ver todas las gift cards
CREATE POLICY "Admins can view all gift cards" ON gift_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'god_mode'
    )
  );

-- Política para que los usuarios puedan ver solo las gift cards que crearon
CREATE POLICY "Users can view own created gift cards" ON gift_cards
  FOR SELECT USING (auth.uid() = created_by);

-- Comentarios en la tabla
COMMENT ON TABLE gift_cards IS 'Gift cards para agregar fondos a billeteras de usuarios';
COMMENT ON COLUMN gift_cards.code IS 'Código único del gift card';
COMMENT ON COLUMN gift_cards.amount IS 'Monto del gift card';
COMMENT ON COLUMN gift_cards.status IS 'Estado: active, used, expired, cancelled';
COMMENT ON COLUMN gift_cards.created_by IS 'Usuario que creó el gift card (admin)';
COMMENT ON COLUMN gift_cards.used_by IS 'Usuario que canjeó el gift card';
COMMENT ON COLUMN gift_cards.expires_at IS 'Fecha de expiración del gift card';
COMMENT ON COLUMN gift_cards.used_at IS 'Fecha en que fue canjeado';