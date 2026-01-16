-- Migration: Add about section featured image and rename social toggle
-- This migration adds:
-- 1. aboutImageUrl - main featured image for the about section
-- 2. aboutImagePosition - position of main image ('above', 'left', 'right')
-- 3. Renames showSocialInHeader to showSocialInHero for clarity

-- Add featured about image URL
ALTER TABLE unions ADD COLUMN IF NOT EXISTS about_image_url TEXT;

-- Add about image position ('above', 'left', 'right') - defaults to 'above'
ALTER TABLE unions ADD COLUMN IF NOT EXISTS about_image_position TEXT DEFAULT 'above';

-- Rename show_social_in_header to show_social_in_hero
-- Note: We'll handle this by adding a new column and copying data, since some DBs don't support RENAME COLUMN
-- First, check if the new column doesn't exist yet
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unions' AND column_name = 'show_social_in_hero') THEN
        -- Add the new column
        ALTER TABLE unions ADD COLUMN show_social_in_hero BOOLEAN NOT NULL DEFAULT false;

        -- Copy data from old column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unions' AND column_name = 'show_social_in_header') THEN
            UPDATE unions SET show_social_in_hero = show_social_in_header;
        END IF;
    END IF;
END $$;

-- Note: We keep the old column for backwards compatibility temporarily
-- It can be dropped in a future migration after ensuring all code uses the new column
