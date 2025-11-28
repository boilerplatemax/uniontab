# Database Schema Improvements - Summary

## Overview
Your database schema has been reviewed and improved to ensure solid architecture for your union management SaaS platform.

## ✅ Schema Review Results

### Tables Status
All required tables are properly configured:

1. **`users`** ✅ - Paying customers/admins who manage unions
   - **Fixed:** Name field is now required (NOT NULL)
   - Stores: id, name, email, password_hash, role, timestamps

2. **`unions`** ✅ - Union organizations
   - **Fixed:** Slug format now follows {unionname}{localnumber} pattern (e.g., "atu123")
   - **Fixed:** Slug uniqueness is strictly enforced
   - **Fixed:** Local number is now optional
   - Stores: name, slug, local_number, contact info, branding, subscription data

3. **`members`** ✅ - Join table connecting users to unions
   - Purpose: Associates users with their unions
   - Constraint: Each user can only belong to ONE union (user_id is unique)
   - Stores: user_id, union_id, role, joined_at

4. **`invitations`** ✅ - Pending member invitations
   - Stores: union_id, email, role, invited_by, status

5. **`activity_logs`** ✅ - Activity tracking
   - Stores: union_id, user_id, action, timestamp, ip_address

6. **`union_pages`** ✅ - Custom pages for unions (newly added to schema.ts)
   - Purpose: Allows unions to create custom content pages
   - Stores: title, slug, content, publish status, member-only flag

### Users vs Members - Clarification

**Users** are the individual people who sign up and use your platform. They are the paying customers/admins.

**Members** is the join table that connects users to unions. When a user creates or joins a union, a record is created in the members table linking that user to the union with a specific role (owner, admin, member, etc.).

This design is **correct** for your use case because:
- Users can be admins who manage union websites
- The members table tracks which union each user belongs to
- Each user can only belong to one union (enforced by unique constraint on user_id)

## 🔧 Changes Made

### 1. Schema Changes (lib/db/schema.ts)
- ✅ Made `name` field required in users table
- ✅ Added `union_pages` table with proper relations
- ✅ Added `boolean` type import for union_pages
- ✅ Added type exports for UnionPage and NewUnionPage

### 2. Sign-Up Form Changes (app/(login)/login.tsx)
- ✅ Added "Your Name" field (required)
- ✅ Made local number truly optional in UI
- ✅ Updated placeholder examples (e.g., "ATU" for union name, "123" for local)
- ✅ Added real-time slug preview showing what the URL will be

### 3. Sign-Up Logic Changes (app/(login)/actions.ts)
- ✅ Added `name` to sign-up schema validation (required, max 100 chars)
- ✅ Made `localNumber` optional in validation
- ✅ Updated slug generation to remove dashes: `{unionname}{localnumber}`
  - Example: "ATU" + "123" = "atu123" (not "atu-123")
  - Example: "ATU" + "" = "atu"
- ✅ **Enforced strict slug uniqueness** - signup is prevented if slug exists
- ✅ Improved error messages for slug conflicts
- ✅ Store user name in database when creating account

### 4. Slug Validation Logic

**How it works:**
1. Union name is converted to lowercase, non-alphanumeric removed: "ATU Workers" → "atu"
2. Local number (if provided) is converted: "Local 123" → "123"
3. They're concatenated: "atu" + "123" = "atu123"
4. System checks if "atu123" already exists
5. **If it exists, signup is REJECTED** with clear error message
6. **No auto-incrementing** - user must choose different name/number

**Examples:**
- Input: "ATU", "123" → Slug: "atu123"
- Input: "United Workers", "456" → Slug: "unitedworkers456"
- Input: "SEIU", "" → Slug: "seiu"

## 📦 Supabase Migration SQL

A complete migration SQL file has been created at:
**`lib/db/migrations/COMPLETE_SCHEMA_RESET.sql`**

### What This Script Does

1. **Drops all existing tables** (⚠️ DELETES ALL DATA)
2. **Creates all tables** with correct schema
3. **Adds all constraints:**
   - Primary keys
   - Foreign keys with proper CASCADE behavior
   - Unique constraints
   - Check constraints (slug format, reserved slugs)
