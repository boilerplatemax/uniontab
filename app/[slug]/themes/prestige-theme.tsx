'use client';

import Link from 'next/link';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import { AdminHelpWidget } from '@/components/admin-help-widget';
import { OnboardingReminder } from '@/components/onboarding-reminder';
import { SocialMediaIcons } from '@/components/social-media-icons';
import type { ThemeProps } from './types';
import { Settings, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { UnionProfileTabs } from '../union-profile-tabs';
import { getLightTint, getDarkerShade, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

/**
 * Prestige Theme (Fresh masonry-focused design)
 * - Clean white backgrounds with generous spacing
 * - Rose/coral accent color for warmth
 * - Pill-style tab navigation with unique tab backgrounds
 * - Grid/masonry layout for posts
 * - Refined typography and smooth transitions
 */
export function PrestigeTheme({
  union,
  posts,
  files,
  events,
  membership,
  isOwner,
  isOwnerOrAdmin,
  isApprovedMember,
  userId,
  slug,
  accessibilityWidgetEnabled,
}: ThemeProps) {
  // Dynamic color palette based on theme color from settings
  const themeColor = union.themeColor || DEFAULT_THEME_COLOR;
  const themeColorLight = getLightTint(themeColor, 97); // Very light tint for backgrounds
  const themeColorDark = getDarkerShade(themeColor, 15); // Darker shade for gradients
  const textPrimary = '#222222'; // Near-black for headers
  const textSecondary = '#717171'; // Medium gray for body
  const borderLight = '#EBEBEB'; // Light border

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Unapproved User Alert Banner */}
      {membership && membership.member.status === 'pending' && (
        <div
          className="border-b"
          style={{
            backgroundColor: themeColorLight,
            borderColor: `${themeColor}33`,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" style={{ color: themeColor }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>
                Your account has not been approved yet - some content may not be visible until an admin approves your membership.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Reminder for Owners */}
      <OnboardingReminder union={union} isOwner={isOwner} />

      {/* Hero Section - Clean Airbnb-inspired design */}
      <div className="relative overflow-hidden">
        {/* Background - solid rose gradient or cover photo */}
        {union.coverPhotoUrl ? (
          <>
            {/* Cover photo with reduced overlay for better visibility */}
            <div className="absolute inset-0">
              <img
                src={union.coverPhotoUrl}
                alt={`${union.name} cover`}
                className="w-full h-full object-cover"
              />
              {/* Light gradient overlay - much more transparent to show the image */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.4) 100%)',
                }}
              />
            </div>
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorDark} 100%)`,
            }}
          />
        )}

        {/* Edit Button for Owners/Admins */}
        {isOwner && (
          <Link
            href={`/${slug}/settings`}
            className="absolute top-6 right-6 z-30 p-3 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl group bg-white/90 backdrop-blur-sm"
            title="Edit banner and settings"
          >
            <Settings className="h-5 w-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
          </Link>
        )}

        {/* Hero Content */}
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${union.coverPhotoUrl ? 'py-20 sm:py-28 lg:py-36' : 'py-16 sm:py-20 lg:py-24'}`}>
          <div className="flex flex-col items-center text-center">
            {/* Logo with clean white frame */}
            {union.logoUrl && (
              <div className="mb-8">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-3xl overflow-hidden shadow-2xl bg-white p-2 flex items-center justify-center">
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="max-h-[90%] max-w-[90%] object-contain"
                  />
                </div>
              </div>
            )}

            {/* Title - UPPERCASE */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-white uppercase">
              {union.publicName || union.name}
              {union.localNumber && !union.publicName && ` ${union.localNumber}`}
            </h1>

            {/* Description */}
            {union.description && (
              <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl text-white/90 leading-relaxed font-light">
                {union.description}
              </p>
            )}

            {/* Social Icons in Hero (conditionally shown) */}
            {(union as any).showSocialInHero && (union as any).socialLinks && Object.values((union as any).socialLinks).some((v: any) => v) && (
              <div className="mt-8">
                <SocialMediaIcons
                  socialLinks={(union as any).socialLinks}
                  size="lg"
                  variant="subtle"
                  subtleColor="#ffffff"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Bar - Clean horizontal strip */}
      {(union.email || union.phone || union.address || union.website) && (
        <div className="border-b" style={{ borderColor: borderLight }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {union.email && (
                <a
                  href={`mailto:${union.email}`}
                  className="flex items-center gap-2 transition-colors group contact-link"
                  style={{ color: textSecondary, ['--theme-color' as string]: themeColor }}
                >
                  <Mail className="h-4 w-4 transition-colors group-hover:[color:var(--theme-color)]" />
                  <span className="text-sm group-hover:text-gray-900 transition-colors">{union.email}</span>
                </a>
              )}
              {union.phone && (
                <a
                  href={`tel:${union.phone}`}
                  className="flex items-center gap-2 transition-colors group"
                  style={{ color: textSecondary, ['--theme-color' as string]: themeColor }}
                >
                  <Phone className="h-4 w-4 transition-colors group-hover:[color:var(--theme-color)]" />
                  <span className="text-sm group-hover:text-gray-900 transition-colors">{union.phone}</span>
                </a>
              )}
              {union.address && (
                <div className="flex items-center gap-2" style={{ color: textSecondary }}>
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{union.address}</span>
                </div>
              )}
              {union.website && (
                <a
                  href={union.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors group"
                  style={{ color: textSecondary, ['--theme-color' as string]: themeColor }}
                >
                  <Globe className="h-4 w-4 transition-colors group-hover:[color:var(--theme-color)]" />
                  <span className="text-sm hover:underline group-hover:text-gray-900 transition-colors">
                    {union.website.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Open airy design */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <UnionProfileTabs
            union={union}
            posts={posts}
            files={files}
            events={events}
            membership={membership}
            isOwner={isOwner}
            isOwnerOrAdmin={isOwnerOrAdmin}
            isApprovedMember={isApprovedMember}
            userId={userId}
            prestigeMode={true}
            hideTabNav={true}
          />
        </div>
      </div>

      {/* Footer - Minimal elegant */}
      <div
        className="border-t mt-auto"
        style={{ borderColor: borderLight }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center gap-6">
            {/* Social Media Icons */}
            <SocialMediaIcons
              socialLinks={(union as any).socialLinks}
              size="lg"
              variant="subtle"
              subtleColor={textSecondary}
            />

            {/* Powered by - Only hide for paid plans with hidePoweredBy enabled */}
            {(!((union as any).hidePoweredBy && (union as any).planName && (union as any).planName !== 'Free')) && (
              <p className="text-sm" style={{ color: textSecondary }}>
                Powered by{' '}
                <a
                  href="/"
                  className="transition-colors font-medium hover:text-gray-900"
                  style={{ color: textPrimary }}
                >
                  UnionTab
                </a>
              </p>
            )}

            {/* Copyright with union name */}
            <p className="text-xs" style={{ color: textSecondary }}>
              &copy; {new Date().getFullYear()} {(union.publicName || union.name).toUpperCase()}
              {union.localNumber && !union.publicName && ` ${union.localNumber}`}
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility Widget */}
      <AccessibilityWidget enabled={accessibilityWidgetEnabled} />

      {/* Admin Help Widget */}
      <AdminHelpWidget slug={slug} isAdmin={isOwner} />
    </div>
  );
}
