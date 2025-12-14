-- Migration: Add Meetings Management System
-- This migration adds tables for managing union meetings with video conferencing integration

-- Step 1: Create meetings table for scheduling and tracking meetings
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,

  -- Meeting details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  agenda TEXT,

  -- Schedule
  scheduled_date TIMESTAMP NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- e.g., "14:00"
  end_time VARCHAR(10), -- e.g., "15:00"
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',

  -- Video conferencing
  platform VARCHAR(20) NOT NULL DEFAULT 'zoom', -- 'zoom', 'google_meet', 'custom'
  meeting_link TEXT, -- The join URL
  meeting_id VARCHAR(100), -- Platform-specific meeting ID
  meeting_password VARCHAR(100), -- Optional password

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'

  -- Access control
  is_private BOOLEAN NOT NULL DEFAULT true, -- Members only by default

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Step 2: Create meeting_invites table for tracking invitations
CREATE TABLE IF NOT EXISTS meeting_invites (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Invite status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'opened', 'accepted', 'declined'
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure each member can only be invited once per meeting
  CONSTRAINT unique_meeting_member UNIQUE (meeting_id, member_id)
);

-- Step 3: Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_meetings_union_id ON meetings(union_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date ON meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_meetings_platform ON meetings(platform);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

CREATE INDEX IF NOT EXISTS idx_meeting_invites_meeting_id ON meeting_invites(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invites_member_id ON meeting_invites(member_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invites_status ON meeting_invites(status);
CREATE INDEX IF NOT EXISTS idx_meeting_invites_sent_at ON meeting_invites(sent_at);

-- Step 4: Add comments for documentation
COMMENT ON TABLE meetings IS 'Tracks scheduled meetings with video conferencing support';
COMMENT ON COLUMN meetings.title IS 'Title of the meeting';
COMMENT ON COLUMN meetings.description IS 'Detailed description of the meeting purpose';
COMMENT ON COLUMN meetings.agenda IS 'Meeting agenda or topics to be discussed';
COMMENT ON COLUMN meetings.scheduled_date IS 'Date of the scheduled meeting';
COMMENT ON COLUMN meetings.start_time IS 'Start time in HH:MM format';
COMMENT ON COLUMN meetings.end_time IS 'End time in HH:MM format';
COMMENT ON COLUMN meetings.timezone IS 'Timezone for the meeting (e.g., America/New_York)';
COMMENT ON COLUMN meetings.platform IS 'Video conferencing platform (zoom, google_meet, custom)';
COMMENT ON COLUMN meetings.meeting_link IS 'Join URL for the video conference';
COMMENT ON COLUMN meetings.meeting_id IS 'Platform-specific meeting identifier';
COMMENT ON COLUMN meetings.meeting_password IS 'Password to join the meeting (if required)';
COMMENT ON COLUMN meetings.status IS 'Current status of the meeting';
COMMENT ON COLUMN meetings.is_private IS 'Whether meeting is restricted to members only';

COMMENT ON TABLE meeting_invites IS 'Tracks meeting invitations sent to members';
COMMENT ON COLUMN meeting_invites.status IS 'Status of the invitation (pending, sent, opened, accepted, declined)';
COMMENT ON COLUMN meeting_invites.sent_at IS 'Timestamp when invitation was sent';
COMMENT ON COLUMN meeting_invites.responded_at IS 'Timestamp when member responded to invitation';
