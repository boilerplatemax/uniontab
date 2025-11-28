import { redirect } from 'next/navigation';
import { getUser, getUserMembership, isUserOwner } from '@/lib/db/queries';

export async function DashboardAuthWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Redirect to home if not logged in
  if (!user) {
    redirect('/sign-in');
  }

  // Check if user is an owner
  const isOwner = await isUserOwner();
  const membership = await getUserMembership();

  // Redirect to union profile if not an owner
  if (!isOwner && membership?.union.slug) {
    redirect(`/${membership.union.slug}/profile`);
  }

  // Redirect to sign-in if no membership found
  if (!membership) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
