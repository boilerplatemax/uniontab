# Navigation System Overhaul - Prompt Series

Feed these prompts to Claude Opus **in order**. Each builds on the previous. Wait for each to be fully implemented before moving to the next.

---

## Prompt 1 of 6: Database Schema & Navigation Configuration

```
I need you to add a navigation configuration system to the UnionTab codebase. This is the FIRST step of a multi-part navigation overhaul. In this step, ONLY make database/schema changes and the API to read/write them. Do NOT touch any UI components yet.

### Context
- Tech stack: Next.js 16, Drizzle ORM, PostgreSQL, TypeScript
- Schema file: `lib/db/schema.ts`
- The `unions` table already exists with theme, social links, and other config fields
- There's an existing `unionPages` table (custom pages with title, slug, content, isPublished, isMembersOnly, sortOrder)
- There's an existing `files` table with categories and privacy controls
- The existing admin permission system uses 10 permission keys defined in `lib/admin-permissions.ts`

### What to build

1. **Add a `navConfig` JSON column to the `unions` table** that stores which navigation items are enabled and their order. Structure it like:
```ts
type NavConfig = {
  items: Array<{
    id: string;           // unique key e.g. 'news', 'about', 'bylaws', 'collective-agreements', 'events', 'elections', 'contact', 'files'
    label: string;        // display name (owner can customize)
    enabled: boolean;     // whether it shows in the nav
    visibility: 'public' | 'members' | 'private'; // who can see it: everyone, logged-in members, or hidden
    sortOrder: number;    // position in the navbar
    type: 'built-in' | 'document-collection' | 'custom-page'; // what kind of page it is
  }>;
};
```

2. **Add a `documentCollections` table** for things like Bylaws, Collective Agreements, Newsletters, etc. These are pages that are essentially a list of uploaded/named files:
```
documentCollections:
  - id (serial, PK)
  - unionId (FK to unions)
  - navItemId (string - matches the navConfig item id)
  - title (varchar 255)
  - description (text, nullable)
  - isPublished (boolean, default false)
  - isMembersOnly (boolean, default false)
  - createdAt, updatedAt timestamps
  - createdBy, updatedBy (FK to users, nullable)
```

3. **Add a `documentCollectionFiles` table** for files within a collection:
```
documentCollectionFiles:
  - id (serial, PK)
  - collectionId (FK to documentCollections)
  - name (varchar 255 - display name)
  - description (text, nullable)
  - fileUrl (text)
  - fileType (varchar 100)
  - fileSize (integer)
  - sortOrder (integer, default 0)
  - createdAt timestamp
  - uploadedBy (FK to users, nullable)
```

4. **Create a default navConfig** that gets set when a union is created. Include these defaults (all enabled):
   - News (built-in, public) - maps to the posts/news feed
   - About (built-in, public) - maps to existing about content
   - Events (built-in, public)
   - Elections (built-in, members)
   - Files (built-in, members)
   - Contact (built-in, public)

   And these disabled by default:
   - Bylaws (document-collection, members, disabled)
   - Collective Agreements (document-collection, members, disabled)
   - Newsletter (document-collection, public, disabled)

5. **Create API routes:**
   - `GET /api/unions/[unionId]/nav-config` - returns the nav config (respecting visibility based on auth)
   - `PUT /api/unions/[unionId]/nav-config` - owner/settings-permission can update the full config
   - Standard CRUD for `documentCollections` and `documentCollectionFiles` under `/api/unions/[unionId]/document-collections/...`

6. **Create a Drizzle migration** for the new tables and column.

7. **Add proper schema relations** in the relations section of schema.ts.

8. **Export types** for NavConfig, DocumentCollection, DocumentCollectionFile.

Important constraints:
- Follow the existing patterns in schema.ts exactly (serial PKs, timestamp defaults, FK patterns, etc.)
- Follow the existing API route patterns in the codebase (check `app/api/` for conventions)
- The navConfig default should be set via a helper function in a new file `lib/nav-config.ts`
- Do NOT touch any UI/component files in this step
```

---

## Prompt 2 of 6: Core Navbar Component (Desktop)

