import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, announcements, announcementAttachments, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { AnnouncementsContent } from './announcements-content';

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

  const isOwner = await checkOwnership(union.id, user.id);

  if (!isOwner) {
    redirect(`/${slug}`);
  }

  const unionAnnouncements = await getUnionAnnouncements(union.id);

  return <AnnouncementsContent slug={slug} union={union} announcements={unionAnnouncements} isOwner={isOwner} />;
}
