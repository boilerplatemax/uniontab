-- Seed Data & Examples for Union Website Builder
-- This file provides example data and common query patterns
-- Date: 2025-11-12

-- ============================================================================
-- EXAMPLE 1: Create a sample union with full details
-- ============================================================================

INSERT INTO "unions" (
	"name",
	"slug",
	"local_number",
	"logo_url",
	"cover_photo_url",
	"email",
	"phone",
	"address",
	"website",
	"description",
	"about",
	"published_at",
	"plan_name",
	"subscription_status"
) VALUES (
	'ATU Local 123',
	'atu123',
	'123',
	'https://example.com/logos/atu123.png',
	'https://example.com/covers/atu123.jpg',
	'info@atu123.org',
	'(555) 123-4567',
	'123 Union Street
Suite 100
New York, NY 10001',
	'https://atu123.org',
	'Representing transit workers in the New York metropolitan area since 1985.',
	'# About ATU Local 123

We are proud members of the Amalgamated Transit Union, representing over 5,000 transit workers in the New York metropolitan area.

## Our Mission
To protect and advance the rights, wages, and working conditions of all transit workers.

## Our History
Founded in 1985, ATU Local 123 has been at the forefront of labor advocacy...',
	now(),
	'Pro',
	'active'
) ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

-- ============================================================================
-- EXAMPLE 2: Create additional sample unions
-- ============================================================================

INSERT INTO "unions" ("name", "slug", "local_number", "description", "email", "published_at", "subscription_status")
VALUES
	('IBEW Local 456', 'ibew456', '456', 'Electrical workers union serving the tri-state area.', 'contact@ibew456.org', now(), 'active'),
	('UAW Local 789', 'uaw789', '789', 'United Auto Workers representing manufacturing employees.', 'info@uaw789.org', now(), 'active'),
	('SEIU Local 1000', 'seiu1000', '1000', 'Service Employees International Union for public sector workers.', 'hello@seiu1000.org', now(), 'trialing')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

-- ============================================================================
-- EXAMPLE 3: Create sample pages for ATU Local 123
-- ============================================================================

-- Get the union_id for ATU Local 123
DO $$
DECLARE
	v_union_id INTEGER;
BEGIN
	SELECT id INTO v_union_id FROM unions WHERE slug = 'atu123';

	-- Create "Member Benefits" page
	INSERT INTO union_pages (
		union_id, title, slug, content, excerpt, is_published, is_members_only, sort_order, published_at
	) VALUES (
		v_union_id,
		'Member Benefits',
		'benefits',
		'# Member Benefits

## Health Insurance
Comprehensive health coverage for you and your family...

## Pension Plan
Defined benefit pension plan with 30-year retirement...

## Education & Training
Free training programs and tuition reimbursement...',
		'Comprehensive benefits package including health insurance, pension, and education programs.',
		true,
		false,  -- Public page
		1,
		now()
	) ON CONFLICT (union_id, slug) DO NOTHING;

	-- Create "Events" page (members only)
	INSERT INTO union_pages (
		union_id, title, slug, content, excerpt, is_published, is_members_only, sort_order, published_at
	) VALUES (
		v_union_id,
		'Upcoming Events',
		'events',
		'# Upcoming Events

## Monthly Meeting
**Date:** First Tuesday of every month
**Time:** 7:00 PM
**Location:** Union Hall

## Training Workshop
**Date:** March 15, 2025
**Topic:** Safety Protocols...',
		'Calendar of union meetings, events, and training sessions.',
		true,
		true,   -- Members only
		2,
		now()
	) ON CONFLICT (union_id, slug) DO NOTHING;

	-- Create "Contact" page
	INSERT INTO union_pages (
		union_id, title, slug, content, excerpt, is_published, is_members_only, sort_order, published_at
	) VALUES (
		v_union_id,
		'Contact Us',
		'contact',
		'# Contact Us

## Office Hours
Monday - Friday: 9:00 AM - 5:00 PM

## Phone
(555) 123-4567

## Email
info@atu123.org

## Address
123 Union Street, Suite 100
New York, NY 10001',
		'Get in touch with ATU Local 123.',
		true,
		false,
		3,
		now()
	) ON CONFLICT (union_id, slug) DO NOTHING;

END $$;
--> statement-breakpoint

-- ============================================================================
-- EXAMPLE 4: Create sample users and member relationships
-- ============================================================================

-- Create sample users (passwords are hashed "password123")
INSERT INTO users (name, email, password_hash, role, created_at)
VALUES
	('John Smith', 'john@atu123.org', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'owner', now()),
	('Jane Doe', 'jane@atu123.org', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'member', now()),
	('Bob Wilson', 'bob@ibew456.org', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'owner', now())
ON CONFLICT (email) DO NOTHING;
--> statement-breakpoint

-- Link users to unions
DO $$
DECLARE
	v_atu_id INTEGER;
	v_ibew_id INTEGER;
	v_john_id INTEGER;
	v_jane_id INTEGER;
	v_bob_id INTEGER;
