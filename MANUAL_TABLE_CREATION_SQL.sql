-- ==========================================
-- MANUAL TABLE CREATION FOR debtor_corporate_matches
-- ==========================================
-- Execute this SQL in Supabase SQL Editor
-- ==========================================

-- 1. Create the main table
CREATE TABLE IF NOT EXISTS debtor_corporate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 1),
  match_type VARCHAR(50) NOT NULL DEFAULT 'partial',
  match_details JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(debtor_id, corporate_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_debtor_id ON debtor_corporate_matches(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_corporate_id ON debtor_corporate_matches(corporate_id);
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_score ON debtor_corporate_matches(match_score);
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_status ON debtor_corporate_matches(status);
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_created_at ON debtor_corporate_matches(created_at);

-- 3. Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_composite ON debtor_corporate_matches(corporate_id, status, match_score DESC);

-- 4. Add RUT column to corporate_clients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'corporate_clients' 
    AND column_name = 'rut'
  ) THEN
    ALTER TABLE corporate_clients ADD COLUMN rut VARCHAR(20);
    CREATE INDEX IF NOT EXISTS idx_corporate_clients_rut ON corporate_clients(rut);
  END IF;
END $$;

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_debtor_corporate_matches_updated_at ON debtor_corporate_matches;
CREATE TRIGGER update_debtor_corporate_matches_updated_at
  BEFORE UPDATE ON debtor_corporate_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE debtor_corporate_matches ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Policy: Users can see their own matches
CREATE POLICY "Users can view their own matches"
  ON debtor_corporate_matches FOR SELECT
  USING (
    auth.uid() = debtor_id OR
    EXISTS (
      SELECT 1 FROM corporate_clients cc
      JOIN companies c ON cc.company_id = c.id
      WHERE cc.id = corporate_id 
      AND c.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('god_mode')
    )
  );

-- Policy: Companies can see matches for their corporate clients
CREATE POLICY "Companies can view matches for their corporate clients"
  ON debtor_corporate_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corporate_clients cc
      JOIN companies c ON cc.company_id = c.id
      WHERE cc.id = corporate_id 
      AND c.user_id = auth.uid()
    )
  );

-- Policy: Only system can insert matches
CREATE POLICY "Only system can insert matches"
  ON debtor_corporate_matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('god_mode')
    )
  );

-- Policy: Companies can update match status for their corporate clients
CREATE POLICY "Companies can update match status"
  ON debtor_corporate_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM corporate_clients cc
      JOIN companies c ON cc.company_id = c.id
      WHERE cc.id = corporate_id 
      AND c.user_id = auth.uid()
    )
  );

-- Policy: Admins and god_mode can do everything
CREATE POLICY "Admins and god_mode full access"
  ON debtor_corporate_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('god_mode')
    )
  );

-- 8. Create view for easy access to matches with details
CREATE OR REPLACE VIEW debtor_corporate_matches_details AS
SELECT 
  dcm.id,
  dcm.debtor_id,
  dcm.corporate_id,
  dcm.match_score,
  dcm.match_type,
  dcm.match_details,
  dcm.status,
  dcm.confirmed_by,
  dcm.confirmed_at,
  dcm.created_at,
  dcm.updated_at,
  -- Debtor information
  debtor.full_name as debtor_name,
  debtor.email as debtor_email,
  debtor.rut as debtor_rut,
  debtor.phone as debtor_phone,
  -- Corporate client information
  corporate.name as corporate_name,
  corporate.contact_email as corporate_email,
  corporate.contact_phone as corporate_phone,
  corporate.rut as corporate_rut,
  corporate.display_category as corporate_category,
  -- Company information
  companies.company_name as company_name,
  companies.id as company_id
FROM debtor_corporate_matches dcm
LEFT JOIN users debtor ON dcm.debtor_id = debtor.id
LEFT JOIN corporate_clients corporate ON dcm.corporate_id = corporate.id
LEFT JOIN companies ON corporate.company_id = companies.id;

-- 9. Grant access to the view
GRANT SELECT ON debtor_corporate_matches_details TO authenticated;
GRANT SELECT ON debtor_corporate_matches_details TO service_role;

-- 10. Add comments for documentation
COMMENT ON TABLE debtor_corporate_matches IS 'Stores automatic matches between debtors and corporate clients based on name and RUT similarity';
COMMENT ON COLUMN debtor_corporate_matches.match_score IS 'Similarity score between 0 and 1, where 1 is perfect match';
COMMENT ON COLUMN debtor_corporate_matches.match_type IS 'Type of match: rut_exact, name_high, partial, perfect';
COMMENT ON COLUMN debtor_corporate_matches.match_details IS 'JSON object with detailed matching information';
COMMENT ON COLUMN debtor_corporate_matches.status IS 'Match status: pending, confirmed, rejected';
COMMENT ON VIEW debtor_corporate_matches_details IS 'Detailed view of debtor-corporate matches with all related information';

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify table was created
SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_name = 'debtor_corporate_matches';

-- Verify indexes were created
SELECT indexname, tablename FROM pg_indexes WHERE tablename = 'debtor_corporate_matches';

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'debtor_corporate_matches';

-- Verify policies were created
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'debtor_corporate_matches';

-- ==========================================
-- COMPLETION
-- ==========================================
-- After executing this SQL, run:
-- node scripts/test_matching_simple.js
-- 
-- The test should now show:
-- ✅ Table exists and is accessible
-- ✅ Matching system fully operational
-- ==========================================