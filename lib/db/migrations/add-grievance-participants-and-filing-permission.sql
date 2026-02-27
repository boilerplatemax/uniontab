-- Migration: Add Grievance Participants and Filing Permission
-- This migration adds:
--   1. grievance_filing_permission column to unions table (controls who can file grievances)
--   2. grievance_participants table (links additional members to grievances they are involved in)

-- Step 1: Add grievance_filing_permission to unions
ALTER TABLE unions
  ADD COLUMN IF NOT EXISTS grievance_filing_permission VARCHAR(20) NOT NULL DEFAULT 'all';

COMMENT ON COLUMN unions.grievance_filing_permission IS 'Controls who can file grievances: ''all'' = members and admins, ''admins_only'' = only admins/owners';

-- Step 2: Create grievance_participants table
CREATE TABLE IF NOT EXISTS grievance_participants (
  id SERIAL PRIMARY KEY,
  grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_grievance_participant UNIQUE (grievance_id, member_id)
);

-- Step 3: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grievance_participants_grievance_id ON grievance_participants(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_participants_member_id ON grievance_participants(member_id);

-- Step 4: Comments
COMMENT ON TABLE grievance_participants IS 'Members added as grievors/participants to a grievance by admins. They can view the grievance but not others.';
COMMENT ON COLUMN grievance_participants.member_id IS 'The member who is a grievor/participant in this grievance';
COMMENT ON COLUMN grievance_participants.added_by IS 'Admin/owner user who added this participant';
