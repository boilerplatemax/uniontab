import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { ElectionResultsPage } from './results-content';

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ slug: string; electionSlug: string }>;
}) {
  const { slug, electionSlug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(
      `/${slug}/sign-in?redirect=/${slug}/elections/${electionSlug}/results`
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Suspense fallback={<div>Loading results...</div>}>
        <ElectionResultsPage slug={slug} electionSlug={electionSlug} />
      </Suspense>
    </div>
  );
}
