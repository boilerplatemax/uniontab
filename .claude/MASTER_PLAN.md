# UnionTab — Master-Planner Agent Reference

> **Product:** UnionTab (uniontab.com)
> **Repo:** saas-starter

---

## 1. Product Vision

UnionTab is a **multi-tenant union management SaaS** where each labour union
local gets its own website and management portal at `uniontab.com/{slug}`.
A union signs up, names their local, and instantly gets a live site with
elections, grievances, dues tracking, mass communications, meetings, strike
coordination, and more.

### Core Goals

1. **Self-service onboarding** — sign up → name your local → live site.
2. **Multi-tenant isolation** — every query scoped by `unionId`.
3. **Freemium model** — Free (150 members) → Base $149 → Plus $249 via Stripe.
4. **Canadian labour focus** — `en_CA` default, bilingual EN/FR.
5. **Production-deployed** — Vercel, Supabase, SendGrid, Twilio, Stripe, Cloudflare.

---

## 2. Tech Stack

| Layer           | Tech                                                   |
| --------------- | ------------------------------------------------------ |
| Framework       | Next.js 16 (App Router, Turbopack, RSC-first)          |
| Language        | TypeScript (strict), `@/*` path alias                  |
| Styling         | Tailwind CSS v4 + shadcn/ui (new-york) + CSS variables |
| UI              | Radix primitives, Lucide icons, Framer Motion          |
| Rich Text       | TipTap editor + DOMPurify                              |
| ORM             | Drizzle ORM (postgres-js driver)                       |
| Database        | PostgreSQL (Supabase-hosted)                           |
| Storage         | Supabase Storage                                       |
| Auth            | Custom JWT (jose) + bcryptjs, cookie sessions          |
| Payments        | Stripe subscriptions                                   |
| Email           | SendGrid (per-union subdomain sending)                 |
| SMS             | Twilio                                                 |
| DNS             | Cloudflare API                                         |
| Video           | Zoom API (server-to-server OAuth)                      |
| i18n            | Custom context-based (EN/FR) in `lib/i18n/`            |
| Validation      | Zod                                                    |
| Data Fetching   | SWR (client), RSC (server)                             |
| Package Manager | pnpm                                                   |

---

## 3. Architecture

### Multi-Tenancy

- **Users** sign up with email + password.
- **Members** join table links user → union with role + status.
- **Unions** are the tenant. Every feature table has `union_id` FK.
- One user = one union (unique constraint).

### Roles

| Role        | Scope                                                  |
| ----------- | ------------------------------------------------------ |
| `webmaster` | Platform super-admin (`user.role`). `/admin/*` routes. |
| `owner`     | Union creator. Full union access.                      |
| `admin`     | Delegated admin with granular JSON permissions.        |
| `member`    | Regular member. Access depends on approval status.     |

Admin permissions: `members`, `communications`, `dues`, `strikes`, `grievances`,
`meetings`, `announcements`, `elections`, `settings`, `analytics`.

### Routing

```
/                        Landing page
/sign-in, /sign-up       Auth
/onboarding              Post-signup
/pricing                 Stripe pricing
/admin/*                 Webmaster panel

/[slug]                  Union homepage (configurable)
/[slug]/about            About
/[slug]/contact          Contact
/[slug]/news             Posts feed
/[slug]/events           Events calendar
/[slug]/elections        Elections/surveys
/[slug]/files            File library
/[slug]/gallery          Photo gallery
/[slug]/members          Member management
/[slug]/grievances       Grievance tracker
/[slug]/strikes          Strike hub
/[slug]/meetings         Meetings (Zoom)
/[slug]/dues             Dues management
/[slug]/announcements    Announcements
/[slug]/mass-email       Mass email
/[slug]/mass-sms         Mass SMS
/[slug]/analytics        Analytics
/[slug]/billing          Stripe portal
/[slug]/settings         Union settings
/[slug]/themes           Theme picker
/[slug]/p/[pageSlug]     Custom CMS pages
/[slug]/profile          Member profile
/[slug]/support          Support tickets
```

---

## 4. Key Database Tables

**Schema:** `lib/db/schema.ts`

