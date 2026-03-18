-- Post Comments system (Phase 2 of backlog item #4)

-- Global toggle on unions
ALTER TABLE unions ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT true;

-- Per-post toggle
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT true;

-- Comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER, -- nullable, for future threading (no FK constraint yet)
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast comment lookups by post
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
-- Index for user's comments (profile page, moderation)
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
