'use client';

import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { AnnouncementClient } from '../announcement-client';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import { OnboardingReminder } from '@/components/onboarding-reminder';
import { SocialMediaIcons } from '@/components/social-media-icons';
import type { ThemeProps } from './types';
import { Settings } from 'lucide-react';
import { UnionProfileTabs } from '../union-profile-tabs';
import { DEFAULT_THEME_COLOR, getContrastColor } from '@/lib/utils/color';

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
  grievanceNotificationCount,
  strikeNotificationCount,
  handleSignOut,
  activeAnnouncements,
  accessibilityWidgetEnabled,
}: ThemeProps) {
  // Calculate contrast color for hero text based on theme color
  const heroTextColor = getContrastColor(union.themeColor || DEFAULT_THEME_COLOR);
  const heroTextOpacity = heroTextColor === '#000000' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner - Above navbar */}
      <AnnouncementClient
        popup={activeAnnouncements.popup}
        banner={activeAnnouncements.banner}
        themeColor={union.themeColor}
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
        grievanceNotificationCount={grievanceNotificationCount}
        strikeNotificationCount={strikeNotificationCount}
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

      {/* Onboarding Reminder for Owners */}
      <OnboardingReminder union={union} isOwner={isOwner} />

      {/* Hero Banner - Modern style with overlay text */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom right, ${union.themeColor || DEFAULT_THEME_COLOR}, ${union.themeColor || DEFAULT_THEME_COLOR}dd, ${union.themeColor || DEFAULT_THEME_COLOR}bb)`
        }}
      >
        {/* Background image with overlay - reduced opacity for better image visibility */}
        {union.coverPhotoUrl && (
          <div className="absolute inset-0">
            <img
              src={union.coverPhotoUrl}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom right, ${union.themeColor || DEFAULT_THEME_COLOR}80, ${union.themeColor || DEFAULT_THEME_COLOR}90, ${union.themeColor || DEFAULT_THEME_COLOR}a0)`
              }}
            />
          </div>
        )}

        {/* Edit Button for Owners/Admins */}
        {isOwner && (
          <Link
            href={`/${slug}/settings`}
            className="absolute top-4 right-4 z-30 backdrop-blur-sm p-3 rounded-lg shadow-lg transition-all hover:scale-105 group"
            style={{
              backgroundColor: heroTextColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              borderColor: heroTextColor === '#000000' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
            }}
            title="Edit banner and settings"
          >
            <Settings className="h-5 w-5 transition-colors" style={{ color: heroTextColor }} />
          </Link>
        )}

        {/* Hero Content */}
        <div className={`relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 ${union.coverPhotoUrl ? 'py-12 sm:py-16 lg:py-20' : 'py-8 sm:py-10 lg:py-12'}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
            {/* Logo - Fixed dimensions to prevent layout shift */}
            {union.logoUrl && (
              <div className="flex-shrink-0">
                <div
                  className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 backdrop-blur-sm rounded-2xl p-3 shadow-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: heroTextColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                    borderWidth: 2,
                    borderColor: heroTextColor === '#000000' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Title and Description */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3" style={{ color: heroTextColor }}>
                {(union.publicName || union.name).toUpperCase()}
                {union.localNumber && !union.publicName && ` ${union.localNumber}`}
              </h1>
              {union.description && (
                <p className="text-base sm:text-lg lg:text-xl max-w-3xl" style={{ color: heroTextOpacity }}>
                  {union.description}
                </p>
              )}

              {/* Social Icons in Hero (conditionally shown) */}
              {(union as any).showSocialInHero && (union as any).socialLinks && Object.values((union as any).socialLinks).some((v: any) => v) && (
                <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start">
                  <SocialMediaIcons
                    socialLinks={(union as any).socialLinks}
                    size="md"
                    variant="subtle"
                    subtleColor={heroTextColor}
                  />
                </div>
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <div className="flex flex-col items-center gap-4">
            {/* Social Media Icons */}
            <SocialMediaIcons
              socialLinks={(union as any).socialLinks}
              size="lg"
            />

            {/* Powered by - Only hide for paid plans with hidePoweredBy enabled */}
            {(!((union as any).hidePoweredBy && (union as any).planName && (union as any).planName !== 'Free')) && (
              <p className="text-gray-500 text-sm">
                Powered by{' '}
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  UnionTab
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accessibility Widget */}
      <AccessibilityWidget enabled={accessibilityWidgetEnabled} />
    </div>
  );
}
