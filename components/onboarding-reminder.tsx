'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Image, Phone, FileText, CheckCircle2, Circle } from 'lucide-react';
import { calculateOnboardingProgress, type OnboardingProgress } from '@/lib/utils/onboarding-progress';
import type { Union } from '@/lib/db/schema';

interface OnboardingReminderProps {
  union: Pick<Union, 'slug' | 'logoUrl' | 'coverPhotoUrl' | 'email' | 'phone' | 'address' | 'website' | 'description' | 'about'>;
  isOwner: boolean;
}

const itemIcons: Record<string, React.ReactNode> = {
  logo: <Image className="h-3 w-3" />,
  contact: <Phone className="h-3 w-3" />,
  about: <FileText className="h-3 w-3" />,
};

export function OnboardingReminder({ union, isOwner }: OnboardingReminderProps) {
  const [dismissed, setDismissed] = useState(true); // Start dismissed to prevent flash
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);

  useEffect(() => {
    // Only show for owners
    if (!isOwner) return;

    // Calculate progress
    const calculatedProgress = calculateOnboardingProgress(union);
    setProgress(calculatedProgress);

    // Don't show if onboarding is complete
    if (calculatedProgress.isComplete) return;

    // Check if dismissed in this session
    const dismissKey = `onboarding-reminder-dismissed-${union.slug}`;
    const isDismissed = sessionStorage.getItem(dismissKey) === 'true';
    setDismissed(isDismissed);
  }, [union, isOwner]);

  const handleDismiss = () => {
    const dismissKey = `onboarding-reminder-dismissed-${union.slug}`;
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  // Don't render if not owner, dismissed, no progress data, or complete
  if (!isOwner || dismissed || !progress || progress.isComplete) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            {/* Progress ring */}
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <div className="relative w-9 h-9">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeDasharray={`${progress.percentage * 0.942} 94.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-blue-700">
                  {progress.percentage}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-900 font-semibold mb-1.5">
                Complete your profile — {progress.completedCount}/{progress.totalCount} done
              </p>
              {/* Field chips */}
              <div className="flex flex-wrap gap-1.5">
                {progress.items.map((item) => (
                  <Link
                    key={item.key}
                    href={`/${union.slug}/settings`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      item.complete
                        ? 'bg-blue-100 text-blue-500 line-through decoration-blue-400 cursor-default pointer-events-none'
                        : 'bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 hover:border-blue-400 shadow-sm'
                    }`}
                  >
                    {item.complete
                      ? <CheckCircle2 className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      : <Circle className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    }
                    {itemIcons[item.key] && (
                      <span className="flex-shrink-0">{itemIcons[item.key]}</span>
                    )}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/${union.slug}/settings`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
            >
              Go to Settings
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
              aria-label="Dismiss reminder"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
