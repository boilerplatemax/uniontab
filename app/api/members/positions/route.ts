import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, memberPositions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Create a new position
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, unionId, positionType, title, area, startDate, endDate, isCurrent, notes } = body;

    if (!memberId || !unionId || !positionType || !title) {
      return NextResponse.json(
        { error: 'Member ID, Union ID, position type, and title are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to add positions' },
        { status: 403 }
      );
    }

    // Create the position
    const [newPosition] = await db
      .insert(memberPositions)
      .values({
        memberId,
        unionId,
        positionType,
        title,
        area: area || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent ?? true,
        notes: notes || null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      position: newPosition,
    });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

// Update a position
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { positionId, unionId, positionType, title, area, startDate, endDate, isCurrent, notes } = body;

    if (!positionId || !unionId || !positionType || !title) {
      return NextResponse.json(
        { error: 'Position ID, Union ID, position type, and title are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit positions' },
        { status: 403 }
      );
    }

    // Update the position
    const [updatedPosition] = await db
      .update(memberPositions)
      .set({
        positionType,
        title,
        area: area || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent ?? true,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(memberPositions.id, positionId))
      .returning();

    return NextResponse.json({
      success: true,
      position: updatedPosition,
    });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

// Delete a position
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { positionId, unionId } = body;

    if (!positionId || !unionId) {
      return NextResponse.json(
        { error: 'Position ID and Union ID are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete positions' },
        { status: 403 }
      );
    }

    // Delete the position
    await db
      .delete(memberPositions)
      .where(eq(memberPositions.id, positionId));

    return NextResponse.json({
      success: true,
      message: 'Position deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}
