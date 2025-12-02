import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users } from '@/lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, recipientFilter, customRecipientIds } = await request.json();

    if (!unionId || !recipientFilter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the requesting user is an owner or admin of the union
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || (requestingMember.role !== 'owner' && requestingMember.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can send mass emails' },
        { status: 403 }
      );
    }

    // Build query conditions based on filter
    let conditions = [eq(members.unionId, unionId)];

    if (recipientFilter === 'custom' && customRecipientIds && customRecipientIds.length > 0) {
      conditions.push(inArray(members.id, customRecipientIds));
    } else if (recipientFilter === 'approved') {
      conditions.push(eq(members.status, 'approved'));
    } else if (recipientFilter === 'admin') {
      conditions.push(eq(members.role, 'admin'));
    } else if (recipientFilter === 'pending') {
      conditions.push(eq(members.status, 'pending'));
    } else if (recipientFilter === 'rejected') {
      conditions.push(eq(members.status, 'rejected'));
    }
    // 'all' filter means no additional conditions

    // Get recipients
    const recipients = await db
      .select({
        memberId: members.id,
        memberRole: members.role,
        memberStatus: members.status,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(members)
      .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      recipients: recipients,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
