import type { NavConfigItem } from '@/lib/db/schema';

/**
 * Built-in nav item IDs that map to existing union features.
 * These are the default items shown in the navbar center section.
 */
export const BUILT_IN_NAV_ITEMS = {
  posts: 'posts',
  about: 'about',
  files: 'files',
  events: 'events',
  elections: 'elections',
  contact: 'contact',
} as const;

export type BuiltInNavItemId = (typeof BUILT_IN_NAV_ITEMS)[keyof typeof BUILT_IN_NAV_ITEMS];

/**
 * Returns the default nav config for a union.
 * These items correspond to the existing tab system (posts, about, files, events, elections, contact).
 */
export function getDefaultNavConfig(): NavConfigItem[] {
  return [
    {
      id: BUILT_IN_NAV_ITEMS.posts,
      label: 'News',
      type: 'built-in',
      href: '',
      visible: true,
      requiresAuth: false,
      order: 0,
    },
    {
      id: BUILT_IN_NAV_ITEMS.about,
      label: 'About',
      type: 'built-in',
      href: '?tab=about',
      visible: true,
      requiresAuth: false,
      order: 1,
    },
    {
      id: BUILT_IN_NAV_ITEMS.files,
      label: 'Files',
      type: 'built-in',
      href: '?tab=files',
      visible: true,
      requiresAuth: false,
      order: 2,
    },
    {
      id: BUILT_IN_NAV_ITEMS.events,
      label: 'Events',
      type: 'built-in',
      href: '?tab=events',
      visible: true,
      requiresAuth: false,
      order: 3,
    },
    {
      id: BUILT_IN_NAV_ITEMS.elections,
      label: 'Elections',
      type: 'built-in',
      href: '?tab=elections',
      visible: true,
      requiresAuth: true,
      order: 4,
    },
    {
      id: BUILT_IN_NAV_ITEMS.contact,
      label: 'Contact',
      type: 'built-in',
      href: '?tab=contact',
      visible: true,
      requiresAuth: false,
      order: 5,
    },
  ];
}

/**
 * Resolves the effective nav config for a union.
 * If the union has a custom navConfig, use it; otherwise use defaults.
 */
export function resolveNavConfig(navConfig: NavConfigItem[] | null | undefined): NavConfigItem[] {
  if (navConfig && navConfig.length > 0) {
    return [...navConfig].sort((a, b) => a.order - b.order);
  }
  return getDefaultNavConfig();
}

/**
 * Resolves the href for a nav item relative to the union slug.
 */
export function getNavItemHref(slug: string, item: NavConfigItem): string {
  if (item.type === 'link' && item.href) {
    return item.href;
  }
  if (item.type === 'page' && item.pageId) {
    return `/${slug}/pages/${item.pageId}`;
  }
  if (item.type === 'collection' && item.collectionId) {
    return `/${slug}/collections/${item.collectionId}`;
  }
  // Built-in items use query params on the union page
  if (item.type === 'built-in') {
    if (!item.href || item.href === '') {
      return `/${slug}`;
    }
    return `/${slug}${item.href}`;
  }
  return `/${slug}`;
}
