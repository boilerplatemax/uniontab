import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, strikes, picketZones, strikeAnnouncements, strikeIncidents, strikeResources } from '@/lib/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { getUser, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { StrikesContent } from './strikes-content';
import { UnionNavbar } from '../union-navbar';
import { getUnionNavigationItems } from '../get-union-page-data';
import { NavbarSpacer } from '../navbar-spacer';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkOwnerOrAdmin(unionId: number, userId: number) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner' || membership?.role === 'admin';
}

async function getMembership(unionId: number, userId: number) {
  const [membership] = await db
    .select({
      user: users,
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership;
}

async function getPendingMembersCount(unionId: number) {
  const [result] = await db
    .select({ value: count() })
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.status, 'pending')));

  return Number(result.value);
}

async function getStrikesForUnion(unionId: number) {
  return await db.query.strikes.findMany({
    where: eq(strikes.unionId, unionId),
    with: {
      zones: {
        where: eq(picketZones.isActive, true),
      },
      announcements: {
        orderBy: [desc(strikeAnnouncements.createdAt)],
        limit: 3,
      },
      incidents: {
        orderBy: [desc(strikeIncidents.createdAt)],
        limit: 3,
      },
      resources: true,
      createdBy: {
        columns: { id: true, name: true, email: true }
      },
    },
    orderBy: [desc(strikes.createdAt)],
  });
}

async function getStrikeSummary(unionId: number) {
  const allStrikes = await db
    .select()
    .from(strikes)
    .where(eq(strikes.unionId, unionId));

  return {
    total: allStrikes.length,
    preparing: allStrikes.filter(s => s.status === 'preparing').length,
    active: allStrikes.filter(s => s.status === 'active').length,
    resolved: allStrikes.filter(s => s.status === 'resolved').length,
  };
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function StrikesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  const union = await getUnionBySlug(slug);
  if (!union) {
    notFound();
  }

  const navItems = await getUnionNavigationItems(union.id);
  const membership = await getMembership(union.id, user.id);
  if (!membership || membership.member.status !== 'approved') {
    redirect(`/${slug}`);
  }

  const isOwnerOrAdmin = await checkOwnerOrAdmin(union.id, user.id);
  const strikesList = await getStrikesForUnion(union.id);
  const summary = isOwnerOrAdmin ? await getStrikeSummary(union.id) : null;
  const pendingCount = await getPendingMembersCount(union.id);
  const grievanceNotificationCount = await getGrievanceNotificationCount(union.id, user.id, isOwnerOrAdmin);
  const strikeNotificationCount = await getStrikeNotificationCount(union.id, user.id, isOwnerOrAdmin);

  return (
    <>
      <UnionNavbar
        slug={union.slug}
        unionName={union.name}
        localNumber={union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingCount}
        grievanceNotificationCount={grievanceNotificationCount}
        strikeNotificationCount={strikeNotificationCount}
        navigationItems={navItems}
      />
      <NavbarSpacer />
      <StrikesContent
        union={union}
        user={membership.user}
        role={membership.member.role}
        memberId={membership.member.id}
        strikes={strikesList}
        summary={summary}
      />
    </>
  );
}
