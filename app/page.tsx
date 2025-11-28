import { redirect } from 'next/navigation';
import { getUserMembership } from '@/lib/db/queries';
import HomeContent from './home-content';

export default async function HomePage() {
  // Check if user has a union and redirect to their public page
  const membership = await getUserMembership();

  if (membership?.union.slug) {
    redirect(`/${membership.union.slug}`);
  }

  return <HomeContent />;
}
