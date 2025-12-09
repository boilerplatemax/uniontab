-- Migration: Add union_email_domains table for multi-subdomain email sending
-- This enables each tenant to send emails from their own verified subdomain

CREATE TABLE IF NOT EXISTS union_email_domains (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE UNIQUE,

  -- Subdomain configuration
  subdomain VARCHAR(100) NOT NULL UNIQUE,
  full_domain VARCHAR(255) NOT NULL UNIQUE,

  -- SendGrid configuration
  sendgrid_domain_id TEXT UNIQUE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_verification_attempt TIMESTAMP,
  verification_error TEXT,

  -- DNS Records (stored as JSON for reference)
  dns_records JSONB,
  cloudflare_record_ids JSONB,

  -- Rate limiting counters
  emails_sent_today INTEGER NOT NULL DEFAULT 0,
  emails_sent_this_hour INTEGER NOT NULL DEFAULT 0,
  emails_sent_this_minute INTEGER NOT NULL DEFAULT 0,
  last_email_sent_at TIMESTAMP,
  daily_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),
  hourly_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),
  minute_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Abuse protection
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_union_email_domains_union_id ON union_email_domains(union_id);
CREATE INDEX IF NOT EXISTS idx_union_email_domains_subdomain ON union_email_domains(subdomain);
CREATE INDEX IF NOT EXISTS idx_union_email_domains_verification_status ON union_email_domains(verification_status);
CREATE INDEX IF NOT EXISTS idx_union_email_domains_is_blocked ON union_email_domains(is_blocked);

-- Add comment to table
COMMENT ON TABLE union_email_domains IS 'Stores subdomain configuration for per-tenant email sending with SendGrid';
COMMENT ON COLUMN union_email_domains.verification_status IS 'Status: pending, verifying, verified, failed';
COMMENT ON COLUMN union_email_domains.dns_records IS 'JSON array of DNS records created in Cloudflare';
COMMENT ON COLUMN union_email_domains.cloudflare_record_ids IS 'JSON array of Cloudflare DNS record IDs for cleanup';
