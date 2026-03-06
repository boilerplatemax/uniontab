'use client';

import { useAnnouncementVisibility } from '@/hooks/use-announcement-visibility';

interface NavbarSpacerProps {
  announcementId?: number | null;
  isDemo?: boolean;
}

export function NavbarSpacer({ announcementId, isDemo = false }: NavbarSpacerProps) {
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);

  return (
    <>
      {/* Spacing for demo banner */}
      {isDemo && <div className="h-9" />}
      {/* Spacing for fixed navbar */}
      <div className="h-14" />
      {/* Additional spacing for announcement banner */}
      {hasVisibleAnnouncement && <div className="h-12" />}
    </>
  );
}
