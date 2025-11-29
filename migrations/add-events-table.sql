-- Migration: Add events table
-- Run this in your database to add the events feature

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location TEXT,
  media_url TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  start_time VARCHAR(10), -- e.g., "09:00"
  end_time VARCHAR(10), -- e.g., "17:00"
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  category VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_events_union_id ON events(union_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_end_date ON events(end_date);
CREATE INDEX idx_events_is_private ON events(is_private);

-- Add comment
COMMENT ON TABLE events IS 'Union events with calendar and scheduling information';
