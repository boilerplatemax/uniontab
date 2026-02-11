'use server';

import { db } from '@/lib/db/drizzle';
import { navigationItems, unionPages, files, unions } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

async function requireWebmaster() {
  const user = await getUser();
  if (!user || user.role !== 'webmaster') {
    throw new Error('Unauthorized: webmaster access required');
  }
  return user;
}

export async function getNavigationItems(unionId: number) {
  await requireWebmaster();

  const items = await db
    .select()
    .from(navigationItems)
    .where(eq(navigationItems.unionId, unionId))
    .orderBy(asc(navigationItems.sortOrder));

  return items;
}

export async function getUnionPages(unionId: number) {
  await requireWebmaster();

  return await db
    .select({
      id: unionPages.id,
      title: unionPages.title,
      slug: unionPages.slug,
      isPublished: unionPages.isPublished,
    })
    .from(unionPages)
    .where(and(eq(unionPages.unionId, unionId), eq(unionPages.isPublished, true)))
    .orderBy(unionPages.title);
}

export async function getUnionFiles(unionId: number) {
  await requireWebmaster();

  return await db
    .select({
      id: files.id,
      name: files.name,
      fileUrl: files.fileUrl,
    })
    .from(files)
    .where(eq(files.unionId, unionId))
    .orderBy(files.name);
}

export async function saveNavigationTree(
  unionId: number,
  items: {
    id?: number;
    parentId?: number | null;
    label: string;
    sortOrder: number;
    visibility: string;
    linkType: string;
    pageId?: number | null;
    fileId?: number | null;
    externalUrl?: string | null;
    builtInRoute?: string | null;
    isEnabled: boolean;
    openInNewTab: boolean;
    isMandatory: boolean;
  }[]
) {
  await requireWebmaster();

  // Get existing items to determine deletes
  const existingItems = await db
    .select()
    .from(navigationItems)
    .where(eq(navigationItems.unionId, unionId));

  const incomingIds = items.filter((i) => i.id).map((i) => i.id as number);

  // Delete items that are no longer in the list (but keep mandatory items)
  for (const existing of existingItems) {
    if (!incomingIds.includes(existing.id)) {
      if (!existing.isMandatory) {
        await db.delete(navigationItems).where(eq(navigationItems.id, existing.id));
      }
    }
  }

  // Upsert items
  const results = [];
  for (const item of items) {
    if (item.id) {
      // Update existing
      const [updated] = await db
        .update(navigationItems)
        .set({
          parentId: item.parentId ?? null,
          label: item.label,
          sortOrder: item.sortOrder,
          visibility: item.visibility,
          linkType: item.linkType,
          pageId: item.pageId ?? null,
          fileId: item.fileId ?? null,
          externalUrl: item.externalUrl ?? null,
          builtInRoute: item.builtInRoute ?? null,
          isEnabled: item.isEnabled,
          openInNewTab: item.openInNewTab,
          isMandatory: item.isMandatory,
          updatedAt: new Date(),
        })
        .where(eq(navigationItems.id, item.id))
        .returning();
      results.push(updated);
    } else {
      // Insert new
      const [inserted] = await db
        .insert(navigationItems)
        .values({
          unionId,
          parentId: item.parentId ?? null,
          label: item.label,
          sortOrder: item.sortOrder,
          visibility: item.visibility,
          linkType: item.linkType,
          pageId: item.pageId ?? null,
          fileId: item.fileId ?? null,
          externalUrl: item.externalUrl ?? null,
          builtInRoute: item.builtInRoute ?? null,
          isEnabled: item.isEnabled,
          openInNewTab: item.openInNewTab,
          isMandatory: item.isMandatory,
        })
        .returning();
      results.push(inserted);
    }
  }

  return results;
}

export async function addNavigationItem(
  unionId: number,
  data: {
    parentId?: number | null;
    label: string;
    sortOrder: number;
    visibility: string;
    linkType: string;
    pageId?: number | null;
    fileId?: number | null;
    externalUrl?: string | null;
    builtInRoute?: string | null;
    isEnabled: boolean;
    openInNewTab: boolean;
  }
) {
  await requireWebmaster();

  const [item] = await db
    .insert(navigationItems)
    .values({
      unionId,
      parentId: data.parentId ?? null,
      label: data.label,
      sortOrder: data.sortOrder,
      visibility: data.visibility,
      linkType: data.linkType,
      pageId: data.pageId ?? null,
      fileId: data.fileId ?? null,
      externalUrl: data.externalUrl ?? null,
      builtInRoute: data.builtInRoute ?? null,
      isEnabled: data.isEnabled,
      openInNewTab: data.openInNewTab,
      isMandatory: false,
    })
    .returning();

  return item;
}

export async function deleteNavigationItem(itemId: number) {
  await requireWebmaster();

  // Check if mandatory
  const [item] = await db
    .select()
    .from(navigationItems)
    .where(eq(navigationItems.id, itemId))
    .limit(1);

  if (!item) {
    throw new Error('Navigation item not found');
  }

  if (item.isMandatory) {
    throw new Error('Cannot delete mandatory navigation item');
  }

  // Also delete children
  await db.delete(navigationItems).where(eq(navigationItems.parentId, itemId));
  await db.delete(navigationItems).where(eq(navigationItems.id, itemId));

  return { success: true };
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
