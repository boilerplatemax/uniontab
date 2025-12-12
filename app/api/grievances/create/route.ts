import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members, grievanceAttachments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface GrievanceAttachment {
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

    const {
      unionId,
      title,
      description,
      category,
      priority,
      status,
      attachments
    } = await request.json();

    if (!unionId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member to create a grievance' },
        { status: 403 }
      );
    }

    // Create the grievance
    const [newGrievance] = await db
      .insert(grievances)
      .values({
        unionId,
        memberId: membership.id,
        title,
        description,
        category: category || null,
        priority: priority || 'medium',
        status: status || 'draft',
        createdBy: user.id,
      })
      .returning();

    // Create grievance attachments if any
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      await db.insert(grievanceAttachments).values(
        attachments.map((attachment: GrievanceAttachment) => ({
          grievanceId: newGrievance.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          uploadedBy: user.id,
        }))
      );
    }

    return NextResponse.json({ success: true, grievance: newGrievance });
  } catch (error) {
    console.error('Error creating grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
