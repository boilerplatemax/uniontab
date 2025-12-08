'use client';

import { useState } from 'react';
import { AnnouncementClient } from '../announcement-client';
import Accessibilik from 'accessibility-react-widget';
import type { ThemeProps } from './types';
import { Users, Home, FileText, Calendar, Vote, Info, Mail, Phone, MapPin, Globe, Menu, X } from 'lucide-react';
import { UnionProfileTabs } from '../union-profile-tabs';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Twitter Theme (Social feed with sidebar)
 * - Left sidebar for navigation
 * - Main feed area for content
 * - Twitter/X inspired design
 * - Responsive with collapsible sidebar
 */
export function TwitterTheme({
  union,
  posts,
  files,
  events,
  membership,
  isOwner,
  isApprovedMember,
  userId,
  slug,
  pendingMembersCount,
  handleSignOut,
  activeAnnouncements,
  accessibilityWidgetEnabled,
}: ThemeProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'about' | 'posts' | 'files' | 'events' | 'elections') || 'posts';

  const setActiveTab = (tab: 'about' | 'posts' | 'files' | 'events' | 'elections') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'posts') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const navItems = [
    { id: 'posts' as const, label: 'Posts', icon: Home },
    { id: 'about' as const, label: 'About', icon: Info },
    { id: 'files' as const, label: 'Files', icon: FileText },
    { id: 'events' as const, label: 'Events', icon: Calendar },
    { id: 'elections' as const, label: 'Elections', icon: Vote },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Announcement Banner - Above everything */}
      <AnnouncementClient
        popup={activeAnnouncements.popup}
        banner={activeAnnouncements.banner}
      />

      {/* Top Bar - Mobile only */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {union.logoUrl ? (
              <img
                src={union.logoUrl}
                alt={`${union.name} logo`}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            )}
            <h1 className="font-bold text-lg truncate">
              {(union.publicName || union.name).toUpperCase()}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Unapproved User Alert Banner */}
      {membership && membership.member.status === 'pending' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-yellow-800 font-medium">
                Your account has not been approved yet - some content may not be visible until an admin approves your membership.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 border-r bg-white min-h-screen sticky top-0">
            <div className="p-6">
              {/* Union Profile */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  {union.logoUrl ? (
                    <img
                      src={union.logoUrl}
                      alt={`${union.name} logo`}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {(union.publicName || union.name).toUpperCase()}
                  {union.localNumber && !union.publicName && ` ${union.localNumber}`}
                </h1>
                {union.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {union.description}
                  </p>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1 mb-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-left font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-lg">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Contact Info */}
              {(union.email || union.phone || union.address || union.website) && (
                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Contact</h3>
                  {union.email && (
                    <a
                      href={`mailto:${union.email}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{union.email}</span>
                    </a>
                  )}
                  {union.phone && (
                    <a
                      href={`tel:${union.phone}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{union.phone}</span>
                    </a>
                  )}
                  {union.address && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2">{union.address}</span>
                    </div>
                  )}
                  {union.website && (
                    <a
                      href={union.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate hover:underline">
                        {union.website.replace(/^https?:\/\//, '')}
                      </span>
                    </a>
                  )}
                </div>
              )}

              {/* User Actions */}
              {membership && (
                <div className="border-t pt-6 mt-6">
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mb-2"
                      onClick={() => router.push(`/${slug}/settings`)}
                    >
                      Settings
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      await handleSignOut();
                      router.push('/login');
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  {/* Close button */}
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Union Profile */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      {union.logoUrl ? (
                        <img
                          src={union.logoUrl}
                          alt={`${union.name} logo`}
                          className="h-16 w-auto object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      {(union.publicName || union.name).toUpperCase()}
                      {union.localNumber && !union.publicName && ` ${union.localNumber}`}
                    </h1>
                    {union.description && (
                      <p className="text-sm text-gray-600">
                        {union.description}
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-1 mb-8">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-lg">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* User Actions */}
                  {membership && (
                    <div className="border-t pt-6 space-y-2">
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            router.push(`/${slug}/settings`);
                            setSidebarOpen(false);
                          }}
                        >
                          Settings
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          await handleSignOut();
                          router.push('/login');
                          setSidebarOpen(false);
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
              <UnionProfileTabs
                union={union}
                posts={posts}
                files={files}
                events={events}
                membership={membership}
                isOwner={isOwner}
                isApprovedMember={isApprovedMember}
                userId={userId}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              UnionTab
            </a>
          </p>
        </div>
      </div>

      {/* Accessibility Widget */}
      {accessibilityWidgetEnabled && <Accessibilik />}
    </div>
  );
}
