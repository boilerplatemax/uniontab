import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members, grievanceAttachments, grievanceParticipants, unions } from '@/lib/db/schema';
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
      attachments,
      grievorMemberIds,
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

    // Check union's grievance filing permission
    const [union] = await db
      .select({ grievanceFilingPermission: unions.grievanceFilingPermission })
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    if (union?.grievanceFilingPermission === 'admins_only' && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only admins and owners can file grievances for this union' },
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

    // Add grievors (participants) if provided by an admin/owner
    if (isOwnerOrAdmin && Array.isArray(grievorMemberIds) && grievorMemberIds.length > 0) {
      // Validate each memberId belongs to this union and is approved, and is not the grievance filer
      const validMembers = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.unionId, unionId), eq(members.status, 'approved')));
      const validMemberIdSet = new Set(validMembers.map((m) => m.id));

      const participantValues = grievorMemberIds
        .filter(
          (mid: number) =>
            validMemberIdSet.has(mid) && mid !== newGrievance.memberId
        )
        .map((mid: number) => ({
          grievanceId: newGrievance.id,
          memberId: mid,
          addedBy: user.id,
        }));

      if (participantValues.length > 0) {
        await db.insert(grievanceParticipants).values(participantValues).onConflictDoNothing();
      }
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
