'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, LogOut, UserCircle, CreditCard, Menu, X, Settings, Megaphone,
  Mail, ChevronDown, ChevronRight, UserPlus, DollarSign, FileText, Zap,
  Video, MessageSquare, BarChart3, Newspaper, Info, FolderOpen, CalendarDays,
  Vote, Phone, ArrowLeft, Shield,
} from 'lucide-react';
import { useAnnouncementVisibility } from '@/hooks/use-announcement-visibility';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions';
import type { AdminPermissions } from '@/lib/db/schema';
import { MemberLoginDropdown } from './member-login-dropdown';

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
}

type TabKey = 'posts' | 'about' | 'files' | 'events' | 'elections' | 'contact';

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
}: UnionNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);

  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  // Active tab from URL
  const activeTab: TabKey = (searchParams.get('tab') as TabKey) || 'posts';

  const setActiveTab = useCallback((tab: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'posts') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const base = `/${slug}`;
    const newUrl = params.toString() ? `${base}?${params.toString()}` : base;
    router.push(newUrl);
  }, [searchParams, slug, router]);

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

  const hasManageAccess = isOwnerOrAdmin && (
    canAccess('members') || canAccess('communications') || canAccess('dues') ||
    canAccess('strikes') || canAccess('grievances') || canAccess('meetings') ||
    canAccess('announcements') || canAccess('elections') || canAccess('settings') ||
    canAccess('analytics')
  );

  const totalAdminBadge = (canAccess('members') ? pendingMembersCount : 0) +
    (canAccess('strikes') ? strikeNotificationCount : 0) +
    (canAccess('grievances') ? grievanceNotificationCount : 0);

  // ── Tab items ──────────────────────────────────────────────────────────

  const tabItems: { key: TabKey; label: string; icon: React.ReactNode; membersOnly?: boolean }[] = [
    { key: 'posts', label: 'News', icon: <Newspaper className="h-4 w-4" /> },
    { key: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    { key: 'events', label: 'Events', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'files', label: 'Files', icon: <FolderOpen className="h-4 w-4" /> },
    { key: 'elections', label: 'Elections', icon: <Vote className="h-4 w-4" />, membersOnly: true },
    { key: 'contact', label: 'Contact', icon: <Phone className="h-4 w-4" /> },
  ];

  // ── Member pages (visible to all members) ────────────────────────────

  const memberPages: { href: string; icon: React.ReactNode; label: string; badge?: number }[] = membership ? [
    { href: `/${slug}/grievances`, icon: <FileText className="h-4 w-4" />, label: 'Grievances', badge: grievanceNotificationCount },
    { href: `/${slug}/meetings`, icon: <Video className="h-4 w-4" />, label: 'Meetings' },
    { href: `/${slug}/strikes`, icon: <Zap className="h-4 w-4" />, label: 'Strikes', badge: strikeNotificationCount },
  ] : [];

  // ── Manage mega-menu groups ────────────────────────────────────────────

  const buildManageGroups = (): MegaMenuGroup[] => {
    const groups: MegaMenuGroup[] = [];

    // Members & Outreach
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

    // Communications
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

    // Union Activities
    const activitiesGroup: MegaMenuItem[] = [];
    if (canAccess('grievances')) {
      activitiesGroup.push({
        href: `/${slug}/grievances`,
        icon: <FileText className="h-5 w-5" />,
        label: 'Grievances',
        description: 'Review and manage member grievances',
        badge: grievanceNotificationCount,
      });
    }
    if (canAccess('strikes')) {
      activitiesGroup.push({
        href: `/${slug}/strikes`,
        icon: <Zap className="h-5 w-5" />,
        label: 'Strikes',
        description: 'Manage strike activities and schedules',
        badge: strikeNotificationCount,
      });
    }
    if (canAccess('meetings')) {
      activitiesGroup.push({
        href: `/${slug}/meetings`,
        icon: <Video className="h-5 w-5" />,
        label: 'Meetings',
        description: 'Create and manage union meetings',
      });
    }
    if (canAccess('elections')) {
      activitiesGroup.push({
        href: `/${slug}/elections`,
        icon: <Vote className="h-5 w-5" />,
        label: 'Elections',
        description: 'Create and manage union elections',
      });
    }
    if (activitiesGroup.length) groups.push({ title: 'Union Activities', items: activitiesGroup });

    // Finance & Announcements
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

    // Settings & Insights
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

  // ── Non-member navbar ──────────────────────────────────────────────────

  if (!membership) {
    return (
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              href={`/${slug}`}
              prefetch={true}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-semibold text-gray-900 text-lg">{displayName}</span>
            </Link>
            <MemberLoginDropdown slug={slug} contactEmail={contactEmail} />
          </div>
        </div>
      </nav>
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

            {/* ─ Center: Primary Nav (desktop) ─ */}
            <div className="hidden lg:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {/* Tab pages */}
              {tabItems.map((item) => {
                if (item.membersOnly && !isApprovedMember) return null;
                const isActive = activeTab === item.key && pathname === `/${slug}`;
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

              {/* Divider */}
              {memberPages.length > 0 && (
                <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />
              )}

              {/* Member pages */}
              {memberPages.map((page) => {
                const isActive = pathname === page.href;
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    prefetch={true}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                      ${isActive
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    {page.label}
                    {page.badge ? (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {page.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            {/* ─ Right side (desktop) ─ */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
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
                    Manage
                    <ChevronDown className={`h-3 w-3 transition-transform ${openPanel === 'manage' ? 'rotate-180' : ''}`} />
                    {totalAdminBadge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {totalAdminBadge}
                      </span>
                    )}
                  </button>

                  {/* Mega Menu Panel */}
                  {openPanel === 'manage' && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[640px] bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50"
                      onMouseEnter={cancelClose}
                      onMouseLeave={closeMegaMenu}
                    >
                      <div className="grid grid-cols-2 gap-6">
                        {manageGroups.map((group) => (
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
                                  <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 group-hover/item:bg-gray-200 transition-colors">
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
                        ))}
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

              {/* Tab Pages */}
              <div className="px-3 py-3">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Pages</p>
                {tabItems.map((item) => {
                  if (item.membersOnly && !isApprovedMember) return null;
                  const isActive = activeTab === item.key && pathname === `/${slug}`;
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
              </div>

              {/* Member Pages */}
              {memberPages.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="h-px bg-gray-100 mx-3 mb-3" />
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Activity</p>
                  {memberPages.map((page) => {
                    const isActive = pathname === page.href;
                    return (
                      <Link
                        key={page.href}
                        href={page.href}
                        prefetch={true}
                        onClick={closeMobile}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
                          ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-gray-500">{page.icon}</span>
                        <span className="text-[15px] font-medium flex-1">{page.label}</span>
                        {page.badge ? (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                            {page.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Manage & Profile */}
              <div className="px-3 pb-3">
                <div className="h-px bg-gray-100 mx-3 mb-3" />

                {hasManageAccess && (
                  <button
                    onClick={() => setMobilePanel('manage')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-[15px] font-medium flex-1 text-left">Manage</span>
                    {totalAdminBadge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {totalAdminBadge}
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
                <span className="font-semibold text-gray-900 text-lg">Manage</span>
                <div className="flex-1" />
                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Grouped items */}
              <div className="px-4 py-4 space-y-6">
                {manageGroups.map((group) => (
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
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-100 text-gray-600">
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
                ))}
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
