-- Fix members table to allow users to join multiple unions
-- Remove unique constraint on user_id and add compound unique on (union_id, user_id)

-- Drop existing unique constraint on user_id if it exists
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_user_id_unique;

-- Add compound unique constraint to prevent same user from joining same union twice
ALTER TABLE members ADD CONSTRAINT idx_members_unique_user_union UNIQUE (union_id, user_id);
