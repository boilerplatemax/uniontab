-- Add file thumbnails setting to unions table
ALTER TABLE "unions" ADD COLUMN IF NOT EXISTS "file_thumbnails_enabled" boolean NOT NULL DEFAULT false;
