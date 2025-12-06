-- Migration: Add comprehensive member profile fields to members table
-- Run this migration to add detailed member information fields

-- Required fields (collected during sign-up)
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE members ADD COLUMN IF NOT EXISTS employer VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS worksite VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);

-- Optional fields
ALTER TABLE members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_id VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE members ADD COLUMN IF NOT EXISTS local_chapter VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS bargaining_unit VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS start_date_with_employer TIMESTAMP;

-- Admin-only notes field
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_employer ON members(employer) WHERE employer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status) WHERE membership_status IS NOT NULL;

-- Add comments
COMMENT ON COLUMN members.phone IS 'Member phone number';
COMMENT ON COLUMN members.employer IS 'Member employer name';
COMMENT ON COLUMN members.job_title IS 'Member job title or classification';
COMMENT ON COLUMN members.worksite IS 'Member worksite or location';
COMMENT ON COLUMN members.employment_status IS 'Employment status: full-time, part-time, casual, or term';
COMMENT ON COLUMN members.address IS 'Member mailing address';
COMMENT ON COLUMN members.date_of_birth IS 'Member date of birth';
COMMENT ON COLUMN members.member_id IS 'Member ID or number';
COMMENT ON COLUMN members.membership_status IS 'Membership status: active, inactive, or retired';
COMMENT ON COLUMN members.local_chapter IS 'Local or chapter assignment';
COMMENT ON COLUMN members.bargaining_unit IS 'Bargaining unit assignment';
COMMENT ON COLUMN members.start_date_with_employer IS 'Start date with current employer';
COMMENT ON COLUMN members.notes IS 'Admin-only notes about the member (not visible to member)';
