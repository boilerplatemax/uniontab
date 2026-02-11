import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, members, posts, files, events, postLikes, postAttachments, announcements, announcementAttachments, dismissedAnnouncements, navigationItems, unionPages } from '@/lib/db/schema';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { getUser, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import type { ThemeId } from '@/lib/themes/config';
import { canAccessTheme } from '@/lib/themes/config';

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
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
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

async function getUnionPosts(unionId: number, userId?: number) {
  const postsWithCreator = await db
    .select({
      id: posts.id,
      unionId: posts.unionId,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      isPrivate: posts.isPrivate,
      isPinned: posts.isPinned,
      authorType: posts.authorType,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      updatedBy: posts.updatedBy,
      createdBy: {
        name: users.name,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.createdBy, users.id))
    .where(eq(posts.unionId, unionId))
    .orderBy(desc(posts.isPinned), desc(posts.createdAt));

  // Get attachments for all posts
  const postIds = postsWithCreator.map(p => p.id);
  const attachmentsData = postIds.length > 0
    ? await db
        .select()
        .from(postAttachments)
        .where(sql`${postAttachments.postId} IN ${sql`(${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`}`)
    : [];

  const attachmentsByPost = attachmentsData.reduce((acc, attachment) => {
    if (!acc[attachment.postId]) {
      acc[attachment.postId] = [];
    }
    acc[attachment.postId].push(attachment);
    return acc;
  }, {} as Record<number, typeof attachmentsData>);

  // Get like counts
  const likeCounts = await db
    .select({
      postId: postLikes.postId,
      count: count(),
    })
    .from(postLikes)
    .where(sql`${postLikes.postId} IN ${postIds.length > 0 ? sql`(${sql.join(postIds.map(id => sql`${id}`), sql`, `)})` : sql`(NULL)`}`)
    .groupBy(postLikes.postId);

  const likeCountMap = Object.fromEntries(
    likeCounts.map(({ postId, count }) => [postId, Number(count)])
  );

  // Get user's likes if logged in
  let userLikes: number[] = [];
  if (userId) {
    const userLikeRecords = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          sql`${postLikes.postId} IN ${postIds.length > 0 ? sql`(${sql.join(postIds.map(id => sql`${id}`), sql`, `)})` : sql`(NULL)`}`
        )
      );
    userLikes = userLikeRecords.map(l => l.postId);
  }

  // Combine data
  return postsWithCreator.map(post => ({
    ...post,
    likeCount: likeCountMap[post.id] || 0,
    isLikedByUser: userLikes.includes(post.id),
    attachments: attachmentsByPost[post.id] || [],
  }));
}

async function getUnionFiles(unionId: number) {
  const filesWithCreator = await db
    .select({
      id: files.id,
      unionId: files.unionId,
      name: files.name,
      originalName: files.originalName,
      fileUrl: files.fileUrl,
      fileType: files.fileType,
      fileSize: files.fileSize,
      isPrivate: files.isPrivate,
      category: files.category,
      sortOrder: files.sortOrder,
      createdAt: files.createdAt,
      createdBy: {
        name: users.name,
      },
    })
    .from(files)
    .innerJoin(users, eq(files.createdBy, users.id))
    .where(eq(files.unionId, unionId))
    .orderBy(desc(files.createdAt));

  return filesWithCreator;
}

async function getUnionEvents(unionId: number) {
  const eventsWithCreator = await db
    .select({
      id: events.id,
      unionId: events.unionId,
      title: events.title,
      description: events.description,
      location: events.location,
      mediaUrl: events.mediaUrl,
      startDate: events.startDate,
      endDate: events.endDate,
      startTime: events.startTime,
      endTime: events.endTime,
      isAllDay: events.isAllDay,
      isPrivate: events.isPrivate,
      category: events.category,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      updatedBy: events.updatedBy,
      createdBy: {
        name: users.name,
      },
    })
    .from(events)
    .innerJoin(users, eq(events.createdBy, users.id))
    .where(eq(events.unionId, unionId))
    .orderBy(events.startDate);

  return eventsWithCreator;
}

async function getActiveAnnouncements(unionId: number, userId?: number) {
  const activeAnnouncementsData = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.unionId, unionId),
      eq(announcements.isActive, true)
    ))
    .orderBy(desc(announcements.createdAt));

  if (activeAnnouncementsData.length === 0) {
    return { popup: null, banner: null };
  }

  // Get the most recent active popup (not dismissed by user)
  let popup = null;
  if (userId) {
    const popupAnnouncements = activeAnnouncementsData.filter(a => a.type === 'popup');
    if (popupAnnouncements.length > 0) {
      const dismissedIds = await db
        .select({ announcementId: dismissedAnnouncements.announcementId })
        .from(dismissedAnnouncements)
        .where(eq(dismissedAnnouncements.userId, userId));

      const dismissedSet = new Set(dismissedIds.map(d => d.announcementId));
      const activePopup = popupAnnouncements.find(p => !dismissedSet.has(p.id));

      if (activePopup) {
        const attachments = await db
          .select()
          .from(announcementAttachments)
          .where(eq(announcementAttachments.announcementId, activePopup.id));

        popup = { ...activePopup, attachments };
      }
    }
  }

  const bannerAnnouncements = activeAnnouncementsData.filter(a => a.type === 'banner');
  const banner = bannerAnnouncements.length > 0 ? bannerAnnouncements[0] : null;

  return { popup, banner };
}

