-- ============================================================================
-- Add Public Name Field to Unions
-- ============================================================================
-- This migration adds a public_name field to the unions table that allows
-- unions to display a more friendly name (e.g., "Barrie Transit Union")
-- while keeping the slug the same (e.g., "atu123").
-- ============================================================================

ALTER TABLE "unions" ADD COLUMN IF NOT EXISTS "public_name" varchar(255);

-- Set existing unions' public_name to their current name as default
UPDATE "unions" SET "public_name" = "name" WHERE "public_name" IS NULL;

-- Add comment to explain the field
COMMENT ON COLUMN "unions"."public_name" IS 'Display name shown to public (e.g., "Barrie Transit Union"). Does not affect the slug URL.';
COMMENT ON COLUMN "unions"."name" IS 'Union identifier used for slug generation (e.g., "ATU"). Should not contain spaces.';
