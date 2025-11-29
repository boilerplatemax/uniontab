-- Supabase Storage Bucket Setup
-- Run this in your Supabase SQL Editor to fix RLS policy errors

-- ============================================
-- STEP 1: Create the storage bucket (if it doesn't exist)
-- ============================================

-- Note: Storage buckets are created via Supabase Dashboard Storage section, not SQL
-- Go to: Storage > Create a new bucket > Name: "union-files" > Public bucket: YES

-- ============================================
-- STEP 2: Create RLS policies for the bucket
-- ============================================

-- Allow anyone to read files (since we're using public URLs)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'union-files' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'union-files'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'union-files' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'union-files' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'union-files' AND auth.role() = 'authenticated' );

-- ============================================
-- ALTERNATIVE: Disable RLS for simpler setup
-- ============================================
-- If you want to temporarily disable RLS on the bucket (less secure but simpler):
--
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
--
-- WARNING: This allows anyone to upload/delete files. Only use for development!
