import { Suspense } from 'react';
import { UnionTabProvider } from './union-tab-context';
import { getNavbarData } from './get-navbar-data';
import { UnionNavbar } from './union-navbar';
import { NavbarSpacer } from './navbar-spacer';
import { AnnouncementClient } from './announcement-client';
import { DemoBanner } from './demo-banner';
import { DemoExitWidget } from './demo-exit-widget';

export default async function UnionSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getNavbarData(slug);

  // If no valid/published union, just render children (404 handled by page.tsx)
  if (!data) {
    return <>{children}</>;
  }

  const isDemo = data.union.isDemo ?? false;

  return (
    <Suspense>
      <UnionTabProvider slug={slug} isDemo={isDemo}>
        {isDemo && data.membership && (
          <>
            <DemoBanner />
            <DemoExitWidget handleSignOut={data.handleSignOut} />
          </>
        )}
        <AnnouncementClient
          popup={data.activeAnnouncements.popup}
          banner={data.activeAnnouncements.banner}
          themeColor={data.union.themeColor}
        />
        <UnionNavbar
          slug={slug}
          unionName={data.union.publicName || data.union.name}
          localNumber={data.union.publicName ? null : data.union.localNumber}
          membership={data.membership}
          handleSignOut={data.handleSignOut}
          pendingMembersCount={data.pendingMembersCount}
          announcementId={data.activeAnnouncements.banner?.id}
          grievanceNotificationCount={data.grievanceNotificationCount}
          strikeNotificationCount={data.strikeNotificationCount}
          contactEmail={data.union.email}
          isApprovedMember={data.isApprovedMember}
          navigationItems={data.navItems}
          hasGalleryImages={data.hasGalleryImages}
          hasPublicFiles={data.hasPublicFiles}
          isDemo={isDemo && !!data.membership}
        />
        <NavbarSpacer announcementId={data.activeAnnouncements.banner?.id} isDemo={isDemo && !!data.membership} />
        {children}
      </UnionTabProvider>
    </Suspense>
  );
}