```
I need you to rebuild the union navbar as step 2 of our navigation overhaul. The database schema from step 1 is now in place (navConfig on unions table, documentCollections table, etc.).

### Context
- Current navbar: `app/[slug]/union-navbar.tsx` - a flat bar with individual links for Grievances, Meetings, Members, Emails, SMS, Settings, Analytics, and a "More" dropdown
- Current tab system: `app/[slug]/union-profile-tabs.tsx` - tabs for Posts, About, Files, Events, Elections, Contact rendered INSIDE the page content area
- Three theme files use both: `app/[slug]/themes/default-theme.tsx`, `modern-theme.tsx`, `prestige-theme.tsx`
- The union's `navConfig` JSON field contains the configurable nav items with enabled/visibility/sortOrder
- Existing permission system: `hasPermission()` from `lib/admin-permissions.ts` checks role + AdminPermissions

### Design Goals (inspired by cupe3913.on.ca but unique to us)
- ONE single top navbar that replaces BOTH the current navbar AND the tab system
- Clean, minimal design with the union name/logo on the left
- Navigation items in the center/right area
- Items with dropdowns use a MEGA-MENU style popup on desktop (like the "About" dropdown on cupe3913.on.ca that shows a rich panel with sections, icons, and descriptions)
- The active page should be visually highlighted (pill/highlight style)
- Must respect the union's `themeColor` for accent/highlight colors

### Navbar Structure

**Left side:**
- Union logo (if exists) + union display name, linking to `/${slug}`

**Center/Right - Public Navigation Items (from navConfig):**
- Render each enabled navConfig item as a nav link
- Items with type 'built-in' link to their respective routes: News → `/${slug}`, About → `/${slug}/about`, Events → `/${slug}/events`, Elections → `/${slug}/elections`, Files → `/${slug}/files`, Contact → `/${slug}/contact`
- Items with type 'document-collection' link to `/${slug}/pages/[navItemId]`
- Items with type 'custom-page' link to `/${slug}/pages/[slug]`
- Only show items where `enabled: true` and visibility allows the current user to see them
- If there are more than ~5 visible items, the overflow goes into a "More" dropdown

**Right side - User area:**
- If NOT signed in: "Sign In" button (styled nicely, maybe with a login icon)
- If signed in as member/admin/owner:
  - An "Admin" dropdown (only visible to owner/admins) that opens a MEGA-MENU panel containing:
    - **Members section:** Members list (with pending badge), Invite Members
    - **Communications section:** Mass Email, Mass SMS, Announcements
    - **Management section:** Grievances (with notification badge), Meetings, Strikes (with badge), Dues
    - **System section:** Settings, Analytics, Billing (owner only)
    - Each item has an icon and short label, laid out in a grid within the mega-menu
  - Profile dropdown (avatar/icon): Profile, Sign Out

### Implementation

1. **Create `app/[slug]/components/navbar/union-nav.tsx`** - the main navbar wrapper component (server component that fetches navConfig and passes data down)

2. **Create `app/[slug]/components/navbar/union-nav-client.tsx`** - the client component with all the interactive behavior (dropdowns, mobile toggle, active state detection)

3. **Create `app/[slug]/components/navbar/admin-mega-menu.tsx`** - the admin tools mega-menu popup. Grid layout with sections, icons, labels, notification badges. Shows on click, closes on outside click or Escape.

4. **Create `app/[slug]/components/navbar/nav-item.tsx`** - individual nav item component that handles active state highlighting

5. **Update the three theme files** (`default-theme.tsx`, `modern-theme.tsx`, `prestige-theme.tsx`) to:
   - Remove the `<UnionProfileTabs>` component usage
   - Use the new navbar component instead of `<UnionNavbar>`
   - The page content area should now just render the content for the current route (no more tabs)
   - Keep each theme's visual flavor but adapt to the new single-navbar paradigm

6. **Keep the old `union-navbar.tsx` and `union-profile-tabs.tsx` files** for now (don't delete) but they should no longer be imported by the themes.

### Styling Notes
- Use Tailwind CSS exclusively
- The navbar should be `fixed top-0` with proper z-index
- Use `backdrop-blur` for a subtle glassmorphism effect on the navbar background
- The admin mega-menu should have a subtle shadow, rounded corners, and smooth fade-in animation
- Use the union's `themeColor` for the active item highlight and accent elements
- Transitions: use CSS transitions for hover states, Framer Motion for the mega-menu open/close

### Important
- Do NOT change any routing or create new page routes yet - that's a later step
- The navbar just needs to render the right links based on navConfig
- Pass navConfig data from the server component to the client component as props
- The admin mega-menu items should use the same `canAccess()` permission checking pattern from the existing navbar
```

---

## Prompt 3 of 6: Mobile Navigation

