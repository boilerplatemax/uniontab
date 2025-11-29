-- Add is_pinned column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Create an index on is_pinned for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);
