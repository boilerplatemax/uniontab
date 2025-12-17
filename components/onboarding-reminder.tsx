'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import { calculateOnboardingProgress, type OnboardingProgress } from '@/lib/utils/onboarding-progress';
import type { Union } from '@/lib/db/schema';

interface OnboardingReminderProps {
  union: Pick<Union, 'slug' | 'logoUrl' | 'coverPhotoUrl' | 'email' | 'phone' | 'address' | 'website' | 'description' | 'about'>;
  isOwner: boolean;
}

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
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-900 font-medium">
                Profile {progress.percentage}% complete
              </p>
              <p className="text-sm text-blue-700 mt-0.5">
                Missing: {progress.missingItems.map(item => item.label).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/${union.slug}/settings`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Complete Setup
              <ArrowRight className="h-4 w-4" />
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
