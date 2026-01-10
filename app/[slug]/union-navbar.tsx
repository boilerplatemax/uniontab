'use client';

import { useState } from 'react';
import { Users, LogOut, UserCircle, CreditCard, Menu, X, Settings, Megaphone, Mail, ChevronDown, UserPlus, DollarSign, FileText, Zap, Video, Wrench, MessageSquare } from 'lucide-react';
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

interface UnionNavbarProps {
  slug: string;
  unionName: string;
  localNumber: string | null;
  membership: {
    user: { name: string | null };
    member: { role: string };
  } | null;
  handleSignOut: () => Promise<void>;
  pendingMembersCount?: number;
  announcementId?: number | null;
  grievanceNotificationCount?: number;
  strikeNotificationCount?: number;
}

export function UnionNavbar({ slug, unionName, localNumber, membership, handleSignOut, pendingMembersCount = 0, announcementId, grievanceNotificationCount = 0, strikeNotificationCount = 0 }: UnionNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const displayName = `${unionName.toUpperCase()}${localNumber ? ` ${localNumber}` : ''}`;

  // Simplified navbar for non-signed-in users
  if (!membership) {
    return (
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm transition-all duration-300 ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
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
            <div className="flex items-center gap-3">
              <Link href={`/${slug}/sign-in`} prefetch={true}>
                <Button variant="outline" size="sm" className="border-gray-300">
                  Sign in
                </Button>
              </Link>
              <Link href={`/${slug}/sign-up`} prefetch={true}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Join union
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Full navbar for signed-in users
  return (
    <>
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm transition-all duration-300 ${hasVisibleAnnouncement ? 'top-12' : 'top-0'}`}>
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
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                {/* Grievances - visible to all members */}
                <Link href={`/${slug}/grievances`} prefetch={true}>
                  <Button variant="ghost" size="sm" className="gap-2 relative">
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">Grievances</span>
                    {grievanceNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {grievanceNotificationCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Meetings - visible to all members */}
                <Link href={`/${slug}/meetings`} prefetch={true}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Video className="h-4 w-4" />
                    <span className="hidden md:inline">Meetings</span>
                  </Button>
                </Link>

                {/* Members - standalone for owners */}
                {isOwner && (
                  <Link href={`/${slug}/members`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2 relative">
                      <Users className="h-4 w-4" />
                      <span className="hidden md:inline">Members</span>
                      {pendingMembersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingMembersCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Mass Emails - standalone for owners/admins */}
                {isOwnerOrAdmin && (
                  <Link href={`/${slug}/mass-email`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="hidden md:inline">Emails</span>
                    </Button>
                  </Link>
                )}

                {/* SMS - standalone for owners/admins */}
                {isOwnerOrAdmin && (
                  <Link href={`/${slug}/mass-sms`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden md:inline">SMS</span>
                    </Button>
                  </Link>
                )}

                {/* Settings - standalone for owners */}
                {isOwner && (
                  <Link href={`/${slug}/settings`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </Link>
                )}

                {/* More Dropdown - for less frequently used items */}
                {isOwnerOrAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 relative">
                        <Wrench className="h-4 w-4" />
                        <span className="hidden md:inline">More</span>
                        <ChevronDown className="h-3 w-3" />
                        {strikeNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {strikeNotificationCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <Link href={`/${slug}/strikes`} prefetch={true}>
                        <DropdownMenuItem>
                          <Zap className="h-4 w-4" />
                          Strikes
                          {strikeNotificationCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {strikeNotificationCount}
                            </span>
                          )}
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/${slug}/dues`} prefetch={true}>
                        <DropdownMenuItem>
                          <DollarSign className="h-4 w-4" />
                          Dues
                        </DropdownMenuItem>
                      </Link>
                      {isOwner && (
                        <>
                          <DropdownMenuSeparator />
                          <Link href={`/${slug}/announcements`} prefetch={true}>
                            <DropdownMenuItem>
                              <Megaphone className="h-4 w-4" />
                              Announcements
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/${slug}/members/invite`} prefetch={true}>
                            <DropdownMenuItem>
                              <UserPlus className="h-4 w-4" />
                              Invite Members
                            </DropdownMenuItem>
                          </Link>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Strikes - visible to regular members (non-admin) */}
                {!isOwnerOrAdmin && (
                  <Link href={`/${slug}/strikes`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="gap-2 relative">
                      <Zap className="h-4 w-4" />
                      <span className="hidden md:inline">Strikes</span>
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-2">
              <div className="pb-3 mb-3 border-b">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium">{membership.user.name}</p>
              </div>

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

              {/* Grievances - visible to all members */}
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

              {/* Meetings - visible to all members */}
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

              {/* Members - for owners (primary actions) */}
              {isOwner && (
                <Link
                  href={`/${slug}/members`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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

              {/* Mass Emails - for owners/admins */}
              {isOwnerOrAdmin && (
                <Link
                  href={`/${slug}/mass-email`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    Emails
                  </Button>
                </Link>
              )}

              {/* SMS - for owners/admins */}
              {isOwnerOrAdmin && (
                <Link
                  href={`/${slug}/mass-sms`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </Button>
                </Link>
              )}

              {/* Settings - for owners */}
              {isOwner && (
                <Link
                  href={`/${slug}/settings`}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              )}

              {/* Less frequently used items section */}
              {isOwnerOrAdmin && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-2">More</p>

                  {/* Strikes */}
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

                  {/* Dues */}
                  <Link
                    href={`/${slug}/dues`}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <DollarSign className="h-4 w-4" />
                      Dues
                    </Button>
                  </Link>

                  {isOwner && (
                    <>
                      <Link
                        href={`/${slug}/announcements`}
                        prefetch={true}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Megaphone className="h-4 w-4" />
                          Announcements
                        </Button>
                      </Link>
                      <Link
                        href={`/${slug}/members/invite`}
                        prefetch={true}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <UserPlus className="h-4 w-4" />
                          Invite Members
                        </Button>
                      </Link>
                      <Link
                        href={`/${slug}/billing`}
                        prefetch={true}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <CreditCard className="h-4 w-4" />
                          Billing
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Strikes - visible to regular members (non-admin) at top level */}
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

              <div className="pt-2 border-t">
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
