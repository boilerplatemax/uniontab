import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, files } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { GalleryContent } from './gallery-content';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import { AdminHelpWidget } from '@/components/admin-help-widget';

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

  return (
    <div className="min-h-screen bg-white">
      <GalleryContent
          slug={slug}
          isAdminOrOwner={isOwnerOrAdmin}
          initialImages={galleryImages.map((img) => ({
            ...img,
            sortOrder: img.sortOrder ?? 0,
            createdAt: img.createdAt.toISOString(),
          }))}
          initialShowTitles={union.galleryShowTitles ?? false}
          union={{
            name: union.name,
            publicName: union.publicName,
            localNumber: union.localNumber,
            description: union.description,
            coverPhotoUrl: union.coverPhotoUrl,
            themeColor: union.themeColor,
            theme: union.theme,
            logoUrl: union.logoUrl,
            email: union.email,
            phone: union.phone,
            address: union.address,
            website: union.website,
            showSocialInHero: union.showSocialInHero,
            socialLinks: union.socialLinks,
          }}
        />
      <AccessibilityWidget enabled={union.accessibilityWidgetEnabled ?? true} />
      <AdminHelpWidget slug={slug} isAdmin={isOwnerOrAdmin} />
    </div>
  );
}
