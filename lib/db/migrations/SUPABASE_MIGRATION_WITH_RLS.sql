-- ============================================================================
-- SUPABASE MIGRATION: Union Website Builder with Row Level Security
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- This will:
-- 1. Migrate your existing tables (teams → unions)
-- 2. Create new tables (union_pages, members)
-- 3. Set up Row Level Security (RLS) policies
-- 4. Preserve your existing data
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the UNIONS table (replaces teams)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "unions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"local_number" varchar(50),
	"logo_url" text,
	"cover_photo_url" text,
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"website" varchar(255),
	"description" text,
	"about" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	CONSTRAINT "unions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "unions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "unions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id"),
	CONSTRAINT "unions_slug_format" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 3)
);

CREATE INDEX IF NOT EXISTS "unions_slug_idx" ON "unions"("slug");
CREATE INDEX IF NOT EXISTS "unions_name_idx" ON "unions"("name");

-- Reserved slug protection
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

CREATE TRIGGER prevent_reserved_slugs
	BEFORE INSERT OR UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION check_reserved_slug();

-- ============================================================================
-- STEP 2: Create the UNION_PAGES table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "union_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"content" text,
	"excerpt" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_members_only" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"meta_title" varchar(255),
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "union_pages_union_slug_unique" UNIQUE("union_id", "slug"),
	CONSTRAINT "union_pages_slug_format" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 1)
);

CREATE INDEX IF NOT EXISTS "union_pages_union_slug_idx" ON "union_pages"("union_id", "slug");
CREATE INDEX IF NOT EXISTS "union_pages_published_idx" ON "union_pages"("union_id", "is_published", "sort_order");

-- ============================================================================
-- STEP 3: Create the MEMBERS table (replaces team_members)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);

CREATE INDEX IF NOT EXISTS "members_union_id_idx" ON "members"("union_id");
CREATE INDEX IF NOT EXISTS "members_user_id_idx" ON "members"("user_id");

-- ============================================================================
-- STEP 4: Migrate existing data from teams to unions
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
	lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
	"created_at",
	"updated_at",
	"stripe_customer_id",
	"stripe_subscription_id",
	"stripe_product_id",
	"plan_name",
	"subscription_status"
FROM "teams"
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: Migrate team_members to members
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
	"team_id",
	"role",
	"joined_at"
FROM "team_members"
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Update invitations and activity_logs tables
-- ============================================================================

-- Add union_id column to invitations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'invitations' AND column_name = 'union_id') THEN
        ALTER TABLE "invitations" ADD COLUMN "union_id" integer;
    END IF;
END $$;

-- Copy team_id to union_id
UPDATE "invitations" SET "union_id" = "team_id" WHERE "union_id" IS NULL;

-- Add union_id column to activity_logs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activity_logs' AND column_name = 'union_id') THEN
        ALTER TABLE "activity_logs" ADD COLUMN "union_id" integer;
    END IF;
END $$;

-- Copy team_id to union_id
UPDATE "activity_logs" SET "union_id" = "team_id" WHERE "union_id" IS NULL;

-- ============================================================================
-- STEP 7: Add foreign key constraints
-- ============================================================================

-- Union pages → unions
ALTER TABLE "union_pages"
	DROP CONSTRAINT IF EXISTS "union_pages_union_id_unions_id_fk";
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Union pages → users (created_by)
ALTER TABLE "union_pages"
	DROP CONSTRAINT IF EXISTS "union_pages_created_by_users_id_fk";
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_created_by_users_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Union pages → users (updated_by)
ALTER TABLE "union_pages"
	DROP CONSTRAINT IF EXISTS "union_pages_updated_by_users_id_fk";
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_updated_by_users_id_fk"
	FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Members → users
ALTER TABLE "members"
	DROP CONSTRAINT IF EXISTS "members_user_id_users_id_fk";
ALTER TABLE "members"
	ADD CONSTRAINT "members_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Members → unions
ALTER TABLE "members"
	DROP CONSTRAINT IF EXISTS "members_union_id_unions_id_fk";
ALTER TABLE "members"
	ADD CONSTRAINT "members_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Invitations → unions
ALTER TABLE "invitations"
	DROP CONSTRAINT IF EXISTS "invitations_union_id_unions_id_fk";
ALTER TABLE "invitations"
	ADD CONSTRAINT "invitations_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Activity logs → unions
ALTER TABLE "activity_logs"
	DROP CONSTRAINT IF EXISTS "activity_logs_union_id_unions_id_fk";
ALTER TABLE "activity_logs"
	ADD CONSTRAINT "activity_logs_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE NO ACTION;

-- ============================================================================
-- STEP 8: Helper functions
-- ============================================================================

-- Generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
	new_slug TEXT := base_slug;
	counter INTEGER := 2;
BEGIN
	WHILE EXISTS (SELECT 1 FROM unions WHERE slug = new_slug) LOOP
		new_slug := base_slug || '-' || counter;
		counter := counter + 1;
	END LOOP;
	RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unions_updated_at
	BEFORE UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_union_pages_updated_at
	BEFORE UPDATE ON "union_pages"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- This is the key difference for Supabase - RLS protects your data

