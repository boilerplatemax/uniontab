import { getUserMembership } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import OnboardingClient from './onboarding-client';

export default async function OnboardingPage() {
  // Check if user is an owner
  const membership = await getUserMembership();

  if (!membership) {
    redirect('/sign-in');
  }

  // Only allow owners to access onboarding
  if (membership.member.role !== 'owner') {
    // Redirect non-owners to their union page
    redirect(`/${membership.union.slug}`);
  }

  return <OnboardingClient />;
}
