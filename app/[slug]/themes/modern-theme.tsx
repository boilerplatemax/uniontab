'use client';

import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { AnnouncementClient } from '../announcement-client';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import type { ThemeProps } from './types';
import { Users, Settings } from 'lucide-react';
import { UnionProfileTabs } from '../union-profile-tabs';

/**
 * Modern Theme (Clean website style)
 * - Hero banner with about/desc text
 * - Fewer margins, more edge-to-edge
 * - Posts look more like a news section
 * - Clean, minimal design
 */
export function ModernTheme({
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
  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner - Above navbar */}
      <AnnouncementClient
        popup={activeAnnouncements.popup}
        banner={activeAnnouncements.banner}
      />

      {/* Navigation Bar - Fixed */}
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
        announcementId={activeAnnouncements.banner?.id}
      />

      {/* Spacing for fixed navbar and announcement */}
      <NavbarSpacer announcementId={activeAnnouncements.banner?.id} />

      {/* Unapproved User Alert Banner */}
      {membership && membership.member.status === 'pending' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
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

      {/* Hero Banner - Modern style with overlay text */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        {/* Background image with overlay */}
        {union.coverPhotoUrl && (
          <div className="absolute inset-0">
            <img
              src={union.coverPhotoUrl}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-800/80" />
          </div>
        )}

        {/* Edit Button for Owners/Admins */}
        {isOwner && (
          <Link
            href={`/${slug}/settings`}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-lg shadow-lg transition-all hover:scale-105 border border-white/20 group"
            title="Edit banner and settings"
          >
            <Settings className="h-5 w-5 text-white group-hover:text-white transition-colors" />
          </Link>
        )}

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
            {/* Logo */}
            {union.logoUrl ? (
              <div className="flex-shrink-0">
                <div className="relative h-24 sm:h-28 lg:h-32 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 shadow-2xl overflow-hidden">
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="h-full w-auto max-w-[200px] object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-2xl">
                <Users className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white" />
              </div>
            )}

            {/* Title and Description */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                {(union.publicName || union.name).toUpperCase()}
                {union.localNumber && !union.publicName && ` ${union.localNumber}`}
              </h1>
              {union.description && (
                <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl">
                  {union.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Less margins, cleaner layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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

      {/* Footer - Minimal */}
      <div className="border-t mt-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 text-center text-gray-500 text-sm">
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
      <AccessibilityWidget enabled={accessibilityWidgetEnabled} />
    </div>
  );
}
