-- Migration: Add gallery_show_titles to unions
ALTER TABLE unions ADD COLUMN IF NOT EXISTS gallery_show_titles BOOLEAN NOT NULL DEFAULT false;
