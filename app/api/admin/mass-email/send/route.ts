import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import sgMail from '@sendgrid/mail';
import { generateUnionBrandedEmail } from '@/lib/email/templates';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@uniontab.com';

interface Member {
  memberId: number;
  userId: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  unionName: string;
  unionId: number;
  unionSlug: string;
  unionLogoUrl: string | null;
  unionCoverPhotoUrl: string | null;
}

interface EmailAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { members, subject, message, attachments } = body as {
      members: Member[];
      subject: string;
      message: string;
      attachments: EmailAttachment[];
    };

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Prepare attachments for SendGrid
    const sendGridAttachments = attachments?.map((att) => ({
      content: att.url.split(',')[1] || att.url, // Handle base64 or URL
      filename: att.name,
      type: att.type,
      disposition: 'attachment'
    }));

    // Group members by union for better email organization
    const membersByUnion = members.reduce((acc, member) => {
      if (!acc[member.unionId]) {
        acc[member.unionId] = [];
      }
      acc[member.unionId].push(member);
      return acc;
    }, {} as Record<number, Member[]>);

    let sentCount = 0;
    const errors: string[] = [];

    // Send emails union by union
    for (const [unionId, unionMembers] of Object.entries(membersByUnion)) {
      const firstMember = unionMembers[0];
      const union = {
        name: firstMember.unionName,
        logoUrl: firstMember.unionLogoUrl,
        coverPhotoUrl: firstMember.unionCoverPhotoUrl
      };

      // Send individual emails to each member
      for (const member of unionMembers) {
        try {
          const { text, html } = generateUnionBrandedEmail({
            union,
            recipientName: member.name,
            subject,
            htmlContent: message
          });

          const emailData: any = {
            to: member.email,
            from: {
              email: FROM_EMAIL,
              name: union.name
            },
            subject,
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
          console.error(`Error sending email to ${member.email}:`, error);
          errors.push(`Failed to send to ${member.email}: ${error.message}`);
        }
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
