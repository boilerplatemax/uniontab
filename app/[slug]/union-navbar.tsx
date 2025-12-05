'use client';

import { useState, useEffect } from 'react';
import { Users, LogOut, Camera, UserCircle, CreditCard, Menu, X, Settings, Megaphone, Mail, ChevronDown } from 'lucide-react';
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
  hasAnnouncement?: boolean;
}

export function UnionNavbar({ slug, unionName, localNumber, membership, handleSignOut, pendingMembersCount = 0, hasAnnouncement = false }: UnionNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const isOwner = membership?.member.role === 'owner';
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  useEffect(() => {
    // Watch for changes to the announcement offset CSS variable
    const updateAnnouncementVisibility = () => {
      const offset = getComputedStyle(document.documentElement)
        .getPropertyValue('--announcement-offset')
        .trim();
      setAnnouncementVisible(offset === '3rem');
    };

    updateAnnouncementVisibility();

    const observer = new MutationObserver(updateAnnouncementVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const displayName = `${unionName.toUpperCase()}${localNumber ? ` ${localNumber}` : ''}`;

  // Simplified navbar for non-signed-in users
  if (!membership) {
    return (
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${announcementVisible ? 'top-12' : 'top-0'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              href={`/${slug}`}
              prefetch={true}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-semibold text-gray-900 text-lg">
                {displayName}
              </span>
            </Link>
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
      <nav className={`fixed left-0 right-0 z-50 bg-white shadow-sm ${announcementVisible ? 'top-12' : 'top-0'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              href={`/${slug}`}
              prefetch={true}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-semibold text-gray-900 text-lg">
                {displayName}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                {isOwner && (
                  <>
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
                  </>
                )}
                {isOwnerOrAdmin && (
                  <>
                    <Link href={`/${slug}/mass-email`} prefetch={true}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="hidden md:inline">Emails</span>
                      </Button>
                    </Link>
                  </>
                )}
                {isOwner && (
                  <>
                    <Link href={`/${slug}/announcements`} prefetch={true}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Megaphone className="h-4 w-4" />
                        <span className="hidden md:inline">News</span>
                      </Button>
                    </Link>
                    <Link href={`/${slug}/settings`} prefetch={true}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden md:inline">Settings</span>
                      </Button>
                    </Link>
                    <Link href={`/${slug}/billing`} prefetch={true}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden md:inline">Billing</span>
                      </Button>
                    </Link>
                  </>
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
              {isOwner && (
                <>
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
                </>
              )}
              {isOwnerOrAdmin && (
                <>
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
                </>
              )}
              {isOwner && (
                <>
                  <Link
                    href={`/${slug}/announcements`}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Megaphone className="h-4 w-4" />
                      News
                    </Button>
                  </Link>
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
