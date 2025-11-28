import { redirect } from 'next/navigation';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { MemberProfile } from './member-profile';

export default async function ProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  const userWithUnion = await getUserWithTeam(user.id);

  return <MemberProfile slug={slug} user={user} userWithUnion={userWithUnion} />;
}
