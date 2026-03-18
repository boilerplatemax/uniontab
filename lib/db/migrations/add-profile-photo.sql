-- Add profile photo URL column to members table
-- Part of Phase 1: Member Profile Photos (backlog item #4)
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
