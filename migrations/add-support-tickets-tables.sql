-- Migration: Add support tickets system tables
-- This enables union admins to submit support tickets and webmaster to respond

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ticket details
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'bug_report', 'feature_request', 'general_inquiry', 'billing', 'technical_issue'

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'awaiting_response', 'resolved', 'closed'
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP
);

-- Support Ticket Replies table
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reply content
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN NOT NULL DEFAULT FALSE, -- True if reply is from webmaster/support

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Support Ticket Attachments table
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  reply_id INTEGER REFERENCES support_ticket_replies(id) ON DELETE CASCADE, -- Optional

  -- File details
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,

  -- Metadata
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_union_id ON support_tickets(union_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_user_id ON support_ticket_replies(user_id);

CREATE INDEX IF NOT EXISTS idx_support_ticket_attachments_ticket_id ON support_ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_attachments_reply_id ON support_ticket_attachments(reply_id);

-- Add comments
COMMENT ON TABLE support_tickets IS 'Support tickets submitted by union admins/owners';
COMMENT ON TABLE support_ticket_replies IS 'Replies to support tickets from users and support staff';
COMMENT ON TABLE support_ticket_attachments IS 'File attachments for support tickets and replies';
COMMENT ON COLUMN support_tickets.category IS 'Category: bug_report, feature_request, general_inquiry, billing, technical_issue';
COMMENT ON COLUMN support_tickets.status IS 'Status: open, in_progress, awaiting_response, resolved, closed';
COMMENT ON COLUMN support_tickets.priority IS 'Priority: low, normal, high, urgent';
COMMENT ON COLUMN support_ticket_replies.is_staff_reply IS 'True if this reply is from UnionTab support staff (webmaster)';
