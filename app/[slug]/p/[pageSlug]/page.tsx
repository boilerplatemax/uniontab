import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, unionPages, members, users, navigationItems, files } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { CustomPageContent } from './custom-page-content';
import type { Metadata } from 'next';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getPageBySlug(unionId: number, pageSlug: string) {
  const [page] = await db
    .select()
    .from(unionPages)
    .where(
      and(eq(unionPages.unionId, unionId), eq(unionPages.slug, pageSlug))
    )
    .limit(1);

  return page;
}

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union) {
    return { title: 'Page Not Found' };
  }

  const page = await getPageBySlug(union.id, pageSlug);
  if (!page) {
    return { title: 'Page Not Found' };
  }

  const unionName = union.publicName || union.name;
  const title = page.metaTitle || page.title;

  return {
    title: `${title} | ${unionName}`,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      user: users,
      member: members,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
    .limit(1);

  return membership;
}

async function getNavigationItems(unionId: number) {
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

  return items;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  const { slug, pageSlug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union) {
    notFound();
  }

  const page = await getPageBySlug(union.id, pageSlug);
  if (!page || !page.isPublished) {
    notFound();
  }

  const membership = await checkMembership(union.id);

  // If members only, check auth
  if (page.isMembersOnly) {
    if (!membership) {
      redirect(`/${slug}/sign-in`);
    }
    // Check if user is an approved member
    if (membership.member.status !== 'approved') {
      redirect(`/${slug}`);
    }
  }

  const navItems = await getNavigationItems(union.id);

  // Check if the current page's nav item has showBanner enabled
  const currentNavItem = navItems.find(
    (item) => item.linkType === 'page' && item.pageId === page.id
  );
  const showBanner = currentNavItem?.showBanner ?? false;

  return (
    <CustomPageContent
      union={union}
      page={page}
      membership={membership}
      handleSignOut={handleSignOut}
      slug={slug}
      navigationItems={navItems}
      showBanner={showBanner}
    />
  );
}
