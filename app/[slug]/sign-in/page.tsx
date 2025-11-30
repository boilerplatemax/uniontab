import { Suspense } from 'react';
import { UnionMemberSignIn } from './union-member-signin';
import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

export default async function UnionSignInPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  return (
    <Suspense>
      <UnionMemberSignIn params={params} union={union} />
    </Suspense>
  );
}
