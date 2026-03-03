'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, LogOut, UserCircle, CreditCard, Menu, X, Settings, Megaphone,
  Mail, ChevronDown, ChevronRight, UserPlus, DollarSign, FileText, Zap,
  Video, MessageSquare, BarChart3, Newspaper, Info, FolderOpen, CalendarDays,
  Vote, Phone, ArrowLeft, Shield, Download, ExternalLink, Images,
} from 'lucide-react';
import { useAnnouncementVisibility } from '@/hooks/use-announcement-visibility';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions';
import type { AdminPermissions, NavigationItem as BaseNavigationItem } from '@/lib/db/schema';
import { MemberLoginDropdown } from './member-login-dropdown';
import { useUnionTab, type TabKey } from './union-tab-context';
import { getNavIconByName } from '@/lib/nav-icons';

type NavigationItem = BaseNavigationItem & { pageSlug?: string | null; fileUrl?: string | null };

// ── Types ──────────────────────────────────────────────────────────────────

interface UnionNavbarProps {
  slug: string;
  unionName: string;
  localNumber: string | null;
  membership: {
    user: { name: string | null };
    member: { role: string; adminPermissions?: AdminPermissions | null };
  } | null;
  handleSignOut: () => Promise<void>;
  pendingMembersCount?: number;
  announcementId?: number | null;
  grievanceNotificationCount?: number;
  strikeNotificationCount?: number;
  contactEmail?: string | null;
  isApprovedMember?: boolean;
  navigationItems?: (NavigationItem & { pageSlug?: string | null; fileUrl?: string | null })[];
  hasGalleryImages?: boolean;
  hasPublicFiles?: boolean;
}

interface MegaMenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: number;
}

