import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { ElectionCommitteeElectionContent } from './election-committee-election-content';
import { Loader2 } from 'lucide-react';

export default async function ElectionCommitteeElectionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in?redirect=/${slug}/election-committee/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <ElectionCommitteeElectionContent slug={slug} electionId={Number(id)} />
      </Suspense>
    </div>
  );
}