```
I need you to build the mobile/responsive version of the navbar as step 3 of our navigation overhaul. The desktop navbar from step 2 is now in place.

### Context
- New navbar lives in `app/[slug]/components/navbar/`
- Desktop version has: logo/name on left, nav items in center, admin mega-menu + profile on right
- NavConfig drives which items show and their visibility
- Admin mega-menu has sections: Members, Communications, Management, System

### Mobile Design (responsive, not a separate component)

The mobile nav should activate below the `md` breakpoint (768px). Enhance the existing navbar components rather than creating separate mobile-only files.

**Mobile Navbar Bar (always visible):**
- Union name/logo on the left (truncated if needed)
- Hamburger menu icon on the right
- Keep it compact: `h-14` height

**Mobile Menu (slides down or overlays when hamburger is tapped):**
- Full-width panel that slides down from the navbar
- Organized into clear sections with dividers:

**Section 1 - Main Navigation:**
- Each enabled navConfig item as a full-width row with icon + label
- If the user doesn't have access to an item (visibility), don't show it
- Tapping any item navigates and closes the menu

**Section 2 - Admin Tools (only for owner/admins):**
- Section header: "Admin Tools"
- Collapsible accordion-style sub-sections:
  - "Members" → Members, Invite Members (with pending badge)
  - "Communications" → Mass Email, Mass SMS, Announcements
  - "Management" → Grievances (badge), Meetings, Strikes (badge), Dues
  - "System" → Settings, Analytics, Billing
- Each sub-section expands/collapses on tap
- Permission-based: only show items the user can access

**Section 3 - Account:**
- Profile link
- Sign Out button

**For non-signed-in users:**
- Show only the public nav items from navConfig
- Show "Sign In" button prominently at the bottom

### Implementation Details

1. **Update `union-nav-client.tsx`** to add:
   - Mobile menu open/close state
   - Hamburger button (visible only below md)
   - The slide-down mobile menu panel
   - Hide the desktop nav items below md breakpoint
   - Accordion state for admin sub-sections
   - Close menu on route change (use `usePathname` to detect)
   - Close menu on Escape key
   - Trap focus within mobile menu when open (accessibility)

2. **Handle body scroll lock** when mobile menu is open (prevent background scrolling)

3. **Animation:**
   - Use Framer Motion `AnimatePresence` for the menu slide-down
   - Accordion sections animate height smoothly
   - Hamburger icon morphs to X when open (use Lucide `Menu` and `X` icons)

4. **Accessibility:**
   - `aria-expanded` on hamburger button
   - `role="navigation"` on the menu
   - Proper focus management
   - `aria-label` for menu sections

5. **Visual Design:**
   - White/light background for the menu panel
   - Subtle separator lines between sections
   - Active/current page indicated with the themeColor accent
   - Notification badges inline with labels (red circles with count)
   - Touch-friendly tap targets (min 44px height per row)
   - Smooth transitions on all interactive elements

### Important
- This should be a RESPONSIVE enhancement to the existing navbar, not a separate component
- Test that desktop behavior is NOT affected
- The mobile menu should feel native and snappy
- Do NOT create new routes or pages
```

---

## Prompt 4 of 6: Route Structure & Page Conversions

