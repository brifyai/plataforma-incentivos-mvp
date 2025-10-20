-- Migration: Add invitation fields to users table
-- Description: Add fields needed for user invitation and registration flow
-- Date: 2025-10-10

-- Add invitation_token column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Add invitation_status column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending';

-- Add invitation_expires_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Add validation_status column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

-- Create index on invitation_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Create index on invitation_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status);

-- Create index on invitation_expires_at for expiration checks
CREATE INDEX IF NOT EXISTS idx_users_invitation_expires_at ON users(invitation_expires_at);

-- Create index on validation_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_validation_status ON users(validation_status);

-- Add comments to document the columns
COMMENT ON COLUMN users.invitation_token IS 'Unique token for user invitation validation';
COMMENT ON COLUMN users.invitation_status IS 'Status of the invitation: pending, completed, expired';
COMMENT ON COLUMN users.invitation_expires_at IS 'Expiration date and time for the invitation token';
COMMENT ON COLUMN users.validation_status IS 'Overall validation status of the user account';