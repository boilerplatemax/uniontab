import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      unionId,
      name,
      phone,
      employer,
      jobTitle,
      worksite,
      employmentStatus,
      address,
      dateOfBirth,
      memberId,
      localChapter,
      bargainingUnit,
      startDateWithEmployer,
    } = body;

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Update user name in users table
    if (name) {
      await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
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
        memberId: memberId || null,
        localChapter: localChapter || null,
        bargainingUnit: bargainingUnit || null,
        startDateWithEmployer: startDateWithEmployer ? new Date(startDateWithEmployer) : null,
      })
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
