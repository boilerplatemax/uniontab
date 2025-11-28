# Supabase Migration - Step by Step Guide

## Overview
You're migrating from a team-based SaaS to a union-based multi-tenant platform. Your current tables will be transformed and Row Level Security (RLS) will be enabled.

---

## Step 1: Backup Your Data (Important!)

Before running the migration, export your current data:

1. Go to Supabase Dashboard
2. Click **"Table Editor"**
3. For each table (`users`, `teams`, `team_members`, `invitations`, `activity_logs`):
   - Click the table name
   - Click **"..."** (three dots) → **"Download as CSV"**
   - Save the backup files

---

## Step 2: Run the Main Migration

1. Open Supabase Dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Open this file: `lib/db/migrations/SUPABASE_MIGRATION_WITH_RLS.sql`
5. **Copy and paste the entire file** into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for it to complete (should take 5-30 seconds)

### Expected Result:
You should see a success message and no errors. If you see errors, **STOP** and share them with me.

---

## Step 3: Verify the Migration Worked

### Check New Tables Exist
1. Go to **"Table Editor"**
2. Verify these new tables appear:
   - ✅ `unions`
   - ✅ `union_pages`
   - ✅ `members`

### Check Data Was Copied
1. Click on **`unions`** table
2. Verify you see your teams data (with auto-generated slugs)
3. Click on **`members`** table
4. Verify you see your team members data

### Check RLS is Enabled
1. Click on **`unions`** table
2. Look for a green shield icon 🛡️ next to the table name
3. Click **"RLS Policies"** tab
4. You should see several policies listed (e.g., "unions_select_public", "unions_update_owner")

---

## Step 4: Test RLS Policies (Optional but Recommended)

### Test 1: Public Access (No Auth)
Run this query in SQL Editor:
```sql
-- This should work (viewing published unions)
SELECT * FROM unions WHERE published_at IS NOT NULL;
```

### Test 2: Check Slug Generation
```sql
-- View generated slugs
SELECT id, name, slug FROM unions;
```

### Test 3: Test Reserved Slugs
```sql
-- This should FAIL with error "Slug is reserved"
INSERT INTO unions (name, slug) VALUES ('Test Union', 'dashboard');
```

### Test 4: Test Single-Union-Per-User
```sql
-- Get a test user_id
SELECT id FROM users LIMIT 1;

-- Try to join TWO unions (should fail on second insert)
INSERT INTO members (user_id, union_id, role) VALUES (1, 1, 'member');  -- Should work
INSERT INTO members (user_id, union_id, role) VALUES (1, 2, 'member');  -- Should FAIL
```

---

## Step 5: Update Your App Code (Later)

After the migration succeeds, you'll need to update your code:

### Update Environment Variables
If you're switching from regular PostgreSQL to Supabase:
```env
# Old (PostgreSQL)
POSTGRES_URL=postgresql://...

# New (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Install Supabase Client (if not already installed)
```bash
npm install @supabase/supabase-js
```

### Replace Drizzle with Supabase Client (Optional)
You can keep using Drizzle with Supabase's PostgreSQL connection, OR switch to Supabase client for built-in RLS support.

---

## Step 6: Clean Up Old Tables (After Testing)

**⚠️ ONLY run this after you've verified everything works!**

1. Test your app thoroughly with the new tables
2. Verify data looks correct
3. Once confident, run the cleanup:
   - Open SQL Editor
   - Open file: `lib/db/migrations/CLEANUP_OLD_TABLES.sql`
   - Copy and paste into SQL Editor
   - Click **"Run"**

This will permanently delete:
- `teams` table
- `team_members` table
- Old `team_id` columns

---

## Troubleshooting

### Error: "relation already exists"
- You may have already run the migration
- Check if `unions` table already exists in Table Editor
- If so, skip to Step 3 (Verify)

### Error: "permission denied"
- Make sure you're running the SQL as the database owner
- Check that you have admin access to your Supabase project

### Error: "auth.uid() does not exist"
- This is normal if you haven't set up Supabase Auth yet
- RLS policies will work once you integrate Supabase Auth in your app

### Some data is missing
- Check your backups from Step 1
- The migration uses `ON CONFLICT DO NOTHING`, so duplicate IDs are skipped
- You may need to manually reconcile data

### RLS policies are blocking everything
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE unions DISABLE ROW LEVEL SECURITY;
  ```
- Re-enable after testing:
  ```sql
  ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
  ```

---

## Migration Summary

### What Changed:
- ✅ `teams` → `unions` (with slugs)
- ✅ `team_members` → `members` (one union per user)
- ✅ `team_id` → `union_id` in invitations and activity_logs
- ✅ New `union_pages` table for custom pages
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Reserved slug protection
- ✅ Slug format validation
- ✅ Helper functions (generate_unique_slug, auto-update timestamps)

### What Stayed the Same:
- ✅ `users` table (unchanged)
- ✅ Your existing user data
- ✅ Stripe integration (stripe_customer_id, etc.)
- ✅ Authentication system (you'll need to integrate with Supabase Auth)

---

## Need Help?

If you run into issues:
1. Check the error message in Supabase SQL Editor
2. Verify you completed each step in order
3. Check your data backups from Step 1
4. Share the error message and I can help debug!

---

## Next Steps After Migration

Once the database is migrated, you'll move on to:
1. **Homepage & Landing** (Prompt 3 in your claude-instructions.txt)
2. **Onboarding Wizard** (Prompt 4)
3. **Dynamic Union Routes** (Prompt 5)
4. **Dashboard Updates** (Prompt 6)

For now, focus on getting the database migration working correctly! 🚀
