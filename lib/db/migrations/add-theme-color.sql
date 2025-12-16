-- Add theme color field to unions table
ALTER TABLE unions ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) NOT NULL DEFAULT '#2563eb';
