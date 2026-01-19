-- Migration: Add prestige premium theme
-- Run this in your database to add the prestige theme option

-- Drop the old constraint first
ALTER TABLE unions DROP CONSTRAINT IF EXISTS valid_theme;

-- Add updated constraint with prestige theme
ALTER TABLE unions
ADD CONSTRAINT valid_theme CHECK (theme IN ('default', 'modern', 'prestige'));

-- Add comment for the prestige theme
COMMENT ON COLUMN unions.theme IS 'Visual theme for union homepage and tabs. Prestige is a premium dark theme with gold accents.';
