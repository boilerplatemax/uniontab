-- Migration: Transform SaaS Teams into Union Website Builder
-- This migration converts the team-based SaaS structure into a union-centric multi-tenant platform
-- Date: 2025-11-12

-- ============================================================================
-- STEP 1: Create the UNIONS table (replaces teams)
-- ============================================================================
-- Unions are the core tenant entity. Each union gets:
-- - A unique slug for their public website (e.g., /atu123)
-- - Branding assets (logo, cover photo)
-- - Contact information
-- - Stripe subscription details
-- ============================================================================

CREATE TABLE IF NOT EXISTS "unions" (
	"id" serial PRIMARY KEY NOT NULL,

	-- Core union identification
	"name" varchar(255) NOT NULL,                    -- Full name: "ATU Local 123"
	"slug" varchar(100) NOT NULL,                    -- URL-safe slug: "atu123"
	"local_number" varchar(50),                      -- Local number: "123"

	-- Branding
	"logo_url" text,                                 -- Union logo (square, recommended 400x400px)
	"cover_photo_url" text,                          -- Cover photo (banner, recommended 1200x400px)

	-- Contact information
	"email" varchar(255),                            -- Primary contact email
	"phone" varchar(50),                             -- Primary phone number
	"address" text,                                  -- Physical address (multi-line)
	"website" varchar(255),                          -- External website (if any)

	-- Description & content
	"description" text,                              -- Short description for homepage
	"about" text,                                    -- Full "About Us" content (markdown supported)

	-- Metadata
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,                        -- When union site went live (NULL = draft)

	-- Stripe subscription (migrated from teams)
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),

	-- Constraints
	CONSTRAINT "unions_slug_unique" UNIQUE("slug"),  -- Globally unique slugs
	CONSTRAINT "unions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "unions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id"),

	-- Slug format validation: lowercase alphanumeric + hyphens, 3-100 chars
	CONSTRAINT "unions_slug_format" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 3)
);
--> statement-breakpoint

-- Index for fast slug lookups (primary access pattern)
CREATE INDEX IF NOT EXISTS "unions_slug_idx" ON "unions"("slug");
--> statement-breakpoint

-- Index for searching unions by name
CREATE INDEX IF NOT EXISTS "unions_name_idx" ON "unions"("name");
--> statement-breakpoint

-- Prevent creation of reserved slugs that conflict with app routes
-- Reserved: dashboard, sign-in, sign-up, onboarding, api, pricing, about, contact, terms, privacy, admin
CREATE OR REPLACE FUNCTION check_reserved_slug()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.slug IN (
		'dashboard', 'sign-in', 'sign-up', 'onboarding', 'api', 'pricing',
		'about', 'contact', 'terms', 'privacy', 'admin', 'settings', 'help',
		'support', 'billing', 'account', 'profile', 'login', 'logout', 'register'
	) THEN
		RAISE EXCEPTION 'Slug "%" is reserved and cannot be used', NEW.slug;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER prevent_reserved_slugs
	BEFORE INSERT OR UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION check_reserved_slug();
--> statement-breakpoint

-- ============================================================================
-- STEP 2: Create the UNION_PAGES table
-- ============================================================================
-- Custom pages for each union (e.g., /atu123/benefits, /atu123/events)
-- Supports markdown content with draft/publish workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS "union_pages" (
	"id" serial PRIMARY KEY NOT NULL,

	-- Relationship to union
	"union_id" integer NOT NULL,                     -- FK to unions.id

	-- Page identification
	"title" varchar(255) NOT NULL,                   -- Page title: "Member Benefits"
	"slug" varchar(100) NOT NULL,                    -- Page slug: "benefits" → /atu123/benefits

	-- Content
	"content" text,                                  -- Markdown content
	"excerpt" text,                                  -- Short preview (for listings)

	-- Page settings
	"is_published" boolean DEFAULT false NOT NULL,   -- Draft vs published
	"is_members_only" boolean DEFAULT false NOT NULL,-- Require union membership to view
	"sort_order" integer DEFAULT 0,                  -- For navigation ordering

	-- SEO & metadata
	"meta_title" varchar(255),                       -- Custom page title (SEO)
	"meta_description" text,                         -- Meta description (SEO)

	-- Timestamps
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,                        -- When page was published

	-- Author tracking
	"created_by" integer,                            -- FK to users.id
	"updated_by" integer,                            -- FK to users.id

	-- Constraints
	-- Each union can have unique page slugs (but different unions can reuse slugs)
	CONSTRAINT "union_pages_union_slug_unique" UNIQUE("union_id", "slug"),

	-- Slug format validation
	CONSTRAINT "union_pages_slug_format" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 1)
);
--> statement-breakpoint

-- Index for fast page lookups by union + slug (primary access pattern)
CREATE INDEX IF NOT EXISTS "union_pages_union_slug_idx" ON "union_pages"("union_id", "slug");
--> statement-breakpoint

-- Index for listing published pages
CREATE INDEX IF NOT EXISTS "union_pages_published_idx" ON "union_pages"("union_id", "is_published", "sort_order");
--> statement-breakpoint

-- ============================================================================
-- STEP 3: Create the MEMBERS table (replaces team_members)
-- ============================================================================
-- Links users to unions with role-based access control
-- Enforces single-union-per-user constraint
-- ============================================================================

