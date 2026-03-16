import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { ElectionCommitteeContent } from './election-committee-content';

export default async function ElectionCommitteePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in?redirect=/${slug}/election-committee`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ElectionCommitteeContent slug={slug} />
      </Suspense>
    </div>
  );
}
