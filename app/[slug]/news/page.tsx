import { redirect } from 'next/navigation';

export default async function NewsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Redirect to the base slug URL which shows news (posts) by default
  redirect(`/${slug}`);
}
