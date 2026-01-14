import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendMembershipApprovalEmail, sendMembershipRejectionEmail } from '@/lib/email/sendgrid';
import { checkMemberLimit } from '@/lib/membership/limits';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, action } = await request.json();

    if (!memberId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'approved' && action !== 'rejected') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
        { error: 'Only union owners can approve members' },
        { status: 403 }
      );
    }

    // Get the member's user information and union details
    const [memberUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, memberToUpdate.userId))
      .limit(1);

    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, memberToUpdate.unionId))
      .limit(1);

    if (!memberUser || !union) {
      return NextResponse.json(
        { error: 'Member or union information not found' },
        { status: 404 }
      );
    }

    // Check member limit if approving (and member is not already approved)
    if (action === 'approved' && memberToUpdate.status !== 'approved') {
      const limitCheck = await checkMemberLimit(memberToUpdate.unionId, 1);

      if (!limitCheck.canApprove) {
        return NextResponse.json(
          {
            error: 'Union membership limit reached',
            details: {
              message: `Your union has reached its membership limit of ${limitCheck.limit} approved members. Please upgrade your plan to approve more members.`,
              limit: limitCheck.limit,
              current: limitCheck.current,
              tierName: limitCheck.tierName,
            }
          },
          { status: 403 }
        );
      }
    }

    // Update the member status
    await db
      .update(members)
      .set({ status: action })
      .where(eq(members.id, memberId));

    // Send email notification
    try {
      if (action === 'approved') {
        await sendMembershipApprovalEmail(
          memberUser.email,
          memberUser.name || 'Member',
          { name: union.name, localNumber: union.localNumber, slug: union.slug }
        );
      } else if (action === 'rejected') {
        await sendMembershipRejectionEmail(
          memberUser.email,
          memberUser.name || 'Member',
          { name: union.name, localNumber: union.localNumber }
        );
      }
    } catch (emailError) {
      console.error('Failed to send membership decision email:', emailError);
      // Don't fail the approval if email fails, but log it
    }

    return NextResponse.json({ success: true, status: action });
  } catch (error) {
    console.error('Error approving member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
