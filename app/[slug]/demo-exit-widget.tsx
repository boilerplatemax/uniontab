'use client';

import { ExternalLink, LogOut } from 'lucide-react';
import Link from 'next/link';

interface DemoExitWidgetProps {
  handleSignOut: () => Promise<void>;
}

export function DemoExitWidget({ handleSignOut }: DemoExitWidgetProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900/80 text-white text-xs rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm">
      <Link
        href="https://www.uniontab.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-amber-400 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        UnionTab.com
      </Link>
      <span className="opacity-30">|</span>
      <form action={handleSignOut}>
        <button
          type="submit"
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          Exit Demo
        </button>
      </form>
    </div>
  );
}
