import { UnionPageContent } from '../union-page-content';

export default async function FilesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <UnionPageContent slug={slug} />;
}
