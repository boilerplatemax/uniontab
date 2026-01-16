-- Drop the preferred_union_name column from unions table
-- This column was added in a previous migration but is no longer used
-- The publicName field is used instead for custom union display names

ALTER TABLE unions DROP COLUMN IF EXISTS preferred_union_name;
