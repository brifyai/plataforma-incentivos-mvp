-- ==========================================
-- SQL PARA CORREGIR CLIENTES CORPORATIVOS
-- ==========================================
-- Copiar y pegar esto en Supabase SQL Editor
-- ==========================================

-- Add client_id column to debts table
ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);

-- Add corporate_client_id column to clients table  
ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);

-- Create indexes for better performance
CREATE INDEX idx_debts_client_id ON debts(client_id);
CREATE INDEX idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Success message
SELECT 'Columns added successfully' as status;