-- Rollback Migration: Revert Union Schema Back to Teams
-- WARNING: This will delete all union-specific data (pages, etc.)
-- Use this only if you need to revert to the original team-based structure
-- Date: 2025-11-12

-- ============================================================================
-- STEP 1: Drop triggers and functions
-- ============================================================================

DROP TRIGGER IF EXISTS prevent_reserved_slugs ON unions;
DROP TRIGGER IF EXISTS update_unions_updated_at ON unions;
DROP TRIGGER IF EXISTS update_union_pages_updated_at ON union_pages;
DROP FUNCTION IF EXISTS check_reserved_slug();
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();
--> statement-breakpoint

-- ============================================================================
-- STEP 2: Recreate teams table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	CONSTRAINT "teams_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "teams_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint

-- ============================================================================
-- STEP 3: Recreate team_members table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================================================
-- STEP 4: Migrate unions data back to teams
-- ============================================================================

INSERT INTO "teams" (
	"id",
	"name",
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
	"created_at",
	"updated_at",
	"stripe_customer_id",
	"stripe_subscription_id",
	"stripe_product_id",
	"plan_name",
	"subscription_status"
FROM "unions";
--> statement-breakpoint

-- ============================================================================
-- STEP 5: Migrate members data back to team_members
-- ============================================================================

INSERT INTO "team_members" (
	"id",
	"user_id",
	"team_id",
	"role",
	"joined_at"
)
SELECT
	"id",
	"user_id",
	"union_id",
	"role",
	"joined_at"
FROM "members";
--> statement-breakpoint

-- ============================================================================
-- STEP 6: Update invitations table
-- ============================================================================

ALTER TABLE "invitations" RENAME COLUMN "union_id" TO "team_id";
--> statement-breakpoint

-- ============================================================================
-- STEP 7: Update activity_logs table
-- ============================================================================

ALTER TABLE "activity_logs" RENAME COLUMN "union_id" TO "team_id";
--> statement-breakpoint

-- ============================================================================
-- STEP 8: Drop union-specific foreign key constraints
-- ============================================================================

DO $$ BEGIN
	ALTER TABLE "union_pages" DROP CONSTRAINT IF EXISTS "union_pages_union_id_unions_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "union_pages" DROP CONSTRAINT IF EXISTS "union_pages_created_by_users_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "union_pages" DROP CONSTRAINT IF EXISTS "union_pages_updated_by_users_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_user_id_users_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_union_id_unions_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_union_id_unions_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_union_id_unions_id_fk";
EXCEPTION
	WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================================
-- STEP 9: Drop union-specific tables
-- ============================================================================

DROP INDEX IF EXISTS "union_pages_union_slug_idx";
DROP INDEX IF EXISTS "union_pages_published_idx";
DROP INDEX IF EXISTS "members_union_id_idx";
DROP INDEX IF EXISTS "members_user_id_idx";
DROP INDEX IF EXISTS "unions_slug_idx";
DROP INDEX IF EXISTS "unions_name_idx";
--> statement-breakpoint

DROP TABLE IF EXISTS "union_pages";
DROP TABLE IF EXISTS "members";
DROP TABLE IF EXISTS "unions";
--> statement-breakpoint

-- ============================================================================
-- STEP 10: Restore original foreign key constraints
-- ============================================================================

DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk"
 FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk"
 FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk"
 FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- The database has been restored to the original team-based structure
-- WARNING: All union pages and union-specific data have been lost
-- ============================================================================
