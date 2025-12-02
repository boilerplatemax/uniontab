-- Migration: Add email usage tracking to unions
-- Run this in your database to add monthly email limit tracking for unions

-- Add email usage tracking fields to unions table
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS monthly_emails_sent INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_usage_reset_date TIMESTAMP NOT NULL DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month');

-- Add comment
COMMENT ON COLUMN unions.monthly_emails_sent IS 'Number of emails sent in the current month';
COMMENT ON COLUMN unions.email_usage_reset_date IS 'Date when the monthly email counter will be reset';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_unions_email_usage_reset_date ON unions(email_usage_reset_date);
