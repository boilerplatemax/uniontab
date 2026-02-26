import { cache } from 'react';
import { db } from '@/lib/db/drizzle';
import {
  unions, users, members, files, announcements,
  announcementAttachments, dismissedAnnouncements, navigationItems, unionPages,
} from '@/lib/db/schema';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { getUser, getGrievanceNotificationCount, getStrikeNotificationCount } from '@/lib/db/queries';
import { cookies } from 'next/headers';

// Cache per request so layout + page don't double-hit the DB for shared queries
const getUnionBySlugCached = cache(async (slug: string) => {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);
  return union ?? null;
});

const getCurrentUserCached = cache(async () => {
  return getUser();
});

const getMembershipCached = cache(async (unionId: number) => {
  const user = await getCurrentUserCached();
  if (!user) return null;
  const [membership] = await db
    .select({ user: users, member: members })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
    .limit(1);
  return membership ?? null;
});

async function getActiveAnnouncements(unionId: number, userId?: number) {
  const active = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.unionId, unionId), eq(announcements.isActive, true)))
    .orderBy(desc(announcements.createdAt));

  if (active.length === 0) return { popup: null, banner: null };

  let popup = null;
  if (userId) {
    const popups = active.filter(a => a.type === 'popup');
    if (popups.length > 0) {
      const dismissed = await db
        .select({ announcementId: dismissedAnnouncements.announcementId })
        .from(dismissedAnnouncements)
        .where(eq(dismissedAnnouncements.userId, userId));
      const dismissedSet = new Set(dismissed.map(d => d.announcementId));
      const activePopup = popups.find(p => !dismissedSet.has(p.id));
      if (activePopup) {
        const attachments = await db
          .select()
          .from(announcementAttachments)
          .where(eq(announcementAttachments.announcementId, activePopup.id));
        popup = { ...activePopup, attachments };
      }
    }
  }

  const banners = active.filter(a => a.type === 'banner');
  return { popup, banner: banners[0] ?? null };
}

async function getNavNavigationItems(unionId: number) {
  return db
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
      icon: navigationItems.icon,
      showBanner: navigationItems.showBanner,
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
}

async function handleSignOutAction() {
  'use server';
  (await cookies()).delete('session');
}

export async function getNavbarData(slug: string) {
  const union = await getUnionBySlugCached(slug);
  if (!union || !union.publishedAt) return null;

  const currentUser = await getCurrentUserCached();
  const membership = await getMembershipCached(union.id);

  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = isOwner || membership?.member.role === 'admin';
  const isApprovedMember = membership?.member.status === 'approved' || isOwner;

  const [
    pendingMembersCount,
    grievanceNotificationCount,
    strikeNotificationCount,
    navItems,
    activeAnnouncements,
    galleryCount,
    publicFilesCount,
  ] = await Promise.all([
    isOwnerOrAdmin
      ? db.select({ value: count() }).from(members)
          .where(and(eq(members.unionId, union.id), eq(members.status, 'pending')))
          .then(([r]) => Number(r.value))
      : Promise.resolve(0),
    currentUser && isApprovedMember
      ? getGrievanceNotificationCount(union.id, currentUser.id, isOwner)
      : Promise.resolve(0),
    currentUser && isApprovedMember
      ? getStrikeNotificationCount(union.id, currentUser.id, isOwner)
      : Promise.resolve(0),
    getNavNavigationItems(union.id),
    getActiveAnnouncements(union.id, currentUser?.id),
    db.select({ value: count() }).from(files)
      .where(and(eq(files.unionId, union.id), eq(files.category, 'gallery')))
      .then(([r]) => Number(r.value)),
    // Count non-gallery public files (isPrivate = false, not a gallery image)
    db.select({ value: count() }).from(files)
      .where(and(
        eq(files.unionId, union.id),
        eq(files.isPrivate, false),
        sql`(${files.category} IS NULL OR ${files.category} != 'gallery')`,
      ))
      .then(([r]) => Number(r.value)),
  ]);

  return {
    union,
    membership,
    isApprovedMember,
    pendingMembersCount,
    grievanceNotificationCount,
    strikeNotificationCount,
    navItems,
    activeAnnouncements,
    hasGalleryImages: galleryCount > 0,
    hasPublicFiles: publicFilesCount > 0,
    handleSignOut: handleSignOutAction,
  };
}
