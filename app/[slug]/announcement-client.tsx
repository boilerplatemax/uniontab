'use client';

import { AnnouncementBanner } from '@/components/announcements/announcement-banner';
import { AnnouncementPopup } from '@/components/announcements/announcement-popup';
import type { Announcement, AnnouncementAttachment } from '@/lib/db/schema';

interface AnnouncementWithAttachments extends Announcement {
  attachments: AnnouncementAttachment[];
}

interface AnnouncementClientProps {
  popup: AnnouncementWithAttachments | null;
  banner: Announcement | null;
}

export function AnnouncementClient({ popup, banner }: AnnouncementClientProps) {
  const handleDismiss = async (announcementId: number) => {
    try {
      await fetch('/api/announcements/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      });
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  return (
    <>
      <AnnouncementBanner announcement={banner} onDismiss={handleDismiss} />
      <AnnouncementPopup announcement={popup} onDismiss={handleDismiss} />
    </>
  );
}
