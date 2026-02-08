'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Users, LogOut, UserCircle, CreditCard, Menu, X, Settings,
  Megaphone, Mail, ChevronDown, UserPlus, DollarSign, FileText,
  Zap, Video, MessageSquare, BarChart3, Vote, Shield, LayoutGrid,
} from 'lucide-react';
import { useAnnouncementVisibility } from '@/hooks/use-announcement-visibility';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions';
import type { AdminPermissions, NavConfigItem } from '@/lib/db/schema';
import { resolveNavConfig, getNavItemHref } from '@/lib/nav-config';
import { MemberLoginDropdown } from './member-login-dropdown';
import { getContrastColor } from '@/lib/utils/color';

interface UnionNavbarProps {
  slug: string;
  unionName: string;
  localNumber: string | null;
  logoUrl?: string | null;
  themeColor?: string;
  navConfig?: NavConfigItem[] | null;
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

export function UnionNavbar({
  slug,
  unionName,
  localNumber,
  logoUrl,
  themeColor = '#2563eb',
  navConfig,
  membership,
  handleSignOut,
  pendingMembersCount = 0,
  announcementId,
  grievanceNotificationCount = 0,
  strikeNotificationCount = 0,
  contactEmail,
  isApprovedMember = false,
}: UnionNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || '';

  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  const canAccess = (permission: AdminPermissionKey): boolean => {
    return hasPermission(membership?.member.role, membership?.member.adminPermissions, permission);
  };

  const displayName = `${unionName}${localNumber ? ` ${localNumber}` : ''}`;
  const resolvedNav = resolveNavConfig(navConfig);
  const contrastColor = getContrastColor(themeColor);
  const textColorClass = contrastColor === '#000000' ? 'text-black' : 'text-white';
  const textMutedClass = contrastColor === '#000000' ? 'text-black/70' : 'text-white/70';

  // Close admin menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node) &&
        adminButtonRef.current &&
        !adminButtonRef.current.contains(event.target as Node)
      ) {
        setIsAdminMenuOpen(false);
      }
    }
    if (isAdminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAdminMenuOpen]);

  // Determine if a nav item is active
  const isNavItemActive = (item: NavConfigItem): boolean => {
    if (item.type === 'built-in') {
      if (item.id === 'posts' && !activeTab) return true;
      if (item.href?.includes(`tab=${activeTab}`) && activeTab) return true;
    }
    return false;
  };

  // Filter nav items based on auth
  const visibleNavItems = resolvedNav.filter(item => {
    if (!item.visible) return false;
    if (item.requiresAuth && !membership) return false;
    if (item.requiresAuth && item.id === 'elections' && !isApprovedMember) return false;
    return true;
  });

  // Non-signed-in users: simplified navbar
  if (!membership) {
    return (
      <nav
        className={`fixed left-0 right-0 z-50 shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}
        style={{ backgroundColor: themeColor }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left: Logo / Union name */}
            <div className="flex items-center gap-3">
              <Link
                href={`/${slug}`}
                prefetch={true}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {logoUrl && (
                  <img src={logoUrl} alt={unionName} className="h-8 w-8 rounded-full object-cover" />
                )}
                <span className={`font-semibold text-lg ${textColorClass}`}>
                  {displayName}
                </span>
              </Link>
            </div>

            {/* Center: Nav items (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={getNavItemHref(slug, item)}
                  prefetch={true}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isNavItemActive(item)
                      ? `${contrastColor === '#000000' ? 'bg-black/10 text-black' : 'bg-white/20 text-white'}`
                      : `${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/10 hover:text-white'}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right: Login */}
            <MemberLoginDropdown slug={slug} contactEmail={contactEmail} />
          </div>
        </div>
      </nav>
    );
  }

  // Signed-in users: full navbar with admin mega-menu
  return (
    <>
      <nav
        className={`fixed left-0 right-0 z-50 shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}
        style={{ backgroundColor: themeColor }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left: Logo / Union name */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href={`/${slug}`}
                prefetch={true}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {logoUrl && (
                  <img src={logoUrl} alt={unionName} className="h-8 w-8 rounded-full object-cover" />
                )}
                <span className={`font-semibold text-lg ${textColorClass} hidden sm:inline`}>
                  {displayName}
                </span>
              </Link>
            </div>

            {/* Center: Configurable nav items (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={getNavItemHref(slug, item)}
                  prefetch={true}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isNavItemActive(item)
                      ? `${contrastColor === '#000000' ? 'bg-black/10 text-black' : 'bg-white/20 text-white'}`
                      : `${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/10 hover:text-white'}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right: Admin mega-menu + Profile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                {/* Grievances - visible to all members */}
                <Link href={`/${slug}/grievances`} prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 relative ${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/10 hover:text-black' : 'hover:bg-white/15 hover:text-white'}`}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden lg:inline">Grievances</span>
                    {grievanceNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {grievanceNotificationCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Meetings - visible to all members */}
                <Link href={`/${slug}/meetings`} prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 ${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/10 hover:text-black' : 'hover:bg-white/15 hover:text-white'}`}
                  >
                    <Video className="h-4 w-4" />
                    <span className="hidden lg:inline">Meetings</span>
                  </Button>
                </Link>

                {/* Strikes - visible to regular members (non-admin) */}
                {!isOwnerOrAdmin && (
                  <Link href={`/${slug}/strikes`} prefetch={true}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 relative ${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/10 hover:text-black' : 'hover:bg-white/15 hover:text-white'}`}
                    >
                      <Zap className="h-4 w-4" />
                      <span className="hidden lg:inline">Strikes</span>
                      {strikeNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {strikeNotificationCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Admin Mega-Menu Button */}
                {isOwnerOrAdmin && (
                  <div className="relative">
                    <button
                      ref={adminButtonRef}
                      onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
                        isAdminMenuOpen
                          ? `${contrastColor === '#000000' ? 'bg-black/10 text-black' : 'bg-white/20 text-white'}`
                          : `${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/10 hover:text-black' : 'hover:bg-white/15 hover:text-white'}`
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden lg:inline">Admin</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                      {(pendingMembersCount > 0 || strikeNotificationCount > 0) && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" />
                      )}
                    </button>

                    {/* Admin Mega-Menu Popup */}
                    {isAdminMenuOpen && (
                      <div
                        ref={adminMenuRef}
                        className="absolute right-0 top-full mt-2 w-[480px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-5"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          {/* Members Section */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Members</h3>
                            <div className="space-y-1">
                              {canAccess('members') && (
                                <Link
                                  href={`/${slug}/members`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span>Members</span>
                                  {pendingMembersCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                      {pendingMembersCount}
                                    </span>
                                  )}
                                </Link>
                              )}
                              {canAccess('members') && (
                                <Link
                                  href={`/${slug}/members/invite`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <UserPlus className="h-4 w-4 text-gray-400" />
                                  <span>Invite Members</span>
                                </Link>
                              )}
                              {canAccess('grievances') && (
                                <Link
                                  href={`/${slug}/grievances`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span>Grievances</span>
                                  {grievanceNotificationCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                      {grievanceNotificationCount}
                                    </span>
                                  )}
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Communications Section */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Communications</h3>
                            <div className="space-y-1">
                              {canAccess('communications') && (
                                <Link
                                  href={`/${slug}/mass-email`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>Mass Email</span>
                                </Link>
                              )}
                              {canAccess('communications') && (
                                <Link
                                  href={`/${slug}/mass-sms`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <MessageSquare className="h-4 w-4 text-gray-400" />
                                  <span>Mass SMS</span>
                                </Link>
                              )}
                              {canAccess('announcements') && (
                                <Link
                                  href={`/${slug}/announcements`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Megaphone className="h-4 w-4 text-gray-400" />
                                  <span>Announcements</span>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Management Section */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</h3>
                            <div className="space-y-1">
                              {canAccess('meetings') && (
                                <Link
                                  href={`/${slug}/meetings`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Video className="h-4 w-4 text-gray-400" />
                                  <span>Meetings</span>
                                </Link>
                              )}
                              {canAccess('elections') && (
                                <Link
                                  href={`/${slug}?tab=elections`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Vote className="h-4 w-4 text-gray-400" />
                                  <span>Elections</span>
                                </Link>
                              )}
                              {canAccess('strikes') && (
                                <Link
                                  href={`/${slug}/strikes`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Zap className="h-4 w-4 text-gray-400" />
                                  <span>Strikes</span>
                                  {strikeNotificationCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                      {strikeNotificationCount}
                                    </span>
                                  )}
                                </Link>
                              )}
                              {canAccess('dues') && (
                                <Link
                                  href={`/${slug}/dues`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <span>Dues</span>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* System Section */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System</h3>
                            <div className="space-y-1">
                              {canAccess('settings') && (
                                <Link
                                  href={`/${slug}/settings`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <Settings className="h-4 w-4 text-gray-400" />
                                  <span>Settings</span>
                                </Link>
                              )}
                              {canAccess('analytics') && (
                                <Link
                                  href={`/${slug}/analytics`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <BarChart3 className="h-4 w-4 text-gray-400" />
                                  <span>Analytics</span>
                                </Link>
                              )}
                              {isOwner && (
                                <Link
                                  href={`/${slug}/billing`}
                                  prefetch={true}
                                  onClick={() => setIsAdminMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span>Billing</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${textMutedClass} ${contrastColor === '#000000' ? 'hover:bg-black/10 hover:text-black' : 'hover:bg-white/15 hover:text-white'}`}
                    >
                      <UserCircle className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium leading-none">{membership.user.name}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={`/${slug}/profile`} prefetch={true}>
                      <DropdownMenuItem>
                        <UserCircle className="h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    {isOwner && (
                      <Link href={`/${slug}/billing`} prefetch={true}>
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4" />
                          Billing
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <form action={handleSignOut}>
                      <button type="submit" className="w-full">
                        <DropdownMenuItem>
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </DropdownMenuItem>
                      </button>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className={`sm:hidden ${textMutedClass}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-white/20 bg-white">
            <div className="px-4 py-4 space-y-1">
              <div className="pb-3 mb-3 border-b">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-gray-900">{membership.user.name}</p>
              </div>

              {/* Nav items */}
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={getNavItemHref(slug, item)}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2 ${
                      isNavItemActive(item) ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}

              <div className="pt-2 border-t">
                <Link
                  href={`/${slug}/profile`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>

                <Link
                  href={`/${slug}/grievances`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2 relative">
                    <FileText className="h-4 w-4" />
                    Grievances
                    {grievanceNotificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {grievanceNotificationCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link
                  href={`/${slug}/meetings`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Video className="h-4 w-4" />
                    Meetings
                  </Button>
                </Link>

                {!isOwnerOrAdmin && (
                  <Link
                    href={`/${slug}/strikes`}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2 relative">
                      <Zap className="h-4 w-4" />
                      Strikes
                      {strikeNotificationCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {strikeNotificationCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Admin section in mobile */}
              {isOwnerOrAdmin && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Admin</p>
                  {canAccess('members') && (
                    <Link href={`/${slug}/members`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2 relative">
                        <Users className="h-4 w-4" />
                        Members
                        {pendingMembersCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {pendingMembersCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )}
                  {canAccess('communications') && (
                    <Link href={`/${slug}/mass-email`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Mail className="h-4 w-4" />
                        Mass Email
                      </Button>
                    </Link>
                  )}
                  {canAccess('communications') && (
                    <Link href={`/${slug}/mass-sms`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Mass SMS
                      </Button>
                    </Link>
                  )}
                  {canAccess('strikes') && (
                    <Link href={`/${slug}/strikes`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2 relative">
                        <Zap className="h-4 w-4" />
                        Strikes
                        {strikeNotificationCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {strikeNotificationCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )}
                  {canAccess('dues') && (
                    <Link href={`/${slug}/dues`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <DollarSign className="h-4 w-4" />
                        Dues
                      </Button>
                    </Link>
                  )}
                  {canAccess('announcements') && (
                    <Link href={`/${slug}/announcements`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Megaphone className="h-4 w-4" />
                        Announcements
                      </Button>
                    </Link>
                  )}
                  {canAccess('settings') && (
                    <Link href={`/${slug}/settings`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  )}
                  {canAccess('analytics') && (
                    <Link href={`/${slug}/analytics`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
                    </Link>
                  )}
                  {isOwner && (
                    <Link href={`/${slug}/billing`} prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              <div className="pt-2 border-t">
                <form action={handleSignOut}>
                  <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
