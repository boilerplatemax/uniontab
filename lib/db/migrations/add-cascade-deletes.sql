-- Migration: Add cascade deletes for proper cleanup
-- This ensures that when members or users are deleted, all related data is cleaned up properly

-- 1. Fix email_logs to cascade delete when member is deleted
ALTER TABLE email_logs
  DROP CONSTRAINT IF EXISTS email_logs_member_id_fkey,
  DROP CONSTRAINT IF EXISTS email_logs_member_id_members_id_fk;

ALTER TABLE email_logs
  ADD CONSTRAINT email_logs_member_id_members_id_fk
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- 2. Fix election_votes to cascade delete when user is deleted
-- This ensures vote data is cleaned up when a user account is removed
ALTER TABLE election_votes
  DROP CONSTRAINT IF EXISTS election_votes_user_id_users_id_fk,
  ADD CONSTRAINT election_votes_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Fix members table to cascade delete when user is deleted
-- This ensures when a user account is deleted, their memberships are cleaned up
ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_user_id_users_id_fk,
  ADD CONSTRAINT members_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Fix other user references that should handle deletion gracefully
-- For activity_logs, set to NULL when user is deleted (for audit trail)
ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_user_id_users_id_fk,
  ADD CONSTRAINT activity_logs_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5. Fix invitations to set NULL when inviter is deleted (keep invitation record)
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_users_id_fk,
  ADD CONSTRAINT invitations_invited_by_users_id_fk
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. Fix post_likes to cascade delete when user is deleted
ALTER TABLE post_likes
  DROP CONSTRAINT IF EXISTS post_likes_user_id_users_id_fk,
  ADD CONSTRAINT post_likes_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Fix dismissed_announcements to cascade delete when user is deleted
ALTER TABLE dismissed_announcements
  DROP CONSTRAINT IF EXISTS dismissed_announcements_user_id_users_id_fk,
  ADD CONSTRAINT dismissed_announcements_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON CONSTRAINT email_logs_member_id_members_id_fk ON email_logs IS 'Cascade delete email logs when member is deleted';
COMMENT ON CONSTRAINT election_votes_user_id_users_id_fk ON election_votes IS 'Cascade delete votes when user account is deleted';
COMMENT ON CONSTRAINT members_user_id_users_id_fk ON members IS 'Cascade delete memberships when user account is deleted';
