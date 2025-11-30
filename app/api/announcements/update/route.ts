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

    const { announcementId, title, content, imageUrl, isPrivate, isActive, attachments } = await request.json();

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Missing announcement ID' },
        { status: 400 }
      );
    }

    // Get the announcement to check ownership
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Validate banner content length if content is being updated
    if (announcement.type === 'banner' && content && content.length > 300) {
      return NextResponse.json(
        { error: 'Banner content must be 300 characters or less' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, announcement.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can update announcements' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    if (title !== undefined) updateData.title = title || null;
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the announcement
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, announcementId))
      .returning();

    // Handle attachments update (only for popups)
    if (announcement.type === 'popup' && attachments !== undefined) {
      // Delete existing attachments
      await db
        .delete(announcementAttachments)
        .where(eq(announcementAttachments.announcementId, announcementId));

      // Insert new attachments
      if (Array.isArray(attachments) && attachments.length > 0) {
        await db.insert(announcementAttachments).values(
          attachments.map((attachment: AnnouncementAttachment) => ({
            announcementId: announcementId,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
          }))
        );
      }
    }

    return NextResponse.json({ success: true, announcement: updatedAnnouncement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
