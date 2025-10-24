-- Migration: Add client_id column to debts table
-- First check if the column already exists to prevent errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the client_id column as a foreign key to clients table
        ALTER TABLE public.debts 
        ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
        
        RAISE NOTICE 'client_id column added to debts table successfully';
    ELSE
        RAISE NOTICE 'client_id column already exists in debts table';
    END IF;
END $$;

-- Optional: Create a composite index for company_id + client_id queries
CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;

-- Migration completed
SELECT 'Migration 024_add_client_id_to_debts completed successfully' as status;