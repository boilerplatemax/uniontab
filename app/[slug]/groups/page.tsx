import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, memberGroups, memberGroupAssignments } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/admin-permissions';
import { GroupsContent } from './groups-content';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
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

async function getGroups(unionId: number) {
  const groups = await db
    .select({
      id: memberGroups.id,
      name: memberGroups.name,
      description: memberGroups.description,
      createdAt: memberGroups.createdAt,
      updatedAt: memberGroups.updatedAt,
      memberCount: sql<number>`count(${memberGroupAssignments.id})::int`,
    })
    .from(memberGroups)
    .leftJoin(memberGroupAssignments, eq(memberGroups.id, memberGroupAssignments.groupId))
    .where(eq(memberGroups.unionId, unionId))
    .groupBy(memberGroups.id)
    .orderBy(memberGroups.name);

  return groups;
}

async function getUnionMembers(unionId: number) {
  const unionMembers = await db
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
    .where(and(eq(members.unionId, unionId), eq(members.status, 'approved')));

  return unionMembers;
}

export default async function GroupsPage({
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

  // Check if user has members permission (owner or admin with members permission)
  const canManageMembers = hasPermission(
    membership.member.role,
    membership.member.adminPermissions as any,
    'members'
  );

  if (!canManageMembers) {
    redirect(`/${slug}`);
  }

  const groups = await getGroups(union.id);
  const unionMembers = await getUnionMembers(union.id);

  return (
    <GroupsContent
      slug={slug}
      union={union}
      groups={groups}
      members={unionMembers}
      isDemo={union.isDemo}
    />
  );
}
