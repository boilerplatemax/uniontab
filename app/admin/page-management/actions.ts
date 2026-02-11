'use server';

import { db } from '@/lib/db/drizzle';
import { unionPages, navigationItems, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

async function requireWebmaster() {
  const user = await getUser();
  if (!user || user.role !== 'webmaster') {
    throw new Error('Unauthorized: webmaster access required');
  }
  return user;
}

export async function getUnionPages(unionId: number) {
  await requireWebmaster();

  return await db
    .select()
    .from(unionPages)
    .where(eq(unionPages.unionId, unionId))
    .orderBy(unionPages.sortOrder);
}

export async function createPage(
  unionId: number,
  data: {
    title: string;
    slug: string;
    content?: string;
    isPublished?: boolean;
    isMembersOnly?: boolean;
  }
) {
  const user = await requireWebmaster();

  const [page] = await db
    .insert(unionPages)
    .values({
      unionId,
      title: data.title,
      slug: data.slug,
      content: data.content || '',
      isPublished: data.isPublished ?? false,
      isMembersOnly: data.isMembersOnly ?? false,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  return page;
}

export async function updatePage(
  pageId: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    isPublished?: boolean;
    isMembersOnly?: boolean;
  }
) {
  const user = await requireWebmaster();

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: user.id,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isPublished !== undefined) {
    updateData.isPublished = data.isPublished;
    if (data.isPublished) {
      updateData.publishedAt = new Date();
    }
  }
  if (data.isMembersOnly !== undefined) updateData.isMembersOnly = data.isMembersOnly;

  const [page] = await db
    .update(unionPages)
    .set(updateData)
    .where(eq(unionPages.id, pageId))
    .returning();

  return page;
}

export async function deletePage(pageId: number) {
  await requireWebmaster();

  // Clean up any navigationItems referencing this page
  await db
    .delete(navigationItems)
    .where(eq(navigationItems.pageId, pageId));

  await db.delete(unionPages).where(eq(unionPages.id, pageId));

  return { success: true };
}

export async function copyPage(pageId: number) {
  const user = await requireWebmaster();

  const original = await db
    .select()
    .from(unionPages)
    .where(eq(unionPages.id, pageId))
    .limit(1);

  if (!original[0]) {
    throw new Error('Page not found');
  }

  const source = original[0];

  const [page] = await db
    .insert(unionPages)
    .values({
      unionId: source.unionId,
      title: `Copy of ${source.title}`,
      slug: `copy-of-${source.slug}`,
      content: source.content,
      excerpt: source.excerpt,
      isPublished: false,
      isMembersOnly: source.isMembersOnly,
      sortOrder: source.sortOrder,
      metaTitle: source.metaTitle,
      metaDescription: source.metaDescription,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  return page;
}

export async function getPageById(pageId: number) {
  await requireWebmaster();

  const [page] = await db
    .select()
    .from(unionPages)
    .where(eq(unionPages.id, pageId))
    .limit(1);

  return page || null;
}

export async function getAllUnions() {
  await requireWebmaster();

  return await db
    .select({
      id: unions.id,
      name: unions.name,
      slug: unions.slug,
      localNumber: unions.localNumber,
      publicName: unions.publicName,
    })
    .from(unions)
    .orderBy(unions.name);
}
