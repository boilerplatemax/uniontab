-- Migration: Add password reset fields to users table
-- Run this migration to add password reset token support

-- Add reset token fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.reset_token IS 'Token for password reset verification';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for reset token (typically 1 hour)';
