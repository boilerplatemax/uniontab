import { Suspense } from 'react';
import { UnionTabProvider } from './union-tab-context';

export default async function UnionSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense>
      <UnionTabProvider slug={slug}>
        {children}
      </UnionTabProvider>
    </Suspense>
  );
}
