'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export type TabKey = 'posts' | 'about' | 'files' | 'events' | 'elections' | 'contact';

const TAB_KEYS: TabKey[] = ['about', 'files', 'events', 'elections', 'contact'];

interface UnionTabContextType {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isOnTabPage: boolean;
  isDemo: boolean;
}

const UnionTabContext = createContext<UnionTabContextType>({
  activeTab: 'posts',
  setActiveTab: () => {},
  isOnTabPage: true,
  isDemo: false,
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

export function UnionTabProvider({
  slug,
  isDemo = false,
  children,
}: {
  slug: string;
  isDemo?: boolean;
  children: React.ReactNode;
}) {
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
    const currentPath = window.location.pathname;
    const isMainPage = currentPath === `/${slug}` || TAB_KEYS.some(k => currentPath === `/${slug}/${k}`);
    if (isMainPage) {
      window.history.pushState({}, '', url);
    } else {
      window.location.href = url;
    }
  }, [slug]);

  // True only when on a tab-based union page (posts, about, files, events, elections, contact)
  const isOnTabPage = pathname === `/${slug}` || TAB_KEYS.some(k => pathname === `/${slug}/${k}`);

  return (
    <UnionTabContext.Provider value={{ activeTab, setActiveTab, isOnTabPage, isDemo }}>
      {children}
    </UnionTabContext.Provider>
  );
}

export function useUnionTab() {
  return useContext(UnionTabContext);
}
