-- Migration: Add Strike Hub System
-- This migration adds comprehensive strike management capabilities including
-- strike events, picket scheduling, check-ins, announcements, incidents, and resources

-- Step 1: Create strikes table for main strike events
CREATE TABLE IF NOT EXISTS strikes (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,

  -- Strike details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  rules TEXT, -- Strike rules and guidelines

  -- Timeline
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'preparing', -- 'preparing', 'active', 'resolved'

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Step 2: Create picket_zones table for picket locations
CREATE TABLE IF NOT EXISTS picket_zones (
  id SERIAL PRIMARY KEY,
  strike_id INTEGER NOT NULL REFERENCES strikes(id) ON DELETE CASCADE,

  -- Zone details
  name VARCHAR(255) NOT NULL,
  location TEXT, -- Address or description of location
  notes TEXT, -- Additional instructions for this zone

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 3: Create picket_shifts table for scheduling shifts at zones
CREATE TABLE IF NOT EXISTS picket_shifts (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES picket_zones(id) ON DELETE CASCADE,

  -- Shift timing
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- e.g., "09:00"
  end_time VARCHAR(10) NOT NULL, -- e.g., "17:00"

  -- Capacity
  max_members INTEGER NOT NULL DEFAULT 10,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 4: Create picket_assignments table for member shift sign-ups and check-ins
CREATE TABLE IF NOT EXISTS picket_assignments (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER NOT NULL REFERENCES picket_shifts(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Check-in/out tracking for strike pay
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'signed_up', -- 'signed_up', 'checked_in', 'completed', 'no_show'

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Prevent duplicate assignments
  CONSTRAINT unique_shift_member UNIQUE (shift_id, member_id)
);

-- Step 5: Create strike_announcements table for strike-specific communications
CREATE TABLE IF NOT EXISTS strike_announcements (
  id SERIAL PRIMARY KEY,
  strike_id INTEGER NOT NULL REFERENCES strikes(id) ON DELETE CASCADE,

  -- Announcement details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Delivery method
  send_method VARCHAR(50) NOT NULL DEFAULT 'in_app', -- 'in_app', 'email', 'sms', 'push', 'all'

  -- Priority/urgency
  is_urgent BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Step 6: Create strike_incidents table for reporting incidents during strikes
CREATE TABLE IF NOT EXISTS strike_incidents (
  id SERIAL PRIMARY KEY,
  strike_id INTEGER NOT NULL REFERENCES strikes(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  zone_id INTEGER REFERENCES picket_zones(id) ON DELETE SET NULL, -- Optional zone reference

  -- Incident details
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  incident_type VARCHAR(50), -- 'safety', 'confrontation', 'injury', 'legal', 'media', 'other'

  -- Evidence
  file_url TEXT, -- Attached photo/video/document
  file_name VARCHAR(255),
  file_type VARCHAR(100),

  -- Resolution tracking
  status VARCHAR(20) NOT NULL DEFAULT 'reported', -- 'reported', 'under_review', 'resolved', 'escalated'
  resolution_notes TEXT,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 7: Create strike_resources table for documents and links
CREATE TABLE IF NOT EXISTS strike_resources (
  id SERIAL PRIMARY KEY,
  strike_id INTEGER NOT NULL REFERENCES strikes(id) ON DELETE CASCADE,

  -- Resource details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'document', 'link', 'video', 'image', 'other'

  -- File details (for uploaded documents)
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,

  -- External link (for links/videos)
  external_url TEXT,

  -- Organization
  category VARCHAR(100), -- 'legal', 'guidelines', 'contacts', 'media', 'training', 'other'
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Access control
  is_private BOOLEAN NOT NULL DEFAULT false, -- If true, only members can view

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Step 8: Create indexes for frequently queried fields

-- Strikes indexes
CREATE INDEX IF NOT EXISTS idx_strikes_union_id ON strikes(union_id);
CREATE INDEX IF NOT EXISTS idx_strikes_status ON strikes(status);
CREATE INDEX IF NOT EXISTS idx_strikes_start_date ON strikes(start_date);
CREATE INDEX IF NOT EXISTS idx_strikes_end_date ON strikes(end_date) WHERE end_date IS NOT NULL;

-- Picket zones indexes
CREATE INDEX IF NOT EXISTS idx_picket_zones_strike_id ON picket_zones(strike_id);
CREATE INDEX IF NOT EXISTS idx_picket_zones_is_active ON picket_zones(is_active) WHERE is_active = true;

-- Picket shifts indexes
CREATE INDEX IF NOT EXISTS idx_picket_shifts_zone_id ON picket_shifts(zone_id);
CREATE INDEX IF NOT EXISTS idx_picket_shifts_date ON picket_shifts(date);
CREATE INDEX IF NOT EXISTS idx_picket_shifts_date_zone ON picket_shifts(zone_id, date);

-- Picket assignments indexes
CREATE INDEX IF NOT EXISTS idx_picket_assignments_shift_id ON picket_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_picket_assignments_member_id ON picket_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_picket_assignments_status ON picket_assignments(status);
CREATE INDEX IF NOT EXISTS idx_picket_assignments_check_in ON picket_assignments(check_in_time) WHERE check_in_time IS NOT NULL;

-- Strike announcements indexes
CREATE INDEX IF NOT EXISTS idx_strike_announcements_strike_id ON strike_announcements(strike_id);
CREATE INDEX IF NOT EXISTS idx_strike_announcements_created_at ON strike_announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_strike_announcements_is_urgent ON strike_announcements(is_urgent) WHERE is_urgent = true;

-- Strike incidents indexes
CREATE INDEX IF NOT EXISTS idx_strike_incidents_strike_id ON strike_incidents(strike_id);
CREATE INDEX IF NOT EXISTS idx_strike_incidents_member_id ON strike_incidents(member_id);
CREATE INDEX IF NOT EXISTS idx_strike_incidents_zone_id ON strike_incidents(zone_id) WHERE zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_strike_incidents_severity ON strike_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_strike_incidents_status ON strike_incidents(status);
CREATE INDEX IF NOT EXISTS idx_strike_incidents_created_at ON strike_incidents(created_at);

-- Strike resources indexes
CREATE INDEX IF NOT EXISTS idx_strike_resources_strike_id ON strike_resources(strike_id);
CREATE INDEX IF NOT EXISTS idx_strike_resources_category ON strike_resources(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_strike_resources_sort_order ON strike_resources(sort_order);
CREATE INDEX IF NOT EXISTS idx_strike_resources_resource_type ON strike_resources(resource_type);

-- Step 9: Add comments for documentation

COMMENT ON TABLE strikes IS 'Main strike events created by union admins';
COMMENT ON COLUMN strikes.title IS 'Title of the strike event';
COMMENT ON COLUMN strikes.description IS 'Detailed description of the strike';
COMMENT ON COLUMN strikes.rules IS 'Strike rules and guidelines for participants';
COMMENT ON COLUMN strikes.status IS 'Current status: preparing, active, or resolved';

COMMENT ON TABLE picket_zones IS 'Physical locations for picket lines during a strike';
COMMENT ON COLUMN picket_zones.name IS 'Name/identifier for the zone';
COMMENT ON COLUMN picket_zones.location IS 'Physical address or description of the location';
COMMENT ON COLUMN picket_zones.notes IS 'Additional instructions or notes for this zone';

COMMENT ON TABLE picket_shifts IS 'Scheduled time slots for picketing at specific zones';
COMMENT ON COLUMN picket_shifts.date IS 'Date of the shift';
COMMENT ON COLUMN picket_shifts.start_time IS 'Start time in HH:MM format';
COMMENT ON COLUMN picket_shifts.end_time IS 'End time in HH:MM format';
COMMENT ON COLUMN picket_shifts.max_members IS 'Maximum number of members allowed for this shift';

COMMENT ON TABLE picket_assignments IS 'Member sign-ups and attendance tracking for picket shifts';
COMMENT ON COLUMN picket_assignments.check_in_time IS 'Timestamp when member checked in (for strike pay)';
COMMENT ON COLUMN picket_assignments.check_out_time IS 'Timestamp when member checked out (for strike pay)';
COMMENT ON COLUMN picket_assignments.status IS 'Assignment status: signed_up, checked_in, completed, no_show';

COMMENT ON TABLE strike_announcements IS 'Communications sent during a strike';
COMMENT ON COLUMN strike_announcements.send_method IS 'Delivery channel: in_app, email, sms, push, or all';
COMMENT ON COLUMN strike_announcements.is_urgent IS 'Whether this is an urgent/priority announcement';

COMMENT ON TABLE strike_incidents IS 'Reports of incidents during strikes';
COMMENT ON COLUMN strike_incidents.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN strike_incidents.incident_type IS 'Type: safety, confrontation, injury, legal, media, other';
COMMENT ON COLUMN strike_incidents.status IS 'Resolution status: reported, under_review, resolved, escalated';

COMMENT ON TABLE strike_resources IS 'Documents, links, and files related to a strike';
COMMENT ON COLUMN strike_resources.resource_type IS 'Type: document, link, video, image, other';
COMMENT ON COLUMN strike_resources.category IS 'Category: legal, guidelines, contacts, media, training, other';
COMMENT ON COLUMN strike_resources.is_private IS 'If true, only union members can access this resource';
