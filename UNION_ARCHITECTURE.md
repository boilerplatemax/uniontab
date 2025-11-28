# Union Website Builder - Architecture Plan

## Project Overview

### Transformation Summary
Converting the existing Next.js + PostgreSQL + Stripe SaaS starter into a **multi-tenant union website builder** where each union local gets their own customizable website with a unique slug (e.g., `/atu123`).

---

## High-Level Architecture

### 1. Multi-Tenancy Model

**Current:** Team-based SaaS (users belong to teams)
**New:** Union-based platform (users belong to union locals)

#### Key Changes:
- Replace "teams" concept with "unions"
- Each union gets a unique slug (e.g., `/atu123`, `/ibew456`)
- Users can only belong to ONE union (enforced at database level)
- Public union pages accessible without authentication
- Member-only areas require authentication + union membership verification

### 2. Data Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UNION WEBSITE BUILDER                    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌──────▼──────┐     ┌─────▼─────┐
    │   UNIONS  │      │    USERS    │     │  MEMBERS  │
    │           │      │             │     │           │
    │ - slug    │      │ - email     │     │ - role    │
    │ - name    │◄─────┤ - password  │────►│ - union   │
    │ - logo    │      │             │     │           │
    │ - cover   │      └─────────────┘     └───────────┘
    │ - contact │
    └───────────┘
          │
          │ One union can have multiple pages
          │
    ┌─────▼─────────┐
    │  UNION_PAGES  │
    │               │
    │ - union_slug  │
    │ - page_slug   │
    │ - content     │
    └───────────────┘
```

### 3. Routing Architecture

#### Current Routes:
```
/ (landing)
/sign-in
/sign-up
/dashboard
/dashboard/activity
/dashboard/general
/dashboard/security
/pricing
```

#### New Routes:
```
/ (landing - union search/create)
/sign-in
/sign-up
/onboarding (wizard for new unions)
/dashboard (union admin panel)
/dashboard/pages (manage union pages)
/dashboard/members (manage union members)
/dashboard/settings (union settings)
/pricing

# Dynamic union routes
/[slug] (e.g., /atu123) - Public union homepage
/[slug]/about - Union about page
/[slug]/contact - Union contact page
/[slug]/members - Members-only area
/[slug]/[custom-page] - Custom pages
```

#### Reserved Slugs (not allowed for unions):
- `dashboard`, `sign-in`, `sign-up`, `onboarding`, `api`, `pricing`, `about`, `contact`, `terms`, `privacy`, `admin`

### 4. Access Control

#### Three Access Levels:

1. **Public (No Auth Required)**
   - View union homepage (`/[slug]`)
   - View public union pages
   - Search for unions
   - See union contact info

2. **Authenticated Users**
   - Sign in/sign up
   - Join a union (if not already member)
   - Access their union's member-only areas

3. **Union Admins (Role: Owner)**
   - Full dashboard access
   - Edit union info (logo, cover, contact)
   - Create/edit custom pages
   - Invite/remove members
   - Change subscription

### 5. Page Builder System

#### Static Pages (Auto-generated):
- **Homepage** - Cover photo, logo, contact info, description
- **About** - Union history, mission, leadership
- **Contact** - Email, phone, address, contact form

#### Custom Pages:
- Markdown-based content editor
- Custom slugs (e.g., `/atu123/benefits`, `/atu123/events`)
- Rich media support (images, videos, embeds)
- Draft/publish workflow

---

## Folder Structure Changes

### Proposed New Structure:

```
saas-starter/
├── app/
│   ├── (public)/                      # Public pages
│   │   ├── page.tsx                   # New landing: search unions
│   │   ├── pricing/
│   │   └── layout.tsx
│   │
│   ├── (auth)/                        # Auth pages (renamed from login)
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── onboarding/                # NEW: Onboarding wizard
│   │   │   ├── page.tsx              # Step 1: Union info
│   │   │   ├── branding/             # Step 2: Logo/cover
│   │   │   ├── contact/              # Step 3: Contact info
│   │   │   └── preview/              # Step 4: Preview & launch
│   │   └── actions.ts
│   │
│   ├── (dashboard)/                   # Union admin dashboard
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Overview (replace team settings)
│   │   │   ├── pages/                # NEW: Manage union pages
│   │   │   ├── members/              # Union members (renamed from activity)
│   │   │   ├── settings/             # Union settings (logo, cover, etc.)
│   │   │   └── account/              # User account settings
│   │   └── layout.tsx
│   │
│   ├── (union)/                       # NEW: Dynamic union routes
│   │   └── [slug]/
│   │       ├── page.tsx              # Union homepage
│   │       ├── about/page.tsx        # About page
│   │       ├── contact/page.tsx      # Contact page
│   │       ├── members/              # Members-only area
│   │       │   ├── page.tsx
│   │       │   └── layout.tsx        # Auth check middleware
│   │       ├── [pageSlug]/page.tsx   # Custom pages
│   │       └── layout.tsx            # Union-specific layout
│   │
│   ├── api/
│   │   ├── unions/                    # NEW: Union API
│   │   │   ├── [slug]/route.ts
│   │   │   └── search/route.ts
│   │   ├── pages/                     # NEW: Page management API
│   │   ├── stripe/
│   │   └── user/
│   │
│   └── layout.tsx
│
├── lib/
│   ├── auth/
│   │   ├── session.ts
│   │   └── middleware.ts              # Add union membership checks
│   │
│   ├── db/
│   │   ├── schema.ts                  # NEW: Add unions, members, pages
│   │   ├── queries.ts                 # NEW: Union-specific queries
│   │   ├── migrations/
│   │   │   ├── 0001_add_unions.sql   # NEW MIGRATION
│   │   │   └── ...
│   │   └── seed.ts
│   │
│   ├── unions/                        # NEW: Union logic
│   │   ├── slug.ts                    # Slug generation/validation
│   │   ├── validation.ts              # Union name/number validation
│   │   └── actions.ts                 # Union server actions
│   │
│   ├── pages/                         # NEW: Page builder logic
│   │   ├── markdown.ts                # Markdown parser
│   │   └── actions.ts                 # Page CRUD actions
│   │
│   └── payments/
│
├── components/
│   ├── ui/
│   ├── union/                         # NEW: Union-specific components
│   │   ├── union-header.tsx          # Cover + logo
│   │   ├── union-nav.tsx             # Navigation
│   │   ├── contact-info.tsx          # Contact section
│   │   └── page-editor.tsx           # Markdown editor
│   │
│   └── onboarding/                    # NEW: Onboarding wizard
│       ├── step-indicator.tsx
│       ├── union-info-form.tsx
│       ├── branding-upload.tsx
│       └── contact-form.tsx
│
└── middleware.ts                      # Update to handle union routes
```

---

## Database Changes Summary

### New Tables:

1. **unions** - Core union data
2. **union_pages** - Custom pages for each union
3. **members** - Links users to unions (replaces team_members)

### Modified Tables:

1. **users** - Remove team references, add union_id
2. **activity_logs** - Change team_id to union_id
3. **invitations** - Change team_id to union_id

### Dropped Tables:

1. **teams** - Replaced by unions

### Key Constraints:

- **One union per user:** Enforced via unique constraint on users.union_id
- **Unique slugs:** Unions must have globally unique slugs
- **Slug format validation:** Use CHECK constraint for slug format
- **Reserved slug protection:** Prevent creation of reserved slugs

---

## Migration Strategy

### Phase 1: Database Schema
1. Create new unions table
2. Create union_pages table
3. Migrate teams → unions
4. Update foreign keys
5. Add slug generation logic

### Phase 2: Authentication & Access Control
1. Update middleware for union routes
2. Add union membership checks
3. Implement single-union-per-user enforcement

### Phase 3: UI/UX
1. Build onboarding wizard
2. Create union homepage template
3. Implement page builder
4. Update dashboard for union management

### Phase 4: Dynamic Routing
1. Implement `[slug]` routes
2. Handle reserved slugs
3. Add custom page routing
4. SEO optimization (meta tags, OG images)

---

## Technical Considerations

### 1. Slug Generation Logic

```typescript
function generateSlug(unionName: string, localNumber: string): string {
  // Example: "ATU Local 123" → "atu123"
  const prefix = unionName.replace(/[^a-z]/gi, '').toLowerCase().slice(0, 6);
  const number = localNumber.replace(/[^0-9]/g, '');
  return `${prefix}${number}`;
}

