'use client';

import { useState } from 'react';
import { Users, LogOut, UserCircle, CreditCard, Menu, X, Settings, Megaphone, Mail, ChevronDown, ChevronRight, UserPlus, DollarSign, FileText, Zap, Video, MessageSquare, BarChart3 } from 'lucide-react';
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
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions';
import type { AdminPermissions } from '@/lib/db/schema';
import { MemberLoginDropdown } from './member-login-dropdown';

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
}

interface MegaMenuItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
  onClick?: () => void;
}

function MegaMenuItem({ href, icon, title, description, badge, onClick }: MegaMenuItemProps) {
  return (
    <Link href={href} prefetch={true} onClick={onClick}>
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-white flex items-center justify-center text-gray-600 group-hover:text-gray-900 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {badge !== undefined && badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function UnionNavbar({ slug, unionName, localNumber, membership, handleSignOut, pendingMembersCount = 0, announcementId, grievanceNotificationCount = 0, strikeNotificationCount = 0, contactEmail }: UnionNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);

  const canAccess = (permission: AdminPermissionKey): boolean => {
    return hasPermission(membership?.member.role, membership?.member.adminPermissions, permission);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) setMobileExpandedSection(null);
  };

  const toggleMobileSection = (section: string) => {
    setMobileExpandedSection(mobileExpandedSection === section ? null : section);
  };

  const closeMobile = () => {
    setIsMobileMenuOpen(false);
    setMobileExpandedSection(null);
  };

  const displayName = `${unionName.toUpperCase()}${localNumber ? ` ${localNumber}` : ''}`;

  // Check what grouped sections are available
  const hasManagement = canAccess('members') || canAccess('strikes') || canAccess('dues');
  const hasCommunications = canAccess('communications') || canAccess('announcements');
  const managementNotificationCount = (canAccess('members') ? pendingMembersCount : 0) + (canAccess('strikes') ? strikeNotificationCount : 0);

  // Simplified navbar for non-signed-in users
  if (!membership) {
    return (
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <Link
                href={`/${slug}`}
                prefetch={true}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="font-semibold text-gray-900 text-lg">
                  {displayName}
                </span>
              </Link>
            </div>
            <MemberLoginDropdown slug={slug} contactEmail={contactEmail} />
          </div>
        </div>
      </nav>
    );
  }

  // Full navbar for signed-in users
  return (
    <>
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <Link
                href={`/${slug}`}
                prefetch={true}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="font-semibold text-gray-900 text-lg">
                  {displayName}
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex items-center gap-1">
                {/* Grievances - visible to all members, standalone */}
                <Link href={`/${slug}/grievances`} prefetch={true}>
                  <Button variant="ghost" size="sm" className="gap-2 relative">
                    <FileText className="h-4 w-4" />
                    <span className="hidden lg:inline">Grievances</span>
                    {grievanceNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {grievanceNotificationCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Meetings - visible to all members, standalone */}
                <Link href={`/${slug}/meetings`} prefetch={true}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Video className="h-4 w-4" />
                    <span className="hidden lg:inline">Meetings</span>
                  </Button>
                </Link>

                {/* Management dropdown - Members, Strikes, Dues, Invite */}
                {hasManagement && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 relative">
                        <Users className="h-4 w-4" />
                        <span className="hidden lg:inline">Management</span>
                        <ChevronDown className="h-3 w-3" />
                        {managementNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {managementNotificationCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-2">
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
                      </div>
                      {canAccess('members') && (
                        <MegaMenuItem
                          href={`/${slug}/members`}
                          icon={<Users className="h-4 w-4" />}
                          title="Members"
                          description="View and manage union membership roster."
                          badge={pendingMembersCount}
                        />
                      )}
                      {canAccess('members') && (
                        <MegaMenuItem
                          href={`/${slug}/members/invite`}
                          icon={<UserPlus className="h-4 w-4" />}
                          title="Invite Members"
                          description="Send invitations to new members."
                        />
                      )}
                      {canAccess('strikes') && (
                        <MegaMenuItem
                          href={`/${slug}/strikes`}
                          icon={<Zap className="h-4 w-4" />}
                          title="Strikes"
                          description="Manage strike actions and tracking."
                          badge={strikeNotificationCount}
                        />
                      )}
                      {canAccess('dues') && (
                        <MegaMenuItem
                          href={`/${slug}/dues`}
                          icon={<DollarSign className="h-4 w-4" />}
                          title="Dues"
                          description="Track and manage member dues."
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Communications dropdown - Emails, SMS, Announcements */}
                {hasCommunications && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Mail className="h-4 w-4" />
                        <span className="hidden lg:inline">Communications</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-2">
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Communications</p>
                      </div>
                      {canAccess('communications') && (
                        <MegaMenuItem
                          href={`/${slug}/mass-email`}
                          icon={<Mail className="h-4 w-4" />}
                          title="Mass Emails"
                          description="Send email updates to members."
                        />
                      )}
                      {canAccess('communications') && (
                        <MegaMenuItem
                          href={`/${slug}/mass-sms`}
                          icon={<MessageSquare className="h-4 w-4" />}
                          title="SMS Messages"
                          description="Send text message blasts to members."
                        />
                      )}
                      {canAccess('announcements') && (
                        <MegaMenuItem
                          href={`/${slug}/announcements`}
                          icon={<Megaphone className="h-4 w-4" />}
                          title="Announcements"
                          description="Create and manage site-wide announcements."
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Settings - standalone */}
                {canAccess('settings') && (
                  <Link href={`/${slug}/settings`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden lg:inline">Settings</span>
                    </Button>
                  </Link>
                )}

                {/* Analytics - standalone */}
                {canAccess('analytics') && (
                  <Link href={`/${slug}/analytics`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden lg:inline">Analytics</span>
                    </Button>
                  </Link>
                )}

                {/* Strikes - visible to regular members (non-admin) */}
                {!isOwnerOrAdmin && (
                  <Link href={`/${slug}/strikes`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2 relative">
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

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
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
                className="sm:hidden"
                onClick={toggleMobileMenu}
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

        {/* Mobile Menu - collapsible sections */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t bg-white max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <div className="pb-3 mb-3 border-b">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium">{membership.user.name}</p>
              </div>

              {/* Direct links - always visible */}
              <Link href={`/${slug}/profile`} prefetch={true} onClick={closeMobile}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Button>
              </Link>

              <Link href={`/${slug}/grievances`} prefetch={true} onClick={closeMobile}>
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

              <Link href={`/${slug}/meetings`} prefetch={true} onClick={closeMobile}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Video className="h-4 w-4" />
                  Meetings
                </Button>
              </Link>

              {/* Settings - standalone */}
              {canAccess('settings') && (
                <Link href={`/${slug}/settings`} prefetch={true} onClick={closeMobile}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              )}

              {/* Analytics - standalone */}
              {canAccess('analytics') && (
                <Link href={`/${slug}/analytics`} prefetch={true} onClick={closeMobile}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
              )}

              {/* Strikes - visible to regular members (non-admin) */}
              {!isOwnerOrAdmin && (
                <Link href={`/${slug}/strikes`} prefetch={true} onClick={closeMobile}>
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

              {/* Management section - collapsible */}
              {hasManagement && (
                <div className="pt-2 border-t">
                  <button
                    onClick={() => toggleMobileSection('management')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Management
                      {managementNotificationCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center normal-case">
                          {managementNotificationCount}
                        </span>
                      )}
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${mobileExpandedSection === 'management' ? 'rotate-90' : ''}`} />
                  </button>
                  {mobileExpandedSection === 'management' && (
                    <div className="ml-2 space-y-0.5 pb-1">
                      {canAccess('members') && (
                        <Link href={`/${slug}/members`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Members</p>
                              <p className="text-xs text-gray-500">View and manage membership roster</p>
                            </div>
                            {pendingMembersCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {pendingMembersCount}
                              </span>
                            )}
                          </div>
                        </Link>
                      )}
                      {canAccess('members') && (
                        <Link href={`/${slug}/members/invite`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <UserPlus className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Invite Members</p>
                              <p className="text-xs text-gray-500">Send invitations to new members</p>
                            </div>
                          </div>
                        </Link>
                      )}
                      {canAccess('strikes') && (
                        <Link href={`/${slug}/strikes`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Zap className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Strikes</p>
                              <p className="text-xs text-gray-500">Manage strike actions and tracking</p>
                            </div>
                            {strikeNotificationCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {strikeNotificationCount}
                              </span>
                            )}
                          </div>
                        </Link>
                      )}
                      {canAccess('dues') && (
                        <Link href={`/${slug}/dues`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Dues</p>
                              <p className="text-xs text-gray-500">Track and manage member dues</p>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Communications section - collapsible */}
              {hasCommunications && (
                <div className={`${!hasManagement ? 'pt-2 border-t' : ''}`}>
                  <button
                    onClick={() => toggleMobileSection('communications')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Communications
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${mobileExpandedSection === 'communications' ? 'rotate-90' : ''}`} />
                  </button>
                  {mobileExpandedSection === 'communications' && (
                    <div className="ml-2 space-y-0.5 pb-1">
                      {canAccess('communications') && (
                        <Link href={`/${slug}/mass-email`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Mass Emails</p>
                              <p className="text-xs text-gray-500">Send email updates to members</p>
                            </div>
                          </div>
                        </Link>
                      )}
                      {canAccess('communications') && (
                        <Link href={`/${slug}/mass-sms`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">SMS Messages</p>
                              <p className="text-xs text-gray-500">Send text message blasts to members</p>
                            </div>
                          </div>
                        </Link>
                      )}
                      {canAccess('announcements') && (
                        <Link href={`/${slug}/announcements`} prefetch={true} onClick={closeMobile}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Megaphone className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Announcements</p>
                              <p className="text-xs text-gray-500">Create site-wide announcements</p>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sign out & Billing */}
              <div className="pt-2 border-t space-y-1">
                {isOwner && (
                  <Link href={`/${slug}/billing`} prefetch={true} onClick={closeMobile}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </Button>
                  </Link>
                )}
                <form action={handleSignOut}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
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