CREATE TABLE IF NOT EXISTS "members" (
	"id" serial PRIMARY KEY NOT NULL,

	-- Relationships
	"user_id" integer NOT NULL,                      -- FK to users.id
	"union_id" integer NOT NULL,                     -- FK to unions.id

	-- Access control
	"role" varchar(50) NOT NULL,                     -- 'owner' or 'member'

	-- Timestamps
	"joined_at" timestamp DEFAULT now() NOT NULL,

	-- CRITICAL CONSTRAINT: One user can only belong to ONE union
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint

-- Index for finding union members
CREATE INDEX IF NOT EXISTS "members_union_id_idx" ON "members"("union_id");
--> statement-breakpoint

-- Index for finding user's union
CREATE INDEX IF NOT EXISTS "members_user_id_idx" ON "members"("user_id");
--> statement-breakpoint

-- ============================================================================
-- STEP 4: Update INVITATIONS table to reference unions instead of teams
-- ============================================================================

-- Rename team_id column to union_id
ALTER TABLE "invitations" RENAME COLUMN "team_id" TO "union_id";
--> statement-breakpoint

-- Update the comment
COMMENT ON COLUMN "invitations"."union_id" IS 'FK to unions.id (renamed from team_id)';
--> statement-breakpoint

-- ============================================================================
-- STEP 5: Update ACTIVITY_LOGS table to reference unions instead of teams
-- ============================================================================

-- Rename team_id column to union_id
ALTER TABLE "activity_logs" RENAME COLUMN "team_id" TO "union_id";
--> statement-breakpoint

-- Update the comment
COMMENT ON COLUMN "activity_logs"."union_id" IS 'FK to unions.id (renamed from team_id)';
--> statement-breakpoint

-- ============================================================================
-- STEP 6: Data migration - Copy teams data to unions
-- ============================================================================
-- This preserves existing team data during the transition
-- ============================================================================

INSERT INTO "unions" (
	"id",
	"name",
	"slug",
	"created_at",
	"updated_at",
	"stripe_customer_id",
	"stripe_subscription_id",
	"stripe_product_id",
	"plan_name",
	"subscription_status"
)
SELECT
	"id",
	"name",
	-- Generate slug from name (lowercase, remove spaces/special chars)
	lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
	"created_at",
	"updated_at",
	"stripe_customer_id",
	"stripe_subscription_id",
	"stripe_product_id",
	"plan_name",
	"subscription_status"
FROM "teams";
--> statement-breakpoint

-- ============================================================================
-- STEP 7: Migrate team_members to members
-- ============================================================================

INSERT INTO "members" (
	"id",
	"user_id",
	"union_id",
	"role",
	"joined_at"
)
SELECT
	"id",
	"user_id",
	"team_id",  -- Maps to union_id (since we preserved IDs in step 6)
	"role",
	"joined_at"
FROM "team_members";
--> statement-breakpoint

-- ============================================================================
-- STEP 8: Drop old tables (WARNING: This deletes teams and team_members)
-- ============================================================================
-- Comment out these lines if you want to keep old data for rollback
-- ============================================================================

-- Drop foreign key constraints first
DO $$ BEGIN
	ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_team_id_teams_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_team_id_teams_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

-- Now drop old tables
DROP TABLE IF EXISTS "team_members";
--> statement-breakpoint

DROP TABLE IF EXISTS "teams";
--> statement-breakpoint

-- ============================================================================
-- STEP 9: Add foreign key constraints for new tables
-- ============================================================================

-- Union pages → unions
DO $$ BEGIN
 ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_union_id_unions_id_fk"
 FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Union pages → users (created_by)
DO $$ BEGIN
 ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_created_by_users_id_fk"
 FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Union pages → users (updated_by)
DO $$ BEGIN
 ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_updated_by_users_id_fk"
 FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Members → users
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Members → unions
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_union_id_unions_id_fk"
 FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Update activity_logs FK to point to unions
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_union_id_unions_id_fk"
 FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Update invitations FK to point to unions
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_union_id_unions_id_fk"
 FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================================
-- STEP 10: Helper function to generate unique slugs
-- ============================================================================
-- This function helps create unique slugs when there are conflicts
-- Example: "atu123" → "atu123-2" → "atu123-3"
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
	new_slug TEXT := base_slug;
	counter INTEGER := 2;
BEGIN
	-- Check if slug exists
	WHILE EXISTS (SELECT 1 FROM unions WHERE slug = new_slug) LOOP
		new_slug := base_slug || '-' || counter;
		counter := counter + 1;
	END LOOP;

	RETURN new_slug;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- ============================================================================
-- STEP 11: Auto-update updated_at timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER update_unions_updated_at
	BEFORE UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint

CREATE TRIGGER update_union_pages_updated_at
	BEFORE UPDATE ON "union_pages"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. Created "unions" table (replaces "teams")
-- 2. Created "union_pages" table for custom pages
-- 3. Created "members" table (replaces "team_members")
-- 4. Updated "invitations" and "activity_logs" to reference unions
-- 5. Migrated existing data from teams → unions
-- 6. Added slug validation and reserved slug protection
-- 7. Enforced single-union-per-user constraint
-- 8. Added helper functions for slug generation and timestamp updates
-- ============================================================================
