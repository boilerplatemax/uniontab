-- Migration: Fix missing union columns
-- This migration ensures all required columns exist on the unions table
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add about_images column (stores array of image URLs for about section)
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS about_images JSONB;

-- Add social_links column (stores social media URLs)
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS social_links JSONB;

-- Add show_social_in_header column
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS show_social_in_header BOOLEAN NOT NULL DEFAULT FALSE;

-- Add theme column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) NOT NULL DEFAULT 'default';

-- Add theme_color column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) NOT NULL DEFAULT '#2563eb';

-- Add accessibility_widget_enabled column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS accessibility_widget_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add monthly_emails_sent column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS monthly_emails_sent INTEGER NOT NULL DEFAULT 0;

-- Add email_usage_reset_date column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS email_usage_reset_date TIMESTAMP NOT NULL DEFAULT NOW();

-- Add storage_used_bytes column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS storage_used_bytes INTEGER NOT NULL DEFAULT 0;

-- Add estimated_member_count column if missing
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS estimated_member_count VARCHAR(50);

-- Add public_name column if missing (in case it was dropped)
ALTER TABLE unions
ADD COLUMN IF NOT EXISTS public_name VARCHAR(255);
