'use client';

import { useState, useEffect } from 'react';

export function useAnnouncementVisibility(announcementId: number | null | undefined): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!announcementId) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed this announcement in localStorage
    const dismissedBanners = JSON.parse(
      localStorage.getItem('dismissedBanners') || '[]'
    );
    setIsVisible(!dismissedBanners.includes(announcementId));

    // Listen for storage changes (when banner is dismissed)
    const handleStorageChange = () => {
      const dismissedBanners = JSON.parse(
        localStorage.getItem('dismissedBanners') || '[]'
      );
      setIsVisible(!dismissedBanners.includes(announcementId));
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-window updates
    window.addEventListener('announcementDismissed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('announcementDismissed', handleStorageChange);
    };
  }, [announcementId]);

  return isVisible;
}
