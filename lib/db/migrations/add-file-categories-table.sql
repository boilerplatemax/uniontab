-- Migration: Add file categories table
-- Run this in your database to add category ordering support

CREATE TABLE IF NOT EXISTS file_categories (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id),
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_union_category UNIQUE (union_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_categories_union_id ON file_categories(union_id);
CREATE INDEX IF NOT EXISTS idx_file_categories_sort_order ON file_categories(sort_order);

-- Add comment
COMMENT ON TABLE file_categories IS 'File categories with ordering for unions';
COMMENT ON COLUMN file_categories.sort_order IS 'Display order of categories';

-- Populate existing categories from files table
INSERT INTO file_categories (union_id, name, sort_order)
SELECT DISTINCT
  union_id,
  category,
  ROW_NUMBER() OVER (PARTITION BY union_id ORDER BY category) - 1 as sort_order
FROM files
WHERE category IS NOT NULL
ON CONFLICT (union_id, name) DO NOTHING;
