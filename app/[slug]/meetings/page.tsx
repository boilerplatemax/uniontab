import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { MeetingsContent } from './meetings-content';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      user: users,
      member: members,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(
      and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      )
    )
    .limit(1);

  return membership;
}

async function getPendingMembersCount(unionId: number, userRole: string | undefined) {
  if (userRole !== 'owner') return 0;

  const pendingMembers = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.status, 'pending')));

  return pendingMembers.length;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) {
    notFound();
  }

  const membership = await checkMembership(union.id);

  // Meetings require authentication
  if (!membership) {
    redirect(`/${slug}/sign-in`);
  }

  const pendingMembersCount = await getPendingMembersCount(
    union.id,
    membership?.member.role
  );

  const unionInfo = {
    id: union.id,
    name: union.publicName || union.name,
    localNumber: union.localNumber,
    logoUrl: union.logoUrl,
    slug: union.slug,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
      />
      <NavbarSpacer />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <MeetingsContent unionInfo={unionInfo} />
      </div>
    </div>
  );
}
