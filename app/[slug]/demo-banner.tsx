'use client';

import { Eye } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="w-full bg-amber-500 text-gray-900 py-1.5 px-4 z-40">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          <strong>Demo View</strong> — You are browsing a read-only demo site. Posts, edits, and deletions are disabled.
        </span>
      </div>
    </div>
  );
}
