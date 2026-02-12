'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export type TabKey = 'posts' | 'about' | 'files' | 'events' | 'elections' | 'contact';

const TAB_KEYS: TabKey[] = ['about', 'files', 'events', 'elections', 'contact'];

interface UnionTabContextType {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const UnionTabContext = createContext<UnionTabContextType>({
  activeTab: 'posts',
  setActiveTab: () => {},
});

function getTabFromPath(pathname: string, slug: string): TabKey {
  const prefix = `/${slug}/`;
  if (pathname.startsWith(prefix)) {
    const segment = pathname.slice(prefix.length).split('/')[0];
    if (TAB_KEYS.includes(segment as TabKey)) {
      return segment as TabKey;
    }
  }
  return 'posts';
}

export function UnionTabProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from pathname or legacy ?tab= param
  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    const tabFromPath = getTabFromPath(pathname, slug);
    if (tabFromPath !== 'posts') return tabFromPath;

    const tabFromQuery = searchParams.get('tab') as TabKey;
    if (tabFromQuery && TAB_KEYS.includes(tabFromQuery)) return tabFromQuery;

    return 'posts';
  });

  // Handle backward compat: redirect ?tab= to path-based URL
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab') as TabKey;
    if (tabFromQuery && TAB_KEYS.includes(tabFromQuery)) {
      const url = `/${slug}/${tabFromQuery}`;
      window.history.replaceState({}, '', url);
    }
  }, [searchParams, slug]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname, slug);
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [slug]);

  const setActiveTab = useCallback((tab: TabKey) => {
    setActiveTabState(tab);
    const url = tab === 'posts' ? `/${slug}` : `/${slug}/${tab}`;
    // If we're on the main union page (or a tab sub-page), use pushState for fast tab switching.
    // If we're on a different page (custom page, tool page, etc.), do a full navigation.
    const currentPath = window.location.pathname;
    const isMainPage = currentPath === `/${slug}` || TAB_KEYS.some(k => currentPath === `/${slug}/${k}`);
    if (isMainPage) {
      window.history.pushState({}, '', url);
    } else {
      window.location.href = url;
    }
  }, [slug]);

  return (
    <UnionTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </UnionTabContext.Provider>
  );
}

export function useUnionTab() {
  return useContext(UnionTabContext);
}
