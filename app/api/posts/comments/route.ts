import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { posts, postComments, users, members, unions } from '@/lib/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or less'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = parseInt(searchParams.get('postId') || '0');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get the post to verify it exists and get unionId
    const [post] = await db
      .select({
        id: posts.id,
        unionId: posts.unionId,
        isPrivate: posts.isPrivate,
        commentsEnabled: posts.commentsEnabled,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check union-level comments setting
    const [union] = await db
      .select({ commentsEnabled: unions.commentsEnabled })
      .from(unions)
      .where(eq(unions.id, post.unionId))
      .limit(1);

    if (!union?.commentsEnabled || !post.commentsEnabled) {
      return NextResponse.json({ comments: [], commentsDisabled: true });
    }

    // If post is private, check membership
    if (post.isPrivate) {
      const user = await getUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      const [membership] = await db
        .select({ status: members.status, role: members.role })
        .from(members)
        .where(
          and(eq(members.unionId, post.unionId), eq(members.userId, user.id))
        )
        .limit(1);

      const isApproved =
        membership?.status === 'approved' || membership?.role === 'owner';
      if (!isApproved) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Fetch comments with user info
    const comments = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        isEdited: postComments.isEdited,
        deletedAt: postComments.deletedAt,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));

    // Get profile photos for commenters (scoped to the post's union)
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const memberPhotos: Record<number, string | null> = {};

    if (userIds.length > 0) {
      const memberRecords = await db
        .select({
          userId: members.userId,
          profilePhotoUrl: members.profilePhotoUrl,
        })
        .from(members)
        .where(
          and(
            eq(members.unionId, post.unionId),
            sql`${members.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`
          )
        );

      for (const m of memberRecords) {
        memberPhotos[m.userId] = m.profilePhotoUrl;
      }
    }

    // Format response — hide content for soft-deleted comments
    const formattedComments = comments.map((comment) => {
      if (comment.deletedAt) {
        return {
          id: comment.id,
          postId: comment.postId,
          deletedAt: comment.deletedAt,
          createdAt: comment.createdAt,
          isDeleted: true,
        };
      }
      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isDeleted: false,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          profilePhotoUrl: memberPhotos[comment.userId] || null,
        },
      };
    });

    return NextResponse.json({
      comments: formattedComments,
      commentsDisabled: false,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { postId, content } = parsed.data;

    // Get the post
    const [post] = await db
      .select({
        id: posts.id,
        unionId: posts.unionId,
        commentsEnabled: posts.commentsEnabled,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check union
    const [union] = await db
      .select({ commentsEnabled: unions.commentsEnabled, isDemo: unions.isDemo })
      .from(unions)
      .where(eq(unions.id, post.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json(
        { error: 'Mutations are disabled in demo mode' },
        { status: 403 }
      );
    }

    if (!union?.commentsEnabled || !post.commentsEnabled) {
      return NextResponse.json(
        { error: 'Comments are disabled' },
        { status: 403 }
      );
    }

    // Check membership — must be approved member
    const [membership] = await db
      .select({
        id: members.id,
        status: members.status,
        role: members.role,
        profilePhotoUrl: members.profilePhotoUrl,
      })
      .from(members)
      .where(
        and(eq(members.unionId, post.unionId), eq(members.userId, user.id))
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to comment' },
        { status: 403 }
      );
    }

    const isApproved =
      membership.status === 'approved' || membership.role === 'owner';
    if (!isApproved) {
      return NextResponse.json(
        { error: 'Your membership must be approved to comment' },
        { status: 403 }
      );
    }

    // Insert comment
    const [newComment] = await db
      .insert(postComments)
      .values({
        postId,
        userId: user.id,
        content,
      })
      .returning();

    return NextResponse.json({
      comment: {
        id: newComment.id,
        postId: newComment.postId,
        userId: newComment.userId,
        content: newComment.content,
        isEdited: newComment.isEdited,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
        isDeleted: false,
        user: {
          id: user.id,
          name: user.name,
          profilePhotoUrl: membership.profilePhotoUrl,
        },
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
