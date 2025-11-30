-- Migration: Add file categories
-- Run this in your database to add category organization to files

ALTER TABLE files
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_sort_order ON files(sort_order);

-- Add comment
COMMENT ON COLUMN files.category IS 'File category for organization and grouping';
COMMENT ON COLUMN files.sort_order IS 'Sort order within category';
