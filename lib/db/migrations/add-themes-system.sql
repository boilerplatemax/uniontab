-- Migration: Add themes system
-- Run this in your database to add theme support to unions

-- Add theme column to unions table
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) NOT NULL DEFAULT 'default';

-- Add constraint to ensure valid theme values
ALTER TABLE unions
ADD CONSTRAINT valid_theme CHECK (theme IN ('default', 'modern', 'twitter'));

-- Add comment
COMMENT ON COLUMN unions.theme IS 'Visual theme for union homepage and tabs';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_unions_theme ON unions(theme);
