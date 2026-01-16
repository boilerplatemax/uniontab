-- Add preferred_union_name column to unions table
-- This allows unions to specify a custom name for email subdomain generation
-- e.g., "cupe123" -> notify@cupe123.uniontab.com

ALTER TABLE unions
ADD COLUMN IF NOT EXISTS preferred_union_name VARCHAR(100);
