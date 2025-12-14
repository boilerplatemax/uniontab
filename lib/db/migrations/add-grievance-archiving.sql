-- Migration: Add Grievance Archiving
-- This migration adds archiving capabilities to grievances for better organization

-- Step 1: Add archiving fields to grievances table
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Create index for archived status
CREATE INDEX IF NOT EXISTS idx_grievances_is_archived ON grievances(is_archived) WHERE is_archived = false;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN grievances.is_archived IS 'Whether this grievance has been archived by admin/owner';
COMMENT ON COLUMN grievances.archived_at IS 'Timestamp when grievance was archived';
COMMENT ON COLUMN grievances.archived_by IS 'User ID who archived this grievance';
