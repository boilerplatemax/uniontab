import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { ElectionVotePage } from './election-vote-content';

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ slug: string; electionSlug: string }>;
}) {
  const { slug, electionSlug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in?redirect=/${slug}/elections/${electionSlug}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={<div>Loading election...</div>}>
        <ElectionVotePage slug={slug} electionSlug={electionSlug} />
      </Suspense>
    </div>
  );
}
