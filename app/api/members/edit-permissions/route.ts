import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, type AdminPermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, permissions } = await request.json();

    if (!memberId || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the member to check union ownership
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Only allow editing permissions for admins (not owners or regular members)
    if (memberToUpdate.role !== 'admin') {
      return NextResponse.json(
        { error: 'Can only edit permissions for admins' },
        { status: 400 }
      );
    }

    // Check if the requesting user is an owner of the union
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, memberToUpdate.unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can modify admin permissions' },
        { status: 403 }
      );
    }

    // Update the admin permissions
    await db
      .update(members)
      .set({ adminPermissions: permissions as AdminPermissions })
      .where(eq(members.id, memberId));

    return NextResponse.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
