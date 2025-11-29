-- ============================================================================
-- COMPLETE DATABASE RESET - Union Management SaaS
-- ============================================================================
-- This script will drop all existing tables and recreate them matching
-- the schema.ts file exactly.
--
-- ⚠️  WARNING: This will DELETE ALL DATA
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing tables
-- ============================================================================

DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "union_pages" CASCADE;
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;
DROP TABLE IF EXISTS "members" CASCADE;
DROP TABLE IF EXISTS "unions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop any existing functions/triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Create USERS table
-- ============================================================================

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" VARCHAR(20) NOT NULL DEFAULT 'member',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMP
);

CREATE INDEX "users_email_idx" ON "users"("email");

-- ============================================================================
-- STEP 3: Create UNIONS table
-- ============================================================================

CREATE TABLE "unions" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) NOT NULL UNIQUE,
  "local_number" VARCHAR(50),
  "public_name" VARCHAR(255),
  "logo_url" TEXT,
  "cover_photo_url" TEXT,
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "address" TEXT,
  "website" VARCHAR(255),
  "description" TEXT,
  "about" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "published_at" TIMESTAMP,
  "stripe_customer_id" TEXT UNIQUE,
  "stripe_subscription_id" TEXT UNIQUE,
  "stripe_product_id" TEXT,
  "plan_name" VARCHAR(50),
  "subscription_status" VARCHAR(20)
);

CREATE INDEX "unions_slug_idx" ON "unions"("slug");

-- ============================================================================
-- STEP 4: Create MEMBERS table
-- ============================================================================

CREATE TABLE "members" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "joined_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "members_user_id_idx" ON "members"("user_id");
CREATE INDEX "members_union_id_idx" ON "members"("union_id");

-- ============================================================================
-- STEP 5: Create ACTIVITY_LOGS table
-- ============================================================================

CREATE TABLE "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip_address" VARCHAR(45)
);

CREATE INDEX "activity_logs_union_id_idx" ON "activity_logs"("union_id");
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- ============================================================================
-- STEP 6: Create INVITATIONS table
-- ============================================================================

CREATE TABLE "invitations" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL,
  "invited_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invited_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending'
);

CREATE INDEX "invitations_union_id_idx" ON "invitations"("union_id");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- ============================================================================
-- STEP 7: Create UNION_PAGES table
-- ============================================================================

CREATE TABLE "union_pages" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "content" TEXT,
  "excerpt" TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "is_members_only" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER DEFAULT 0,
  "meta_title" VARCHAR(255),
  "meta_description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "published_at" TIMESTAMP,
  "created_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "union_pages_union_id_slug_idx" ON "union_pages"("union_id", "slug");

-- ============================================================================
-- STEP 8: Create POSTS table
-- ============================================================================

CREATE TABLE "posts" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "image_url" TEXT,
  "is_private" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "posts_union_id_idx" ON "posts"("union_id");
CREATE INDEX "posts_created_by_idx" ON "posts"("created_by");

-- ============================================================================
-- STEP 9: Create FILES table
-- ============================================================================

CREATE TABLE "files" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_type" VARCHAR(100) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "is_private" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "files_union_id_idx" ON "files"("union_id");
CREATE INDEX "files_created_by_idx" ON "files"("created_by");

-- ============================================================================
-- STEP 10: Create EVENTS table
-- ============================================================================

CREATE TABLE "events" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "media_url" TEXT,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "start_time" VARCHAR(10),
  "end_time" VARCHAR(10),
  "is_all_day" BOOLEAN NOT NULL DEFAULT false,
  "is_private" BOOLEAN NOT NULL DEFAULT false,
  "category" VARCHAR(100),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "events_union_id_idx" ON "events"("union_id");
CREATE INDEX "events_start_date_idx" ON "events"("start_date");
CREATE INDEX "events_end_date_idx" ON "events"("end_date");
CREATE INDEX "events_is_private_idx" ON "events"("is_private");

-- ============================================================================
-- STEP 11: Create auto-update trigger for updated_at columns
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unions_updated_at
  BEFORE UPDATE ON "unions"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_union_pages_updated_at
  BEFORE UPDATE ON "union_pages"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON "posts"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON "events"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ✅ DATABASE RESET COMPLETE
-- ============================================================================
-- Tables created:
-- ✅ users (id: SERIAL, with all required fields)
-- ✅ unions (id: SERIAL, with public_name column)
-- ✅ members (join table with proper foreign keys and status for approval)
-- ✅ activity_logs (tracking user actions)
-- ✅ invitations (team management)
-- ✅ union_pages (custom content)
-- ✅ posts (union posts with public/private toggle)
-- ✅ files (file storage with public/private toggle)
-- ✅ events (union events with calendar information)
--
-- All tables match schema.ts exactly
-- ============================================================================
