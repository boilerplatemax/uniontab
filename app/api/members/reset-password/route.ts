import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hashPassword } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, unionId, newPassword } = await request.json();

    if (!memberId || !unionId || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify the requesting user is an admin or owner of the union
    const [requesterMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, currentUser.id),
          eq(members.unionId, unionId),
          eq(members.status, 'approved')
        )
      )
      .limit(1);

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      return NextResponse.json({ error: 'Forbidden: admin or owner access required' }, { status: 403 });
    }

    // Get the target member
    const [targetMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, memberId),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Owners can reset any member's password; admins cannot reset an owner's password
    if (requesterMembership.role === 'admin' && targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Admins cannot reset an owner\'s password' }, { status: 403 });
    }

    // Hash and update the password
    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, targetMember.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
