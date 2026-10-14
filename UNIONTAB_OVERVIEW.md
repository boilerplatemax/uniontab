# UnionTab Overview

## What it is

UnionTab is a hosted website and membership platform for labor union locals. Each local gets its own public site at a URL like `/atu123`, plus a members-only area and an admin dashboard behind it. The people using it are union officers and admins who run the local, and the rank-and-file members who log in to read news, vote in elections, pay dues, file grievances, and so on. It is a multi-tenant SaaS: one codebase and one database serve every union, each isolated by its own slug.

## Architecture at a glance

- **Front end and back end are the same app.** It's a Next.js app (App Router, React 19). Pages are server components, and the "back end" is just Next.js API route handlers under `app/api/*` plus some server actions. No separate server.
- **Database:** Postgres, accessed through Drizzle (a typed query builder). The whole schema lives in `lib/db/schema.ts`.
- **Auth:** home-grown. Email and password, passwords hashed with bcrypt, and a signed JWT stored in an httpOnly `session` cookie (see `lib/auth/session.ts`). No third-party auth provider.
- **Payments:** Stripe. Checkout for new subscriptions, the Stripe billing portal for managing them, and a webhook that keeps our records in sync.
- **File storage:** Supabase storage buckets for logos, photos, documents, and attachments. The database only stores the URLs and a running byte count per union.
- **Email and SMS:** SendGrid for email, Twilio for text blasts.
- **Hosting:** built to run on Vercel (`BASE_URL`, Vercel Analytics, the proxy-style middleware all point that way).

The flow is: a request hits the Next.js middleware (`proxy.ts`), which handles subdomain rewrites and blocks a couple of things, then the page or API route runs on the server, reads the session cookie to figure out who you are, and queries Postgres scoped to the right union.

## Key features and the thinking behind them

**1. Slug-based multi-tenancy.** Every union is one row in the `unions` table with a unique `slug`, and almost every other table (members, posts, events, elections, dues, files) carries a `unionId` foreign key. A visitor to `/atu123` resolves the union by slug, and all data is filtered by that union's id. I did it this way instead of giving each union a separate database or subdomain because it keeps hosting and deploys simple while still isolating tenants. The trade-off is that isolation is enforced in application code, so every protected query has to remember to filter by union, and membership checks have to run on every members-only route.

**2. Roles layered on top of membership.** A user is a global account; a `member` row links that user to a specific union with a `role` (owner, admin, member), plus flags for things like election committee. One user belongs to one union. Permission checks are simple role comparisons done server-side in the route or page (for example, only `owner` can reach settings). I kept roles as plain strings rather than a formal permissions system because the real-world hierarchy of a union local is small and well understood, so a heavier system wasn't worth it.

**3. Subscription tiers that gate real limits.** Stripe handles billing, and the webhook (`app/api/stripe/webhook/route.ts`) listens for subscription created/updated/deleted events and writes `planName` and `subscriptionStatus` back onto the union. Those fields then drive actual limits computed in code: member count, storage bytes, monthly email and SMS quotas (see `lib/membership/limits.ts`, `lib/storage/limits.ts`). Free gets 150 members and 1 GB; paid tiers raise those. I derive limits from the stored plan on each request rather than trusting Stripe live, so the app stays fast and keeps working even if a Stripe call is slow. There are also per-union "extra" override columns so I can bump a specific union's limits by hand without changing their plan.

**4. Elections and voting.** This is the richest feature. An election has questions of several types (yes/no, multiple choice, ranking, scale, free text), an open and close time, and a results-visibility setting. Two design choices matter: votes are split across two tables so that *who voted* (`election_votes`, one row per user with a unique constraint) is kept separate from *what they voted* (`election_responses`), which protects ballot secrecy. And all the state transitions and the "has this closed" decision use server time, not anything the client sends, so nobody can change their clock to vote after close. There's also an in-person voting path the election committee can mark, with a constraint that stops someone from voting both in person and online.

