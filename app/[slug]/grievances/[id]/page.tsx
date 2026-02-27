import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, grievanceParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getGrievanceById, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { GrievanceDetailContent } from './grievance-detail-content';

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

  return adminMembers.filter(m => m.member.role === 'owner' || m.member.role === 'admin');
}

async function getAllApprovedMembers(unionId: number) {
  const allMembers = await db
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
    )
    .orderBy(users.name);

  return allMembers;
}

export default async function GrievanceDetailPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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

  // Get the grievance with appropriate permissions
  const grievance = await getGrievanceById(parseInt(id), isOwnerOrAdmin);

  if (!grievance) {
    notFound();
  }

  // Check if user has permission to view this grievance
  const isGrievanceCreator = grievance.memberId === membership.member.id;
  let isParticipant = false;
  if (!isOwnerOrAdmin && !isGrievanceCreator) {
    const [participation] = await db
      .select()
      .from(grievanceParticipants)
      .where(and(
        eq(grievanceParticipants.grievanceId, grievance.id),
        eq(grievanceParticipants.memberId, membership.member.id)
      ))
      .limit(1);
    isParticipant = !!participation;
  }

  if (!isOwnerOrAdmin && !isGrievanceCreator && !isParticipant) {
    redirect(`/${slug}/grievances`);
  }

  const adminMembers = isOwnerOrAdmin ? await getAdminMembers(union.id) : [];
  const allMembers = isOwnerOrAdmin ? await getAllApprovedMembers(union.id) : [];

  return (
    <GrievanceDetailContent
        union={union}
        user={membership.user}
        role={membership.member.role}
        memberId={membership.member.id}
        grievance={grievance}
        adminMembers={adminMembers}
        allMembers={allMembers}
    />
  );
}