interface MegaMenuGroup {
  title: string;
  items: MegaMenuItem[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function UnionNavbar({
  slug,
  unionName,
  localNumber,
  membership,
  handleSignOut,
  pendingMembersCount = 0,
  announcementId,
  grievanceNotificationCount = 0,
  strikeNotificationCount = 0,
  contactEmail,
  isApprovedMember = false,
  navigationItems = [],
  hasGalleryImages = false,
  hasPublicFiles = false,
}: UnionNavbarProps) {
  const pathname = usePathname();
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);
  const { activeTab, setActiveTab, isOnTabPage } = useUnionTab();

  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  // Permission helper
  const canAccess = (permission: AdminPermissionKey): boolean => {
    return hasPermission(membership?.member.role, membership?.member.adminPermissions, permission);
  };

  // ── Desktop mega-menu state ────────────────────────────────────────────
  const [openPanel, setOpenPanel] = useState<'manage' | 'profile' | null>(null);
  const panelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openMegaMenu = (panel: 'manage' | 'profile') => {
    if (panelTimeoutRef.current) clearTimeout(panelTimeoutRef.current);
    setOpenPanel(panel);
  };

  const closeMegaMenu = () => {
    panelTimeoutRef.current = setTimeout(() => setOpenPanel(null), 150);
  };

  const cancelClose = () => {
    if (panelTimeoutRef.current) clearTimeout(panelTimeoutRef.current);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    if (openPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPanel]);

  // ── Mobile state ───────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'main' | 'manage' | 'profile'>('main');

  const closeMobile = () => {
    setMobileOpen(false);
    setTimeout(() => setMobilePanel('main'), 300);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const displayName = `${unionName.toUpperCase()}${localNumber ? ` ${localNumber}` : ''}`;

  // Gallery link is always visible to admins/owners; visible to others only if there are gallery images
  const showGalleryLink = isOwnerOrAdmin || hasGalleryImages;

  // In fallback (no custom nav) mode: hide "Files" for non-logged-in visitors when there are no public files.
  // Logged-in members always see Files. Custom nav is handled by isNavItemVisible / DB visibility field.
  const showFallbackFilesTab = !!membership || hasPublicFiles;

  const hasAdminAccess = isOwnerOrAdmin && (
    canAccess('members') || canAccess('communications') || canAccess('dues') ||
    canAccess('strikes') || canAccess('grievances') || canAccess('meetings') ||
    canAccess('announcements') || canAccess('elections') || canAccess('settings') ||
    canAccess('analytics')
  );

  // Show manage menu for all members (member tools) or admins
  const hasManageAccess = !!membership && (hasAdminAccess || isApprovedMember);

  const totalAdminBadge = (canAccess('members') ? pendingMembersCount : 0) +
    (canAccess('strikes') ? strikeNotificationCount : 0) +
    (canAccess('grievances') ? grievanceNotificationCount : 0);

  const memberToolsBadge = grievanceNotificationCount + strikeNotificationCount;

  // ── Tab items (dynamic from navigationItems, with hardcoded fallback) ──

  // Icon map for built-in routes
  const builtInRouteIcons: Record<string, React.ReactNode> = {
    news: <Newspaper className="h-4 w-4" />,
    about: <Info className="h-4 w-4" />,
    events: <CalendarDays className="h-4 w-4" />,
    files: <FolderOpen className="h-4 w-4" />,
    elections: <Vote className="h-4 w-4" />,
    gallery: <Images className="h-4 w-4" />,
    contact: <Phone className="h-4 w-4" />,
    members: <Users className="h-4 w-4" />,
    dues: <DollarSign className="h-4 w-4" />,
    grievances: <FileText className="h-4 w-4" />,
    meetings: <Video className="h-4 w-4" />,
    announcements: <Megaphone className="h-4 w-4" />,
    analytics: <BarChart3 className="h-4 w-4" />,
    settings: <Settings className="h-4 w-4" />,
  };

  // Map built-in route names to TabKey values
  const routeToTabKey: Record<string, TabKey> = {
    news: 'posts',
    about: 'about',
    events: 'events',
    files: 'files',
    elections: 'elections',
    contact: 'contact',
  };

  // Hardcoded fallback tabs (used when no navigation items exist)
  const hardcodedTabItems: { key: TabKey; label: string; icon: React.ReactNode; membersOnly?: boolean }[] = [
    { key: 'posts', label: 'News', icon: <Newspaper className="h-4 w-4" /> },
    { key: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    { key: 'events', label: 'Events', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'files', label: 'Files', icon: <FolderOpen className="h-4 w-4" /> },
    { key: 'elections', label: 'Elections', icon: <Vote className="h-4 w-4" />, membersOnly: true },
    { key: 'contact', label: 'Contact', icon: <Phone className="h-4 w-4" /> },
  ];

  // Determine if we should use dynamic navigation
  const enabledNavItems = navigationItems.filter((item) => item.isEnabled);
  const useDynamicNav = enabledNavItems.length > 0;

  // True when Gallery is already a dynamic nav item — prevents double-rendering
  const galleryIsNavItem = enabledNavItems.some(
    (item) => item.linkType === 'built_in_route' && item.builtInRoute === 'gallery'
  );

  // Visibility filter for navigation items
  const isNavItemVisible = (item: NavigationItem): boolean => {
    if (!item.isEnabled) return false;
    // Elections is always members-only — approved login required regardless of configured visibility
    if (item.linkType === 'built_in_route' && item.builtInRoute === 'elections') {
      return !!membership && isApprovedMember;
    }
    if (item.visibility === 'public') return true;
    if (item.visibility === 'members_only') return !!membership && isApprovedMember;
    if (item.visibility === 'admins_only') return isOwnerOrAdmin;
    return true;
  };

  // Top-level dynamic nav items (parentId is null)
  const topLevelNavItems = enabledNavItems.filter((item) => !item.parentId);
  // Children grouped by parentId
  const getNavChildren = (parentId: number) =>
    enabledNavItems.filter((item) => item.parentId === parentId && isNavItemVisible(item));

  // Resolve icon for a nav item - custom icon takes priority
  const getNavIcon = (item: NavigationItem): React.ReactNode => {
    // Check for custom icon first
    const customIcon = getNavIconByName((item as any).icon);
    if (customIcon) return customIcon;

    // If icon field is explicitly null/undefined (user chose "None"), don't show default
    return null;
  };

  // Resolve href for non-tab built-in routes and other nav items
  const getNavHref = (item: NavigationItem): string | null => {
    if (item.linkType === 'built_in_route' && item.builtInRoute === 'gallery') return `/${slug}/gallery`;
    if (item.linkType === 'page' && item.pageId && item.pageSlug) return `/${slug}/p/${item.pageSlug}`;
    if (item.linkType === 'file' && item.fileId && item.fileUrl) return item.fileUrl;
    if (item.linkType === 'external_url' && item.externalUrl) return item.externalUrl;
    return null;
  };

  // Is a nav item a built-in tab (renders via setActiveTab)?
  const isBuiltInTab = (item: NavigationItem): boolean =>
    item.linkType === 'built_in_route' && !!item.builtInRoute && !!routeToTabKey[item.builtInRoute];

  // Build the final tab items for fallback mode
  const tabItems = hardcodedTabItems;

  // ── Dropdown state for nav items with children ─────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openDropdown = (id: number) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdownId(id);
  };

  const closeDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => setOpenDropdownId(null), 150);
  };

