-- Migration: Add mass email system
-- Run this in your database to add mass email functionality for union owners/admins

CREATE TABLE IF NOT EXISTS mass_emails (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  recipient_filter VARCHAR(50) NOT NULL, -- 'all', 'approved', 'admin', 'pending', 'rejected', 'custom'
  custom_recipient_ids JSON, -- Array of member IDs for custom selection
  attachments JSON, -- Array of attachment URLs/names
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'failed'
  total_recipients INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_mass_email_status CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  CONSTRAINT valid_recipient_filter CHECK (recipient_filter IN ('all', 'approved', 'admin', 'pending', 'rejected', 'custom'))
);

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  mass_email_id INTEGER NOT NULL REFERENCES mass_emails(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_email_log_status CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mass_emails_union_id ON mass_emails(union_id);
CREATE INDEX IF NOT EXISTS idx_mass_emails_status ON mass_emails(status);
CREATE INDEX IF NOT EXISTS idx_mass_emails_created_by ON mass_emails(created_by);
CREATE INDEX IF NOT EXISTS idx_mass_emails_sent_at ON mass_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_mass_email_id ON email_logs(mass_email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_member_id ON email_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Add comments
COMMENT ON TABLE mass_emails IS 'Mass email campaigns sent by union owners/admins';
COMMENT ON TABLE email_logs IS 'Individual email delivery logs for mass email campaigns';