```
I need you to convert the tab-based pages into proper routes as step 4 of the navigation overhaul. The new navbar (desktop + mobile) is done and links to these routes - now we need the routes to actually exist and work.

### Context
- Currently, the union home page at `app/[slug]/page.tsx` renders ALL content (posts, about, files, events, elections, contact) through a tabbed interface in `union-profile-tabs.tsx`
- The tabs use `?tab=about`, `?tab=files`, etc. as query params
- Some routes already exist as separate pages: `app/[slug]/about/page.tsx`, `app/[slug]/files/page.tsx`, `app/[slug]/events/page.tsx`, `app/[slug]/contact/page.tsx`
- The navbar now links to `/${slug}` (news), `/${slug}/about`, `/${slug}/events`, `/${slug}/elections`, `/${slug}/files`, `/${slug}/contact`
- Document collection pages should be at `/${slug}/pages/[navItemId]`

### What to build

1. **Create/update `app/[slug]/layout.tsx`** (if it doesn't exist, create it):
   - This layout wraps ALL `[slug]` pages
   - It should:
     - Fetch the union by slug
     - Check membership/auth
     - Fetch navConfig
     - Get notification counts (pending members, grievances, strikes)
     - Render the new navbar at the top
     - Render announcement banner
     - Render the pending-approval warning banner (if member is pending)
     - Render `{children}` below
     - Render footer
   - This replaces the navbar rendering that currently happens inside each theme file
   - The layout is a SERVER component

2. **Simplify `app/[slug]/page.tsx`** (the news/home page):
   - Remove ALL the data fetching that's duplicated in the layout (union, membership, announcements, etc.)
   - This page should ONLY fetch and render posts/news content
   - Remove the theme switching logic - the layout handles the navbar now
   - The page itself just shows the posts feed with create/edit functionality
   - Keep supporting the three visual themes for the CONTENT AREA only (how posts are displayed), not for the navbar

3. **Ensure these route pages exist and work as standalone pages** (create or update):
   - `app/[slug]/about/page.tsx` - About page with union info, description, images, social links
   - `app/[slug]/events/page.tsx` - Events listing with calendar/list toggle
   - `app/[slug]/elections/page.tsx` - Elections listing
   - `app/[slug]/files/page.tsx` - Files browser with categories
   - `app/[slug]/contact/page.tsx` - Contact form + executive board + info

   Each page should:
   - Be a server component that fetches its own data
   - Check visibility (public vs members-only from navConfig) and redirect/show-login if unauthorized
   - Have a clean, standalone layout (no tabs)
   - Reuse existing components where possible (e.g., `EventsCalendar`, `ElectionsList`, `ContactTabContent`, `CategorizedFilesList`)
   - Include a page header with the page title

4. **Create `app/[slug]/pages/[navItemId]/page.tsx`** for document collection pages:
   - Fetch the documentCollection by navItemId + unionId
   - Check visibility based on navConfig settings
   - Display the collection title, description
   - List all files in the collection with download links
   - Clean card-based layout for each file (name, description, file type icon, download button)
   - If the user is owner/admin, show an "Upload File" button and manage functionality

5. **Add redirect handling for old tab URLs:**
   - In `app/[slug]/page.tsx`, if `?tab=about` is present, redirect to `/${slug}/about`
   - Same for `?tab=files` → `/${slug}/files`, `?tab=events` → `/${slug}/events`, etc.
   - This ensures old bookmarks still work

6. **Update the theme files** to be content-only renderers:
   - They should no longer render the navbar, footer, or tabs
   - They only control visual styling of the content area (post cards, layout grid, etc.)
   - Pass-through to the page content

### Important
- The layout.tsx is the KEY file - it centralizes what was previously scattered across three theme files
- Every page under `[slug]` automatically gets the navbar from the layout
- Reuse existing components rather than rewriting them
- Make sure the navConfig visibility checks are consistent: if a page is set to 'members' visibility and the user isn't a member, show a "Sign in to view this page" message rather than a 404
- Keep all existing functionality working - this is a restructure, not a feature removal
```

---

## Prompt 5 of 6: Navigation Settings UI

```
I need you to build the admin settings interface for configuring the navbar as step 5. The nav system is functional - now owners need a UI to manage it.

### Context
- Settings page: `app/[slug]/settings/page.tsx` (existing)
- NavConfig is stored as JSON on the `unions` table
- DocumentCollections and DocumentCollectionFiles tables exist
- API routes for nav-config and document-collections are in place
- The settings page likely already has sections/tabs for different settings areas

### What to build

1. **Add a "Navigation" section to the settings page** (or a new tab/section within the existing settings layout). This should include:

**Navigation Items Manager:**
- A drag-and-drop sortable list (use the existing dnd-kit setup) of all nav items
- Each item row shows:
  - Drag handle (grip icon)
  - Toggle switch (enabled/disabled)
  - Editable label (inline text input)
  - Visibility dropdown: Public / Members Only / Hidden
  - Item type badge: "Built-in", "Documents", "Custom"
  - For document-collection items: a "Manage Files" button that opens the document manager
- "Add Navigation Item" button at the bottom with options:
  - Add Document Collection (creates a new bylaws/agreements/newsletter style page)
  - Add Custom Page (links to the existing unionPages system)
- Save button that PUTs the updated navConfig
- Visual preview hint: show which items will appear in the navbar based on current config

**Document Collection Manager** (inline expandable or dialog):
- When "Manage Files" is clicked on a document-collection nav item:
  - Show collection title and description (editable)
  - List of uploaded files with:
    - File name (editable)
    - File description (editable)
    - File type/size info
    - Download link
    - Delete button
    - Drag handle for reordering
  - Upload new file button (use existing Supabase upload patterns from the codebase)
  - Save order/changes button

2. **The UI should follow existing settings page patterns:**
   - Use the same Card/Section layout as other settings sections
   - Use existing UI components (Button, Input, Switch, Select, Dialog, etc. from `components/ui/`)
   - Match the existing visual style

3. **Validation & guardrails:**
   - "News" (home/posts) cannot be disabled or removed (it's the landing page)
   - At least one nav item must be public (warn if all are set to members-only)
   - Labels must be non-empty
   - Maximum of ~12 nav items (reasonable limit)
   - Document collections need at least a title

4. **Optimistic updates:**
   - Use the existing SWR patterns for data fetching
   - Show loading states during save
   - Toast notifications on success/error (use existing toast system)

### Important
- Follow the EXACT patterns used in the existing settings page for layout, data fetching, and form handling
- Use the existing upload infrastructure (Supabase storage) for document collection files
- The drag-and-drop should use `@dnd-kit` which is already a dependency
- Keep it simple and functional - don't over-design the settings UI
- Owner AND users with 'settings' permission should be able to access this
```