- **Core:** `users`, `unions`, `members`, `activity_logs`, `invitations`
- **Content:** `union_pages`, `navigation_items`, `posts`, `events`, `announcements`, `files`, `file_categories`
- **Elections:** `elections`, `election_questions`, `election_options`, `election_votes`, `election_responses`, `in_person_votes`
- **Communications:** `mass_emails`, `email_logs`, `mass_sms`, `sms_logs`, `union_email_domains`
- **Dues:** `dues_cycles`, `dues`, `dues_receipts`, `dues_audit_log`
- **Grievances:** `grievances`, `grievance_comments`, `grievance_attachments`, `grievance_categories`, `grievance_participants`
- **Strikes:** `strikes`, `picket_zones`, `picket_shifts`, `picket_assignments`, `strike_announcements`, `strike_incidents`, `strike_resources`
- **Meetings:** `meetings`, `meeting_invites`, `meeting_participants`
- **Members:** `member_documents`, `member_certifications`, `member_positions`, `member_notes`
- **Support:** `support_tickets`, `support_ticket_replies`, `support_ticket_attachments`
- **Contact:** `union_contact_info`, `union_executives`, `contact_form_submissions`

---

## 5. Subscription Limits

| Resource  | Free | Base ($149) | Plus ($249) |
| --------- | ---- | ----------- | ----------- |
| Members   | 150  | 500         | 2,000       |
| Storage   | 1 GB | 10 GB       | 30 GB       |
| Emails/mo | 500  | 5,000       | 15,000      |
| SMS/mo    | 0    | 1,500       | 4,000       |

Webmaster can grant per-union overrides via `extra_*` fields.

---

## 6. Code Conventions

### Patterns

- **Server Components by default** — `'use client'` only when needed.
- **Server Actions** (`'use server'`) for mutations — validated with Zod via
  `validatedAction()` and `validatedActionWithUser()` in `lib/auth/middleware.ts`.
- **Drizzle ORM** — mix of SQL-like (`db.select().from()`) and relational
  (`db.query.tableName.findMany()`) queries.
- **Type exports** — every table exports `Type` + `NewType` (e.g., `User`, `NewUser`).
- **TypeScript enums** for status/type fields.

### Auth Pattern

- JWT in `session` httpOnly cookie (jose).
- `getUser()` → reads cookie → verifies JWT → fetches user.
- `getTeamForUser()` → user's union with members.
- `getUserMembership()` → member record + union.
- `withTeam()` HOF wraps server actions requiring union context.

### File Structure

```
app/[slug]/feature-name/
  page.tsx              ← Server component (data fetching)
  feature-content.tsx   ← Client component (interactivity)

components/feature-name/
  feature-component.tsx ← Reusable UI

lib/feature-name/
  limits.ts             ← Tier-based limits
  actions.ts            ← Server actions

app/api/feature-name/
  route.ts              ← API handlers
```

### UI

- **shadcn/ui** (new-york variant) from `@/components/ui/`.
- **Tailwind CSS v4** with CSS variables for theming.
- **Lucide React** for icons.
- **Framer Motion** for animations.
- **TipTap** for rich text; **DOMPurify** for rendering.
- **Manrope** font family.
- **date-fns** for date formatting.

### Theming

Three themes: `default` (Classic), `modern`, `prestige` (paid-only).
Per-union `themeColor` (hex) for accent. Stored on `unions.theme`.

---

## 7. Rules for Code Generation

1. **Always scope data by `unionId`** — never return cross-tenant data.
2. **Use server components** unless client interactivity is required.
3. **Validate all inputs with Zod** — use `validatedAction` / `validatedActionWithUser`.
4. **Follow file naming** — `page.tsx` (server) + `feature-content.tsx` (client).
5. **Use Drizzle ORM** — not raw SQL.
6. **Use shadcn/ui** from `@/components/ui/` — don't reinvent.
7. **Respect tier limits** — check `lib/*/limits.ts` before allowing actions.
8. **Use Supabase Storage** for uploads via `lib/supabase/client.ts`.
9. **Use `@/` path alias** for all imports.
10. **Export types** from schema for new tables (`Type` + `NewType`).
11. **Add Drizzle relations** for new tables.
12. **Respect demo mode** — check `union.isDemo` before mutations.
13. **Use TipTap** for rich text, **DOMPurify** for rendering.
14. **Support EN/FR** for user-facing strings.
15. **Use `date-fns`** for dates, `lucide-react` for icons.

---

## 8. Security

1. Tenant isolation — all queries scoped by `unionId`.
2. JWT sessions, bcrypt passwords, email verification required.
3. Zod validation on all server actions and API routes.
4. DOMPurify on all rich text content (XSS prevention).
5. Reserved slugs block route conflicts.
6. Monthly caps on emails, SMS, invites per tier.
7. Soft deletes for users.
8. Demo mode prevents mutations on showcase unions.
9. Granular admin permissions.
10. Grievance internal comments hidden from non-admins.

---

## 9. Dev Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Drizzle Studio
pnpm db:seed      # Seed data
```
