import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { posts, members, postAttachments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface PostAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, title, content, imageUrl, isPrivate, authorType, attachments } = await request.json();

    if (!unionId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can create posts' },
        { status: 403 }
      );
    }

    // Create the post
    const [newPost] = await db
      .insert(posts)
      .values({
        unionId,
        title,
        content,
        imageUrl: imageUrl || null,
        isPrivate: isPrivate || false,
        authorType: authorType || 'union',
        createdBy: user.id,
      })
      .returning();

    // Create post attachments if any
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      await db.insert(postAttachments).values(
        attachments.map((attachment: PostAttachment) => ({
          postId: newPost.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
        }))
      );
    }

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
