-- ============================================================================
-- Fix Users ID from UUID to Serial Integer
-- ============================================================================
-- This migration fixes the mismatch between the database schema (UUID) and
-- the Drizzle schema (serial/integer) by converting all user IDs to integers.
-- ============================================================================

-- Step 1: Drop all foreign key constraints
ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_user_id_users_id_fk";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_invited_by_users_id_fk";
ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_user_id_users_id_fk";
ALTER TABLE "union_pages" DROP CONSTRAINT IF EXISTS "union_pages_created_by_users_id_fk";
ALTER TABLE "union_pages" DROP CONSTRAINT IF EXISTS "union_pages_updated_by_users_id_fk";

-- Step 2: Drop the users table and recreate with serial ID
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) NOT NULL DEFAULT 'member',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Step 3: Update related tables to use integer for user_id
ALTER TABLE "members" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "members" ADD COLUMN "user_id" integer NOT NULL;

ALTER TABLE "invitations" DROP COLUMN IF EXISTS "invited_by";
ALTER TABLE "invitations" ADD COLUMN "invited_by" integer NOT NULL;

ALTER TABLE "activity_logs" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "activity_logs" ADD COLUMN "user_id" integer;

ALTER TABLE "union_pages" DROP COLUMN IF EXISTS "created_by";
ALTER TABLE "union_pages" ADD COLUMN "created_by" integer;

ALTER TABLE "union_pages" DROP COLUMN IF EXISTS "updated_by";
ALTER TABLE "union_pages" ADD COLUMN "updated_by" integer;

-- Step 4: Add back foreign key constraints
ALTER TABLE "members"
	ADD CONSTRAINT "members_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "invitations"
	ADD CONSTRAINT "invitations_invited_by_users_id_fk"
	FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "activity_logs"
	ADD CONSTRAINT "activity_logs_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_created_by_users_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_updated_by_users_id_fk"
	FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Step 5: Add unique constraint back to members.user_id
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_unique" UNIQUE("user_id");

-- Step 6: Recreate the update trigger for users
CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE ON "users"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Recreate RLS policies for users
DROP POLICY IF EXISTS "users_select_self" ON "users";
DROP POLICY IF EXISTS "users_update_self" ON "users";
DROP POLICY IF EXISTS "users_insert_public" ON "users";

CREATE POLICY "users_select_self" ON "users"
	FOR SELECT
	USING (true);

CREATE POLICY "users_update_self" ON "users"
	FOR UPDATE
	USING (true);

CREATE POLICY "users_insert_public" ON "users"
	FOR INSERT
	WITH CHECK (true);

-- Note: RLS is simplified for now since we're not using Supabase auth.uid()
-- The application handles auth through sessions instead.
