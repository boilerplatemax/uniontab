# Fix for "Row-Level Security Policy" Upload Error

## Problem
When uploading files, you get: **"new row violates row-level security policy"**

This happens because your Supabase storage bucket needs proper policies configured.

---

## Quick Fix (2 minutes)

### Step 1: Create the Storage Bucket

1. Open your **Supabase Dashboard**
2. Go to **Storage** (in left sidebar)
3. Click **"New bucket"**
4. Settings:
   - **Name**: `union-files`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: 10 MB (or whatever you prefer)
5. Click **"Create bucket"**

### Step 2: Configure RLS Policies

**Option A: Simple (Recommended for Development)**

1. In the Storage section, click on your `union-files` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. Choose **"For full customization"**
5. Create this policy:
   - **Name**: `Allow public uploads`
   - **Allowed operation**: `INSERT`, `SELECT`, `UPDATE`, `DELETE` (check all)
   - **Target roles**: `authenticated`, `anon` (check both)
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`

**Option B: Secure (Recommended for Production)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file `SUPABASE_STORAGE_SETUP.sql` (in your project root)
3. Copy and paste the SQL into the editor
4. Click **"Run"**

This creates policies that:
- ✅ Allow public read access (for viewing files)
- ✅ Allow authenticated users to upload
- ✅ Allow users to manage their own files

---

## Step 3: Verify the Fix

After setting up the bucket and policies:

1. Go back to your app
2. Try uploading an image again
3. It should now work! ✅

---

## Still Getting Errors?

### Error: "bucket not found"
- Make sure the bucket name is exactly `union-files` (no spaces, lowercase)
- Check that the bucket exists in Storage section

### Error: "Invalid JWT" or "auth.role() does not exist"
- Your Supabase anon key might be incorrect
- Check `.env` file has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: "permission denied for table objects"
- Make sure you're logged in as project owner in Supabase Dashboard
- Try Option A above (simpler policy setup)

---

## Need Help?

If none of this works, share the exact error message and I can help debug!
