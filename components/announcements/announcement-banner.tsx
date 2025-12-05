'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/lib/db/schema';

interface AnnouncementBannerProps {
  announcement: Announcement | null;
  onDismiss: (announcementId: number) => void;
  onVisibilityChange?: (visible: boolean) => void;
}

export function AnnouncementBanner({ announcement, onDismiss, onVisibilityChange }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (announcement) {
      // Check if user has dismissed this banner in localStorage
      const dismissedBanners = JSON.parse(
        localStorage.getItem('dismissedBanners') || '[]'
      );
      const isVisible = !dismissedBanners.includes(announcement.id);
      setVisible(isVisible);
      onVisibilityChange?.(isVisible);
    } else {
      setVisible(false);
      onVisibilityChange?.(false);
    }
  }, [announcement, onVisibilityChange]);

  const handleDismiss = () => {
    if (!announcement) return;

    // Store dismissal in localStorage
    const dismissedBanners = JSON.parse(
      localStorage.getItem('dismissedBanners') || '[]'
    );
    dismissedBanners.push(announcement.id);
    localStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners));

    // Call API to track dismissal
    onDismiss(announcement.id);
    setVisible(false);
    onVisibilityChange?.(false);
  };

  if (!announcement || !visible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white shadow-sm z-[60]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-12">
          <div
            className="flex-1 text-sm"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:bg-blue-700 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
