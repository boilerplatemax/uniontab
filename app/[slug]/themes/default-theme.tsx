import { Users, Mail, Phone, MapPin, Globe, Settings } from 'lucide-react';
import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { UnionProfileTabs } from '../union-profile-tabs';
import { AnnouncementClient } from '../announcement-client';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import { AdminHelpWidget } from '@/components/admin-help-widget';
import { OnboardingReminder } from '@/components/onboarding-reminder';
import { SocialMediaIcons } from '@/components/social-media-icons';
import { UnionTabProvider } from '../union-tab-context';
import type { ThemeProps } from './types';

/**
 * Default Theme (Classic Facebook-style layout)
 * - Large cover photo
 * - Overlapping logo on profile section
 * - Contact information bar
 * - Tab-based content navigation
 */
export function DefaultTheme({
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
  return (
    <UnionTabProvider slug={slug}>
    <div className="min-h-screen bg-gray-100">
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
        contactEmail={union.email}
        isApprovedMember={isApprovedMember}
      />

      {/* Spacing for fixed navbar and announcement */}
      <NavbarSpacer announcementId={activeAnnouncements.banner?.id} />

      {/* Unapproved User Alert Banner */}
      {membership && membership.member.status === 'pending' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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

      {/* Cover Photo - Facebook style */}
      <div className="relative bg-white">
        <div
          className={`relative overflow-hidden ${union.coverPhotoUrl ? 'h-[300px] sm:h-[400px]' : 'h-[120px] sm:h-[150px]'}`}
          style={{
            background: union.coverPhotoUrl
              ? undefined
              : `linear-gradient(135deg, ${union.themeColor || '#2563eb'} 0%, ${union.themeColor || '#2563eb'}dd 50%, ${union.themeColor || '#2563eb'}bb 100%)`
          }}
        >
          {union.coverPhotoUrl && (
            <img
              src={union.coverPhotoUrl}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover"
            />
          )}

          {/* Edit Button for Owners/Admins */}
          {isOwner && (
            <Link
              href={`/${slug}/settings`}
              className="absolute bottom-4 right-4 z-30 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-lg shadow-lg transition-all hover:scale-105 group"
              title="Edit banner and settings"
            >
              <Settings className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Profile Section - Facebook style */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${union.coverPhotoUrl ? '-mt-20' : '-mt-10 sm:-mt-12'}`}>
        <div className="bg-white rounded-lg shadow-sm pb-4">
          {/* Logo and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-6 pt-6">
            {/* Logo - Overlapping cover photo with fixed dimensions to prevent layout shift */}
            <div className={`flex-shrink-0 relative z-20 ${union.coverPhotoUrl ? '-mt-8 sm:-mt-16' : '-mt-4 sm:-mt-8'}`}>
              {union.logoUrl ? (
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl">
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                </div>
              )}
            </div>

            {/* Name and Local Number */}
            <div className="flex-1 text-center sm:text-left pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {(union.publicName || union.name).toUpperCase()}
                {union.localNumber && !union.publicName && ` ${union.localNumber}`}
              </h1>
              {union.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base">
                  {union.description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information Bar */}
          {(union.email || union.phone || union.address || union.website) && (
            <div className="px-6 pb-4 border-t pt-4">
              <div className="flex flex-wrap gap-4 text-sm">
                {union.email && (
                  <a
                    href={`mailto:${union.email}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{union.email}</span>
                  </a>
                )}
                {union.phone && (
                  <a
                    href={`tel:${union.phone}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{union.phone}</span>
                  </a>
                )}
                {union.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{union.address}</span>
                  </div>
                )}
                {union.website && (
                  <a
                    href={union.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hover:underline">
                      {union.website.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Social Icons in Hero (conditionally shown) */}
          {(union as any).showSocialInHero && (union as any).socialLinks && Object.values((union as any).socialLinks).some((v: any) => v) && (
            <div className="px-6 pb-4 border-t pt-4 flex justify-center sm:justify-start">
              <SocialMediaIcons
                socialLinks={(union as any).socialLinks}
                size="md"
              />
            </div>
          )}

        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnionProfileTabs
          union={union}
          posts={posts}
          files={files}
          events={events}
          membership={membership}
          isOwner={isOwner}
          isApprovedMember={isApprovedMember}
          userId={userId}
          hideTabNav={true}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  className="text-blue-600 hover:text-blue-700 font-medium"
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

      {/* Admin Help Widget */}
      <AdminHelpWidget slug={slug} isAdmin={isOwner} />
    </div>
    </UnionTabProvider>
  );
}
