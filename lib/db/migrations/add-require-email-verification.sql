-- Add require_email_verification flag to unions table
-- When set to false, members can sign up without verifying their email address.
-- Sitemasters can toggle this per-union from the admin panel.
-- Default is true (email verification required) to preserve existing behaviour.

ALTER TABLE unions
  ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN NOT NULL DEFAULT TRUE;
