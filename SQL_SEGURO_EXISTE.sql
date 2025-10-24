-- ==========================================
-- SQL SEGURO QUE VERIFICA SI EXISTEN COLUMNAS
-- ==========================================
-- Copiar y pegar esto en Supabase SQL Editor
-- ==========================================

-- Add corporate_client_id column to clients table (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE 'corporate_client_id column added to clients table';
    ELSE
        RAISE NOTICE 'corporate_client_id column already exists in clients table';
    END IF;
END $$;

-- Create indexes for better performance (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Success message
SELECT 'Columns verified/added successfully' as status;