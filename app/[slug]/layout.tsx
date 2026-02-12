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
    <UnionTabProvider slug={slug}>
      {children}
    </UnionTabProvider>
  );
}
