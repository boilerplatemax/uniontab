-- ============================================================================
-- COMPLETE SCHEMA RESET - Union Management SaaS
-- ============================================================================
-- This script will drop all existing tables and recreate them with the
-- correct schema including all constraints, triggers, and RLS policies.
--
-- IMPORTANT: This will DELETE ALL DATA. Only run this if you want to
-- completely reset your database.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing tables (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS "union_pages" CASCADE;
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;
DROP TABLE IF EXISTS "members" CASCADE;
DROP TABLE IF EXISTS "unions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS check_reserved_slug() CASCADE;
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Create USERS table
-- ============================================================================
-- Users are the paying customers/admins who create and manage unions

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

-- ============================================================================
-- STEP 3: Create UNIONS table
-- ============================================================================
-- Unions are the organizations that users create and manage

CREATE TABLE "unions" (
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
	CONSTRAINT "unions_slug_format" CHECK (slug ~ '^[a-z0-9]+$' AND length(slug) >= 3)
);

CREATE INDEX IF NOT EXISTS "unions_slug_idx" ON "unions"("slug");
CREATE INDEX IF NOT EXISTS "unions_name_idx" ON "unions"("name");

-- ============================================================================
-- STEP 4: Create MEMBERS table
-- ============================================================================
-- Members is the join table connecting users to unions
-- Each user can only be a member of ONE union

CREATE TABLE "members" (
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
-- STEP 5: Create INVITATIONS table
-- ============================================================================
-- Invitations for users to join unions

CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS "invitations_union_id_idx" ON "invitations"("union_id");
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations"("email");

-- ============================================================================
-- STEP 6: Create ACTIVITY_LOGS table
-- ============================================================================
-- Track all user and union activities

CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);

CREATE INDEX IF NOT EXISTS "activity_logs_union_id_idx" ON "activity_logs"("union_id");
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- ============================================================================
-- STEP 7: Create UNION_PAGES table
-- ============================================================================
-- Custom pages that unions can create for their websites

CREATE TABLE "union_pages" (
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
-- STEP 8: Add foreign key constraints
-- ============================================================================

-- Members → Users
ALTER TABLE "members"
	ADD CONSTRAINT "members_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Members → Unions
ALTER TABLE "members"
	ADD CONSTRAINT "members_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Invitations → Unions
ALTER TABLE "invitations"
	ADD CONSTRAINT "invitations_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Invitations → Users (invited by)
ALTER TABLE "invitations"
	ADD CONSTRAINT "invitations_invited_by_users_id_fk"
	FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE;

-- Activity Logs → Unions
ALTER TABLE "activity_logs"
	ADD CONSTRAINT "activity_logs_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE NO ACTION;

-- Activity Logs → Users
ALTER TABLE "activity_logs"
	ADD CONSTRAINT "activity_logs_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- Union Pages → Unions
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_union_id_unions_id_fk"
	FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE;

-- Union Pages → Users (created by)
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_created_by_users_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Union Pages → Users (updated by)
ALTER TABLE "union_pages"
	ADD CONSTRAINT "union_pages_updated_by_users_id_fk"
	FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- ============================================================================
-- STEP 9: Create helper functions and triggers
-- ============================================================================

-- Function to check for reserved slugs
CREATE OR REPLACE FUNCTION check_reserved_slug()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.slug IN (
		'dashboard', 'sign-in', 'sign-up', 'onboarding', 'api', 'pricing',
		'about', 'contact', 'terms', 'privacy', 'admin', 'settings', 'help',
		'support', 'billing', 'account', 'profile', 'login', 'logout', 'register',
		'signin', 'signup', 'auth', 'oauth', 'callback', 'verify', 'reset'
	) THEN
		RAISE EXCEPTION 'Slug "%" is reserved and cannot be used', NEW.slug;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent reserved slugs on unions
CREATE TRIGGER prevent_reserved_slugs
	BEFORE INSERT OR UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION check_reserved_slug();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_unions_updated_at
	BEFORE UPDATE ON "unions"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_union_pages_updated_at
	BEFORE UPDATE ON "union_pages"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE ON "users"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 10: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE "unions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "union_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 11: RLS Policies for USERS
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
-- STEP 12: RLS Policies for UNIONS
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
-- STEP 13: RLS Policies for UNION_PAGES
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
-- STEP 14: RLS Policies for MEMBERS
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
-- STEP 15: RLS Policies for INVITATIONS
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

-- INVITED USERS: Can update invitation status (accept/decline)
CREATE POLICY "invitations_update_invited" ON "invitations"
	FOR UPDATE
	USING (email = (SELECT email FROM users WHERE id = auth.uid()::integer));

-- ============================================================================
-- STEP 16: RLS Policies for ACTIVITY_LOGS
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
-- STEP 17: Grant permissions to authenticated users
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Your database now has:
-- ✅ Users table with name required (NOT NULL)
-- ✅ Unions table with proper slug format: {unionname}{localnumber} (e.g., atu123)
-- ✅ Slug uniqueness enforced - prevents duplicate union creation
-- ✅ Local number is optional
-- ✅ Members table - joins users to unions (one union per user)
-- ✅ Union pages for custom content
-- ✅ Invitations for team management
-- ✅ Activity logs for tracking
-- ✅ Row Level Security (RLS) enabled and configured
-- ✅ Multi-tenant data isolation
-- ✅ Proper access controls (public, members, owners)
--
-- Key Points:
-- - Users are the paying customers/admins
-- - Members is the join table (users can belong to unions)
-- - Union slugs follow format: {unionname}{localnumber} (e.g., "atu123")
-- - If slug exists, signup is prevented (no auto-increment)
-- - Name is required when users sign up
-- ============================================================================
