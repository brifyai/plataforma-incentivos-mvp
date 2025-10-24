# Manual Migration Instructions: Add client_id to debts table

## Problem
The application is failing because the `client_id` column doesn't exist in the `debts` table, causing the `getCompanyDebts` function to fail when trying to check for the column's existence.

## Solution
You need to run the following SQL in your Supabase SQL Editor:

```sql
-- Add the client_id column as a foreign key to clients table
ALTER TABLE public.debts 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);

-- Optional: Create a composite index for company_id + client_id queries
CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
```

## Steps to Apply

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL above
4. Click "Run" to execute the migration

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed, you can run:
```bash
supabase db push
```

## Verification

After running the migration, you can verify it worked by running:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'client_id'
AND table_schema = 'public';
```

You should see the `client_id` column in the results.

## Temporary Fix

If you cannot apply the migration immediately, you can modify the `getCompanyDebts` function in `src/services/databaseService.js` to handle the missing column gracefully. The current implementation already has fallback logic, but the 404 error suggests the information_schema query itself is failing.

The current code should work once the migration is applied.