async function getUnionNavigationItems(unionId: number) {
  const items = await db
    .select({
      id: navigationItems.id,
      unionId: navigationItems.unionId,
      parentId: navigationItems.parentId,
      label: navigationItems.label,
      sortOrder: navigationItems.sortOrder,
      visibility: navigationItems.visibility,
      linkType: navigationItems.linkType,
      pageId: navigationItems.pageId,
      fileId: navigationItems.fileId,
      externalUrl: navigationItems.externalUrl,
      builtInRoute: navigationItems.builtInRoute,
      isEnabled: navigationItems.isEnabled,
      openInNewTab: navigationItems.openInNewTab,
      isMandatory: navigationItems.isMandatory,
      createdAt: navigationItems.createdAt,
      updatedAt: navigationItems.updatedAt,
      pageSlug: unionPages.slug,
      fileUrl: files.fileUrl,
    })
    .from(navigationItems)
    .leftJoin(unionPages, eq(navigationItems.pageId, unionPages.id))
    .leftJoin(files, eq(navigationItems.fileId, files.id))
    .where(eq(navigationItems.unionId, unionId))
    .orderBy(asc(navigationItems.sortOrder));

  return items;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export async function getUnionPageData(slug: string) {
  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  if (!union.publishedAt) {
    notFound();
  }

  const membership = await checkMembership(union.id);
  const isOwner = membership?.member.role === 'owner';
  const isApprovedMember = membership?.member.status === 'approved' || isOwner;

  const currentUser = await getUser();

  const pendingMembersCount = isOwner ? await getPendingMembersCount(union.id) : 0;

  const grievanceNotificationCount = currentUser && isApprovedMember
    ? await getGrievanceNotificationCount(union.id, currentUser.id, isOwner)
    : 0;
  const strikeNotificationCount = currentUser && isApprovedMember
    ? await getStrikeNotificationCount(union.id, currentUser.id, isOwner)
    : 0;

  const unionPosts = await getUnionPosts(union.id, currentUser?.id);
  const unionFiles = await getUnionFiles(union.id);
  const unionEvents = await getUnionEvents(union.id);

  const activeAnnouncements = await getActiveAnnouncements(union.id, currentUser?.id);
  const unionNavigationItems = await getUnionNavigationItems(union.id);

  const requestedTheme = (union.theme || 'default') as ThemeId;
  const hasAccess = canAccessTheme(requestedTheme, (union as any).planName);
  const theme = hasAccess ? requestedTheme : 'default';

  return {
    union,
    membership,
    isOwner,
    isApprovedMember,
    currentUser,
    pendingMembersCount,
    grievanceNotificationCount,
    strikeNotificationCount,
    unionPosts,
    unionFiles,
    unionEvents,
    activeAnnouncements,
    navigationItems: unionNavigationItems,
    theme,
    handleSignOut,
    slug,
  };
}
