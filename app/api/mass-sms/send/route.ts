import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, unions, massSMS, smsLogs } from '@/lib/db/schema';
import { eq, and, inArray, isNull, isNotNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendSMS, isTwilioConfigured, isValidPhoneNumber } from '@/lib/sms/twilio';
import { sendEmail } from '@/lib/email/sendgrid';
import { checkSMSLimit, incrementSMSUsage, SMS_CHARACTER_LIMIT } from '@/lib/sms/limits';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      unionId,
      message,
      recipientFilter,
      customRecipientIds,
    } = await request.json();

    if (!unionId || !message || !recipientFilter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > SMS_CHARACTER_LIMIT) {
      return NextResponse.json(
        { error: `Message exceeds ${SMS_CHARACTER_LIMIT} character limit` },
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
        { error: 'Only union owners and admins can send mass SMS' },
        { status: 403 }
      );
    }

    // Get union details
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      return NextResponse.json(
        { error: 'SMS service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Build query conditions based on filter
    let conditions = [
      eq(members.unionId, unionId),
      isNotNull(members.phone), // Only members with phone numbers
    ];

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

    // Get recipients with phone numbers
    const allRecipients = await db
      .select({
        memberId: members.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        phone: members.phone,
        allowTextMessages: members.allowTextMessages,
      })
      .from(members)
      .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
      .where(and(...conditions));

    // Filter out recipients with invalid phone numbers or who have opted out of text messages
    const validRecipients = allRecipients.filter(
      r => r.phone && isValidPhoneNumber(r.phone) && r.allowTextMessages !== false
    );

    if (validRecipients.length === 0) {
      const optedOutCount = allRecipients.filter(r => r.allowTextMessages === false).length;
      if (optedOutCount > 0 && allRecipients.length === optedOutCount) {
        return NextResponse.json(
          { error: 'All matching members have opted out of text message communications' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'No recipients found with valid phone numbers' },
        { status: 400 }
      );
    }

    // Check SMS limit before sending
    const smsLimitCheck = await checkSMSLimit(unionId, validRecipients.length);

    if (!smsLimitCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'SMS feature requires a paid subscription',
          details: {
            hasAccess: false,
            message: 'Upgrade to a paid plan to access the SMS feature.',
          },
        },
        { status: 403 }
      );
    }

    if (!smsLimitCheck.canSend) {
      const resetDate = new Date(smsLimitCheck.resetDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      return NextResponse.json(
        {
          error: 'Monthly SMS limit exceeded',
          details: {
            limit: smsLimitCheck.limit,
            used: smsLimitCheck.used,
            remaining: smsLimitCheck.remaining,
            requested: validRecipients.length,
            resetDate: resetDate,
            message: `You have ${smsLimitCheck.remaining} SMS remaining this month. You are trying to send ${validRecipients.length} messages. Your limit will reset on ${resetDate}.`,
          },
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // Create mass SMS record
    const [massSMSRecord] = await db
      .insert(massSMS)
      .values({
        unionId,
        message,
        recipientFilter,
        customRecipientIds: recipientFilter === 'custom' ? customRecipientIds : null,
        status: 'sending',
        totalRecipients: validRecipients.length,
        successCount: 0,
        failureCount: 0,
        createdBy: user.id,
      })
      .returning();

    // Send SMS to all recipients
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of validRecipients) {
      const result = await sendSMS(recipient.phone!, message);

      if (result.success) {
        // Log successful send
        await db.insert(smsLogs).values({
          massSMSId: massSMSRecord.id,
          memberId: recipient.memberId,
          phone: recipient.phone!,
          status: 'sent',
          twilioSid: result.sid,
        });

        successCount++;
      } else {
        // Log failed send
        await db.insert(smsLogs).values({
          massSMSId: massSMSRecord.id,
          memberId: recipient.memberId,
          phone: recipient.phone!,
          status: 'failed',
          errorMessage: result.error || 'Unknown error',
        });

        failureCount++;
      }
    }

    // Update mass SMS record with results
    await db
      .update(massSMS)
      .set({
        status: failureCount === validRecipients.length ? 'failed' : 'sent',
        successCount,
        failureCount,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(massSMS.id, massSMSRecord.id));

    // Increment SMS usage counter (only count successfully sent messages)
    if (successCount > 0) {
      await incrementSMSUsage(unionId, successCount);
    }

    // Notify info@uniontab.com about the SMS blast
    const unionDisplay = `${union.name.toUpperCase()}${union.localNumber ? ` ${union.localNumber}` : ''}`;
    const senderName = user.name || 'Unknown';
    const senderRole = requestingMember.role;
    sendEmail({
      to: 'info@uniontab.com',
      subject: `SMS blast sent - ${unionDisplay}`,
      text: `SMS blast sent by ${unionDisplay}\n\nSender: ${senderName} (${senderRole})\nRecipients: ${successCount} sent, ${failureCount} failed\n\nMessage:\n${message}`,
      html: `<p><strong>SMS blast sent by ${unionDisplay}</strong></p><p>Sender: ${senderName} (${senderRole})</p><p>Recipients: ${successCount} sent, ${failureCount} failed</p><hr/><p><strong>Message:</strong></p><p>${message}</p>`,
    }).catch((error) => {
      console.error('Failed to send blast notification:', error);
    });

    return NextResponse.json({
      success: true,
      massSMSId: massSMSRecord.id,
      totalRecipients: validRecipients.length,
      successCount,
      failureCount,
      status: failureCount === validRecipients.length ? 'failed' : 'sent',
    });
  } catch (error) {
    console.error('Error sending mass SMS:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
