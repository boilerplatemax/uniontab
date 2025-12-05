'use client';

import { useEffect, useState } from 'react';

export function NavbarSpacer() {
  const [announcementOffset, setAnnouncementOffset] = useState('0rem');

  useEffect(() => {
    // Initialize from CSS variable
    const updateOffset = () => {
      const offset = getComputedStyle(document.documentElement)
        .getPropertyValue('--announcement-offset')
        .trim() || '0rem';
      setAnnouncementOffset(offset);
    };

    updateOffset();

    // Watch for changes to the CSS variable
    const observer = new MutationObserver(updateOffset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  const topOffset = announcementOffset === '3rem' ? 'h-[104px]' : 'h-14';

  return <div className={topOffset} />;
}
