import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, files } from '@/lib/db/schema';
import { eq, and, asc, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { signOut } from '@/app/(login)/actions';
import { GalleryContent } from './gallery-content';
import { getUnionNavigationItems } from '../get-union-page-data';

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
      user: { id: users.id, name: users.name },
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);
  return membership;
}

async function getGalleryImages(unionId: number) {
  return db
    .select({
      id: files.id,
      url: files.fileUrl,
      name: files.name,
      type: files.fileType,
      size: files.fileSize,
      sortOrder: files.sortOrder,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(and(eq(files.unionId, unionId), eq(files.category, 'gallery')))
    .orderBy(asc(files.sortOrder), asc(files.createdAt));
}

async function getPendingMembersCount(unionId: number) {
  const [result] = await db
    .select({ value: count() })
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.status, 'pending')));
  return Number(result.value);
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) {
    notFound();
  }

  const currentUser = await getUser();
  const membership = currentUser ? await getMembership(union.id, currentUser.id) : null;
  const isOwnerOrAdmin =
    membership?.member.role === 'owner' || membership?.member.role === 'admin';
  const isApprovedMember = membership?.member.status === 'approved' || isOwnerOrAdmin;

  const galleryImages = await getGalleryImages(union.id);
  const hasGalleryImages = galleryImages.length > 0;

  // Non-admins can only view if there are images
  if (!isOwnerOrAdmin && !hasGalleryImages) {
    redirect(`/${slug}`);
  }

  const pendingMembersCount = isOwnerOrAdmin ? await getPendingMembersCount(union.id) : 0;
  const navItems = await getUnionNavigationItems(union.id);

  async function handleSignOut() {
    'use server';
    await signOut();
  }

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
        isApprovedMember={isApprovedMember}
        navigationItems={navItems}
        hasGalleryImages={hasGalleryImages}
      />
      <NavbarSpacer />
      <GalleryContent
        slug={slug}
        isAdminOrOwner={isOwnerOrAdmin}
        initialImages={galleryImages.map((img) => ({
          ...img,
          sortOrder: img.sortOrder ?? 0,
          createdAt: img.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
