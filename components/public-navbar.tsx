'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import {
  Users,
  Menu,
  X,
  Home,
  Mail,
  MessageSquare,
  FileText,
  AlertTriangle,
  Calendar,
  Vote,
  DollarSign,
  ChevronDown,
  Award,
  Info,
} from 'lucide-react';

interface PublicNavbarProps {
  isLoggedIn?: boolean;
  unionSlug?: string;
}

const featureLinks = [
  {
    slug: 'member-profiles',
    icon: Users,
    name: 'Member Profiles',
    description: 'Manage your full membership directory',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    slug: 'mass-email-text',
    icon: Mail,
    name: 'Mass Email & Text',
    description: 'Reach every member instantly',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    slug: 'grievance-tracking',
    icon: AlertTriangle,
    name: 'Grievance Tracking',
    description: 'From filing to resolution',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    slug: 'news-posts',
    icon: MessageSquare,
    name: 'News & Posts',
    description: 'Keep members informed & engaged',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    slug: 'file-sharing',
    icon: FileText,
    name: 'File Sharing',
    description: 'Contracts and docs, secured',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    slug: 'events-meetings',
    icon: Calendar,
    name: 'Events & Meetings',
    description: 'Organize and track attendance',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    slug: 'elections-voting',
    icon: Vote,
    name: 'Elections & Voting',
    description: 'Secure democratic ballots',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    slug: 'dues-management',
    icon: DollarSign,
    name: 'Dues Management',
    description: 'Track payments & send reminders',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
];

export function PublicNavbar({ isLoggedIn, unionSlug }: PublicNavbarProps = {}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target as Node)) {
        setAboutOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity group">
            <div className="relative">
              <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              UnionTab
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/features')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Features
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {featuresOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Features</div>
                    </div>
                    <Link
                      href="/features"
                      onClick={() => setFeaturesOpen(false)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View all features →
                    </Link>
                  </div>
                  {/* Feature grid */}
                  <div className="grid grid-cols-2 gap-1">
                    {featureLinks.map((f) => (
                      <Link
                        key={f.slug}
                        href={`/features/${f.slug}`}
                        onClick={() => setFeaturesOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-9 h-9 ${f.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <f.icon className={`h-4.5 w-4.5 ${f.color} h-[18px] w-[18px]`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {f.name}
                          </div>
                          <div className="text-xs text-gray-500">{f.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <Link href="/pricing">
              <Button
                variant="ghost"
                className={`text-sm text-gray-700 hover:text-blue-600 ${isActive('/pricing') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}
              >
                Pricing
              </Button>
            </Link>

            {/* About dropdown */}
            <div className="relative" ref={aboutDropdownRef}>
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/about') || isActive('/why-choose-us')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                About
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
              </button>

              {aboutOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">
                  <Link
                    href="/about"
                    onClick={() => setAboutOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="h-[18px] w-[18px] text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">About Us</div>
                      <div className="text-xs text-gray-500">Our mission & story</div>
                    </div>
                  </Link>
                  <Link
                    href="/why-choose-us"
                    onClick={() => setAboutOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="h-[18px] w-[18px] text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Why Choose Us?</div>
                      <div className="text-xs text-gray-500">Compare vs competitors</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Blog & Contact */}
            {[
              { name: 'Blog', href: '/blogs' },
              { name: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`text-sm text-gray-700 hover:text-blue-600 ${
                    isActive(link.href) ? 'text-blue-600 font-semibold bg-blue-50' : ''
                  }`}
                >
                  {link.name}
                </Button>
              </Link>
            ))}

            <LanguageToggle variant="pill" />

            {isLoggedIn && unionSlug ? (
              <Link href={`/${unionSlug}`}>
                <Button className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <Home className="h-4 w-4 mr-2" />
                  My Union
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/member-login">
                  <Button variant="outline" className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                    Member Login
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger + CTA */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && unionSlug ? (
              <Link href={`/${unionSlug}`}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Home className="h-4 w-4 mr-1" />
                  My Union
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Get Started
                </Button>
              </Link>
            )}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-1">
            {/* Features accordion */}
            <button
              onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${
                isActive('/features') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {mobileFeaturesOpen && (
              <div className="ml-4 space-y-1 pb-1">
                <Link
                  href="/features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-blue-600 font-medium hover:bg-gray-50 rounded-lg"
                >
                  View All Features →
                </Link>
                {featureLinks.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/features/${f.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 ${f.bg} rounded-md flex items-center justify-center flex-shrink-0`}>
                      <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pricing */}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/pricing') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Pricing
            </Link>

            {/* About accordion */}
            <button
              onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${
                isActive('/about') || isActive('/why-choose-us') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>About</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileAboutOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileAboutOpen && (
              <div className="ml-4 space-y-1 pb-1">
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                    <Info className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">About Us</div>
                    <div className="text-xs text-gray-500">Our mission & story</div>
                  </div>
                </Link>
                <Link
                  href="/why-choose-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center flex-shrink-0">
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Why Choose Us?</div>
                    <div className="text-xs text-gray-500">Compare vs competitors</div>
                  </div>
                </Link>
              </div>
            )}

            {/* Blog & Contact */}
            {[
              { name: 'Blog', href: '/blogs' },
              { name: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.href) ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!isLoggedIn && (
              <div className="pt-2 border-t mt-2 space-y-2 px-4">
                <Link
                  href="/member-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full border-blue-600 text-blue-600">
                    Member Login
                  </Button>
                </Link>
              </div>
            )}
            <div className="pt-2 border-t mt-2 px-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Language</span>
              <LanguageToggle variant="pill" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
