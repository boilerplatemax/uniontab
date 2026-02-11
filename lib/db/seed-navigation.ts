import { db } from '@/lib/db/drizzle';
import { navigationItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_NAV_ITEMS = [
  { label: 'News', builtInRoute: 'news', sortOrder: 0 },
  { label: 'About', builtInRoute: 'about', sortOrder: 1 },
  { label: 'Events', builtInRoute: 'events', sortOrder: 2 },
  { label: 'Files', builtInRoute: 'files', sortOrder: 3 },
  { label: 'Elections', builtInRoute: 'elections', sortOrder: 4 },
  { label: 'Contact', builtInRoute: 'contact', sortOrder: 5 },
] as const;

export async function seedDefaultNavigation(unionId: number): Promise<void> {
  // Check if this union already has navigation items
  const existing = await db
    .select({ id: navigationItems.id })
    .from(navigationItems)
    .where(eq(navigationItems.unionId, unionId))
    .limit(1);

  if (existing.length > 0) {
    return; // Already seeded
  }

  await db.insert(navigationItems).values(
    DEFAULT_NAV_ITEMS.map((item) => ({
      unionId,
      label: item.label,
      builtInRoute: item.builtInRoute,
      sortOrder: item.sortOrder,
      visibility: 'public' as const,
      linkType: 'built_in_route' as const,
      isEnabled: true,
      isMandatory: true,
      openInNewTab: false,
    }))
  );
}
