import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, unions, massEmails, emailLogs } from '@/lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendMassEmail } from '@/lib/email/sendgrid';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      unionId,
      subject,
      htmlContent,
      textContent,
      recipientFilter,
      customRecipientIds,
      attachments,
    } = await request.json();

    if (!unionId || !subject || !htmlContent || !textContent || !recipientFilter) {
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

    // Get union details for branding
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
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
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(members)
      .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
      .where(and(...conditions));

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found matching the criteria' },
        { status: 400 }
      );
    }

    // Create mass email record
    const [massEmailRecord] = await db
      .insert(massEmails)
      .values({
        unionId,
        subject,
        htmlContent,
        textContent,
        recipientFilter,
        customRecipientIds: recipientFilter === 'custom' ? customRecipientIds : null,
        attachments: attachments || null,
        status: 'sending',
        totalRecipients: recipients.length,
        successCount: 0,
        failureCount: 0,
        createdBy: user.id,
      })
      .returning();

    // Send emails to all recipients
    let successCount = 0;
    let failureCount = 0;

    const unionInfo = {
      name: union.name,
      localNumber: union.localNumber,
      logoUrl: union.logoUrl,
    };

    for (const recipient of recipients) {
      try {
        await sendMassEmail({
          to: recipient.userEmail,
          subject,
          htmlContent,
          textContent,
          unionInfo,
          attachments: attachments || undefined,
        });

        // Log successful send
        await db.insert(emailLogs).values({
          massEmailId: massEmailRecord.id,
          memberId: recipient.memberId,
          email: recipient.userEmail,
          status: 'sent',
        });

        successCount++;
      } catch (error: any) {
        console.error(`Failed to send email to ${recipient.userEmail}:`, error);

        // Log failed send
        await db.insert(emailLogs).values({
          massEmailId: massEmailRecord.id,
          memberId: recipient.memberId,
          email: recipient.userEmail,
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
        });

        failureCount++;
      }
    }

    // Update mass email record with results
    await db
      .update(massEmails)
      .set({
        status: failureCount === recipients.length ? 'failed' : 'sent',
        successCount,
        failureCount,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(massEmails.id, massEmailRecord.id));

    return NextResponse.json({
      success: true,
      massEmailId: massEmailRecord.id,
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      status: failureCount === recipients.length ? 'failed' : 'sent',
    });
  } catch (error) {
    console.error('Error sending mass email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
