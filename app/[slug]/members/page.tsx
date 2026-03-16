import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, navigationItems, files, memberGroups, memberGroupAssignments } from '@/lib/db/schema';
import { eq, and, count, asc, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MembersContent } from './members-content';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkOwnership(unionId: number, userId: number) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner';
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
    .where(eq(members.unionId, unionId));

  return unionMembers;
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
      memberCount: sql<number>`count(${memberGroupAssignments.id})::int`,
    })
    .from(memberGroups)
    .leftJoin(memberGroupAssignments, eq(memberGroups.id, memberGroupAssignments.groupId))
    .where(eq(memberGroups.unionId, unionId))
    .groupBy(memberGroups.id)
    .orderBy(memberGroups.name);

  return groups;
}

async function getGroupAssignments(unionId: number) {
  const assignments = await db
    .select({
      memberId: memberGroupAssignments.memberId,
      groupId: memberGroupAssignments.groupId,
    })
    .from(memberGroupAssignments)
    .innerJoin(memberGroups, eq(memberGroupAssignments.groupId, memberGroups.id))
    .where(eq(memberGroups.unionId, unionId));

  return assignments;
}

export default async function MembersPage({
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

  const isOwner = await checkOwnership(union.id, user.id);

  if (!isOwner) {
    redirect(`/${slug}`);
  }

  const [unionMembers, groups, groupAssignments] = await Promise.all([
    getUnionMembers(union.id),
    getGroups(union.id),
    getGroupAssignments(union.id),
  ]);

  return (
    <MembersContent
      slug={slug}
      union={union}
      members={unionMembers}
      isOwner={isOwner}
      groups={groups}
      groupAssignments={groupAssignments}
      isDemo={union.isDemo}
    />
  );
}