4. **Creates helper functions:**
   - `check_reserved_slug()` - Prevents use of reserved slugs
   - `update_updated_at_column()` - Auto-updates timestamps
5. **Enables Row Level Security (RLS)**
6. **Adds RLS policies** for proper access control
7. **Grants permissions** to authenticated users

### How to Use the Migration

#### ⚠️ WARNING: This will DELETE ALL existing data!

**For Fresh Database Setup:**
```sql
-- Copy the entire contents of COMPLETE_SCHEMA_RESET.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

**For Existing Database with Data:**
You should create a separate migration that only alters existing tables:
1. Backup your data first
2. Modify individual tables instead of dropping them
3. Run migrations in this order:
   - Add new columns
   - Update constraints
   - Migrate data
   - Add new tables

#### Step-by-Step Migration Process

1. **Go to Supabase Dashboard** → SQL Editor

2. **Create a new query**

3. **Copy and paste** the entire `COMPLETE_SCHEMA_RESET.sql` file

4. **Review the script** to ensure you understand what it does

5. **Run the script** - this will:
   - Drop all existing tables
   - Create fresh tables with correct schema
   - Set up RLS policies
   - Enable all constraints

6. **Verify** the migration:
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check constraints
   SELECT * FROM information_schema.table_constraints
   WHERE table_schema = 'public';
   ```

## 🎯 Key Features

### Slug Uniqueness Enforcement

**Database Level:**
- Unique constraint on `unions.slug`
- Check constraint ensures format: `^[a-z0-9]+$` (alphanumeric only, no dashes)
- Minimum length: 3 characters

**Application Level:**
- Validation checks if slug exists before creating union
- Returns clear error message if duplicate found
- No auto-increment numbering - forces unique combination

**Reserved Slugs:**
These slugs are blocked to prevent conflicts with app routes:
- dashboard, sign-in, sign-up, onboarding, api, pricing
- about, contact, terms, privacy, admin, settings, help
- support, billing, account, profile, login, logout, register

### User Name Requirement

**Database:**
```sql
"name" varchar(100) NOT NULL
```

**Application:**
- Sign-up form includes "Your Name" field
- Validation requires name (1-100 characters)
- Name is stored when user account is created

### Union Pages (Future Feature)

The `union_pages` table is ready for when you want to add custom page functionality:
- Each union can create multiple custom pages
- Pages can be published or draft
- Pages can be public or members-only
- Pages have SEO metadata (title, description)
- Pages are ordered by sort_order

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies for:

**Users:**
- Can view/update their own data
- Anyone can sign up (insert)

**Unions:**
- Public: Can view published unions
- Members: Can view their own union (even unpublished)
- Owners: Can update their union
- Authenticated: Can create new unions

**Members:**
- Can view members of their own union
- Can add themselves (signup flow)
- Owners can add/remove other members

**Invitations:**
- Owners can manage invitations
- Invited users can view their invitations
- Invited users can update status (accept/decline)

**Activity Logs:**
- Owners can view their union's logs
- System can always insert logs

**Union Pages:**
- Public: Can view published, non-member-only pages
- Members: Can view all pages of their union
- Owners: Can create/update/delete pages

## 🚀 Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Test user signup** with the name field
3. **Test slug generation** - try creating unions with different name/number combinations
4. **Test duplicate prevention** - try creating a union with same name+number twice
5. **Verify RLS policies** work correctly
6. **Update your application code** if needed to work with the new schema

## 📝 Testing Checklist

- [ ] User signup requires name
- [ ] Slug format is correct: {unionname}{localnumber}
- [ ] Duplicate slugs are rejected
- [ ] Local number is optional
- [ ] Reserved slugs are blocked
- [ ] RLS policies prevent unauthorized access
- [ ] Members can only see their own union data
- [ ] Owners can manage their union

## 🆘 Support

If you encounter any issues:
1. Check the error message - they're designed to be clear
2. Verify your Supabase connection
3. Check RLS policies if you get permission errors
4. Review the SQL migration for any failed steps

---

**All changes have been committed and pushed to branch:**
`claude/improve-database-schema-01Nwvuze7uZAktY3Go1e2gkd`
