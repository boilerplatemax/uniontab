'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/lib/db/schema';

interface AnnouncementBannerProps {
  announcement: Announcement | null;
  onDismiss: (announcementId: number) => void;
}

export function AnnouncementBanner({ announcement, onDismiss }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (announcement) {
      // Check if user has dismissed this banner in localStorage
      const dismissedBanners = JSON.parse(
        localStorage.getItem('dismissedBanners') || '[]'
      );
      if (!dismissedBanners.includes(announcement.id)) {
        setVisible(true);
      }
    }
  }, [announcement]);

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
  };

  if (!announcement || !visible) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div
            className="flex-1 text-sm sm:text-base"
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
