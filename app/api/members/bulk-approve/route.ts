import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, unions } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendMembershipApprovalEmail, sendMembershipRejectionEmail } from '@/lib/email/sendgrid';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberIds, status } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid member IDs' },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'pending', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, pending, or rejected' },
        { status: 400 }
      );
    }

    // Get all members to update
    const membersToUpdate = await db
      .select()
      .from(members)
      .where(inArray(members.id, memberIds));

    if (membersToUpdate.length === 0) {
      return NextResponse.json({ error: 'No members found' }, { status: 404 });
    }

    // Prevent updating owners
    const ownerMembers = membersToUpdate.filter(m => m.role === 'owner');
    if (ownerMembers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot update union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const unionId = membersToUpdate[0].unionId;
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

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can update member status' },
        { status: 403 }
      );
    }

    // Get union details for email
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    // Update all members at once
    await db
      .update(members)
      .set({ status })
      .where(inArray(members.id, memberIds));

    // Send email notifications to all updated members
    const emailPromises = membersToUpdate.map(async (member) => {
      try {
        // Get user information
        const [memberUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);

        if (!memberUser) {
          console.error(`User not found for member ID ${member.id}`);
          return;
        }

        if (status === 'approved') {
          await sendMembershipApprovalEmail(
            memberUser.email,
            memberUser.name || 'Member',
            { name: union.name, localNumber: union.localNumber, slug: union.slug }
          );
        } else if (status === 'rejected') {
          await sendMembershipRejectionEmail(
            memberUser.email,
            memberUser.name || 'Member',
            { name: union.name, localNumber: union.localNumber }
          );
        }
      } catch (emailError) {
        console.error(`Failed to send email for member ID ${member.id}:`, emailError);
        // Don't fail the entire operation if individual emails fail
      }
    });

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      updatedCount: membersToUpdate.length,
      status
    });
  } catch (error) {
    console.error('Error bulk updating members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
