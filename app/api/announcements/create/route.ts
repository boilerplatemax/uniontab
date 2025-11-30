import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { announcements, members, announcementAttachments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface AnnouncementAttachment {
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

    const { unionId, type, title, content, imageUrl, isPrivate, attachments } = await request.json();

    if (!unionId || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'popup' && type !== 'banner') {
      return NextResponse.json(
        { error: 'Invalid announcement type. Must be "popup" or "banner"' },
        { status: 400 }
      );
    }

    // Validate banner content length (300 chars)
    if (type === 'banner' && content.length > 300) {
      return NextResponse.json(
        { error: 'Banner content must be 300 characters or less' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can create announcements' },
        { status: 403 }
      );
    }

    // Create the announcement
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        unionId,
        type,
        title: title || null,
        content,
        imageUrl: imageUrl || null,
        isPrivate: isPrivate || false,
        isActive: true,
        createdBy: user.id,
      })
      .returning();

    // Create announcement attachments if any (only for popups)
    if (type === 'popup' && attachments && Array.isArray(attachments) && attachments.length > 0) {
      await db.insert(announcementAttachments).values(
        attachments.map((attachment: AnnouncementAttachment) => ({
          announcementId: newAnnouncement.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
        }))
      );
    }

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