---

## Prompt 6 of 6: Polish, Cleanup & Integration Testing

```
This is the FINAL step of the navigation overhaul. Everything is built - now I need you to polish, clean up dead code, and make sure the entire system works together.

### Tasks

1. **Remove dead code:**
   - Delete the old tab system component: `app/[slug]/union-profile-tabs.tsx`
   - Delete or archive the old navbar: `app/[slug]/union-navbar.tsx` (only if it's no longer imported ANYWHERE)
   - Remove any unused imports across all modified files
   - Remove the old `MemberLoginDropdown` component if it's been replaced
   - Check for any orphaned components that were only used by the tabs

2. **Verify all navigation flows work:**
   - Public user visiting `/${slug}` sees: navbar with public nav items + Sign In button
   - Public user can access pages marked as 'public' visibility
   - Public user gets "Sign in" prompt on 'members' visibility pages
   - Signed-in member sees: navbar with all member-visible items + profile dropdown
   - Admin/owner sees: all member items + Admin mega-menu
   - Admin mega-menu items respect individual permissions
   - Mobile menu works for all three user types
   - Active page is highlighted in navbar
   - Old `?tab=` URLs redirect properly

3. **Theme integration:**
   - Verify all three themes (default, modern, prestige) work with the new layout structure
   - The themes should only affect the content area styling, not the navbar
   - Make sure `themeColor` is applied to navbar accents, active states, and the admin mega-menu highlights
   - Ensure the cover photo / hero section still renders correctly below the new navbar

4. **Announcement banner integration:**
   - The announcement banner should still appear above the navbar (or between navbar and content)
   - The navbar's `top` position should adjust when a banner is active (existing pattern)
   - Test both popup and banner announcement types

5. **Edge cases to handle:**
   - Union with no navConfig yet (migration hasn't set defaults) → use default config
   - Union with all items disabled except News → should still work fine
   - Document collection with no files → show "No documents yet" empty state
   - Very long union name → truncate with ellipsis in navbar
   - Many nav items → overflow into "More" dropdown gracefully

6. **Performance:**
   - navConfig should be fetched ONCE in the layout and passed down, not re-fetched per page
   - Use `prefetch={true}` on navbar links (existing pattern)
   - Lazy-load the admin mega-menu content (don't render the full grid if it's closed)

7. **Quick accessibility pass:**
   - Keyboard navigation through all navbar items
   - Screen reader labels on icon-only buttons
   - Proper heading hierarchy on document collection pages
   - Focus visible states on all interactive elements
   - Skip-to-content link

8. **Update any remaining references:**
   - If anything still imports the old navbar or tabs, update the imports
   - Make sure the `NavbarSpacer` component still works with the new navbar height
   - Update any hardcoded tab links (search for `?tab=`) across the codebase and convert to direct route links

Provide a summary at the end of what was changed, removed, and any remaining TODOs.
```

---

## Usage Tips

- **Feed one prompt at a time.** Wait for full implementation before moving to the next.
- **After each prompt,** test the app locally before proceeding. Fix any issues before moving on.
- **If a prompt produces too many changes,** you can ask Claude to do it in sub-steps (e.g., "Just do items 1-3 first").
- **The prompts reference your actual file paths and patterns.** If you've renamed files since this was written, update the paths.
- **Key files that will be heavily modified:** `lib/db/schema.ts`, `app/[slug]/page.tsx`, the theme files, and the settings page.
- **Key files that will be NEW:** `app/[slug]/components/navbar/*`, `app/[slug]/layout.tsx`, `app/[slug]/pages/[navItemId]/page.tsx`, `lib/nav-config.ts`