  const cancelDropdownClose = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
  };

  // ── Mobile expanded sections for nested items ──────────────────────────
  const [mobileExpandedIds, setMobileExpandedIds] = useState<Set<number>>(new Set());
  const toggleMobileExpanded = (id: number) => {
    setMobileExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Manage mega-menu groups ────────────────────────────────────────────

  const buildManageGroups = (): MegaMenuGroup[] => {
    const groups: MegaMenuGroup[] = [];

    // Members & Outreach (admin only)
    const membersGroup: MegaMenuItem[] = [];
    if (canAccess('members')) {
      membersGroup.push({
        href: `/${slug}/members`,
        icon: <Users className="h-5 w-5" />,
        label: 'Members',
        description: 'View and manage the member list',
        badge: pendingMembersCount,
      });
      membersGroup.push({
        href: `/${slug}/members/invite`,
        icon: <UserPlus className="h-5 w-5" />,
        label: 'Invite Members',
        description: 'Send invitations to new members',
      });
    }
    if (membersGroup.length) groups.push({ title: 'Members & Outreach', items: membersGroup });

    // Communications (admin only)
    const commsGroup: MegaMenuItem[] = [];
    if (canAccess('communications')) {
      commsGroup.push({
        href: `/${slug}/mass-email`,
        icon: <Mail className="h-5 w-5" />,
        label: 'Mass Email',
        description: 'Send emails to all union members',
      });
      commsGroup.push({
        href: `/${slug}/mass-sms`,
        icon: <MessageSquare className="h-5 w-5" />,
        label: 'Mass SMS',
        description: 'Send text messages to members',
      });
    }
    if (commsGroup.length) groups.push({ title: 'Communications', items: commsGroup });

    // Member Tools (visible to ALL approved members)
    if (isApprovedMember) {
      const memberToolsGroup: MegaMenuItem[] = [
        {
          href: `/${slug}/elections`,
          icon: <Vote className="h-5 w-5" />,
          label: 'Elections',
          description: 'View and participate in union elections',
        },
        {
          href: `/${slug}/grievances`,
          icon: <FileText className="h-5 w-5" />,
          label: 'Grievances',
          description: 'View and submit member grievances',
          badge: grievanceNotificationCount,
        },
        {
          href: `/${slug}/meetings`,
          icon: <Video className="h-5 w-5" />,
          label: 'Meetings',
          description: 'View upcoming union meetings',
        },
        {
          href: `/${slug}/strikes`,
          icon: <Zap className="h-5 w-5" />,
          label: 'Strikes',
          description: 'View strike activities and schedules',
          badge: strikeNotificationCount,
        },
      ];
      groups.push({ title: 'Member Tools', items: memberToolsGroup });
    }

    // Finance & Announcements (admin only)
    const financeGroup: MegaMenuItem[] = [];
    if (canAccess('dues')) {
      financeGroup.push({
        href: `/${slug}/dues`,
        icon: <DollarSign className="h-5 w-5" />,
        label: 'Dues',
        description: 'Manage member dues and payments',
      });
    }
    if (canAccess('announcements')) {
      financeGroup.push({
        href: `/${slug}/announcements`,
        icon: <Megaphone className="h-5 w-5" />,
        label: 'Announcements',
        description: 'Create and manage announcements',
      });
    }
    if (financeGroup.length) groups.push({ title: 'Finance & Announcements', items: financeGroup });

    // Settings & Insights (admin only)
    const settingsGroup: MegaMenuItem[] = [];
    if (canAccess('settings')) {
      settingsGroup.push({
        href: `/${slug}/settings`,
        icon: <Settings className="h-5 w-5" />,
        label: 'Union Settings',
        description: 'Configure union preferences and branding',
      });
    }
    if (canAccess('analytics')) {
      settingsGroup.push({
        href: `/${slug}/analytics`,
        icon: <BarChart3 className="h-5 w-5" />,
        label: 'Analytics',
        description: 'View reports, insights, and metrics',
      });
    }
    if (isOwner) {
      settingsGroup.push({
        href: `/${slug}/billing`,
        icon: <CreditCard className="h-5 w-5" />,
        label: 'Billing',
        description: 'Manage subscription and payment method',
      });
    }
    if (settingsGroup.length) groups.push({ title: 'Settings & Insights', items: settingsGroup });

    return groups;
  };

  const manageGroups = hasManageAccess ? buildManageGroups() : [];

  // Color palette for mega-menu icon backgrounds
  const groupColors: Record<string, { bg: string; hoverBg: string; text: string }> = {
    'Member Tools': { bg: 'bg-blue-50', hoverBg: 'group-hover/item:bg-blue-100', text: 'text-blue-600' },
    'Members & Outreach': { bg: 'bg-violet-50', hoverBg: 'group-hover/item:bg-violet-100', text: 'text-violet-600' },
    'Communications': { bg: 'bg-emerald-50', hoverBg: 'group-hover/item:bg-emerald-100', text: 'text-emerald-600' },
    'Union Activities': { bg: 'bg-amber-50', hoverBg: 'group-hover/item:bg-amber-100', text: 'text-amber-600' },
    'Finance & Announcements': { bg: 'bg-rose-50', hoverBg: 'group-hover/item:bg-rose-100', text: 'text-rose-600' },
    'Settings & Insights': { bg: 'bg-slate-50', hoverBg: 'group-hover/item:bg-slate-100', text: 'text-slate-600' },
  };

  const getGroupColor = (title: string) => groupColors[title] || { bg: 'bg-gray-100', hoverBg: 'group-hover/item:bg-gray-200', text: 'text-gray-600' };

  // ── Non-member navbar ──────────────────────────────────────────────────

  // Public nav items (visible to non-members)
  // Elections is always excluded from public nav regardless of configured visibility
  const publicNavItems = enabledNavItems.filter(
    (item) => item.isEnabled && item.visibility === 'public' &&
      !(item.linkType === 'built_in_route' && item.builtInRoute === 'elections')
  );
  const publicTopLevelNavItems = publicNavItems.filter((item) => !item.parentId);
  const getPublicNavChildren = (parentId: number) =>
    publicNavItems.filter((item) => item.parentId === parentId);

  // Mobile state for non-member menu
  const [nonMemberMobileOpen, setNonMemberMobileOpen] = useState(false);

  if (!membership) {
    const hasPublicNav = useDynamicNav && publicTopLevelNavItems.length > 0;
    // For non-logged-in visitors: hide the Files tab when there are no public files
    const publicFallbackTabs = hardcodedTabItems.filter(
      (item) => !item.membersOnly && (item.key !== 'files' || hasPublicFiles)
    );

    return (
      <>
        <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-14 gap-4">
              <Link
                href={`/${slug}`}
                prefetch={true}
                className="flex-shrink-0 font-semibold text-gray-900 text-lg hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => setActiveTab('posts')}
              >
                {displayName}
              </Link>

              <div className="hidden lg:block flex-1" />

              {/* Desktop nav items */}
              <div className="hidden lg:flex items-center gap-1">
                {!hasPublicNav ? (
                  <>
                    {publicFallbackTabs.filter((t) => t.key !== 'contact').map((item) => {
                      const isActive = isOnTabPage && activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveTab(item.key)}
                          className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                            ${isActive
                              ? 'text-gray-900 bg-gray-100'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          {item.label}
                          {isActive && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                    {showGalleryLink && (
                      <Link
                        href={`/${slug}/gallery`}
                        className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                          ${pathname === `/${slug}/gallery`
                            ? 'text-gray-900 bg-gray-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        Gallery
                        {pathname === `/${slug}/gallery` && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                        )}
                      </Link>
                    )}
                    <button
                      onClick={() => setActiveTab('contact')}
                      className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                        ${isOnTabPage && activeTab === 'contact'
                          ? 'text-gray-900 bg-gray-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      Contact
                      {isOnTabPage && activeTab === 'contact' && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                      )}
                    </button>
                  </>
                ) : (
                  publicTopLevelNavItems.sort((a, b) => a.sortOrder - b.sortOrder).map((navItem) => {
                    const children = navItem.id ? getPublicNavChildren(navItem.id) : [];
                    const hasChildren = children.length > 0;

                    if (isBuiltInTab(navItem)) {
                      const tabKey = routeToTabKey[navItem.builtInRoute!];
                      const isActive = isOnTabPage && activeTab === tabKey;

                      if (hasChildren) {
                        return (
                          <div
                            key={navItem.id}
                            className="relative"
                            onMouseEnter={() => openDropdown(navItem.id)}
                            onMouseLeave={closeDropdown}
                          >
                            <button
                              onClick={() => setActiveTab(tabKey)}
                              className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                                ${isActive
                                  ? 'text-gray-900 bg-gray-100'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                              {navItem.label}
                              <ChevronDown className="h-3 w-3" />
                              {isActive && (
                                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                              )}
                            </button>
                            {openDropdownId === navItem.id && (
                              <div
                                className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                onMouseEnter={cancelDropdownClose}
                                onMouseLeave={closeDropdown}
                              >
                                {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                                  <NavDropdownItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} onClose={() => setOpenDropdownId(null)} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={navItem.id}
                          onClick={() => setActiveTab(tabKey)}
                          className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                            ${isActive
                              ? 'text-gray-900 bg-gray-100'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          {navItem.label}
                          {isActive && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                          )}
                        </button>
                      );
                    }

                    const href = getNavHref(navItem);
                    if (!href) return null;

                    if (hasChildren) {
                      return (
                        <div
                          key={navItem.id}
                          className="relative"
                          onMouseEnter={() => openDropdown(navItem.id)}
                          onMouseLeave={closeDropdown}
                        >
                          <Link
                            href={href}
                            target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                            rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                            className="relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          >
                            {navItem.label}
                            <ChevronDown className="h-3 w-3" />
                          </Link>
                          {openDropdownId === navItem.id && (
                            <div
                              className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                              onMouseEnter={cancelDropdownClose}
                              onMouseLeave={closeDropdown}
                            >
                              {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                                <NavDropdownItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} onClose={() => setOpenDropdownId(null)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={navItem.id}
                        href={href}
                        target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                        rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                        className="relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        {navItem.label}
                      </Link>
                    );
                  })
                )}

                {hasPublicNav && showGalleryLink && !galleryIsNavItem && (
                  <Link
                    href={`/${slug}/gallery`}
                    className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                      ${pathname === `/${slug}/gallery`
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Gallery
                    {pathname === `/${slug}/gallery` && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </Link>
                )}

                <div className="h-5 w-px bg-gray-200 mx-1" />
                <MemberLoginDropdown slug={slug} contactEmail={contactEmail} />
              </div>

              {/* Hamburger (mobile) */}
              <div className="lg:hidden ml-auto flex items-center gap-2">
                <MemberLoginDropdown slug={slug} contactEmail={contactEmail} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNonMemberMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Full-Screen Overlay for non-members */}
        {nonMemberMobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/20" onClick={() => setNonMemberMobileOpen(false)} />
            <div className="absolute inset-0 bg-white overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-lg">{displayName}</span>
                <button onClick={() => setNonMemberMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="px-3 py-3">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Pages</p>
                {!hasPublicNav ? (
                  <>
                    {publicFallbackTabs.filter((t) => t.key !== 'contact').map((item) => {
                      const isActive = isOnTabPage && activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => { setActiveTab(item.key); setNonMemberMobileOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                            ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <span className="text-gray-500">{item.icon}</span>
                          <span className="text-[15px] font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                    {showGalleryLink && (
                      <Link
                        href={`/${slug}/gallery`}
                        onClick={() => setNonMemberMobileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
                          ${pathname === `/${slug}/gallery` ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-gray-500"><Images className="h-4 w-4" /></span>
                        <span className="text-[15px] font-medium">Gallery</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { setActiveTab('contact'); setNonMemberMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                        ${isOnTabPage && activeTab === 'contact' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="text-gray-500"><Phone className="h-4 w-4" /></span>
                      <span className="text-[15px] font-medium">Contact</span>
                    </button>
                  </>
                ) : (
                  publicTopLevelNavItems.sort((a, b) => a.sortOrder - b.sortOrder).map((navItem) => {
                    const children = navItem.id ? getPublicNavChildren(navItem.id) : [];
                    const hasChildren = children.length > 0;
                    const isExpanded = mobileExpandedIds.has(navItem.id);
                    const icon = getNavIcon(navItem);

                    if (isBuiltInTab(navItem)) {
                      const tabKey = routeToTabKey[navItem.builtInRoute!];
                      const isActive = isOnTabPage && activeTab === tabKey;
                      return (
                        <div key={navItem.id}>
                          <div className="flex items-center">
                            <button
                              onClick={() => { setActiveTab(tabKey); setNonMemberMobileOpen(false); }}
                              className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                                ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="text-gray-500">{icon}</span>
                              <span className="text-[15px] font-medium">{navItem.label}</span>
                            </button>
                            {hasChildren && (
                              <button
                                onClick={() => toggleMobileExpanded(navItem.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                          {hasChildren && isExpanded && (
                            <div className="ml-8 space-y-0.5">
                              {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                                <MobileNavChildItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} closeMobile={() => setNonMemberMobileOpen(false)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const href = getNavHref(navItem);
                    if (!href) return null;
                    return (
                      <div key={navItem.id}>
                        <div className="flex items-center">
                          <Link
                            href={href}
                            target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                            rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                            onClick={() => setNonMemberMobileOpen(false)}
                            className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors text-gray-700 hover:bg-gray-50"
                          >
                            <span className="text-gray-500">{icon}</span>
                            <span className="text-[15px] font-medium">{navItem.label}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              onClick={() => toggleMobileExpanded(navItem.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        {hasChildren && isExpanded && (
                          <div className="ml-8 space-y-0.5">
                            {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                              <MobileNavChildItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} closeMobile={() => setNonMemberMobileOpen(false)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {/* Gallery link in mobile non-member nav (dynamic nav only) */}
                {hasPublicNav && showGalleryLink && !galleryIsNavItem && (
                  <Link
                    href={`/${slug}/gallery`}
                    onClick={() => setNonMemberMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
                      ${pathname === `/${slug}/gallery` ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="text-gray-500"><Images className="h-4 w-4" /></span>
                    <span className="text-[15px] font-medium">Gallery</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Member navbar ──────────────────────────────────────────────────────

  return (
    <>
      <nav
        ref={panelRef}
        className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            {/* ─ Left: Logo / Union Name ─ */}
            <Link
              href={`/${slug}`}
              prefetch={true}
              className="flex-shrink-0 font-semibold text-gray-900 text-lg hover:opacity-80 transition-opacity"
              onClick={() => setActiveTab('posts')}
            >
              {displayName}
            </Link>

            {/* ─ Spacer to push nav right ─ */}
            <div className="hidden lg:block flex-1" />

            {/* ─ Right: Pages + Controls (desktop) ─ */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Tab pages — dynamic or fallback */}
              {!useDynamicNav ? (
                /* Hardcoded fallback */
                <>
                  {tabItems.filter((t) => t.key !== 'contact').map((item) => {
                    if (item.membersOnly && !isApprovedMember) return null;
                    const isActive = isOnTabPage && activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                          ${isActive
                            ? 'text-gray-900 bg-gray-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        {item.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                  {showGalleryLink && (
                    <Link
                      href={`/${slug}/gallery`}
                      className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                        ${pathname === `/${slug}/gallery`
                          ? 'text-gray-900 bg-gray-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      Gallery
                      {pathname === `/${slug}/gallery` && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                      )}
                    </Link>
                  )}
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                      ${isOnTabPage && activeTab === 'contact'
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Contact
                    {isOnTabPage && activeTab === 'contact' && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </button>
                </>
              ) : (
                /* Dynamic navigation items */
                topLevelNavItems.filter(isNavItemVisible).sort((a, b) => a.sortOrder - b.sortOrder).map((navItem) => {
                  const children = navItem.id ? getNavChildren(navItem.id) : [];
                  const hasChildren = children.length > 0;

                  if (isBuiltInTab(navItem)) {
                    const tabKey = routeToTabKey[navItem.builtInRoute!];
                    const isActive = isOnTabPage && activeTab === tabKey;

                    if (hasChildren) {
                      return (
                        <div
                          key={navItem.id}
                          className="relative"
                          onMouseEnter={() => openDropdown(navItem.id)}
                          onMouseLeave={closeDropdown}
                        >
                          <button
                            onClick={() => setActiveTab(tabKey)}
                            className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                              ${isActive
                                ? 'text-gray-900 bg-gray-100'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                          >
                            {navItem.label}
                            <ChevronDown className="h-3 w-3" />
                            {isActive && (
                              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                            )}
                          </button>
                          {openDropdownId === navItem.id && (
                            <div
                              className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                              onMouseEnter={cancelDropdownClose}
                              onMouseLeave={closeDropdown}
                            >
                              {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                                <NavDropdownItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} onClose={() => setOpenDropdownId(null)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={navItem.id}
                        onClick={() => setActiveTab(tabKey)}
                        className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer
                          ${isActive
                            ? 'text-gray-900 bg-gray-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        {navItem.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                        )}
                      </button>
                    );
                  }

                  // Non-built-in: page, file, or external URL
                  const href = getNavHref(navItem);
                  if (!href) return null;

                  if (hasChildren) {
                    return (
                      <div
                        key={navItem.id}
                        className="relative"
                        onMouseEnter={() => openDropdown(navItem.id)}
                        onMouseLeave={closeDropdown}
                      >
                        <Link
                          href={href}
                          target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                          rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                          className="relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                          {navItem.label}
                          <ChevronDown className="h-3 w-3" />
                        </Link>
                        {openDropdownId === navItem.id && (
                          <div
                            className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                            onMouseEnter={cancelDropdownClose}
                            onMouseLeave={closeDropdown}
                          >
                            {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                              <NavDropdownItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} onClose={() => setOpenDropdownId(null)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={navItem.id}
                      href={href}
                      target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                      rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                      className="relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {navItem.label}
                    </Link>
                  );
                })
              )}

              {/* Gallery link (member desktop, dynamic nav only) */}
              {useDynamicNav && showGalleryLink && !galleryIsNavItem && (
                <Link
                  href={`/${slug}/gallery`}
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                    ${pathname === `/${slug}/gallery`
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  Gallery
                  {pathname === `/${slug}/gallery` && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
                  )}
                </Link>
              )}

              {/* Separator between pages and controls */}
              <div className="h-5 w-px bg-gray-200 mx-1" />
              {/* Manage button + mega menu */}
              {hasManageAccess && (
                <div
                  className="relative"
                  onMouseEnter={() => openMegaMenu('manage')}
                  onMouseLeave={closeMegaMenu}
                >
                  <button
                    onClick={() => setOpenPanel(openPanel === 'manage' ? null : 'manage')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer relative
                      ${openPanel === 'manage' ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    <Shield className="h-4 w-4" />
                    {'Tools'}
                    <ChevronDown className={`h-3 w-3 transition-transform ${openPanel === 'manage' ? 'rotate-180' : ''}`} />
                    {(totalAdminBadge + (hasAdminAccess ? 0 : memberToolsBadge)) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {hasAdminAccess ? totalAdminBadge : memberToolsBadge}
                      </span>
                    )}
                  </button>

                  {/* Mega Menu Panel */}
                  {openPanel === 'manage' && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[640px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                      onMouseEnter={cancelClose}
                      onMouseLeave={closeMegaMenu}
                    >
                      {/* Subtle top accent bar */}
                      <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500" />
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {manageGroups.map((group) => {
                            const color = getGroupColor(group.title);
                            return (
                              <div key={group.title}>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                  {group.title}
                                </h3>
                                <div className="space-y-1">
                                  {group.items.map((item) => (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      prefetch={true}
                                      onClick={() => setOpenPanel(null)}
                                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                                    >
                                      <div className={`flex-shrink-0 p-2 rounded-lg ${color.bg} ${color.text} ${color.hoverBg} transition-colors`}>
                                        {item.icon}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                          {item.badge ? (
                                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                              {item.badge}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile dropdown */}
              <div
                className="relative"
                onMouseEnter={() => openMegaMenu('profile')}
                onMouseLeave={closeMegaMenu}
              >
                <button
                  onClick={() => setOpenPanel(openPanel === 'profile' ? null : 'profile')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                    ${openPanel === 'profile' ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <UserCircle className="h-4 w-4" />
                  <ChevronDown className={`h-3 w-3 transition-transform ${openPanel === 'profile' ? 'rotate-180' : ''}`} />
                </button>

                {openPanel === 'profile' && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
                    onMouseEnter={cancelClose}
                    onMouseLeave={closeMegaMenu}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{membership.user.name}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={`/${slug}/profile`}
                        prefetch={true}
                        onClick={() => setOpenPanel(null)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle className="h-4 w-4 text-gray-500" />
                        Profile
                      </Link>
                      {isOwner && (
                        <Link
                          href={`/${slug}/billing`}
                          prefetch={true}
                          onClick={() => setOpenPanel(null)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          Billing
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <form action={handleSignOut}>
                        <button
                          type="submit"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 text-gray-500" />
                          Sign out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─ Hamburger (mobile) ─ */}
            <div className="lg:hidden ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMobileOpen(true); setMobilePanel('main'); }}
                className="relative"
              >
                <Menu className="h-5 w-5" />
                {(grievanceNotificationCount + strikeNotificationCount + pendingMembersCount) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full h-2.5 w-2.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ Mobile Full-Screen Overlay ═══════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" onClick={closeMobile} />

          {/* Panels container */}
          <div className="absolute inset-0 bg-white overflow-hidden flex">
            {/* ── Main Panel ── */}
            <div
              className={`absolute inset-0 bg-white transition-transform duration-300 ease-in-out overflow-y-auto
                ${mobilePanel === 'main' ? 'translate-x-0' : '-translate-x-full'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-lg">{displayName}</span>
                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* User info */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-900">{membership.user.name}</p>
              </div>

              {/* Tab Pages — dynamic or fallback */}
              <div className="px-3 py-3">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Pages</p>
                {!useDynamicNav ? (
                  /* Hardcoded fallback */
                  <>
                    {tabItems.filter((t) => t.key !== 'contact').map((item) => {
                      if (item.membersOnly && !isApprovedMember) return null;
                      const isActive = isOnTabPage && activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => { setActiveTab(item.key); closeMobile(); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                            ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <span className="text-gray-500">{item.icon}</span>
                          <span className="text-[15px] font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                    {showGalleryLink && (
                      <Link
                        href={`/${slug}/gallery`}
                        onClick={closeMobile}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
                          ${pathname === `/${slug}/gallery` ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-gray-500"><Images className="h-4 w-4" /></span>
                        <span className="text-[15px] font-medium">Gallery</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { setActiveTab('contact'); closeMobile(); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                        ${isOnTabPage && activeTab === 'contact' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="text-gray-500"><Phone className="h-4 w-4" /></span>
                      <span className="text-[15px] font-medium">Contact</span>
                    </button>
                  </>
                ) : (
                  /* Dynamic navigation items */
                  topLevelNavItems.filter(isNavItemVisible).sort((a, b) => a.sortOrder - b.sortOrder).map((navItem) => {
                    const children = navItem.id ? getNavChildren(navItem.id) : [];
                    const hasChildren = children.length > 0;
                    const isExpanded = mobileExpandedIds.has(navItem.id);
                    const icon = getNavIcon(navItem);

                    if (isBuiltInTab(navItem)) {
                      const tabKey = routeToTabKey[navItem.builtInRoute!];
                      const isActive = isOnTabPage && activeTab === tabKey;

                      return (
                        <div key={navItem.id}>
                          <div className="flex items-center">
                            <button
                              onClick={() => { setActiveTab(tabKey); closeMobile(); }}
                              className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
                                ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="text-gray-500">{icon}</span>
                              <span className="text-[15px] font-medium">{navItem.label}</span>
                            </button>
                            {hasChildren && (
                              <button
                                onClick={() => toggleMobileExpanded(navItem.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                          {hasChildren && isExpanded && (
                            <div className="ml-8 space-y-0.5">
                              {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                                <MobileNavChildItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} closeMobile={closeMobile} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Non-built-in nav item
                    const href = getNavHref(navItem);
                    if (!href) return null;

                    return (
                      <div key={navItem.id}>
                        <div className="flex items-center">
                          <Link
                            href={href}
                            target={navItem.openInNewTab || navItem.linkType === 'file' ? '_blank' : undefined}
                            rel={navItem.openInNewTab || navItem.linkType === 'file' ? 'noopener noreferrer' : undefined}
                            onClick={closeMobile}
                            className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors text-gray-700 hover:bg-gray-50"
                          >
                            <span className="text-gray-500">{icon}</span>
                            <span className="text-[15px] font-medium">{navItem.label}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              onClick={() => toggleMobileExpanded(navItem.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        {hasChildren && isExpanded && (
                          <div className="ml-8 space-y-0.5">
                            {children.sort((a, b) => a.sortOrder - b.sortOrder).map((child) => (
                              <MobileNavChildItem key={child.id} item={child} slug={slug} getNavIcon={getNavIcon} getNavHref={getNavHref} isBuiltInTab={isBuiltInTab} routeToTabKey={routeToTabKey} setActiveTab={setActiveTab} closeMobile={closeMobile} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {/* Gallery link in member mobile nav (dynamic nav only) */}
                {useDynamicNav && showGalleryLink && !galleryIsNavItem && (
                  <Link
                    href={`/${slug}/gallery`}
                    onClick={closeMobile}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
                      ${pathname === `/${slug}/gallery` ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="text-gray-500"><Images className="h-4 w-4" /></span>
                    <span className="text-[15px] font-medium">Gallery</span>
                  </Link>
                )}
              </div>

              {/* Manage & Profile */}
              <div className="px-3 pb-3">
                <div className="h-px bg-gray-100 mx-3 mb-3" />

                {hasManageAccess && (
                  <button
                    onClick={() => setMobilePanel('manage')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-[15px] font-medium flex-1 text-left">{'Tools'}</span>
                    {(hasAdminAccess ? totalAdminBadge : memberToolsBadge) > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {hasAdminAccess ? totalAdminBadge : memberToolsBadge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                )}

                <button
                  onClick={() => setMobilePanel('profile')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <UserCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-[15px] font-medium flex-1 text-left">Profile & Account</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Quick sign out at bottom */}
              <div className="px-3 pb-6">
                <div className="h-px bg-gray-100 mx-3 mb-3" />
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-gray-500" />
                    <span className="text-[15px] font-medium">Sign out</span>
                  </button>
                </form>
              </div>
            </div>

            {/* ── Manage Panel (slide-in) ── */}
            <div
              className={`absolute inset-0 bg-white transition-transform duration-300 ease-in-out overflow-y-auto
                ${mobilePanel === 'manage' ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => setMobilePanel('main')}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 text-lg">{'Tools'}</span>
                <div className="flex-1" />
                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Grouped items */}
              <div className="px-4 py-4 space-y-6">
                {manageGroups.map((group) => {
                  const color = getGroupColor(group.title);
                  return (
                    <div key={group.title}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-1">
                        {group.title}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={closeMobile}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item"
                          >
                            <div className={`flex-shrink-0 p-2.5 rounded-xl ${color.bg} ${color.text}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] font-medium text-gray-900">{item.label}</span>
                                {item.badge ? (
                                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                    {item.badge}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Profile Panel (slide-in) ── */}
            <div
              className={`absolute inset-0 bg-white transition-transform duration-300 ease-in-out overflow-y-auto
                ${mobilePanel === 'profile' ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => setMobilePanel('main')}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 text-lg">Profile & Account</span>
                <div className="flex-1" />
                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* User info card */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="p-3 rounded-full bg-gray-200">
                    <UserCircle className="h-8 w-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900">{membership.user.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{membership.member.role}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href={`/${slug}/profile`}
                    prefetch={true}
                    onClick={closeMobile}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-100 text-gray-600">
                      <UserCircle className="h-5 w-5" />
                    </div>
                    <div className="pt-0.5">
                      <span className="text-[15px] font-medium text-gray-900">View Profile</span>
                      <p className="text-[13px] text-gray-500 mt-0.5">View and edit your profile information</p>
                    </div>
                  </Link>

                  {isOwner && (
                    <Link
                      href={`/${slug}/billing`}
                      prefetch={true}
                      onClick={closeMobile}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-100 text-gray-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="pt-0.5">
                        <span className="text-[15px] font-medium text-gray-900">Billing</span>
                        <p className="text-[13px] text-gray-500 mt-0.5">Manage subscription and payment method</p>
                      </div>
                    </Link>
                  )}

                  <div className="h-px bg-gray-100 my-2" />

                  <form action={handleSignOut}>
                    <button
                      type="submit"
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-100 text-gray-600">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <div className="pt-0.5 text-left">
                        <span className="text-[15px] font-medium text-gray-900">Sign out</span>
                        <p className="text-[13px] text-gray-500 mt-0.5">Log out of your account</p>
                      </div>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helper components for dynamic navigation ────────────────────────────

function NavDropdownItem({
  item,
  slug,
  getNavIcon,
  getNavHref,
  isBuiltInTab,
  routeToTabKey,
  setActiveTab,
  onClose,
}: {
  item: NavigationItem;
  slug: string;
  getNavIcon: (item: NavigationItem) => React.ReactNode;
  getNavHref: (item: NavigationItem) => string | null;
  isBuiltInTab: (item: NavigationItem) => boolean;
  routeToTabKey: Record<string, TabKey>;
  setActiveTab: (tab: TabKey) => void;
  onClose: () => void;
}) {
  const icon = getNavIcon(item);

  if (isBuiltInTab(item)) {
    const tabKey = routeToTabKey[item.builtInRoute!];
    return (
      <button
        onClick={() => { setActiveTab(tabKey); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <span className="text-gray-400">{icon}</span>
        {item.label}
      </button>
    );
  }

  const href = getNavHref(item);
  if (!href) return null;

  return (
    <Link
      href={href}
      target={item.openInNewTab || item.linkType === 'file' ? '_blank' : undefined}
      rel={item.openInNewTab || item.linkType === 'file' ? 'noopener noreferrer' : undefined}
      onClick={onClose}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {item.label}
    </Link>
  );
}

function MobileNavChildItem({
  item,
  slug,
  getNavIcon,
  getNavHref,
  isBuiltInTab,
  routeToTabKey,
  setActiveTab,
  closeMobile,
}: {
  item: NavigationItem;
  slug: string;
  getNavIcon: (item: NavigationItem) => React.ReactNode;
  getNavHref: (item: NavigationItem) => string | null;
  isBuiltInTab: (item: NavigationItem) => boolean;
  routeToTabKey: Record<string, TabKey>;
  setActiveTab: (tab: TabKey) => void;
  closeMobile: () => void;
}) {
  const icon = getNavIcon(item);

  if (isBuiltInTab(item)) {
    const tabKey = routeToTabKey[item.builtInRoute!];
    return (
      <button
        onClick={() => { setActiveTab(tabKey); closeMobile(); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-50 cursor-pointer"
      >
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    );
  }

  const href = getNavHref(item);
  if (!href) return null;

  return (
    <Link
      href={href}
      target={item.openInNewTab || item.linkType === 'file' ? '_blank' : undefined}
      rel={item.openInNewTab || item.linkType === 'file' ? 'noopener noreferrer' : undefined}
      onClick={closeMobile}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}
