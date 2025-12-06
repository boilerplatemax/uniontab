import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      memberId,
      unionId,
      name,
      phone,
      employer,
      jobTitle,
      worksite,
      employmentStatus,
      address,
      dateOfBirth,
      memberIdNumber,
      membershipStatus,
      localChapter,
      bargainingUnit,
      startDateWithEmployer,
      notes,
    } = body;

    if (!memberId || !unionId) {
      return NextResponse.json(
        { error: 'Member ID and Union ID are required' },
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
        { error: 'You do not have permission to edit members' },
        { status: 403 }
      );
    }

    // Get the member to update
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent editing owners unless you are also an owner
    if (memberToUpdate.role === 'owner' && userMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can edit other owners' },
        { status: 403 }
      );
    }

    // Update user name in users table if provided
    if (name) {
      await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, memberToUpdate.userId));
    }

    // Update member profile in members table
    await db
      .update(members)
      .set({
        phone: phone || null,
        employer: employer || null,
        jobTitle: jobTitle || null,
        worksite: worksite || null,
        employmentStatus: employmentStatus || null,
        address: address || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        memberId: memberIdNumber || null,
        membershipStatus: membershipStatus || null,
        localChapter: localChapter || null,
        bargainingUnit: bargainingUnit || null,
        startDateWithEmployer: startDateWithEmployer ? new Date(startDateWithEmployer) : null,
        notes: notes !== undefined ? notes : memberToUpdate.notes,
      })
      .where(eq(members.id, memberId));

    return NextResponse.json({
      success: true,
      message: 'Member profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { error: 'Failed to update member profile' },
      { status: 500 }
    );
  }
}
