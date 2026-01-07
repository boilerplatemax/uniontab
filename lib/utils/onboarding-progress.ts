import type { Union } from '@/lib/db/schema';

export interface OnboardingItem {
  key: string;
  label: string;
  complete: boolean;
  settingsSection?: string;
}

export interface OnboardingProgress {
  percentage: number;
  completedCount: number;
  totalCount: number;
  items: OnboardingItem[];
  missingItems: OnboardingItem[];
  isComplete: boolean;
}

/**
 * Calculate the onboarding completion progress for a union.
 * This checks which profile fields have been filled in.
 */
export function calculateOnboardingProgress(union: Pick<Union, 'logoUrl' | 'coverPhotoUrl' | 'email' | 'phone' | 'address' | 'website' | 'description' | 'about'>): OnboardingProgress {
  const items: OnboardingItem[] = [
    {
      key: 'logo',
      label: 'Logo',
      complete: Boolean(union.logoUrl),
      settingsSection: 'Branding',
    },
    {
      key: 'contact',
      label: 'Contact Info',
      complete: Boolean(union.email || union.phone || union.address || union.website),
      settingsSection: 'Contact Information',
    },
    {
      key: 'about',
      label: 'About Section',
      complete: Boolean(union.description || union.about),
      settingsSection: 'Basic Information',
    },
  ];

  const completedCount = items.filter(item => item.complete).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const missingItems = items.filter(item => !item.complete);

  return {
    percentage,
    completedCount,
    totalCount,
    items,
    missingItems,
    isComplete: completedCount === totalCount,
  };
}
