import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, memberGroups, memberGroupAssignments } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MassEmailContent } from './mass-email-content';

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
    .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
    .where(eq(members.unionId, unionId));

  return unionMembers;
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

export default async function MassEmailPage({
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

  const isOwnerOrAdmin = await checkOwnerOrAdmin(union.id, user.id);

  if (!isOwnerOrAdmin) {
    redirect(`/${slug}`);
  }

  const [unionMembers, groups, groupAssignments] = await Promise.all([
    getUnionMembers(union.id),
    getGroups(union.id),
    getGroupAssignments(union.id),
  ]);

  return (
    <MassEmailContent
      slug={slug}
      union={union}
      members={unionMembers}
      groups={groups}
      groupAssignments={groupAssignments}
    />
  );
}
