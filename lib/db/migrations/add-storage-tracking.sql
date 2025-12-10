-- Migration: Add storage tracking to unions
-- Run this in your database to add storage usage tracking for unions

-- Add storage tracking field to unions table
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS storage_used_bytes INTEGER NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN unions.storage_used_bytes IS 'Total storage used in bytes across all files, attachments, and media';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_unions_storage_used_bytes ON unions(storage_used_bytes);
