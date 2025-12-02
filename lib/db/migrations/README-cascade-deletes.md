# Cascade Delete Migration

## Overview
This migration adds proper cascade delete constraints to the database schema to ensure data integrity when members or users are deleted.

## What This Fixes

### 1. Member Deletion Issues
Previously, when a member was deleted from the `/members` page:
- Only the `members` record was deleted
- The `users` record remained in the database
- This prevented the email from being reused for new signups
- Election votes and other related data remained orphaned

### 2. Union Deletion Issues
Previously, when a union was deleted by a webmaster:
- Member records were deleted
- But user accounts remained in the database
- This left orphaned user accounts that couldn't log in anywhere

## Changes Made

### Database Schema Updates (`add-cascade-deletes.sql`)
The migration adds or updates foreign key constraints with proper cascade behavior:

1. **Cascade Deletes** (child data deleted when parent is deleted):
   - `email_logs` → `members` (when member deleted, delete their email logs)
   - `election_votes` → `users` (when user deleted, delete their votes)
   - `members` → `users` (when user deleted, delete their memberships)
   - `post_likes` → `users` (when user deleted, delete their likes)
   - `dismissed_announcements` → `users` (when user deleted, delete their dismissals)
   - All union-related tables → `unions` (when union deleted, delete all related data)

2. **Set NULL** (reference set to null when parent deleted, preserving the record):
   - `activity_logs.user_id` → `users` (preserve audit trail)
   - `invitations.invited_by` → `users` (preserve invitation record)
   - Creator/updater fields in various tables (preserve content, just remove attribution)

### API Updates

#### Member Deletion (`/api/members/delete/route.ts`)
- Now checks if the user has memberships in other unions
- If no other memberships exist, deletes the user account entirely
- Cascade deletes automatically clean up votes, likes, etc.
- Returns `userDeleted: true/false` to indicate if the user was deleted

#### Union Deletion (`/api/admin/unions/[id]/route.ts`)
- After deleting the union and all members
- Checks each user to see if they have memberships in other unions
- Deletes orphaned user accounts (users with no other union memberships)
- Returns count of `orphanedUsersDeleted`

## How to Run This Migration

### Option 1: Using psql (Recommended)
```bash
psql -U your_username -d your_database -f lib/db/migrations/add-cascade-deletes.sql
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `add-cascade-deletes.sql`
4. Click "Run"

### Option 3: Using Drizzle Kit
If you're using Drizzle Kit for migrations:
```bash
# The schema.ts file has been updated with the cascade constraints
# Generate a new migration
npx drizzle-kit generate:pg

# Apply the migration
npx drizzle-kit push:pg
```

## Testing

After running the migration, test the following scenarios:

### Test Member Deletion
1. Create a test user and have them join a union
2. As owner, delete the member from `/members` page
3. Try to sign up with the same email - it should now work!
4. Check that the user record is gone from the database

### Test Union Deletion
1. Create a test union with some members
2. As webmaster, delete the union
3. Check that orphaned user accounts are deleted
4. Users who are members of other unions should remain

## Rollback

If you need to rollback this migration, you can restore the old constraints:

```sql
-- Example rollback for one table
ALTER TABLE email_logs
  DROP CONSTRAINT IF EXISTS email_logs_member_id_members_id_fk,
  ADD CONSTRAINT email_logs_member_id_members_id_fk
    FOREIGN KEY (member_id) REFERENCES members(id);
```

Note: You'll need to create a full rollback script for all tables if needed.

## Important Notes

⚠️ **Before Running in Production:**
1. **Backup your database** - This changes constraint behavior
2. **Test thoroughly** - Ensure cascade deletes work as expected
3. **Check for orphaned data** - Clean up any existing orphaned records first

💡 **What Gets Preserved:**
- Activity logs (audit trail) - user references set to NULL
- Content created by deleted users - attribution removed but content remains
- Invitation records - invitation history preserved

🗑️ **What Gets Deleted:**
- User votes when user is deleted
- User likes when user is deleted
- Email logs when member is deleted
- All union data when union is deleted
- User account when they have no union memberships
