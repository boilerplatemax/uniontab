'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/lib/db/schema';
import { getContrastColor, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

interface AnnouncementBannerProps {
  announcement: Announcement | null;
  onDismiss: (announcementId: number) => void;
  themeColor?: string | null;
}

export function AnnouncementBanner({ announcement, onDismiss, themeColor }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);
  const bgColor = themeColor || DEFAULT_THEME_COLOR;
  const textColor = getContrastColor(bgColor);

  useEffect(() => {
    if (announcement) {
      // Check if user has dismissed this banner in sessionStorage (resets on new session)
      const dismissedBanners = JSON.parse(
        sessionStorage.getItem('dismissedBanners') || '[]'
      );
      if (!dismissedBanners.includes(announcement.id)) {
        setVisible(true);
      }
    }
  }, [announcement]);

  const handleDismiss = () => {
    if (!announcement) return;

    // Store dismissal in sessionStorage (only for current session)
    const dismissedBanners = JSON.parse(
      sessionStorage.getItem('dismissedBanners') || '[]'
    );
    dismissedBanners.push(announcement.id);
    sessionStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners));

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('announcementDismissed'));

    // Call API to track dismissal
    onDismiss(announcement.id);
    setVisible(false);
  };

  if (!announcement || !visible) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 shadow-sm z-[60]"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-12">
          <div
            className="flex-1 text-sm"
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
            style={{ color: textColor }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
