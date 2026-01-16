-- Add author_type field to posts table
-- Allows posts to be attributed to either the individual user or the union
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type VARCHAR(20) NOT NULL DEFAULT 'union';
