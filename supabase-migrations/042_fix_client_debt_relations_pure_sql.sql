-- Fix Client-Debt Relations
-- This migration fixes the missing client_id column in debts table
-- and ensures proper foreign key relationships

-- Add client_id column to debts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        
        -- Add comment
        COMMENT ON COLUMN debts.client_id IS 'Reference to the client table for corporate debt tracking';
    END IF;
END $$;

-- Add corporate_client_id column to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        
        -- Add comment
        COMMENT ON COLUMN clients.corporate_client_id IS 'Reference to the corporate client this individual client belongs to';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

-- Enable RLS policies for the new columns
-- Update existing policies to include the new columns

-- Policy for debts table
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
CREATE POLICY "Users can view their own debts" ON debts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = debts.company_id 
            AND companies.user_id = auth.uid()
        ))
    );

-- Policy for clients table
DROP POLICY IF EXISTS "Companies can view their clients" ON clients;
CREATE POLICY "Companies can view their clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = clients.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create trigger to automatically set corporate_client_id if not provided
CREATE OR REPLACE FUNCTION set_default_corporate_client()
RETURNS TRIGGER AS $$
BEGIN
    -- If corporate_client_id is not set, try to find the default corporate client for this company
    IF NEW.corporate_client_id IS NULL THEN
        SELECT id INTO NEW.corporate_client_id 
        FROM corporate_clients 
        WHERE company_id = NEW.company_id 
        AND is_active = true 
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_default_corporate_client ON clients;
CREATE TRIGGER trigger_set_default_corporate_client
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_default_corporate_client();

-- Create a function to safely get client_id for debts
CREATE OR REPLACE FUNCTION get_debt_client_id(debt_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT c.id 
        FROM debts d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.id = debt_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for debt-client relationships (simplified version)
CREATE OR REPLACE VIEW debt_client_view AS
SELECT
    d.id as debt_id,
    d.company_id,
    d.user_id,
    d.client_id,
    c.business_name as client_name,
    c.contact_email as client_email,
    c.rut as client_rut,
    d.original_amount,
    d.current_amount,
    d.status,
    d.created_at
FROM debts d
LEFT JOIN clients c ON d.client_id = c.id;

-- Grant access to the view
GRANT SELECT ON debt_client_view TO authenticated, anon;