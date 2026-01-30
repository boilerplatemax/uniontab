-- Add default_language column to unions table
-- This allows each union to set their default language preference (en, fr)

ALTER TABLE unions ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) NOT NULL DEFAULT 'en';

-- Add a comment for clarity
COMMENT ON COLUMN unions.default_language IS 'Default language for the union portal (en = English, fr = French)';
