-- Add thumbnail URL to files table for PDF first-page previews
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;
