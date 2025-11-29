import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { UnionNavbar } from '../../union-navbar';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { LikeButton } from '@/components/posts/like-button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getPost(postId: number) {
  const [post] = await db
    .select({
      id: posts.id,
      unionId: posts.unionId,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      isPrivate: posts.isPrivate,
      isPinned: posts.isPinned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.createdBy, users.id))
    .where(eq(posts.id, postId))
    .limit(1);

  return post;
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return membership;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) {
    notFound();
  }

  const post = await getPost(postId);
  if (!post || post.unionId !== union.id) {
    notFound();
  }

  // Check if post is private and user has access
  if (post.isPrivate) {
    const membership = await checkMembership(union.id);
    if (!membership) {
      redirect(`/login?redirect=/${slug}/post/${id}`);
    }
  }

  const membership = await checkMembership(union.id);
  const currentUser = await getUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/${slug}?tab=posts`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {union.publicName || union.name}
        </Link>

        <Card className="shadow-sm">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full rounded-lg mb-6 max-h-96 object-cover"
              />
            )}

            <RichTextContent content={post.content} className="mb-6" />

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <LikeButton
                  postId={post.id}
                  initialLiked={false}
                  initialCount={0}
                  userId={currentUser?.id || null}
                />
                <div className="text-sm text-gray-500">
                  Posted by {post.createdBy.name} •{' '}
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
