# Steward Directory Feature - Implementation Plan

## Project Context

UnionTab is a Next.js 14+ app (App Router) with:
- **Frontend**: React, Tailwind CSS, Radix UI, Lucide icons
- **Backend**: Next.js API routes (`app/api/...`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db/schema.ts`)
- **Auth**: Custom session-based auth
- **Structure**: Multi-tenant via `[slug]` routes — each union has its own site

### Existing Relevant Data
The `members` table already has these text fields that relate to steward/unit concepts:
- `steward` (varchar) — currently a free-text field on a member's union info
- `bargainingUnit` (varchar) — free-text
- `subUnit` (varchar) — free-text
- `department` (varchar) — free-text

The `memberPositions` table tracks executive/committee/union positions per member.

### Key Difference from Competitor
The competitor uses a GraphQL/Apollo stack with "units" as a first-class backend entity. UnionTab uses REST API routes + Drizzle ORM with no formal "unit" entity — bargaining units, sub-units, and departments are free-text fields on member records.

---

## Feature Design: Steward Directory

### What We're Building
A steward directory that lets admins assign members as stewards for specific organizational groupings (bargaining units, departments, sub-units), and lets members see their assigned steward's contact info from their profile/dashboard.

### Approach: New `steward_assignments` Table

Rather than overloading the existing free-text `steward` field, we create a proper relational table. This gives us:
- One member can be steward for multiple units/departments
- Members can look up their steward by their own bargaining unit, department, or sub-unit
- Clean admin management UI

---

## Implementation Steps

### Step 1: Database Schema — `stewardAssignments` table

Add to `lib/db/schema.ts`:

```ts
export const stewardAssignments = pgTable('steward_assignments', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id').notNull().references(() => unions.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  scopeType: varchar('scope_type', { length: 50 }).notNull(), // 'bargaining_unit', 'department', 'sub_unit'
  scopeValue: varchar('scope_value', { length: 255 }).notNull(), // The actual value, e.g. "Unit A"
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: integer('assigned_by').notNull().references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  uniqueStewardScope: unique('unique_steward_scope').on(table.unionId, table.scopeType, table.scopeValue),
}));
```

- **uniqueStewardScope** ensures one steward per (union, scope type, scope value) — e.g., one steward per bargaining unit.
- A single member can be steward for multiple scopes.

Add relations in the existing relations section.

Generate a Drizzle migration.

### Step 2: API Routes

**`app/api/steward-assignments/route.ts`** — GET (list) + POST (assign)
- GET: Query by `unionId`, optionally filter by `scopeType` and `scopeValue`. Returns steward assignments with member + user details (name, email, phone, profile photo).
- POST: Admin-only. Body: `{ memberId, scopeType, scopeValue }`. Creates assignment.

**`app/api/steward-assignments/[id]/route.ts`** — DELETE (remove)
- Admin-only. Deletes a steward assignment by ID.

**`app/api/steward-assignments/my-steward/route.ts`** — GET
- Member-facing. Looks up the logged-in member's `bargainingUnit`, `department`, and `subUnit`, then returns any matching steward assignments with contact info.

### Step 3: Admin UI — Steward Management Tab

Add a **"Stewards" tab** inside the existing **Settings page** (`app/[slug]/settings/tabs/`):

**`app/[slug]/settings/tabs/stewards-tab.tsx`**

- Scope selector: dropdown to pick scope type (Bargaining Unit / Department / Sub-Unit)
- Value selector: dropdown populated from **distinct values** of that field across the union's members (via a new API endpoint or inline query)
- Current steward display: shows the currently assigned steward for the selected scope+value, with a Remove button
- Assign steward: autocomplete/search input to find a member by name and assign them
- List view: table/cards showing all current steward assignments for the union

Permission: Only `owner` or admins with `settings` permission.

### Step 4: Member-Facing UI — "Your Steward" Card

Add a **steward card** to the member's profile page or as a visible component on the union dashboard.

**`app/[slug]/profile/steward-card.tsx`** (or inline in member-profile)

- On load, calls `/api/steward-assignments/my-steward`
- If a steward is assigned for the member's unit/dept, shows:
  - Profile photo (or avatar fallback)
  - Name
  - Email + phone
  - Their scope (e.g., "Steward for Bargaining Unit A")
- If no steward is assigned, shows a friendly fallback message

### Step 5: Migration + Seed Data

- Generate Drizzle migration: `pnpm db:generate`
- Optionally seed some steward assignments in existing demo data

---

## File Summary

| File | Purpose |
|---|---|
| `lib/db/schema.ts` | Add `stewardAssignments` table + relations |
| `lib/db/migrations/XXXX_*.sql` | Generated migration |
| `app/api/steward-assignments/route.ts` | GET (list) + POST (assign) |
| `app/api/steward-assignments/[id]/route.ts` | DELETE (remove assignment) |
| `app/api/steward-assignments/my-steward/route.ts` | GET (member's steward lookup) |
| `app/api/steward-assignments/scopes/route.ts` | GET distinct scope values for admin dropdowns |
| `app/[slug]/settings/tabs/stewards-tab.tsx` | Admin steward management UI |
| `app/[slug]/settings/settings-content.tsx` | Add stewards tab to settings tabs list |
| `app/[slug]/profile/steward-card.tsx` | Member-facing steward display card |
| `app/[slug]/profile/member-profile.tsx` | Integrate steward card into profile |

---

## Scope Boundaries

**In scope:**
- DB table + migration
- CRUD API routes
- Admin management tab in settings
- Member-facing steward card on profile

**Out of scope (future):**
- Dashboard widget (can add later)
- Steward as a formal role with special permissions
- Notifications when a steward is assigned
- Steward history/audit log
