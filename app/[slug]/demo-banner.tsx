'use client';

import { Eye } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 h-9 bg-amber-500 text-gray-900 px-4 z-[55] flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          <strong>Demo View</strong> — You are browsing a read-only demo site. Posts, edits, and deletions are disabled.
        </span>
      </div>
    </div>
  );
}
