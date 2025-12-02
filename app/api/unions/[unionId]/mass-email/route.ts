import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';
import { generateUnionBrandedEmail } from '@/lib/email/templates';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@uniontab.com';

interface EmailRecipient {
  memberId: number;
  userId: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
}

interface EmailAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unionId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId } = await params;
    const unionIdNum = parseInt(unionId);

    if (isNaN(unionIdNum)) {
      return NextResponse.json({ error: 'Invalid union ID' }, { status: 400 });
    }

    // Check if user is owner/admin of this union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionIdNum), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'You must be a union owner to send mass emails' },
        { status: 403 }
      );
    }

    // Get union details for branding
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionIdNum))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { recipients, subject, message, attachments } = body as {
      recipients: EmailRecipient[];
      subject: string;
      message: string;
      attachments?: EmailAttachment[];
    };

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Prepare attachments for SendGrid if provided
    const sendGridAttachments = attachments?.map((att) => ({
      content: att.url.includes('base64,') ? att.url.split(',')[1] : att.url,
      filename: att.name,
      type: att.type,
      disposition: 'attachment' as const
    }));

    // Add union branding to subject
    const unionDisplayName = union.publicName || union.name;
    const localNumberPart = union.localNumber ? ` Local ${union.localNumber}` : '';
    const brandedSubject = `${unionDisplayName}${localNumberPart} - ${subject}`;

    let sentCount = 0;
    const errors: string[] = [];

    // Send individual emails to each recipient
    for (const recipient of recipients) {
      try {
        const { text, html } = generateUnionBrandedEmail({
          union: {
            name: unionDisplayName,
            logoUrl: union.logoUrl,
            coverPhotoUrl: union.coverPhotoUrl
          },
          recipientName: recipient.name,
          subject: brandedSubject,
          htmlContent: message
        });

        const emailData: any = {
          to: recipient.email,
          from: {
            email: FROM_EMAIL,
            name: unionDisplayName
          },
          subject: brandedSubject,
          text,
          html
        };

        // Add attachments if any
        if (sendGridAttachments && sendGridAttachments.length > 0) {
          emailData.attachments = sendGridAttachments;
        }

        await sgMail.send(emailData);
        sentCount++;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        errors.push(`Failed to send to ${recipient.email}: ${error.message}`);
      }
    }

    return NextResponse.json({
      sent: sentCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error sending mass email:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: error.message },
      { status: 500 }
    );
  }
}
