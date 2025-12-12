-- Migration: Add Grievance Tracking System
-- This migration adds tables and fields to support comprehensive grievance tracking for union members

-- Step 1: Create grievances table for tracking grievance cases
CREATE TABLE IF NOT EXISTS grievances (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Grievance details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100), -- 'workplace', 'disciplinary', 'contract', 'harassment', 'safety', 'other'

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'assigned', 'under_review', 'awaiting_response', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Assignment
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Steward/admin handling the case
  assigned_at TIMESTAMP,

  -- Resolution
  resolution_notes TEXT,
  resolution_outcome VARCHAR(50), -- 'upheld', 'denied', 'partially_upheld', 'withdrawn', 'settled'
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Step 2: Create grievance_comments table for messages/notes within grievances
CREATE TABLE IF NOT EXISTS grievance_comments (
  id SERIAL PRIMARY KEY,
  grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,

  -- Comment details
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes only visible to admins/stewards

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Step 3: Create grievance_attachments table for file uploads
CREATE TABLE IF NOT EXISTS grievance_attachments (
  id SERIAL PRIMARY KEY,
  grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,

  -- File details
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,

  -- Metadata
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 4: Create grievance_categories table for admin-managed categories
CREATE TABLE IF NOT EXISTS grievance_categories (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_union_category UNIQUE (union_id, name)
);

-- Step 5: Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_grievances_union_id ON grievances(union_id);
CREATE INDEX IF NOT EXISTS idx_grievances_member_id ON grievances(member_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_priority ON grievances(priority);
CREATE INDEX IF NOT EXISTS idx_grievances_assigned_to ON grievances(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievances_category ON grievances(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievances_created_at ON grievances(created_at);
CREATE INDEX IF NOT EXISTS idx_grievances_updated_at ON grievances(updated_at);

CREATE INDEX IF NOT EXISTS idx_grievance_comments_grievance_id ON grievance_comments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_comments_created_at ON grievance_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_grievance_comments_is_internal ON grievance_comments(is_internal);

CREATE INDEX IF NOT EXISTS idx_grievance_attachments_grievance_id ON grievance_attachments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_attachments_created_at ON grievance_attachments(created_at);

CREATE INDEX IF NOT EXISTS idx_grievance_categories_union_id ON grievance_categories(union_id);
CREATE INDEX IF NOT EXISTS idx_grievance_categories_is_active ON grievance_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_grievance_categories_sort_order ON grievance_categories(sort_order);

-- Step 6: Add comments for documentation
COMMENT ON TABLE grievances IS 'Tracks grievance cases submitted by union members';
COMMENT ON COLUMN grievances.title IS 'Brief title/summary of the grievance';
COMMENT ON COLUMN grievances.description IS 'Detailed description of the grievance';
COMMENT ON COLUMN grievances.category IS 'Type of grievance (workplace, disciplinary, contract, harassment, safety, other)';
COMMENT ON COLUMN grievances.status IS 'Current status of the grievance';
COMMENT ON COLUMN grievances.priority IS 'Priority level (low, medium, high, urgent)';
COMMENT ON COLUMN grievances.assigned_to IS 'User ID of steward/admin assigned to handle this grievance';
COMMENT ON COLUMN grievances.assigned_at IS 'Timestamp when grievance was assigned';
COMMENT ON COLUMN grievances.resolution_notes IS 'Notes about how the grievance was resolved';
COMMENT ON COLUMN grievances.resolution_outcome IS 'Outcome of the grievance resolution';
COMMENT ON COLUMN grievances.resolved_at IS 'Timestamp when grievance was marked as resolved';
COMMENT ON COLUMN grievances.closed_at IS 'Timestamp when grievance was closed/archived';

COMMENT ON TABLE grievance_comments IS 'Messages and notes within grievance cases';
COMMENT ON COLUMN grievance_comments.comment IS 'Content of the comment/note';
COMMENT ON COLUMN grievance_comments.is_internal IS 'Whether this note is internal (visible only to admins/stewards)';

COMMENT ON TABLE grievance_attachments IS 'File attachments for grievance cases';
COMMENT ON COLUMN grievance_attachments.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN grievance_attachments.file_url IS 'URL to the uploaded file';
COMMENT ON COLUMN grievance_attachments.file_type IS 'MIME type of the file';
COMMENT ON COLUMN grievance_attachments.file_size IS 'Size of the file in bytes';

COMMENT ON TABLE grievance_categories IS 'Admin-managed categories for organizing grievances';
COMMENT ON COLUMN grievance_categories.name IS 'Name of the category';
COMMENT ON COLUMN grievance_categories.description IS 'Description of when to use this category';
COMMENT ON COLUMN grievance_categories.is_active IS 'Whether this category is currently active/available';
COMMENT ON COLUMN grievance_categories.sort_order IS 'Order in which to display categories';
