-- Add about images and social links to unions table
ALTER TABLE unions ADD COLUMN IF NOT EXISTS about_images JSONB;
ALTER TABLE unions ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE unions ADD COLUMN IF NOT EXISTS show_social_in_header BOOLEAN NOT NULL DEFAULT FALSE;
