import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, navigationItems, files } from '@/lib/db/schema';
import { eq, and, count, asc } from 'drizzle-orm';
import { getUser, getGrievancesForUnion, getGrievanceSummaryForUnion, getGrievancesForMember, getGrievancesForParticipant, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { GrievancesContent } from './grievances-content';

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

  const membership = await getMembership(union.id, user.id);
  if (!membership || membership.member.status !== 'approved') {
    redirect(`/${slug}`);
  }

  const isOwnerOrAdmin = await checkOwnerOrAdmin(union.id, user.id);

  // Get grievances based on role
  let grievances: any[];
  if (isOwnerOrAdmin) {
    grievances = await getGrievancesForUnion(union.id);
  } else {
    // Regular members see their own grievances + any they were added to as a grievor
    const [ownGrievances, participantGrievances] = await Promise.all([
      getGrievancesForMember(membership.member.id),
      getGrievancesForParticipant(membership.member.id),
    ]);
    const seen = new Set<number>();
    grievances = [];
    for (const g of [...ownGrievances, ...participantGrievances]) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        grievances.push(g);
      }
    }
    grievances.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get summary stats (for admins)
  const summary = isOwnerOrAdmin ? await getGrievanceSummaryForUnion(union.id) : null;

  // Get admin members for assignment dropdown
  const adminMembers = isOwnerOrAdmin ? await getAdminMembers(union.id) : [];

  // Get all approved members for the grievors picker (admin only)
  const allMembers = isOwnerOrAdmin
    ? await db
        .select({
          member: members,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(eq(members.unionId, union.id), eq(members.status, 'approved')))
        .orderBy(users.name)
    : [];

  return (
    <GrievancesContent
        union={union}
        user={membership.user}
        role={membership.member.role}
        memberId={membership.member.id}
        grievances={grievances}
        summary={summary}
        adminMembers={adminMembers}
        allMembers={allMembers}
        grievanceFilingPermission={(union as any).grievanceFilingPermission || 'all'}
    />
  );
}
