-- ============================================================================
-- CLEANUP: Delete old teams and team_members tables
-- ============================================================================
-- ⚠️ WARNING: Run this ONLY AFTER verifying the migration worked!
--
-- Before running this:
-- 1. Verify unions table has all your data
-- 2. Verify members table has all your data
-- 3. Test that your app works with new tables
--
-- This script will permanently delete:
-- - teams table
-- - team_members table
-- - team_id columns from invitations and activity_logs
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop old foreign key constraints
-- ============================================================================

-- Drop FK from invitations.team_id → teams.id
ALTER TABLE "invitations"
	DROP CONSTRAINT IF EXISTS "invitations_team_id_teams_id_fk";

-- Drop FK from activity_logs.team_id → teams.id
ALTER TABLE "activity_logs"
	DROP CONSTRAINT IF EXISTS "activity_logs_team_id_teams_id_fk";

-- ============================================================================
-- STEP 2: Drop old team_id columns
-- ============================================================================

-- Drop team_id from invitations (we're using union_id now)
ALTER TABLE "invitations"
	DROP COLUMN IF EXISTS "team_id";

-- Drop team_id from activity_logs (we're using union_id now)
ALTER TABLE "activity_logs"
	DROP COLUMN IF EXISTS "team_id";

-- ============================================================================
-- STEP 3: Drop old tables
-- ============================================================================

-- Drop team_members table (replaced by members)
DROP TABLE IF EXISTS "team_members";

-- Drop teams table (replaced by unions)
DROP TABLE IF EXISTS "teams";

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- Old tables removed:
-- ✅ teams → deleted (data preserved in unions)
-- ✅ team_members → deleted (data preserved in members)
-- ✅ team_id columns → deleted (using union_id instead)
-- ============================================================================

SELECT 'Cleanup complete! Old tables have been removed.' as status;
