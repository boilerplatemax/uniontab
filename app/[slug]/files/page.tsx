import { redirect } from 'next/navigation';

export default async function FilesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}?tab=files`);
}
