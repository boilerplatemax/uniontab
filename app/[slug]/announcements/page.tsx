import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, announcements, announcementAttachments, users } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { AnnouncementsContent } from './announcements-content';
import { UnionNavbar } from '../union-navbar';
import { signOut } from '@/app/(login)/actions';

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
      member: members,
      user: {
        id: users.id,
        name: users.name,
      },
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

async function getUnionAnnouncements(unionId: number) {
  const unionAnnouncements = await db
    .select({
      announcement: announcements,
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.createdBy, users.id))
    .where(eq(announcements.unionId, unionId))
    .orderBy(desc(announcements.createdAt));

  // Fetch attachments for each announcement
  const announcementsWithAttachments = await Promise.all(
    unionAnnouncements.map(async ({ announcement, createdBy }) => {
      const attachments = await db
        .select()
        .from(announcementAttachments)
        .where(eq(announcementAttachments.announcementId, announcement.id));

      return {
        ...announcement,
        createdBy,
        attachments,
      };
    })
  );

  return announcementsWithAttachments;
}

export default async function AnnouncementsPage({
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

  if (!membership || membership.member.role !== 'owner') {
    redirect(`/${slug}`);
  }

  const pendingMembersCount = await getPendingMembersCount(union.id);
  const unionAnnouncements = await getUnionAnnouncements(union.id);

  async function handleSignOut() {
    'use server';
    await signOut();
  }

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.name || 'Union'}
        localNumber={union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
      />
      <AnnouncementsContent slug={slug} union={union} announcements={unionAnnouncements} isOwner={true} />
    </>
  );
}
