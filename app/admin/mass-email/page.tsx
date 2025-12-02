import { getUser, getUserMembership } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import MassEmailClient from './mass-email-client';

export default async function MassEmailPage() {
  const user = await getUser();

  // Check if user is authenticated and is a webmaster (admin)
  if (!user || user.role !== 'webmaster') {
    redirect('/sign-in');
  }

  return <MassEmailClient />;
}
