-- Migration: Add accessibility widget system
-- Run this in your database to add accessibility widget support to unions

-- Add accessibility_widget_enabled column to unions table
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS accessibility_widget_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN unions.accessibility_widget_enabled IS 'Enable/disable accessibility widget for union pages (text size, high contrast, etc.)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_unions_accessibility_widget ON unions(accessibility_widget_enabled);
