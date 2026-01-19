'use client';

import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { AnnouncementClient } from '../announcement-client';
import { AccessibilityWidget } from '@/components/accessibility-widget';
import { OnboardingReminder } from '@/components/onboarding-reminder';
import { SocialMediaIcons } from '@/components/social-media-icons';
import type { ThemeProps } from './types';
import { Settings, Mail, Phone, MapPin, Globe, Sparkles } from 'lucide-react';
import { UnionProfileTabs } from '../union-profile-tabs';

/**
 * Prestige Theme (Premium dark theme)
 * - Elegant dark background with subtle gradients
 * - Glass-morphism effects with backdrop blur
 * - Gold/amber accents for luxury feel
 * - Sophisticated typography and spacing
 * - Premium card designs with elegant borders
 * - Requires Base or Plus subscription
 */
export function PrestigeTheme({
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
  // Gold accent color for premium feel
  const goldAccent = '#D4AF37';
  const goldAccentLight = '#F4E4BA';
  const goldAccentDark = '#B8962E';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle animated background pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${goldAccent} 1px, transparent 1px), radial-gradient(circle at 75% 75%, ${goldAccent} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Announcement Banner - Above navbar */}
      <AnnouncementClient
        popup={activeAnnouncements.popup}
        banner={activeAnnouncements.banner}
        themeColor={goldAccent}
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
        <div
          className="border-b"
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderColor: 'rgba(212, 175, 55, 0.3)',
          }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" style={{ color: goldAccent }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: goldAccentLight }}>
                Your account has not been approved yet - some content may not be visible until an admin approves your membership.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Reminder for Owners */}
      <OnboardingReminder union={union} isOwner={isOwner} />

      {/* Hero Section - Premium glass-morphism design */}
      <div className="relative overflow-hidden">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)`,
          }}
        />

        {/* Cover photo with premium overlay */}
        {union.coverPhotoUrl && (
          <div className="absolute inset-0">
            <img
              src={union.coverPhotoUrl}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover opacity-20"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%)`,
              }}
            />
          </div>
        )}

        {/* Decorative gold accent lines */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${goldAccent} 20%, ${goldAccentLight} 50%, ${goldAccent} 80%, transparent 100%)`,
          }}
        />

        {/* Edit Button for Owners/Admins */}
        {isOwner && (
          <Link
            href={`/${slug}/settings`}
            className="absolute top-6 right-6 z-30 backdrop-blur-md p-3 rounded-xl shadow-2xl transition-all hover:scale-105 group border"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
            title="Edit banner and settings"
          >
            <Settings className="h-5 w-5 transition-colors" style={{ color: goldAccent }} />
          </Link>
        )}

        {/* Hero Content */}
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${union.coverPhotoUrl ? 'py-16 sm:py-20 lg:py-28' : 'py-12 sm:py-16 lg:py-20'}`}>
          <div className="flex flex-col items-center text-center">
            {/* Logo with premium frame */}
            {union.logoUrl && (
              <div className="mb-8">
                <div
                  className="relative p-1 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${goldAccent} 0%, ${goldAccentLight} 50%, ${goldAccent} 100%)`,
                  }}
                >
                  <div
                    className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 backdrop-blur-xl rounded-xl overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    }}
                  >
                    <img
                      src={union.logoUrl}
                      alt={`${union.name} logo`}
                      className="max-h-[85%] max-w-[85%] object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Premium badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border"
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: goldAccent }} />
              <span className="text-sm font-medium tracking-wide" style={{ color: goldAccentLight }}>
                PREMIUM UNION
              </span>
            </div>

            {/* Title with gradient */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${goldAccentLight} 0%, ${goldAccent} 50%, ${goldAccentLight} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {(union.publicName || union.name).toUpperCase()}
              {union.localNumber && !union.publicName && ` ${union.localNumber}`}
            </h1>

            {/* Description */}
            {union.description && (
              <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl text-slate-300 leading-relaxed">
                {union.description}
              </p>
            )}

            {/* Contact info bar - glass morphism */}
            {(union.email || union.phone || union.address || union.website) && (
              <div
                className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 px-6 py-4 rounded-2xl backdrop-blur-md border"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderColor: 'rgba(212, 175, 55, 0.2)',
                }}
              >
                {union.email && (
                  <a
                    href={`mailto:${union.email}`}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  >
                    <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" style={{ color: goldAccent }} />
                    <span className="text-sm">{union.email}</span>
                  </a>
                )}
                {union.phone && (
                  <a
                    href={`tel:${union.phone}`}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  >
                    <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" style={{ color: goldAccent }} />
                    <span className="text-sm">{union.phone}</span>
                  </a>
                )}
                {union.address && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4" style={{ color: goldAccent }} />
                    <span className="text-sm">{union.address}</span>
                  </div>
                )}
                {union.website && (
                  <a
                    href={union.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  >
                    <Globe className="h-4 w-4 group-hover:scale-110 transition-transform" style={{ color: goldAccent }} />
                    <span className="text-sm hover:underline">
                      {union.website.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Social Icons in Hero (conditionally shown) */}
            {(union as any).showSocialInHero && (union as any).socialLinks && Object.values((union as any).socialLinks).some((v: any) => v) && (
              <div className="mt-8">
                <SocialMediaIcons
                  socialLinks={(union as any).socialLinks}
                  size="lg"
                  variant="subtle"
                  subtleColor={goldAccent}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom decorative line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${goldAccent}40 20%, ${goldAccent}60 50%, ${goldAccent}40 80%, transparent 100%)`,
          }}
        />
      </div>

      {/* Main Content - Premium card design */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Glass card container for tabs */}
        <div
          className="rounded-3xl backdrop-blur-xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderColor: 'rgba(212, 175, 55, 0.15)',
          }}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <UnionProfileTabs
              union={union}
              posts={posts}
              files={files}
              events={events}
              membership={membership}
              isOwner={isOwner}
              isApprovedMember={isApprovedMember}
              userId={userId}
              prestigeMode={true}
            />
          </div>
        </div>
      </div>

      {/* Footer - Premium style */}
      <div
        className="border-t mt-8"
        style={{
          borderColor: 'rgba(212, 175, 55, 0.2)',
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center gap-6">
            {/* Decorative element */}
            <div
              className="w-24 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)`,
              }}
            />

            {/* Social Media Icons */}
            <SocialMediaIcons
              socialLinks={(union as any).socialLinks}
              size="lg"
              variant="subtle"
              subtleColor={goldAccent}
            />

            {/* Powered by - Only hide for paid plans with hidePoweredBy enabled */}
            {(!((union as any).hidePoweredBy && (union as any).planName && (union as any).planName !== 'Free')) && (
              <p className="text-slate-500 text-sm">
                Powered by{' '}
                <a
                  href="/"
                  className="transition-colors font-medium hover:opacity-80"
                  style={{ color: goldAccent }}
                >
                  UnionTab
                </a>
              </p>
            )}

            {/* Copyright with union name */}
            <p className="text-slate-600 text-xs">
              &copy; {new Date().getFullYear()} {union.publicName || union.name}
              {union.localNumber && !union.publicName && ` ${union.localNumber}`}
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility Widget */}
      <AccessibilityWidget enabled={accessibilityWidgetEnabled} />
    </div>
  );
}