// Handle duplicates: atu123 → atu123-2, atu123-3, etc.
```

### 2. SEO & Performance

- **Static Site Generation (SSG):** Use `generateStaticParams` for popular unions
- **On-Demand ISR:** Revalidate union pages when content changes
- **Metadata API:** Generate dynamic meta tags for each union
- **Sitemap:** Auto-generate sitemap with all union pages

### 3. File Storage (Logo/Cover Photos)

**Options:**
- **Vercel Blob Storage** (if deploying to Vercel)
- **AWS S3** / **Cloudflare R2** (self-hosted)
- **Supabase Storage** (if switching to Supabase)

**Recommendation:** Start with Vercel Blob for simplicity, switch to S3 for scale.

### 4. Stripe Integration Changes

- Keep existing subscription model
- Each union = one subscription
- Union owner pays for subscription
- Plan tiers:
  - **Free:** Basic homepage, limited pages
  - **Pro:** Unlimited pages, custom domain, analytics

---

## Security Considerations

### 1. Multi-Tenant Isolation

- Always filter queries by union_id/union_slug
- Use Row-Level Security (RLS) if switching to Supabase
- Validate union membership in all protected routes

### 2. Input Validation

- Sanitize markdown content (prevent XSS)
- Validate file uploads (logo/cover) - size, type, malware scan
- Validate slugs against reserved list

### 3. Rate Limiting

- Limit union creation (prevent spam)
- Rate limit contact form submissions
- Throttle API endpoints

---

## Next Steps

1. ✅ Review this architecture plan
2. Generate SQL migration files
3. Implement database changes
4. Build onboarding wizard
5. Create dynamic union routes
6. Update dashboard for union management
7. Test multi-tenant isolation
8. Deploy and monitor

---

## Questions to Consider

1. **Should users be able to switch unions?** (Currently: No, enforced at DB level)
2. **Custom domains per union?** (e.g., atu123.com → /atu123)
3. **Email notifications for new members?** (Stripe subscription triggers)
4. **Union search functionality?** (By name, number, location)
5. **Public directory of all unions?** (SEO benefit, discovery)

---

This architecture provides a solid foundation for your union website builder while maintaining the existing Stripe integration and authentication system. The multi-tenant model ensures proper isolation between unions while allowing shared infrastructure.
