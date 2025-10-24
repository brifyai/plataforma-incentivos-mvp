-- Add validation_status column to companies table
-- This allows administrators to set the validation status of companies

-- Add validation_status column with default value
ALTER TABLE companies ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

-- Create index on validation_status for filtering
CREATE INDEX IF NOT EXISTS idx_companies_validation_status ON companies(validation_status);

-- Add comment for documentation
COMMENT ON COLUMN companies.validation_status IS 'Validation status of the company: pending, validated, or rejected';