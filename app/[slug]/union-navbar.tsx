'use client';

import { useState } from 'react';
import { Users, LogOut, Camera, UserCircle, CreditCard, Menu, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}

export function UnionNavbar({ slug, unionName, localNumber, membership, handleSignOut }: UnionNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOwner = membership?.member.role === 'owner';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const displayName = `${unionName.toUpperCase()}${localNumber ? ` ${localNumber}` : ''}`;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900 text-lg">
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {membership ? (
                <>
                  <span className="text-sm text-gray-700 hidden md:inline">
                    {membership.user.name}
                  </span>
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href={`/${slug}/profile`} prefetch={true}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <UserCircle className="h-4 w-4" />
                        <span className="hidden md:inline">Profile</span>
                      </Button>
                    </Link>
                    {isOwner && (
                      <>
                        <Link href={`/${slug}/members`} prefetch={true}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden md:inline">Members</span>
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
                    <form action={handleSignOut}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden md:inline">Log out</span>
                      </Button>
                    </form>
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
                </>
              ) : (
                <>
                  <Link href={`/${slug}/sign-in`} prefetch={true}>
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                      Member Login
                    </Button>
                  </Link>
                  <Link href={`/${slug}/sign-up`} prefetch={true}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <span className="hidden sm:inline">Join Union</span>
                      <span className="sm:hidden">Join</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {membership && isMobileMenuOpen && (
          <div className="sm:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-2">
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
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Members
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
              <form action={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </form>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