BEGIN
	-- Get IDs
	SELECT id INTO v_atu_id FROM unions WHERE slug = 'atu123';
	SELECT id INTO v_ibew_id FROM unions WHERE slug = 'ibew456';
	SELECT id INTO v_john_id FROM users WHERE email = 'john@atu123.org';
	SELECT id INTO v_jane_id FROM users WHERE email = 'jane@atu123.org';
	SELECT id INTO v_bob_id FROM users WHERE email = 'bob@ibew456.org';

	-- John is owner of ATU Local 123
	INSERT INTO members (user_id, union_id, role, joined_at)
	VALUES (v_john_id, v_atu_id, 'owner', now())
	ON CONFLICT (user_id) DO NOTHING;

	-- Jane is member of ATU Local 123
	INSERT INTO members (user_id, union_id, role, joined_at)
	VALUES (v_jane_id, v_atu_id, 'member', now())
	ON CONFLICT (user_id) DO NOTHING;

	-- Bob is owner of IBEW Local 456
	INSERT INTO members (user_id, union_id, role, joined_at)
	VALUES (v_bob_id, v_ibew_id, 'owner', now())
	ON CONFLICT (user_id) DO NOTHING;

END $$;
--> statement-breakpoint

-- ============================================================================
-- COMMON QUERY PATTERNS
-- ============================================================================
-- Below are example queries for common operations
-- (These are comments, not executable in migration)
-- ============================================================================

-- Query 1: Get union by slug with member count
-- SELECT
--     u.*,
--     COUNT(m.id) as member_count
-- FROM unions u
-- LEFT JOIN members m ON m.union_id = u.id
-- WHERE u.slug = 'atu123'
-- GROUP BY u.id;

-- Query 2: Get all published pages for a union
-- SELECT *
-- FROM union_pages
-- WHERE union_id = (SELECT id FROM unions WHERE slug = 'atu123')
--   AND is_published = true
-- ORDER BY sort_order ASC;

-- Query 3: Check if user is member of a specific union
-- SELECT m.*
-- FROM members m
-- JOIN unions u ON u.id = m.union_id
-- WHERE m.user_id = 1
--   AND u.slug = 'atu123';

-- Query 4: Get user's union details
-- SELECT u.*
-- FROM unions u
-- JOIN members m ON m.union_id = u.id
-- WHERE m.user_id = 1;

-- Query 5: Check slug availability
-- SELECT EXISTS (
--     SELECT 1 FROM unions WHERE slug = 'newunion123'
-- ) as slug_taken;

-- Query 6: Generate next available slug
-- SELECT generate_unique_slug('atu123');  -- Returns 'atu123-2' if 'atu123' exists

-- Query 7: Get all members of a union with user details
-- SELECT
--     u.id,
--     u.name,
--     u.email,
--     m.role,
--     m.joined_at
-- FROM members m
-- JOIN users u ON u.id = m.user_id
-- JOIN unions un ON un.id = m.union_id
-- WHERE un.slug = 'atu123'
-- ORDER BY m.joined_at DESC;

-- Query 8: Get union activity logs
-- SELECT
--     al.*,
--     u.name as user_name,
--     u.email as user_email
-- FROM activity_logs al
-- LEFT JOIN users u ON u.id = al.user_id
-- JOIN unions un ON un.id = al.union_id
-- WHERE un.slug = 'atu123'
-- ORDER BY al.timestamp DESC
-- LIMIT 50;

-- Query 9: Search unions by name or local number
-- SELECT *
-- FROM unions
-- WHERE
--     name ILIKE '%transit%'
--     OR local_number ILIKE '%123%'
-- ORDER BY name ASC;

-- Query 10: Get pending invitations for a union
-- SELECT
--     i.*,
--     u.name as invited_by_name
-- FROM invitations i
-- JOIN users u ON u.id = i.invited_by
-- JOIN unions un ON un.id = i.union_id
-- WHERE un.slug = 'atu123'
--   AND i.status = 'pending'
-- ORDER BY i.invited_at DESC;

-- ============================================================================
-- VALIDATION TESTS
-- ============================================================================
-- These queries help verify the migration worked correctly
-- ============================================================================

-- Test 1: Verify unions were created
-- SELECT COUNT(*) as union_count FROM unions;

-- Test 2: Verify slug constraints work
-- Test reserved slug (should fail):
-- INSERT INTO unions (name, slug) VALUES ('Test Union', 'dashboard');

-- Test invalid slug format (should fail):
-- INSERT INTO unions (name, slug) VALUES ('Test Union', 'Invalid Slug!');

-- Test 3: Verify single-union-per-user constraint
-- This should fail if user already has a union:
-- INSERT INTO members (user_id, union_id, role) VALUES (1, 2, 'member');

-- Test 4: Verify foreign key cascade deletes
-- Deleting a union should delete its pages and members:
-- DELETE FROM unions WHERE slug = 'test-union';

-- Test 5: Verify updated_at auto-updates
-- UPDATE unions SET name = 'Updated Name' WHERE slug = 'atu123';
-- SELECT name, updated_at FROM unions WHERE slug = 'atu123';

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================
-- Created:
-- - 4 sample unions (ATU, IBEW, UAW, SEIU)
-- - 3 sample users (John, Jane, Bob)
-- - 3 member relationships
-- - 3 sample pages for ATU Local 123 (benefits, events, contact)
--
-- Test credentials:
-- - john@atu123.org / password123 (ATU owner)
-- - jane@atu123.org / password123 (ATU member)
-- - bob@ibew456.org / password123 (IBEW owner)
-- ============================================================================
