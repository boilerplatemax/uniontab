import { redirect } from 'next/navigation';

export default async function ContactPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}?tab=contact`);
}
