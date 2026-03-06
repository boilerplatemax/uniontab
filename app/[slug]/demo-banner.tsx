'use client';

import { Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DemoBannerProps {
  handleSignOut: () => Promise<void>;
}

export function DemoBanner({ handleSignOut }: DemoBannerProps) {
  return (
    <div className="w-full bg-amber-500 text-gray-900 py-2 px-4 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>
            <strong>Demo View</strong> — You are browsing a read-only demo site. All admin tools are visible but actions are disabled.
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="https://www.uniontab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline underline-offset-2 hover:opacity-75 font-medium"
          >
            Back to UnionTab.com
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <span className="opacity-40">|</span>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="underline underline-offset-2 hover:opacity-75 font-medium"
            >
              Exit Demo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
