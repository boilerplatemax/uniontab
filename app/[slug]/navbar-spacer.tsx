'use client';

import { useAnnouncementVisibility } from '@/hooks/use-announcement-visibility';

interface NavbarSpacerProps {
  announcementId?: number | null;
}

export function NavbarSpacer({ announcementId }: NavbarSpacerProps) {
  const hasVisibleAnnouncement = useAnnouncementVisibility(announcementId);

  return (
    <>
      {/* Spacing for fixed navbar */}
      <div className="h-14" />
      {/* Additional spacing for announcement banner */}
      {hasVisibleAnnouncement && <div className="h-12 transition-all duration-300" />}
    </>
  );
}
