-- Migration: Add announcements system
-- Run this in your database to add announcements (popups and banners)

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'popup' or 'banner'
  title VARCHAR(255), -- Optional for banners
  content TEXT NOT NULL,
  image_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT valid_announcement_type CHECK (type IN ('popup', 'banner'))
);

CREATE TABLE IF NOT EXISTS announcement_attachments (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dismissed_announcements (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  dismissed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_union_id ON announcements(union_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcement_attachments_announcement_id ON announcement_attachments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_announcements_announcement_id ON dismissed_announcements(announcement_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_announcements_user_id ON dismissed_announcements(user_id);

-- Add comments
COMMENT ON TABLE announcements IS 'Union announcements (popups and banners)';
COMMENT ON TABLE announcement_attachments IS 'File attachments for popup announcements';
COMMENT ON TABLE dismissed_announcements IS 'Track which users have dismissed which announcements';
