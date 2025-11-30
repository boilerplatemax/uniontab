import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { ElectionsContent } from './elections-content';

export default async function ElectionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading elections...</div>}>
        <ElectionsContent slug={slug} />
      </Suspense>
    </div>
  );
}
