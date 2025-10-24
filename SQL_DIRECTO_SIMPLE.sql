-- ==========================================
-- SQL DIRECTO Y SIMPLE FORZADO
-- ==========================================
-- Este SQL agrega las columnas sin verificar
-- Use solo si el SQL anterior no funcionó
-- ==========================================

-- Forzar agregar client_id a debts
ALTER TABLE debts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Forzar agregar corporate_client_id a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS corporate_client_id UUID REFERENCES corporate_clients(id);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Mensaje de éxito
SELECT 'Columnas agregadas exitosamente' as resultado;