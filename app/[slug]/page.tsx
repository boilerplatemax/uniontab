import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, members, posts, files, events, postLikes, postAttachments, announcements, announcementAttachments, dismissedAnnouncements } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { Users, Camera, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { UnionNavbar } from './union-navbar';
import { UnionProfileTabs } from './union-profile-tabs';
import { AnnouncementBanner } from '@/components/announcements/announcement-banner';
import { AnnouncementPopup } from '@/components/announcements/announcement-popup';
import { AnnouncementClient } from './announcement-client';

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

  // Get like counts and user's like status for all posts

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

async function getActiveAnnouncements(unionId: number, userId?: number, isOwner: boolean = false) {
  // Owners don't see auto-popups, but we still fetch for the banner
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
  if (!isOwner && userId) {
    const popupAnnouncements = activeAnnouncementsData.filter(a => a.type === 'popup');
    if (popupAnnouncements.length > 0) {
      // Check if user has dismissed any popups
      const dismissedIds = await db
        .select({ announcementId: dismissedAnnouncements.announcementId })
        .from(dismissedAnnouncements)
        .where(eq(dismissedAnnouncements.userId, userId));

      const dismissedSet = new Set(dismissedIds.map(d => d.announcementId));

      // Find first non-dismissed popup
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

  // Get the most recent active banner
  const bannerAnnouncements = activeAnnouncementsData.filter(a => a.type === 'banner');
  const banner = bannerAnnouncements.length > 0 ? bannerAnnouncements[0] : null;

  return { popup, banner };
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function PublicUnionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  // Only show published unions
  if (!union.publishedAt) {
    notFound();
  }

  const membership = await checkMembership(union.id);
  const isOwner = membership?.member.role === 'owner';
  const isApprovedMember = membership?.member.status === 'approved' || isOwner;

  // Get current user
  const currentUser = await getUser();

  // Get pending members count for owners
  const pendingMembersCount = isOwner ? await getPendingMembersCount(union.id) : 0;

  // Fetch posts, files, and events
  const unionPosts = await getUnionPosts(union.id, currentUser?.id);
  const unionFiles = await getUnionFiles(union.id);
  const unionEvents = await getUnionEvents(union.id);

  // Fetch active announcements
  const activeAnnouncements = await getActiveAnnouncements(union.id, currentUser?.id, isOwner);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
      />

      {/* Announcement Banner */}
      <AnnouncementClient
        popup={activeAnnouncements.popup}
        banner={activeAnnouncements.banner}
      />

      {/* Unapproved User Alert Banner */}
      {membership && membership.member.status === 'pending' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-yellow-800 font-medium">
                Your account has not been approved yet - some content may not be visible until an admin approves your membership.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo - Facebook style */}
      <div className="relative bg-white">
        <div className="relative h-[300px] sm:h-[400px] bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
          {union.coverPhotoUrl ? (
            <img
              src={union.coverPhotoUrl}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Users className="h-32 w-32 text-white/30" />
            </div>
          )}
        </div>
      </div>

      {/* Profile Section - Facebook style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-lg shadow-sm pb-4">
          {/* Logo and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-6 pt-6">
            {/* Logo - Overlapping cover photo with flexible sizing */}
            <div className="flex-shrink-0 -mt-8 sm:-mt-16 relative z-20">
              {union.logoUrl ? (
                <div className="relative h-32 sm:h-40 bg-white rounded-xl border-4 border-white shadow-xl overflow-hidden">
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="h-full w-auto max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl">
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                </div>
              )}
            </div>

            {/* Name and Local Number */}
            <div className="flex-1 text-center sm:text-left pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {(union.publicName || union.name).toUpperCase()}
                {union.localNumber && !union.publicName && ` ${union.localNumber}`}
              </h1>
              {union.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base">
                  {union.description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information Bar */}
          {(union.email || union.phone || union.address || union.website) && (
            <div className="px-6 pb-4 border-t pt-4">
              <div className="flex flex-wrap gap-4 text-sm">
                {union.email && (
                  <a
                    href={`mailto:${union.email}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{union.email}</span>
                  </a>
                )}
                {union.phone && (
                  <a
                    href={`tel:${union.phone}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{union.phone}</span>
                  </a>
                )}
                {union.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{union.address}</span>
                  </div>
                )}
                {union.website && (
                  <a
                    href={union.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hover:underline">
                      {union.website.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnionProfileTabs
          union={union}
          posts={unionPosts}
          files={unionFiles}
          events={unionEvents}
          membership={membership}
          isOwner={isOwner}
          isApprovedMember={isApprovedMember}
          userId={currentUser?.id || null}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              UnionTab
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