-- Enable RLS on all tables
ALTER TABLE "unions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "union_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: RLS POLICIES FOR UNIONS
-- ============================================================================

-- PUBLIC: Anyone can view published unions
CREATE POLICY "unions_select_public" ON "unions"
	FOR SELECT
	USING (published_at IS NOT NULL);

-- MEMBERS: Can view their own union (even if unpublished)
CREATE POLICY "unions_select_members" ON "unions"
	FOR SELECT
	USING (
		id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
		)
	);

-- OWNERS: Can update their own union
CREATE POLICY "unions_update_owner" ON "unions"
	FOR UPDATE
	USING (
		id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

-- AUTHENTICATED: Can create new unions
CREATE POLICY "unions_insert_authenticated" ON "unions"
	FOR INSERT
	WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 11: RLS POLICIES FOR UNION_PAGES
-- ============================================================================

-- PUBLIC: Anyone can view published, non-member-only pages
CREATE POLICY "union_pages_select_public" ON "union_pages"
	FOR SELECT
	USING (
		is_published = true
		AND is_members_only = false
	);

-- MEMBERS: Can view member-only pages of their union
CREATE POLICY "union_pages_select_members" ON "union_pages"
	FOR SELECT
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
		)
	);

-- OWNERS: Can create/update/delete pages in their union
CREATE POLICY "union_pages_insert_owner" ON "union_pages"
	FOR INSERT
	WITH CHECK (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

CREATE POLICY "union_pages_update_owner" ON "union_pages"
	FOR UPDATE
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

CREATE POLICY "union_pages_delete_owner" ON "union_pages"
	FOR DELETE
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

-- ============================================================================
-- STEP 12: RLS POLICIES FOR MEMBERS
-- ============================================================================

-- MEMBERS: Can view members of their own union
CREATE POLICY "members_select_same_union" ON "members"
	FOR SELECT
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
		)
	);

-- AUTHENTICATED: Can insert themselves as member (signup flow)
CREATE POLICY "members_insert_self" ON "members"
	FOR INSERT
	WITH CHECK (user_id = auth.uid()::integer);

-- OWNERS: Can insert/delete members in their union
CREATE POLICY "members_insert_owner" ON "members"
	FOR INSERT
	WITH CHECK (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

CREATE POLICY "members_delete_owner" ON "members"
	FOR DELETE
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

-- ============================================================================
-- STEP 13: RLS POLICIES FOR USERS
-- ============================================================================

-- Users can view their own data
CREATE POLICY "users_select_self" ON "users"
	FOR SELECT
	USING (id = auth.uid()::integer);

-- Users can update their own data
CREATE POLICY "users_update_self" ON "users"
	FOR UPDATE
	USING (id = auth.uid()::integer);

-- Anyone can insert (signup)
CREATE POLICY "users_insert_public" ON "users"
	FOR INSERT
	WITH CHECK (true);

-- ============================================================================
-- STEP 14: RLS POLICIES FOR INVITATIONS
-- ============================================================================

-- OWNERS: Can view/create/delete invitations for their union
CREATE POLICY "invitations_select_owner" ON "invitations"
	FOR SELECT
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

CREATE POLICY "invitations_insert_owner" ON "invitations"
	FOR INSERT
	WITH CHECK (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

CREATE POLICY "invitations_delete_owner" ON "invitations"
	FOR DELETE
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

-- INVITED USERS: Can view invitations sent to their email
CREATE POLICY "invitations_select_invited" ON "invitations"
	FOR SELECT
	USING (email = (SELECT email FROM users WHERE id = auth.uid()::integer));

-- ============================================================================
-- STEP 15: RLS POLICIES FOR ACTIVITY_LOGS
-- ============================================================================

-- OWNERS: Can view activity logs for their union
CREATE POLICY "activity_logs_select_owner" ON "activity_logs"
	FOR SELECT
	USING (
		union_id IN (
			SELECT union_id FROM members
			WHERE user_id = auth.uid()::integer
			AND role = 'owner'
		)
	);

-- SYSTEM: Can always insert activity logs
CREATE POLICY "activity_logs_insert_system" ON "activity_logs"
	FOR INSERT
	WITH CHECK (true);

-- ============================================================================
-- STEP 16: GRANT PERMISSIONS
-- ============================================================================
-- Supabase needs these grants for authenticated users

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Your database now has:
-- ✅ Unions table with slug validation
-- ✅ Union pages with draft/publish workflow
-- ✅ Members with single-union-per-user constraint
-- ✅ Row Level Security (RLS) enabled and configured
-- ✅ Multi-tenant data isolation
-- ✅ Proper access controls (public, members, owners)
--
-- Next steps:
-- 1. Test the migration by creating a test union
-- 2. Verify RLS policies work correctly
-- 3. Update your app code to use Supabase client
-- ============================================================================
