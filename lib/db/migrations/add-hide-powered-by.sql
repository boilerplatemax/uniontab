-- Add hide_powered_by column to unions table
-- Allows paid users to hide "Powered by UnionTab" in their footer

ALTER TABLE unions ADD COLUMN IF NOT EXISTS hide_powered_by BOOLEAN NOT NULL DEFAULT false;
