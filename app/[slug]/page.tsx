import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UnionPageContent } from './union-page-content';

export default async function PublicUnionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if the union has a custom home page set
  const [union] = await db
    .select({ homePage: unions.homePage })
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  const homePage = union?.homePage || 'news';

  // If the home page is a custom page (format: "page:<slug>"), redirect to it
  if (homePage.startsWith('page:')) {
    const pageSlug = homePage.slice(5);
    redirect(`/${slug}/p/${pageSlug}`);
  }

  // If the home page is a built-in tab other than news, redirect to that tab
  if (homePage !== 'news') {
    redirect(`/${slug}/${homePage}`);
  }

  // Default: show the news/posts tab
  return <UnionPageContent slug={slug} />;
}
