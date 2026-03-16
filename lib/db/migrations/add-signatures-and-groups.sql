-- Migration: Add member signatures and custom member groups
-- Date: 2026-03-16

-- Feature 1: Member Signatures
ALTER TABLE members ADD COLUMN IF NOT EXISTS signature_html TEXT;
COMMENT ON COLUMN members.signature_html IS 'Rich text HTML signature for posts and emails (owner/admin only)';

-- Feature 2: Custom Member Groups
CREATE TABLE IF NOT EXISTS member_groups (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_union_group_name UNIQUE (union_id, name)
);

CREATE TABLE IF NOT EXISTS member_group_assignments (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_group_member UNIQUE (group_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_groups_union_id ON member_groups(union_id);
CREATE INDEX IF NOT EXISTS idx_member_group_assignments_group_id ON member_group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_member_group_assignments_member_id ON member_group_assignments(member_id);
