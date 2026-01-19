-- Add admin_permissions JSON field to members table
-- This field stores granular permissions for admin users
-- Owners have all permissions by default; this only affects 'admin' role members

ALTER TABLE members
ADD COLUMN IF NOT EXISTS admin_permissions JSON DEFAULT NULL;

-- Add a comment to document the field
COMMENT ON COLUMN members.admin_permissions IS 'JSON object with admin permission flags: { members, communications, dues, strikes, grievances, meetings, announcements, elections, settings, analytics }';
