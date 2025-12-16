-- Migration: Add estimated member count to unions
-- Run this in your database to add the estimated member count field

-- Add estimated member count field to unions table
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS estimated_member_count VARCHAR(50);

-- Add comment
COMMENT ON COLUMN unions.estimated_member_count IS 'Estimated member count range collected at signup (for internal tracking only)';
