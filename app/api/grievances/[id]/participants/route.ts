import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members, grievanceParticipants, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/grievances/[id]/participants - list all participants
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const grievanceId = parseInt(id);
    if (!grievanceId) {
      return NextResponse.json({ error: 'Invalid grievance ID' }, { status: 400 });
    }

    // Get grievance to know unionId
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }

    // Caller must be a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, grievance.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this union' }, { status: 403 });
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    // Only admins/owners or the grievance creator or a participant can view participants
    const isCreator = grievance.memberId === membership.id;
    if (!isOwnerOrAdmin && !isCreator) {
      const [participation] = await db
        .select()
        .from(grievanceParticipants)
        .where(and(
          eq(grievanceParticipants.grievanceId, grievanceId),
          eq(grievanceParticipants.memberId, membership.id)
        ))
        .limit(1);
      if (!participation) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch participants with member and user details
    const participants = await db
      .select({
        id: grievanceParticipants.id,
        memberId: grievanceParticipants.memberId,
        createdAt: grievanceParticipants.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(grievanceParticipants)
      .innerJoin(members, eq(grievanceParticipants.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(grievanceParticipants.grievanceId, grievanceId));

    return NextResponse.json({ success: true, participants });
  } catch (error) {
    console.error('Error fetching grievance participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/grievances/[id]/participants - add a participant (admin/owner only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const grievanceId = parseInt(id);
    if (!grievanceId) {
      return NextResponse.json({ error: 'Invalid grievance ID' }, { status: 400 });
    }

    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    // Get grievance
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }

    // Caller must be admin/owner
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, grievance.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only admins and owners can add grievance participants' },
        { status: 403 }
      );
    }

    // Ensure the target member belongs to the same union and is approved
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.unionId, grievance.unionId),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found or not an approved member of this union' },
        { status: 404 }
      );
    }

    // Don't add the grievance filer as a participant (they already have access)
    if (targetMember.id === grievance.memberId) {
      return NextResponse.json(
        { error: 'The grievance filer is already associated with this grievance' },
        { status: 400 }
      );
    }

    // Insert participant (unique constraint handles duplicates)
    const [participant] = await db
      .insert(grievanceParticipants)
      .values({
        grievanceId,
        memberId,
        addedBy: user.id,
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error('Error adding grievance participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/grievances/[id]/participants?participantId=X - remove a participant (admin/owner only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const grievanceId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const participantId = parseInt(searchParams.get('participantId') || '0');

    if (!grievanceId || !participantId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get grievance
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }

    // Caller must be admin/owner
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, grievance.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only admins and owners can remove grievance participants' },
        { status: 403 }
      );
    }

    await db
      .delete(grievanceParticipants)
      .where(and(
        eq(grievanceParticipants.id, participantId),
        eq(grievanceParticipants.grievanceId, grievanceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing grievance participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
