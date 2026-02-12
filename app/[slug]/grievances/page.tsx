import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, navigationItems, files } from '@/lib/db/schema';
import { eq, and, count, asc } from 'drizzle-orm';
import { getUser, getGrievancesForUnion, getGrievanceSummaryForUnion, getGrievancesForMember, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { GrievancesContent } from './grievances-content';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { cookies } from 'next/headers';
import { getUnionNavigationItems } from '../get-union-page-data';

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

async function getAdminMembers(unionId: number) {
  const adminMembers = await db
    .select({
      member: members,
      user: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(
      and(
        eq(members.unionId, unionId),
        eq(members.status, 'approved')
      )
    );

  // Filter to only owners and admins
  return adminMembers.filter(m => m.member.role === 'owner' || m.member.role === 'admin');
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function GrievancesPage({
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

  // Get grievances based on role
  let grievances;
  if (isOwnerOrAdmin) {
    grievances = await getGrievancesForUnion(union.id);
  } else {
    grievances = await getGrievancesForMember(membership.member.id);
  }

  // Get summary stats (for admins)
  const summary = isOwnerOrAdmin ? await getGrievanceSummaryForUnion(union.id) : null;

  // Get admin members for assignment dropdown
  const adminMembers = isOwnerOrAdmin ? await getAdminMembers(union.id) : [];

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
      <GrievancesContent
        union={union}
        user={membership.user}
        role={membership.member.role}
        memberId={membership.member.id}
        grievances={grievances}
        summary={summary}
        adminMembers={adminMembers}
      />
    </>
  );
}
