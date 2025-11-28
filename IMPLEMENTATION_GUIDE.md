# Union Website Builder - Implementation Guide

This guide explains the files created and the next steps to implement your union website builder.

## Files Created

### 1. Architecture Documentation
**File:** `UNION_ARCHITECTURE.md`

Complete architectural overview including:
- High-level multi-tenancy model
- Data architecture diagrams
- Routing structure (current vs. new)
- Proposed folder structure
- Access control levels
- Migration strategy
- Technical considerations (slug generation, SEO, file storage)
- Security considerations

### 2. Database Migration Files

#### Primary Migration
**File:** `lib/db/migrations/0001_add_unions_schema.sql`

Comprehensive migration that:
- Creates `unions` table (replaces `teams`)
- Creates `union_pages` table for custom pages
- Creates `members` table (replaces `team_members`)
- Updates `invitations` and `activity_logs` to reference unions
- Migrates existing data from teams → unions
- Adds slug validation and reserved slug protection
- Enforces single-union-per-user constraint
- Includes helper functions for slug generation

**Key Features:**
- ✅ Unique slug validation with format checking
- ✅ Reserved slug protection (dashboard, api, admin, etc.)
- ✅ Single-union-per-user enforcement
- ✅ Auto-updating timestamps
- ✅ Cascade deletes for data integrity
- ✅ Comprehensive comments explaining each section

#### Seed Data & Examples
**File:** `lib/db/migrations/0002_seed_unions_examples.sql`

Provides:
- 4 sample unions (ATU, IBEW, UAW, SEIU)
- 3 sample users with hashed passwords
- 3 sample pages for demonstration
- Common query patterns (10+ examples)
- Validation tests

**Test Credentials:**
- `john@atu123.org` / `password123` (Owner of ATU Local 123)
- `jane@atu123.org` / `password123` (Member of ATU Local 123)
- `bob@ibew456.org` / `password123` (Owner of IBEW Local 456)

#### Rollback Migration (Optional)
**File:** `lib/db/migrations/0001_rollback_unions_schema.sql`

Safety net to revert changes if needed. **WARNING:** This deletes union-specific data.

---

## How to Apply the Migration

### Option 1: Using Drizzle Kit (Recommended)

Since your project uses Drizzle ORM, you'll need to update the schema first, then run migrations.

**Step 1:** Update `lib/db/schema.ts` with new tables (see Drizzle Schema section below)

**Step 2:** Generate and push migration
```bash
npx drizzle-kit push
```

### Option 2: Manual SQL Execution

If you prefer to run the SQL directly:

```bash
# Connect to your PostgreSQL database
psql $POSTGRES_URL

# Run the migration
\i lib/db/migrations/0001_add_unions_schema.sql

# Optional: Load seed data
\i lib/db/migrations/0002_seed_unions_examples.sql
```

### Option 3: Using Database GUI

1. Open your preferred database tool (pgAdmin, DBeaver, etc.)
2. Connect to your PostgreSQL database
3. Copy and execute the contents of `0001_add_unions_schema.sql`
4. Optionally run `0002_seed_unions_examples.sql`

---

## Next Steps: Drizzle Schema Update

You'll need to update `lib/db/schema.ts` to match the new SQL schema. Here's a skeleton:

```typescript
import { pgTable, serial, varchar, text, timestamp, integer, boolean, unique } from 'drizzle-orm/pg-core';

// Unions table (replaces teams)
export const unions = pgTable('unions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  localNumber: varchar('local_number', { length: 50 }),
  logoUrl: text('logo_url'),
  coverPhotoUrl: text('cover_photo_url'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  website: varchar('website', { length: 255 }),
  description: text('description'),
  about: text('about'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

// Union pages table
export const unionPages = pgTable('union_pages', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id').notNull().references(() => unions.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  isPublished: boolean('is_published').default(false).notNull(),
  isMembersOnly: boolean('is_members_only').default(false).notNull(),
  sortOrder: integer('sort_order').default(0),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  uniqueUnionSlug: unique().on(table.unionId, table.slug),
}));

// Members table (replaces team_members)
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  unionId: integer('union_id').notNull().references(() => unions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Update invitations table
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id').notNull().references(() => unions.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
});

// Update activity_logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id').notNull().references(() => unions.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
});
```

---

## Implementation Phases

### Phase 1: Database & Schema (Complete this first)
- ✅ Review architecture plan
- ✅ Review SQL migrations
- ⬜ Apply SQL migration to database
- ⬜ Update `lib/db/schema.ts` with Drizzle types
- ⬜ Update `lib/db/queries.ts` for union-specific queries
- ⬜ Test queries with seed data

### Phase 2: Authentication & Middleware
- ⬜ Update `middleware.ts` to handle `/[slug]` routes
- ⬜ Add union membership checks in `lib/auth/middleware.ts`
- ⬜ Update session handling for union context
- ⬜ Add "members-only" page protection

### Phase 3: Onboarding Wizard
- ⬜ Create `/onboarding` route group
- ⬜ Build step 1: Union name + local number form
- ⬜ Build step 2: Logo + cover photo upload
- ⬜ Build step 3: Contact information form
- ⬜ Build step 4: Preview & publish
- ⬜ Create slug generation utility
- ⬜ Add validation for reserved slugs

### Phase 4: Homepage & Landing
- ⬜ Redesign `/` with union search
- ⬜ Add "Create my website" CTA
- ⬜ Implement union search functionality
- ⬜ Create union directory (optional)

