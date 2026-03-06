-- Add is_demo column to unions table for demo union sites
ALTER TABLE unions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