### Phase 5: Dynamic Union Routes
- ⬜ Create `app/(union)/[slug]` route group
- ⬜ Build union homepage template (cover + logo + contact)
- ⬜ Build `/[slug]/about` page
- ⬜ Build `/[slug]/contact` page
- ⬜ Build `/[slug]/members` protected area
- ⬜ Build `/[slug]/[pageSlug]` for custom pages
- ⬜ Add SEO metadata generation

### Phase 6: Dashboard Updates
- ⬜ Update dashboard to show union context
- ⬜ Create `/dashboard/pages` for page management
- ⬜ Create `/dashboard/members` for member management
- ⬜ Update `/dashboard/settings` for union settings
- ⬜ Build markdown page editor
- ⬜ Add image upload for logo/cover

### Phase 7: File Storage
- ⬜ Set up Vercel Blob / S3 / Cloudflare R2
- ⬜ Create upload endpoints
- ⬜ Add image optimization
- ⬜ Implement file size/type validation

### Phase 8: Testing & Polish
- ⬜ Test multi-tenant isolation
- ⬜ Test single-union-per-user enforcement
- ⬜ Test reserved slug protection
- ⬜ Add rate limiting
- ⬜ Optimize SEO (sitemaps, meta tags)
- ⬜ Performance testing (ISR, caching)
- ⬜ Security audit

---

## Key Technical Decisions to Make

### 1. File Storage Solution
**Options:**
- Vercel Blob (easiest if deploying to Vercel)
- AWS S3 (most popular, mature)
- Cloudflare R2 (S3-compatible, cheaper egress)
- Supabase Storage (if switching to Supabase)

**Recommendation:** Start with Vercel Blob for speed, migrate to S3 later if needed.

### 2. Custom Domains
**Question:** Should each union be able to use a custom domain (e.g., `atu123.com` → `/atu123`)?

**If yes:**
- Requires DNS management
- SSL certificate provisioning
- Additional Vercel configuration (or Cloudflare Workers)

**If no:**
- Simpler implementation
- All unions use `yourplatform.com/[slug]`

### 3. Subscription Tiers
**Current:** One subscription per team/union

**Proposed tiers:**
- **Free:** Basic homepage, 3 pages, 10 members
- **Pro:** Unlimited pages, unlimited members, custom domain, analytics

### 4. Email Notifications
**Question:** Should users receive email notifications for:
- New member joins
- Page published
- Subscription renewal
- Union settings changed

**If yes:** Integrate with Resend, SendGrid, or Postmark

### 5. Content Editor
**Options:**
- Markdown (simplest, what's in the schema)
- WYSIWYG (TipTap, Lexical)
- Block editor (EditorJS, Novel)

**Recommendation:** Start with markdown, add WYSIWYG later.

---

## Common Query Examples

### Get union by slug with member count
```sql
SELECT u.*, COUNT(m.id) as member_count
FROM unions u
LEFT JOIN members m ON m.union_id = u.id
WHERE u.slug = 'atu123'
GROUP BY u.id;
```

### Check if user is member of a union
```sql
SELECT EXISTS (
  SELECT 1 FROM members
  WHERE user_id = $1 AND union_id = (SELECT id FROM unions WHERE slug = $2)
) as is_member;
```

### Get all published pages for a union
```sql
SELECT * FROM union_pages
WHERE union_id = (SELECT id FROM unions WHERE slug = 'atu123')
  AND is_published = true
ORDER BY sort_order ASC;
```

### Generate unique slug
```sql
SELECT generate_unique_slug('atu123');  -- Returns 'atu123-2' if taken
```

---

## Testing the Migration

### 1. Verify tables exist
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('unions', 'union_pages', 'members');
```

### 2. Test slug validation
```sql
-- Should fail (reserved slug)
INSERT INTO unions (name, slug) VALUES ('Test', 'dashboard');

-- Should fail (invalid format)
INSERT INTO unions (name, slug) VALUES ('Test', 'Invalid Slug!');

-- Should succeed
INSERT INTO unions (name, slug) VALUES ('Test Union', 'test-union-123');
```

### 3. Test single-union constraint
```sql
-- Create a test user
INSERT INTO users (name, email, password_hash) VALUES ('Test', 'test@test.com', 'hash');

-- Join union 1 (should succeed)
INSERT INTO members (user_id, union_id, role) VALUES (
  (SELECT id FROM users WHERE email = 'test@test.com'),
  1,
  'member'
);

-- Try to join union 2 (should fail due to unique constraint)
INSERT INTO members (user_id, union_id, role) VALUES (
  (SELECT id FROM users WHERE email = 'test@test.com'),
  2,
  'member'
);
```

---

## Troubleshooting

### Migration fails with "table already exists"
- Check if you've already run the migration
- Use rollback script if needed
- Verify database state with `\dt` (psql)

### Drizzle schema doesn't match
- Run `npx drizzle-kit push` after updating `schema.ts`
- Check for type mismatches

### Slug generation conflicts
- Check `generate_unique_slug()` function exists
- Test with: `SELECT generate_unique_slug('test');`

### Foreign key violations
- Ensure data migration completed successfully
- Check existing relationships haven't been orphaned

---

## Resources

- **Drizzle ORM Docs:** https://orm.drizzle.team/
- **Next.js Dynamic Routes:** https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- **Vercel Blob Storage:** https://vercel.com/docs/storage/vercel-blob
- **Stripe Subscriptions:** https://stripe.com/docs/billing/subscriptions/overview

---

## Support

If you encounter issues:
1. Check the SQL comments in the migration files
2. Review the architecture document for context
3. Test with the provided seed data
4. Validate with the test queries

---

Good luck with your union website builder! 🚀
